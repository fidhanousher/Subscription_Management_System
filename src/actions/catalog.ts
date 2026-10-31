"use server";

import { BillingInterval, DiscountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { ActionState } from "./auth";

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const salesPrice = Number(formData.get("salesPrice"));
  const costPrice = Number(formData.get("costPrice"));
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name || !type || Number.isNaN(salesPrice) || Number.isNaN(costPrice)) {
    return { error: "Name, type, sales price and cost price are required." };
  }
  const product = await prisma.product.create({
    data: { name, type, salesPrice, costPrice, notes: notes || null },
  });
  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

export async function addVariantAction(formData: FormData) {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const priceDelta = Number(formData.get("priceDelta") ?? 0);
  if (!productId || !name || !value) return;
  await prisma.productVariant.create({
    data: { productId, name, value, priceDelta },
  });
  revalidatePath(`/products/${productId}`);
}

export async function createPlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const interval = String(formData.get("interval")) as BillingInterval;
  const minQuantity = Number(formData.get("minQuantity") ?? 1);
  const availableFrom = new Date(String(formData.get("availableFrom")));
  const availableToRaw = String(formData.get("availableTo") ?? "");
  if (!name || Number.isNaN(price) || !interval) {
    return { error: "Name, price and billing interval are required." };
  }
  await prisma.plan.create({
    data: {
      name,
      price,
      interval,
      minQuantity,
      availableFrom,
      availableTo: availableToRaw ? new Date(availableToRaw) : null,
      autoCloseOnEnd: formData.get("autoCloseOnEnd") === "on",
      allowEarlyClose: formData.get("allowEarlyClose") === "on",
      allowPause: formData.get("allowPause") === "on",
      allowRenew: formData.get("allowRenew") === "on",
    },
  });
  revalidatePath("/plans");
  return { success: "Plan saved." };
}

export async function createTaxAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const rate = Number(formData.get("rate"));
  const appliesTo = String(formData.get("appliesTo") ?? "ALL");
  if (!name || Number.isNaN(rate)) return;
  await prisma.taxRule.create({
    data: { name, rate, appliesTo, active: true },
  });
  revalidatePath("/taxes");
}

export async function toggleTaxAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active")) === "true";
  await prisma.taxRule.update({ where: { id }, data: { active: !active } });
  revalidatePath("/taxes");
}

export async function createDiscountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type")) as DiscountType;
  const value = Number(formData.get("value"));
  if (!name || Number.isNaN(value)) return { error: "Name and value are required." };
  const productId = String(formData.get("productId") ?? "");
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  await prisma.discount.create({
    data: {
      name,
      type,
      value,
      minPurchase: formData.get("minPurchase")
        ? Number(formData.get("minPurchase"))
        : null,
      minQuantity: formData.get("minQuantity")
        ? Number(formData.get("minQuantity"))
        : null,
      startDate: new Date(String(formData.get("startDate"))),
      endDate: String(formData.get("endDate") ?? "")
        ? new Date(String(formData.get("endDate")))
        : null,
      maxUses: formData.get("maxUses") ? Number(formData.get("maxUses")) : null,
      applyToSubscription: formData.get("applyToSubscription") === "on",
      products: productId ? { create: [{ productId }] } : undefined,
      subscriptions: subscriptionId
        ? { create: [{ subscriptionId }] }
        : undefined,
    },
  });
  revalidatePath("/discounts");
  return { success: "Discount saved." };
}

export async function createStaffAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { validatePassword, hashPassword } = await import("@/lib/password");
  if (!email || !name) return { error: "Name and email are required." };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "That email is already in use." };
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: "STAFF",
      company: "Brightloop Software",
    },
  });
  revalidatePath("/staff");
  return { success: "Staff member added." };
}
