import Joi from "joi";
// This file defines validation schemas for user-related operations using the Joi library. The "passwordSchema" defines the requirements for a valid password, including length and character composition. The "createUserSchema" defines the required fields for creating a new user, including email, username, and password. The "loginSchema" defines the required fields for logging in, which are email and password. The "userIdSchema" defines the required format for a user ID, which must be a UUID. These schemas are used to validate incoming request data in the authentication and user routes to ensure that the data meets the expected format and constraints before processing it further.
export const passwordSchema = Joi.string()
    .min(12)
    .max(128)
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[^a-zA-Z0-9]/, "special character")
    .required()
    .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 12 characters",
        "string.max": "Password must be at most 128 characters",
        "string.pattern.base":
            "Password must include uppercase, lowercase, number, and special character",
    });

// This file defines validation schemas for user-related operations using the Joi library. The "passwordSchema" defines the requirements for a valid password, including length and character composition. The "createUserSchema" defines the required fields for creating a new user, including email, username, and password. The "loginSchema" defines the required fields for logging in, which are email and password. The "userIdSchema" defines the required format for a user ID, which must be a UUID. These schemas are used to validate incoming request data in the authentication and user routes to ensure that the data meets the expected format and constraints before processing it further.
export const createUserSchema = Joi.object({
    email: Joi.string().email().required().max(255),
    username: Joi.string().min(3).max(50).required(),
    password: passwordSchema,
});
// This file defines validation schemas for user-related operations using the Joi library. The "passwordSchema" defines the requirements for a valid password, including length and character composition. The "createUserSchema" defines the required fields for creating a new user, including email, username, and password. The "loginSchema" defines the required fields for logging in, which are email and password. The "userIdSchema" defines the required format for a user ID, which must be a UUID. These schemas are used to validate incoming request data in the authentication and user routes to ensure that the data meets the expected format and constraints before processing it further.
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
export const userIdSchema = Joi.object({
    id: Joi.string().uuid().required(),
});