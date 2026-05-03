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
    // This route allows users to log in with their email and password. It validates the input, checks the credentials against the database, and creates a JWT token if the login is successful. Try logging in with valid credentials to see the token created, and with invalid credentials to see the appropriate error messages.
    app.post("/auth/login",
        {
            schema: {
                tags: ["Authentication"],
                summary: "Login user",
                description:
                    "Authenticate a user using email and password. If successful, the server sets an HttpOnly signed cookie named token.",
                body: {
                    type: "object",
                    required: ["email", "password"],
                    additionalProperties: false,
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                            examples: ["user1@example.com"],
                        },
                        password: {
                            type: "string",
                            minLength: 1,
                            description: "User password",
                            examples: ["StrongPassword!123"],
                        },
                    },
                },
                response: {
                    200: {
                        description: "Login successful",
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                examples: ["Login successful"],
                            },
                            user: {
                                type: "object",
                                properties: {
                                    id: {
                                        type: "string",
                                        format: "uuid",
                                        examples: ["550e8400-e29b-41d4-a716-446655440000"],
                                    },
                                    email: {
                                        type: "string",
                                        format: "email",
                                        examples: ["tin@example.com"],
                                    },
                                    username: {
                                        type: "string",
                                        examples: ["tin"],
                                    },
                                    role: {
                                        type: "string",
                                        examples: ["user"],
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Validation error",
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                examples: ["\"email\" must be a valid email"],
                            },
                        },
                    },
                    401: {
                        description: "Invalid email or password",
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                examples: ["Invalid credentials"],
                            },
                        },
                    },
                    500: {
                        description: "Server error",
                        type: "object",
                        properties: {
                            message: {
                                type: "string",
                                examples: ["Internal Server Error"],
                            },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
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
    // This route allows users to log out by clearing the authentication cookie. Try logging in first to set the cookie, then access this route to see the cookie cleared and the logout message returned.
    app.post("/auth/logout", {
        schema: {
            tags: ["Authentication"],
            summary: "Logout user",
            description:
                "Clear the authentication cookie. After logout, protected routes such as GET /users should return 401 Unauthorized.",
            security: [{ cookieAuth: [] }],
            response: {
                200: {
                    description: "Logout successful",
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            examples: ["Logout successful"],
                        },
                    },
                },
                500: {
                    description: "Internal server error",
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            examples: ["Internal Server Error"],
                        },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        reply.clearCookie(authCookieName, { path: "/" });

        return reply.send({
            message: "Logout successful",
        });
    });
    // This route retrieves the currently authenticated user's information. Try accessing it without logging in to see a 401 error, then log in and access it again to see your user information returned. This tests the authentication mechanism and ensures that only authenticated users can access their own information.
    app.get("/auth/me", {
        schema: {
            tags: ["Authentication"],
            summary: "Get current authenticated user",
            description:
                "Protected route. Returns the currently logged-in user based on the signed JWT cookie. Try once without login to see 401, then login and try again.",
            security: [{ cookieAuth: [] }],
            response: {
                200: {
                    description: "Current authenticated user",
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        id: {
                            type: "string",
                            format: "uuid",
                            examples: ["550e8400-e29b-41d4-a716-446655440000"],
                        },
                        email: {
                            type: "string",
                            format: "email",
                            examples: ["user1@example.com"],
                        },
                        username: {
                            type: "string",
                            examples: ["user1"],
                        },
                        role: {
                            type: "string",
                            examples: ["user"],
                        },
                    },
                },
                401: {
                    description:
                        "Authentication failed. Cookie is missing, invalid, expired, or the user no longer exists.",
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            examples: [
                                "Not authenticated",
                                "Invalid cookie signature",
                                "User not found",
                                "Invalid token",
                            ],
                        },
                    },
                },
                500: {
                    description: "Internal server error",
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            examples: ["Internal Server Error"],
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
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