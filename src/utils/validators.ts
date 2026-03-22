import Joi from "joi";

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

export const createUserSchema = Joi.object({
    email: Joi.string().email().required().max(255),
    username: Joi.string().min(3).max(50).required(),
    password: passwordSchema,
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const userIdSchema = Joi.object({
    id: Joi.string().uuid().required(),
});