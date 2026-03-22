import "reflect-metadata";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import dotenv from "dotenv";
import rateLimit from "@fastify/rate-limit";
dotenv.config();

//for testing
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import Fastify from "fastify";
import { AppDataSource } from "./data-source";
import { userRoutes } from "./api/v1/user";
import { authRoutes } from "./api/v1/auth";
import { getEnv } from "./data-source";
import authPlugin from "./plugin/authenticate";

const fastify = Fastify({
    logger: true
});

async function start() {

    await AppDataSource.initialize();

    await fastify.register(cookie, {
        secret: getEnv("COOKIE_SECRET"),
    });

    console.log("Database connected");

    await fastify.register(cors, {
        origin: "http://localhost:3000",
        credentials: true,
    });

    //cần sửa trong tương lai ----------------------------------------------------- set to be true
    await fastify.register(helmet, {
        contentSecurityPolicy: false,
    });

    await fastify.register(rateLimit, {
        max: 50,
        timeWindow: "1 minute",
    });
    await fastify.register(swagger, {
        openapi: {
            info: {
                title: "COMP.SEC.300 Secure API",
                description: "Secure CRUD API with authentication for user management",
                version: "1.0.0",
            },
            servers: [
                {
                    url: "http://localhost:8081",
                },
            ],
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: "token",
                    },
                },
            },
        },
    });

    await fastify.register(swaggerUI, {
        routePrefix: "/documentation",
    });
    await fastify.register(authPlugin);
    await fastify.register(authRoutes);
    await fastify.register(userRoutes);


    fastify.get("/", async () => {
        return { message: "API running" };
    });

    await fastify.listen({ port: 8081, host: "0.0.0.0" });
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});