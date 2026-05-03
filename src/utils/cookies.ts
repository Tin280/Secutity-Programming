// This file defines constants and options related to authentication cookies. The "authCookieName" constant specifies the name of the cookie that will be used to store the JWT token for authentication. The "authCookieOptions" object defines various options for the cookie, such as making it HTTP-only, setting the same-site policy to "strict", and specifying a maximum age for the cookie. These options help enhance the security of the authentication mechanism by preventing client-side scripts from accessing the cookie and mitigating cross-site request forgery (CSRF) attacks.
export const authCookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: "strict" as const,
    path: "/",
    signed: true,
    maxAge: 60 * 60,
};