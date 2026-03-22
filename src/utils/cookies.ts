export const authCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "strict" as const,
    path: "/",
    signed: true,
    maxAge: 60 * 60,
};