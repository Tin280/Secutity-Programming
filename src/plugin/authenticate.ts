// import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
// import jwt from "jsonwebtoken";
// import { JwtPayload } from "../types/user";

// const authCookieName = "token";

// declare module "fastify" {
//     interface FastifyRequest {
//         user: JwtPayload;
//     }

//     interface FastifyInstance {
//         authenticate: (
//             request: FastifyRequest,
//             reply: FastifyReply
//         ) => Promise<void>;
//     }
// }

// function getEnv(name: string): string {
//     const value = process.env[name];

//     if (!value || value.trim() === "") {
//         throw new Error(`Missing environment variable: ${name}`);
//     }

//     return value;
// }

// export async function authPlugin(app: FastifyInstance) {
//     app.decorate(
//         "authenticate",
//         async function (request: FastifyRequest, reply: FastifyReply) {
//             const signedCookie = request.cookies[authCookieName];

//             if (!signedCookie) {
//                 reply.status(401).send({ message: "Not authenticated" });
//                 return;
//             }

//             try {
//                 const unsigned = request.unsignCookie(signedCookie);

//                 if (!unsigned.valid || !unsigned.value) {
//                     reply.status(401).send({ message: "Invalid cookie signature" });
//                     return;
//                 }

//                 const payload = jwt.verify(
//                     unsigned.value,
//                     getEnv("JWT_SECRET")
//                 ) as JwtPayload;

//                 request.user = payload;
//             } catch {
//                 reply.status(401).send({ message: "Invalid token" });
//             }
//         }
//     );
// }
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/user";

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

function getEnv(name: string): string {
    const value = process.env[name];

    if (!value || value.trim() === "") {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

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