import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entity/User";

dotenv.config();

// function getEnv(name: string): string {
//     const value = process.env[name];
//     if (!value) {
//         throw new Error(`Missing environment variable: ${name}`);
//     }
//     return value;
// }
export function getEnv(name: string): string {
    const value = process.env[name];

    if (!value || value.trim() === "") {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
}

export const AppDataSource = new DataSource({
    type: "mariadb",
    host: getEnv("DB_HOST"),
    port: Number(getEnv("DB_PORT")),
    username: getEnv("DB_USER"),
    password: getEnv("DB_PASSWORD"),
    database: getEnv("DB_NAME"),
    entities: [User],
    synchronize: true,
    logging: false,
});