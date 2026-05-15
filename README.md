# 🔐 COMP.SEC.300 — Secure CRUD API

> A secure backend API for user management, built as a seminar project for the **COMP.SEC.300 Secure Programming** course. Demonstrates real-world secure programming principles in a production-style Node.js + TypeScript stack.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Setup & Running](#-setup--running)
  - [1. Start MariaDB with Docker](#1-start-mariadb-with-docker)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Run the Backend](#4-run-the-backend)
- [API Endpoints](#-api-endpoints)
- [Swagger Documentation](#-swagger-documentation)
- [Input Validation](#-input-validation)
- [Security Test Cases](#-security-test-cases)
- [Database Commands](#-database-commands)
- [Troubleshooting](#-troubleshooting)
- [Security Notes](#-security-notes)
- [Demo Flow](#-demo-flow)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔑 **JWT Authentication** | Token-based auth stored in signed HttpOnly cookies |
| 🛡️ **Password Hashing** | bcrypt hashing before storage |
| ✅ **Input Validation** | Strict Joi schemas on all endpoints |
| 🗄️ **TypeORM + MariaDB** | Safe parameterized queries — no raw SQL |
| 🔒 **Protected Routes** | Authentication pre-handler on sensitive endpoints |
| 🧹 **Safe Responses** | `toSafeUser` strips `passwordHash` from all API responses |
| 📄 **Swagger / OpenAPI** | Interactive docs + manual security testing |
| 🌐 **CORS & Helmet** | Security headers and origin control |
| ⚡ **Rate Limiting** | Fastify Rate Limit plugin |

---

## 🛠 Tech Stack

**Runtime & Language**
- Node.js · TypeScript

**Web Framework**
- Fastify · Fastify Cookie · Fastify CORS · Fastify Helmet · Fastify Rate Limit

**Database**
- MariaDB · TypeORM · Docker

**Auth & Security**
- JSON Web Token · bcrypt · Joi

**Docs & Testing**
- Swagger / OpenAPI

---

## 📁 Project Structure

```
project-root/
├── src/
│   ├── api/
│   │   ├── auth.ts          # Login, logout, /auth/me routes
│   │   └── user.ts          # User creation and retrieval routes
│   ├── entity/
│   │   └── User.ts          # TypeORM User entity (maps to DB table)
│   ├── plugin/
│   │   └── authenticate.ts  # JWT cookie verification pre-handler
│   ├── types/
│   │   └── user.ts          # TypeScript types: User, JWT payload, SafeUser
│   ├── utils/
│   │   ├── cookies.ts       # Cookie name and security options
│   │   ├── mapUser.ts       # toSafeUser() — strips sensitive fields
│   │   └── validators.ts    # Joi schemas: password, user, login, UUID
│   ├── data-source.ts       # TypeORM DB config (reads from .env)
│   └── index.ts             # App entry: server, plugins, routes, Swagger
├── .env                     # ⚠️ Not committed to Git
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## ⚙️ Prerequisites

Install the following tools before running the project:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

Verify installations:

```bash
node -v
npm -v
docker --version
git --version
```

---

## 🚀 Setup & Running

### 1. Start MariaDB with Docker

**Linux / macOS:**
```bash
docker run -d \
  --name compsec300-db \
  -e MARIADB_USER=dbuser \
  -e MARIADB_PASSWORD=dbpassword \
  -e MARIADB_ROOT_PASSWORD=my-secret-pw \
  -e MARIADB_DATABASE=compsec300-db \
  -p 3306:3306 \
  mariadb:latest
```

**Windows CMD (one-liner):**
```bash
docker run -d --name compsec300-db -e MARIADB_USER=dbuser -e MARIADB_PASSWORD=dbpassword -e MARIADB_ROOT_PASSWORD=my-secret-pw -e MARIADB_DATABASE=compsec300-db -p 3306:3306 mariadb:latest
```

Verify the container is running:
```bash
docker ps
# Expected container name: compsec300-db
```

> **Container stopped?** Restart it with: `docker start compsec300-db`

---

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=dbuser
DB_PASSWORD=dbpassword
DB_NAME=compsec300-db

JWT_SECRET=change-this-jwt-secret
COOKIE_SECRET=change-this-cookie-secret
```

> ⚠️ **Never commit `.env` to Git.** Ensure it is listed in `.gitignore`.

The database values must match the Docker container configuration above.

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Run the Backend

```bash
# Development mode
npm run dev

# Or
npm start
```

The server starts at: **`http://localhost:8081`**

Health check:
```bash
curl http://localhost:8081/
# → { "message": "API running" }
```

---

## 📡 API Endpoints

### `POST /user` — Create User

```json
{
  "email": "user1@example.com",
  "username": "user1",
  "password": "StrongPassword!123"
}
```

**Response:** `201 Created` — returns safe user object (no password hash).

---

### `POST /auth/login` — Login

```json
{
  "email": "user1@example.com",
  "password": "StrongPassword!123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "user1@example.com",
    "username": "user1",
    "role": "user"
  }
}
```

A signed HttpOnly JWT cookie is set on success.

---

### `GET /auth/me` — Current Authenticated User

Returns the currently logged-in user from the auth cookie.

| State | Response |
|---|---|
| Logged in | `200 OK` with user object |
| Not logged in | `401 Unauthorized` |

---

### `GET /users` — List All Users *(Protected)*

Requires a valid authentication cookie.

| State | Response |
|---|---|
| Logged in | `200 OK` with user array |
| Not logged in | `401 Unauthorized` |

> ⚠️ **Note:** In a production system, this route should be restricted to admin users only.

---

### `POST /auth/logout` — Logout

```json
{ "message": "Logout successful" }
```

Clears the authentication cookie. Protected routes return `401` again.

---

## 📄 Swagger Documentation

Interactive API docs available at:

```
http://localhost:8081/documentation
```

Use Swagger to manually test all endpoints, including validation errors, auth flows, and security edge cases.

---

## ✅ Input Validation

Implemented with **Joi** in `src/utils/validators.ts`.

**Password Policy:**
- Minimum **12** characters, maximum **128**
- At least one **lowercase** letter
- At least one **uppercase** letter
- At least one **number**
- At least one **special character**

**Create User Schema:**

| Field | Rule |
|---|---|
| `email` | Valid email format |
| `username` | 3–50 characters |
| `password` | Follows password policy |

**Login Schema:**

| Field | Rule |
|---|---|
| `email` | Valid email format |
| `password` | Required |

**User ID Schema:** Must be a valid **UUID**.

---

## 🧪 Security Test Cases

### ❌ Invalid Email
```json
{ "email": "invalid-email", "username": "testuser", "password": "StrongPassword!123" }
```
**Expected:** `400 Bad Request`

---

### ❌ Weak Password
```json
{ "email": "weak@example.com", "username": "weakuser", "password": "123" }
```
**Expected:** `400 Bad Request`

---

### ❌ SQL Injection — Email Field
```json
{ "email": "' OR 1=1 --", "username": "sqltest", "password": "StrongPassword!123" }
```
**Expected:** `400 Bad Request` — email format validation rejects this.

---

### ⚠️ SQL Injection — Username Field
```json
{ "email": "user5@example.com", "username": "' OR 1=1 --", "password": "StrongPassword!123" }
```

If the username schema only checks length, this may be stored as plain text — not a successful injection (TypeORM uses parameterized queries), but indicates overly permissive validation.

**Recommended fix:**
```ts
username: Joi.string()
  .min(3)
  .max(30)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .required()
```

---

### ❌ Login Bypass Attempt
```json
{ "email": "' OR 1=1 --", "password": "anything" }
```
**Expected:** `400 Bad Request` or `401 Unauthorized` — login must not succeed.

---

### ❌ Mass Assignment — Role Escalation
```json
{
  "email": "normal@example.com",
  "username": "normaluser",
  "password": "StrongPassword!123",
  "role": "admin"
}
```
**Expected:** The `role` field is ignored or rejected. Users cannot self-assign admin roles.

---

### ❌ Unauthenticated Protected Route
```
GET /users  (no cookie)
```
**Expected:** `401 Unauthorized`

---

## 🗄️ Database Commands

Connect to MariaDB inside the Docker container:

```bash
docker exec -it compsec300-db mariadb -u root -p
# Password: my-secret-pw
```

```sql
-- Select the database
USE `compsec300-db`;

-- Show tables
SHOW TABLES;

-- View all users (safe columns only)
SELECT id, email, username, role FROM `user`;

-- View specific user
SELECT email, username, role FROM `user` WHERE email = 'user1@example.com';

-- Promote user to admin
UPDATE `user` SET role = 'admin' WHERE email = 'admin@example.com';

-- Delete all users
DELETE FROM `user`;

-- Reset table
TRUNCATE TABLE `user`;
```

> If the table is named `users` instead of `user`, update the SQL commands accordingly.

---

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check if the container is running
docker ps

# Start the container if stopped
docker start compsec300-db
```
Also verify that `.env` values match the Docker container configuration.

---

### Port 3306 Already in Use
```bash
docker stop compsec300-db
docker rm compsec300-db
# Then re-run the docker run command from the setup section
```

---

### CORS Error (Frontend)

Ensure the backend allows the frontend origin:

```ts
await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
});
```

And the frontend includes credentials on all requests:
```ts
credentials: "include"
```

---

### Cookie Not Sent After Login

Check all of the following:

| Setting | Required Value |
|---|---|
| Backend CORS `credentials` | `true` |
| Frontend fetch `credentials` | `"include"` |
| Cookie `httpOnly` | `true` |
| Cookie `secure` (local HTTP) | `false` |
| Cookie `path` | `"/"` |

Example local cookie configuration:
```ts
{
  httpOnly: true,
  secure: false,
  sameSite: "strict",
  path: "/",
  signed: true,
  maxAge: 60 * 60
}
```

---

## 🛡️ Security Notes

This project demonstrates the following secure programming principles:

- **Validate before processing** — All input validated with Joi before touching the database
- **Password complexity** — Enforced at registration time
- **Password hashing** — bcrypt; plain text passwords are never stored
- **JWT in HttpOnly cookie** — Prevents XSS from accessing the token
- **Signed cookies** — Tamper detection via cookie signing
- **Auth pre-handler** — Protected routes reject unauthenticated requests
- **Safe response mapping** — `toSafeUser()` strips `passwordHash` from all responses
- **Parameterized queries** — TypeORM prevents raw SQL injection
- **Security headers** — Fastify Helmet sets appropriate HTTP headers

**Known limitation:** The `/users` route currently checks authentication but not *authorization*. In a production system, listing all users should be restricted to the `admin` role only.

---

## 🎬 Demo Flow

Suggested presentation sequence using Swagger UI:

```
Step 1 │ GET /users          → 401 Unauthorized (not logged in)
Step 2 │ POST /user          → 201 Created (valid user data)
Step 3 │ POST /user          → 400 Bad Request (invalid email)
Step 4 │ POST /user          → 400 Bad Request (weak password)
Step 5 │ POST /user          → 400 Bad Request (SQL injection input)
Step 6 │ POST /auth/login    → 200 OK + auth cookie set
Step 7 │ GET /auth/me        → 200 OK (shows current user)
Step 8 │ GET /users          → 200 OK (protected route now accessible)
Step 9 │ POST /auth/logout   → 200 OK + cookie cleared
Step 10│ GET /auth/me        → 401 Unauthorized
```

This flow demonstrates authentication, input validation, protected routes, safe API responses, and secure programming principles end-to-end.

---

*COMP.SEC.300 Secure Programming — Seminar Project*
