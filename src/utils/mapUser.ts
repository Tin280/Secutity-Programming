import { User } from "../entity/User";
import { SafeUserResponse } from "../types/user";

export function toSafeUser(user: User): SafeUserResponse {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
    };
}