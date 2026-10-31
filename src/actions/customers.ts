"use server";

import { revalidatePath } from "next/cache";
import { hashPassword, validatePassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/rbac";
import { ActionState } from "./auth";

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const password = String(formData.get("password") ?? "Customer123!");
  if (!email || !name) return { error: "Name and email are required." };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };
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
  revalidatePath("/customers");
  return { success: "Customer created." };
}
