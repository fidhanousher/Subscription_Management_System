import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    role: session.user.role,
  };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (user.role === "CUSTOMER") redirect("/portal");
  return user;
}

export async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function requireCustomer() {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/dashboard");
  return user;
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function canManageCatalog(role: Role) {
  return role === "ADMIN";
}
