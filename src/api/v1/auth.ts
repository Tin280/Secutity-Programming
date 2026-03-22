import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../data-source";
import { User } from "../../entity/User";
import { loginSchema } from "../../utils/validators";
import { toSafeUser } from "../../utils/mapUser";
import { JwtPayload, LoginBody } from "../../types/user";
import { authCookieOptions } from "../../utils/cookies";

const authCookieName = "token";

declare module "fastify" {
    interface FastifyRequest {
        user: JwtPayload;
    }

    interface FastifyInstance {
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
    }
}
export async function authRoutes(app: FastifyInstance) {
    const userRepo = AppDataSource.getRepository(User);

    app.post("/auth/login", async (request, reply) => {
        const { error, value } = loginSchema.validate(request.body, {
            abortEarly: true,
            stripUnknown: true,
        });
        if (error) {
            return reply.status(400).send({
                message: error.details[0]?.message,
            });
        }
        const body = value as LoginBody;

        const user = await userRepo.findOne({
            where: { email: body.email },
        });

        if (!user) {
            return reply.status(401).send({
                message: "Invalid credentials",
            });
        }
        const passwordOk = await bcrypt.compare(body.password, user.passwordHash);

        if (!passwordOk) {
            return reply.status(401).send({
                message: "Invalid credentials",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("Missing environment variable: JWTSECRET")
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h",
        });
        reply.setCookie(authCookieName, token, authCookieOptions);
        return reply.send({
            message: "Login successful",
            user: toSafeUser(user),
        });
    });

    app.post("/auth/logout", async (_request, reply) => {
        reply.clearCookie(authCookieName, { path: "/" });

        return reply.send({
            message: "Logout successful",
        });
    });

    app.get("/auth/me", async (request, reply) => {
        const signedCookie = request.cookies[authCookieName];

        if (!signedCookie) {
            return reply.status(401).send({
                message: "Not authenticated",
            });
        }

        try {
            if (!process.env.JWT_SECRET) {
                throw new Error("Missing environment variable: JWT_SECRET");
            }

            const unsigned = request.unsignCookie(signedCookie);
            if (!unsigned.valid) {
                return reply.status(401).send({
                    message: "Invalid cookie signature",
                });
            }

            const payload = jwt.verify(
                unsigned.value,
                process.env.JWT_SECRET
            ) as JwtPayload;

            const user = await userRepo.findOne({
                where: { id: payload.sub },
            });

            if (!user) {
                return reply.status(401).send({
                    message: "User not found",
                });
            }

            return reply.send(toSafeUser(user));
        } catch {
            return reply.status(401).send({
                message: "Invalid token",
            });
        }
    });
}