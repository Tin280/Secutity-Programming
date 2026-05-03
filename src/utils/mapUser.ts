import { User } from "../entity/User";
import { SafeUserResponse } from "../types/user";

// This function takes a User entity object and maps it to a SafeUserResponse object, which contains only the fields that are safe to expose in API responses. This is important for security, as it prevents sensitive information such as password hashes from being included in API responses. Try using this function with a User object to see how it filters out sensitive fields and returns only the safe user information.
export function toSafeUser(user: User): SafeUserResponse {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
    };
}