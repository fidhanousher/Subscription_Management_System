"use server";

import { randomBytes } from "crypto";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";

export type ActionState = { error?: string; success?: string } | null;

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
  return null;
}

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email || !name) return { error: "Name and email are required." };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };
  if (password !== confirm) return { error: "Passwords do not match." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email already has an account." };

  await prisma.user.create({
    data: {
      email,
      name,
      company: company || null,
      passwordHash: await hashPassword(password),
      role: "CUSTOMER",
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/portal",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }
  return null;
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    const url = `${process.env.AUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    console.log(`Password reset link for ${email}: ${url}`);
  }
  return {
    success:
      "If that email is registered, a reset link has been sent. In development it is printed in the server log.",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });
  if (!user) return { error: "This reset link is invalid or has expired." };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetTokenExpiresAt: null,
    },
  });
  redirect("/login");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
