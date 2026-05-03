import { FastifyInstance } from "fastify";
import { AppDataSource } from "../../data-source";
import { User } from "../../entity/User";
import { toSafeUser } from "../../utils/mapUser";
import bcrypt from "bcrypt";
import { createUserSchema, userIdSchema } from "../../utils/validators";
import { UserParams } from "../../types/user";

export async function userRoutes(app: FastifyInstance) {
    const userRepo = AppDataSource.getRepository(User);

    // This route allows anyone to create a new user account. It includes validation for email format, password strength, and checks for duplicate emails. Try creating users with valid data, invalid email formats, weak passwords, and duplicate emails to see how the validation works and how the API responds to different scenarios.
    app.post("/user",
        {
            // This is the test case for validating user input and preventing common vulnerabilities like SQL injection and XSS. Try creating users with valid data, invalid email formats, SQL injection attempts in the email or username, and weak passwords to see how the validation works.
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
                            username: "user1--shouldcreate",
                            password: "StrongPassword!123",
                        },
                        {
                            email: "invalid-email",
                            username: "user2--shouldnotcreate",
                            password: "StrongPassword!123",
                        },
                        {
                            email: "' OR 1=1 --",
                            username: "user3--XXSattack",
                            password: "StrongPassword!123",
                        },
                        {
                            email: "user4@example.com",
                            username: "user4--shouldnotcreate",
                            password: "123",
                        },
                        {
                            email: "user5@example.com",
                            username: "' OR 1=1 --",
                            password: "StrongPassword!123",
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
    // This route retrieves all users and is protected by authentication. Try accessing it without logging in to see a 401 error, then log in and access it again to see the list of users. This tests the authentication mechanism and ensures that only authenticated users can access this sensitive information.
    app.get("/users",
        {
            schema: {
                tags: ["Users"],
                summary: "Get all users that can be seen depending on role",
                description:
                    "Protected route. Try once without login to see 401, then login and try again.",
                security: [{ cookieAuth: [] }],
                response: {
                    200: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                email: { type: "string" },
                                username: { type: "string" },
                                role: { type: "string" },
                            },
                        },
                    },
                    401: {
                        type: "object",
                        properties: {
                            message: { type: "string" },
                        },
                    },
                },
            },
            preHandler: app.authenticate,
        }, async (request, reply) => {
            const users = await userRepo.find();
            return reply.send(users.map(toSafeUser));
        });
    // This route retrieves a user by their UUID and is protected by authentication. Try accessing it with a valid UUID, an invalid UUID format, without authentication, and with a non-existing UUID to see how the API handles each case. This tests the route's ability to validate input, enforce authentication, and handle cases where the requested resource does not exist.
    app.get("/users/:id", {
        schema: {
            tags: ["Users"],
            summary: "Get user by UUID",
            description:
                "Protected route. Try valid UUID, invalid UUID, no authentication, and non-existing UUID.",
            security: [{ cookieAuth: [] }],
            params: {
                type: "object",
                required: ["id"],
                properties: {
                    id: { type: "string" },
                },
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        email: { type: "string" },
                        username: { type: "string" },
                        role: { type: "string" },
                    },
                },
                400: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
                401: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
                404: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
            },
        },
        preHandler: app.authenticate,
    }, async (request, reply) => {
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