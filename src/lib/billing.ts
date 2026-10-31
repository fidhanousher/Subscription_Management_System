import { InvoiceStatus, Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { prisma } from "./prisma";
import { addInterval, periodKey } from "./dates";
import { dueDaysFromTerms, roundMoney } from "./money";
import { nextNumber } from "./numbering";
import {
  allocateDiscounts,
  findApplicableDiscounts,
  incrementDiscountUses,
} from "./discounts";

export async function generateInvoiceForSubscription(
  subscriptionId: string,
  options?: { periodDate?: Date },
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      customer: true,
      plan: true,
      lines: true,
    },
  });
  if (!subscription) throw new Error("Subscription not found.");
  if (subscription.status !== "ACTIVE") {
    throw new Error("Only active subscriptions can be billed.");
  }

  const periodDate = options?.periodDate ?? subscription.nextBillingAt ?? new Date();
  const key = periodKey(periodDate, subscription.plan.interval);

  const existing = await prisma.invoice.findUnique({
    where: {
      subscriptionId_periodKey: {
        subscriptionId,
        periodKey: key,
      },
    },
  });
  if (existing) {
    return { invoice: existing, created: false };
  }

  const defaultTax = await prisma.taxRule.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  const fallbackRate = defaultTax ? Number(defaultTax.rate) : 0;

  const rawLines = [
    ...(Number(subscription.plan.price) > 0
      ? [
          {
            productId: null as string | null,
            quantity: 1,
            unitPrice: Number(subscription.plan.price),
            taxRate: fallbackRate,
            description: `Plan: ${subscription.plan.name}`,
          },
        ]
      : []),
    ...subscription.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: Number(line.unitPrice),
      taxRate: Number(line.taxRate) || fallbackRate,
      description: line.description,
    })),
  ];

  const discounts = await findApplicableDiscounts({
    subscriptionId,
    lines: rawLines,
    now: periodDate,
  });
  const priced = allocateDiscounts(rawLines, discounts);
  const subtotal = roundMoney(
    priced.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
  );
  const discountTotal = roundMoney(
    priced.reduce((sum, line) => sum + line.discountAmount, 0),
  );
  const taxTotal = roundMoney(priced.reduce((sum, line) => sum + line.tax, 0));
  const total = roundMoney(subtotal - discountTotal + taxTotal);
  const dueDate = addDays(periodDate, dueDaysFromTerms(subscription.paymentTerms));

  try {
  const number = await nextNumber("INV");
  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        number,
        customerId: subscription.customerId,
        customerName: subscription.customer.name,
        customerEmail: subscription.customer.email,
        subscriptionId: subscription.id,
        periodKey: key,
        status: InvoiceStatus.DRAFT,
        issueDate: periodDate,
        dueDate,
        subtotal: new Prisma.Decimal(subtotal),
        taxTotal: new Prisma.Decimal(taxTotal),
        discountTotal: new Prisma.Decimal(discountTotal),
        total: new Prisma.Decimal(total),
        lines: {
          create: priced.map((line) => ({
            description:
              "description" in line && typeof line.description === "string"
                ? line.description
                : "Line",
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: new Prisma.Decimal(line.unitPrice),
            taxRate: new Prisma.Decimal(line.taxRate),
            discountAmount: new Prisma.Decimal(line.discountAmount),
            amount: new Prisma.Decimal(line.amount),
          })),
        },
      },
    });

    const nextBillingAt = addInterval(periodDate, subscription.plan.interval);
    const shouldClose =
      subscription.plan.autoCloseOnEnd &&
      subscription.expiryDate &&
      nextBillingAt > subscription.expiryDate;

    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        lastBilledPeriodKey: key,
        nextBillingAt: shouldClose ? null : nextBillingAt,
        status: shouldClose ? "CLOSED" : "ACTIVE",
      },
    });

    return created;
  }, { timeout: 15000 });

  await incrementDiscountUses(discounts.map((d) => d.discount.id));
  return { invoice, created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const invoice = await prisma.invoice.findUnique({
        where: {
          subscriptionId_periodKey: {
            subscriptionId,
            periodKey: key,
          },
        },
      });
      if (invoice) return { invoice, created: false };
    }
    throw error;
  }
}

export async function runBilling(now = new Date()) {
  const due = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      nextBillingAt: { lte: now },
    },
    select: { id: true, nextBillingAt: true },
  });

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of due) {
    try {
      const result = await generateInvoiceForSubscription(item.id, {
        periodDate: item.nextBillingAt ?? now,
      });
      if (result.created) created += 1;
      else skipped += 1;
    } catch (error) {
      errors.push(
        `${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return { due: due.length, created, skipped, errors };
}
