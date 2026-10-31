"use server";

import { Prisma, SubscriptionStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { nextNumber } from "@/lib/numbering";
import { requireCustomer, requireStaff, requireUser } from "@/lib/rbac";
import { generateInvoiceForSubscription } from "@/lib/billing";
import { ActionState } from "./auth";

async function defaultTaxRate() {
  const tax = await prisma.taxRule.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  return tax ? Number(tax.rate) : 0;
}

export async function createFromTemplateAction(formData: FormData) {
  await requireStaff();
  const templateId = String(formData.get("templateId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");
  const startDate = new Date(String(formData.get("startDate")));
  const expiryDateRaw = String(formData.get("expiryDate") ?? "");
  const paymentTerms = String(formData.get("paymentTerms") ?? "Net 30");
  const template = await prisma.quotationTemplate.findUnique({
    where: { id: templateId },
    include: { lines: { include: { product: true } }, plan: true },
  });
  if (!template || !customerId) return;
  const taxRate = await defaultTaxRate();
  const number = await nextNumber("SUB");
  const created = await prisma.subscription.create({
    data: {
      number,
      customerId,
      planId: template.planId,
      startDate,
      expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
      paymentTerms,
      status: SubscriptionStatus.QUOTATION,
      quoteValidUntil: addDays(new Date(), template.validityDays),
      lines: {
        create: template.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          description: line.product.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate,
          amount: new Prisma.Decimal(Number(line.unitPrice) * line.quantity),
        })),
      },
    },
  });
  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${created.id}`);
}

export async function createSubscriptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();
  const customerId = String(formData.get("customerId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!customerId || !planId || !productId) {
    return { error: "Customer, plan and product are required." };
  }
  const [plan, product, variant] = await Promise.all([
    prisma.plan.findUnique({ where: { id: planId } }),
    prisma.product.findUnique({ where: { id: productId } }),
    variantId ? prisma.productVariant.findUnique({ where: { id: variantId } }) : null,
  ]);
  if (!plan || !product) return { error: "Plan or product not found." };
  if (quantity < plan.minQuantity) {
    return { error: `Minimum quantity for this plan is ${plan.minQuantity}.` };
  }
  const unitPrice = Number(product.salesPrice) + Number(variant?.priceDelta ?? 0);
  const taxRate = await defaultTaxRate();
  const number = await nextNumber("SUB");
  const created = await prisma.subscription.create({
    data: {
      number,
      customerId,
      planId,
      startDate: new Date(String(formData.get("startDate"))),
      expiryDate: String(formData.get("expiryDate") ?? "")
        ? new Date(String(formData.get("expiryDate")))
        : null,
      paymentTerms: String(formData.get("paymentTerms") ?? "Net 30"),
      status: SubscriptionStatus.DRAFT,
      notes: String(formData.get("notes") ?? "") || null,
      lines: {
        create: [
          {
            productId,
            variantId: variantId || null,
            description: variant
              ? `${product.name} · ${variant.value}`
              : product.name,
            quantity,
            unitPrice,
            taxRate,
            amount: unitPrice * quantity,
          },
        ],
      },
    },
  });
  revalidatePath("/subscriptions");
  redirect(`/subscriptions/${created.id}`);
}

export async function transitionSubscriptionAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next")) as SubscriptionStatus | "RESUME";
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });
  if (!sub) return;
  if (user.role === "CUSTOMER" && sub.customerId !== user.id) return;
  if (user.role === "CUSTOMER" && !["PAUSED", "CLOSED", "ACTIVE", "RESUME"].includes(next)) {
    return;
  }

  let status = sub.status;
  let nextBillingAt = sub.nextBillingAt;
  let expiryDate = sub.expiryDate;

  if (next === "QUOTATION" && sub.status === "DRAFT") status = "QUOTATION";
  if (next === "CONFIRMED" && (sub.status === "QUOTATION" || sub.status === "DRAFT")) {
    status = "CONFIRMED";
  }
  if (next === "ACTIVE" && (sub.status === "CONFIRMED" || sub.status === "QUOTATION")) {
    status = "ACTIVE";
    nextBillingAt = sub.nextBillingAt ?? sub.startDate;
  }
  if (next === "PAUSED" && sub.status === "ACTIVE") {
    if (!sub.plan.allowPause) return;
    status = "PAUSED";
  }
  if (next === "RESUME" && sub.status === "PAUSED") {
    status = "ACTIVE";
    nextBillingAt = new Date();
  }
  if (next === "CLOSED" && ["ACTIVE", "PAUSED", "CONFIRMED"].includes(sub.status)) {
    if (sub.status === "ACTIVE" && !sub.plan.allowEarlyClose) {
      if (!sub.expiryDate || sub.expiryDate > new Date()) return;
    }
    status = "CLOSED";
    nextBillingAt = null;
  }
  if (next === "ACTIVE" && sub.status === "CLOSED") {
    if (!sub.plan.allowRenew) return;
    status = "ACTIVE";
    expiryDate = addDays(new Date(), 365);
    nextBillingAt = new Date();
  }

  await prisma.subscription.update({
    where: { id },
    data: { status, nextBillingAt, expiryDate },
  });
  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${id}`);
  revalidatePath("/portal");
}

export async function billNowAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  await generateInvoiceForSubscription(id);
  revalidatePath("/invoices");
  revalidatePath(`/subscriptions/${id}`);
}

export async function createTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  const planId = String(formData.get("planId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const validityDays = Number(formData.get("validityDays") ?? 30);
  if (!name || !planId || !productId) return { error: "Name, plan and product are required." };
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found." };
  await prisma.quotationTemplate.create({
    data: {
      name,
      planId,
      validityDays,
      lines: {
        create: [
          {
            productId,
            quantity,
            unitPrice: product.salesPrice,
          },
        ],
      },
    },
  });
  revalidatePath("/templates");
  return { success: "Template saved." };
}
