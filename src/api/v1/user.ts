import { FastifyInstance } from "fastify";
import { AppDataSource } from "../../data-source";
import { User } from "../../entity/User";
import { toSafeUser } from "../../utils/mapUser";
import bcrypt from "bcrypt";
import { createUserSchema, userIdSchema } from "../../utils/validators";
import { UserParams } from "../../types/user";

export async function userRoutes(app: FastifyInstance) {
    const userRepo = AppDataSource.getRepository(User);

    app.post("/user",
        {
            schema: {
                tags: ["Users"],
                summary: "Create a new user",
                description: "Create an account with a secure password (12-128 characters, including uppercase, lowercase, numbers, and special characters).",
                body: {
                    type: "object",
                    required: ["email", "username", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                        },
                        username: {
                            type: "string",
                        },
                        password: {
                            type: "string",

                            pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{12,})"
                        },

                    },
                    examples: [
                        {
                            email: "user1@example.com",
                            username: "user1",
                            password: "StrongPassword!123",
                        },
                        {
                            email: "invalid-email",
                            username: "user1",
                            password: "123",
                        },
                        {
                            email: "' OR 1=1 --",
                            username: "<script>alert(1)</script>",
                            password: "hack",
                        },
                        {
                            email: "user1@example.com"
                        }
                    ],
                },
                response: {
                    201: {
                        description: "User created successfully",
                        type: "object",
                        properties: {
                            id: { type: "string", example: "550e8400-e29b-41d4-a716-446655440000" },
                            email: { type: "string", example: "user1@example.com" },
                            username: { type: "string", example: "user1" },
                            role: { type: "string", example: "user" },
                        },
                    },
                    400: {
                        description: "Invalid input",
                        type: "object",
                        properties: {
                            message: { type: "string", example: "\"email\" must be a valid email" },
                        },
                    },
                    409: {
                        description: "Email already exists",
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Email already exists" },
                        },
                    },
                },
            },
        },
        async (request, reply) => {
            const { error, value } = createUserSchema.validate(request.body, {
                abortEarly: true,
                stripUnknown: true,
            });

            if (error) {
                return reply.status(400).send({
                    message: error.details[0]?.message,
                });
            }

            const existing = await userRepo.findOne({
                where: { email: value.email },
            });

            if (existing) {
                return reply.status(409).send({
                    message: "Email already exists",
                });
            }

            const passwordHash = await bcrypt.hash(value.password, 10);

            const user = userRepo.create({
                email: value.email,
                username: value.username,
                passwordHash,
                role: "user",
            })
            await userRepo.save(user);

            return reply.status(201).send(toSafeUser(user));
        });

    app.get("/users", { preHandler: [app.authenticate] }, async (request, reply) => {
        const users = await userRepo.find();
        return reply.send(users.map(toSafeUser));
    });

    app.get("/users/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
        const params = request.params as UserParams;
        const { error, value } = userIdSchema.validate(params, {
            abortEarly: true,
            stripUnknown: true,
        });
        if (error) {
            return reply.status(400).send({
                message: "Invalid user id",
            });
        }

        const user = await userRepo.findOne({
            where: { id: value.id },
        });

        if (!user) {
            return reply.status(404).send({
                message: "User not found",
            });
        }

        return reply.send(toSafeUser(user));
    })

}