"use server";

import { InvoiceStatus, PaymentMethod, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/rbac";
import { runBilling } from "@/lib/billing";
import { ActionState } from "./auth";

export async function runBillingAction() {
  await requireStaff();
  await runBilling();
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function invoiceStatusAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next")) as InvoiceStatus | "SEND";
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!invoice) return;

  if (next === "SEND") {
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id },
        data: { status: "CONFIRMED", sentAt: new Date() },
      });
    } else {
      await prisma.invoice.update({
        where: { id },
        data: { sentAt: new Date() },
      });
    }
    console.log(`Invoice ${invoice.number} sent to ${invoice.customerEmail}`);
  } else if (next === "CONFIRMED" && invoice.status === "DRAFT") {
    await prisma.invoice.update({ where: { id }, data: { status: "CONFIRMED" } });
  } else if (next === "CANCELLED" && invoice.status !== "PAID") {
    await prisma.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function recordPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method")) as PaymentMethod;
  const paidAt = new Date(String(formData.get("paidAt") ?? new Date().toISOString()));
  const note = String(formData.get("note") ?? "").trim();
  if (!invoiceId || Number.isNaN(amount) || amount <= 0) {
    return { error: "Invoice and a positive amount are required." };
  }
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice || invoice.status === "CANCELLED") {
    return { error: "Invoice cannot accept payments." };
  }
  if (invoice.status === "DRAFT") {
    return { error: "Confirm the invoice before recording payment." };
  }

  await prisma.payment.create({
    data: {
      invoiceId,
      method,
      amount: new Prisma.Decimal(amount),
      paidAt,
      note: note || null,
    },
  });

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;
  if (paid + 0.001 >= Number(invoice.total)) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });
  } else if (invoice.status !== "CONFIRMED") {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "CONFIRMED" },
    });
  }

  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  return { success: "Payment recorded." };
}
