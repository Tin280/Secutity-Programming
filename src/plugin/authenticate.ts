import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/user";

const authCookieName = "token";
// This plugin adds an authentication mechanism to the Fastify instance. It defines a decorator called "authenticate" that can be used as a pre-handler for routes that require authentication. The "authenticate" function checks for a signed cookie containing a JWT token, verifies the token, and attaches the decoded payload to the request object. If the token is missing, invalid, or has an invalid signature, it responds with a 401 error. This plugin is essential for protecting routes and ensuring that only authenticated users can access certain resources.
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
// This function retrieves an environment variable by name and throws an error if it is missing or empty. This is used to ensure that critical configuration values, such as the JWT secret, are present before the application starts. Try running the application without setting the required environment variables to see how it handles missing configuration.
function getEnv(name: string): string {
    const value = process.env[name];

    if (!value || value.trim() === "") {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}
// This plugin adds an authentication mechanism to the Fastify instance. It defines a decorator called "authenticate" that can be used as a pre-handler for routes that require authentication. The "authenticate" function checks for a signed cookie containing a JWT token, verifies the token, and attaches the decoded payload to the request object. If the token is missing, invalid, or has an invalid signature, it responds with a 401 error. This plugin is essential for protecting routes and ensuring that only authenticated users can access certain resources.
async function authPlugin(app: FastifyInstance) {
    app.decorate(
        "authenticate",
        async function (request: FastifyRequest, reply: FastifyReply) {
            const signedCookie = request.cookies[authCookieName];

            if (!signedCookie) {
                reply.status(401).send({ message: "Not authenticated" });
                return;
            }

            try {
                const unsigned = request.unsignCookie(signedCookie);

                if (!unsigned.valid || !unsigned.value) {
                    reply.status(401).send({ message: "Invalid cookie signature" });
                    return;
                }

                const payload = jwt.verify(
                    unsigned.value,
                    getEnv("JWT_SECRET")
                ) as JwtPayload;

                request.user = payload;
            } catch {
                reply.status(401).send({ message: "Invalid token" });
            }
        }
    );
}

export default fp(authPlugin);