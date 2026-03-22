export type UserRole = "user" | "admin";

export type CreateUserBody = {
    email: string;
    username: string;
    password: string;
};

export type LoginBody = {
    email: string;
    password: string;
};

export type UserParams = {
    id: string;
};

export type SafeUserResponse = {
    id: string;
    email: string;
    username: string;
    role: UserRole;
};

export type JwtPayload = {
    sub: string;
    email: string;
    role: UserRole;
};