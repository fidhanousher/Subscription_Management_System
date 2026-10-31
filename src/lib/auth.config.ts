import type { NextAuthConfig } from "next-auth";

const publicPaths = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = (token.role as "ADMIN" | "STAFF" | "CUSTOMER") ?? "CUSTOMER";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      const role = auth?.user?.role;
      const isPublic = publicPaths.some((p) => path.startsWith(p));

      if (isPublic) {
        if (role === "CUSTOMER") {
          return Response.redirect(new URL("/portal", nextUrl));
        }
        if (role === "ADMIN" || role === "STAFF") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (path.startsWith("/api/auth") || path.startsWith("/api/cron")) {
        return true;
      }

      if (path.startsWith("/portal")) {
        if (!role) return false;
        if (role !== "CUSTOMER") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!role) return false;

      if (role === "CUSTOMER") {
        return Response.redirect(new URL("/portal", nextUrl));
      }

      return role === "ADMIN" || role === "STAFF";
    },
  },
} satisfies NextAuthConfig;
