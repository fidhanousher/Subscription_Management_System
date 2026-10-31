import { Discount, DiscountType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { roundMoney } from "./money";

type LineInput = {
  productId: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type DiscountResult = {
  discount: Discount;
  amount: number;
};

export async function findApplicableDiscounts(params: {
  subscriptionId: string;
  lines: LineInput[];
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const subtotal = params.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const quantity = params.lines.reduce((sum, line) => sum + line.quantity, 0);

  const discounts = await prisma.discount.findMany({
    where: {
      active: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    include: {
      products: true,
      subscriptions: true,
    },
  });

  const applied: DiscountResult[] = [];

  for (const discount of discounts) {
    if (discount.maxUses != null && discount.usedCount >= discount.maxUses) {
      continue;
    }
    if (discount.minPurchase != null && subtotal < Number(discount.minPurchase)) {
      continue;
    }
    if (discount.minQuantity != null && quantity < discount.minQuantity) {
      continue;
    }

    const productIds = discount.products.map((p) => p.productId);
    const subscriptionIds = discount.subscriptions.map((s) => s.subscriptionId);
    const hasProductScope = productIds.length > 0;
    const hasSubScope = discount.applyToSubscription || subscriptionIds.length > 0;

    if (hasSubScope && subscriptionIds.length > 0 && !subscriptionIds.includes(params.subscriptionId)) {
      continue;
    }

    if (!hasProductScope && !hasSubScope && productIds.length === 0 && !discount.applyToSubscription) {
      // global discount
    } else if (hasProductScope && !hasSubScope) {
      const matching = params.lines.some(
        (line) => line.productId && productIds.includes(line.productId),
      );
      if (!matching) continue;
    }

    const base = hasProductScope
      ? params.lines
          .filter((line) => line.productId && productIds.includes(line.productId))
          .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
      : subtotal;

    const amount =
      discount.type === DiscountType.PERCENT
        ? roundMoney(base * (Number(discount.value) / 100))
        : Math.min(Number(discount.value), base);

    if (amount > 0) {
      applied.push({ discount, amount });
    }
  }

  return applied;
}

export function allocateDiscounts(
  lines: LineInput[],
  discounts: DiscountResult[],
) {
  const totalDiscount = roundMoney(discounts.reduce((sum, d) => sum + d.amount, 0));
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  return lines.map((line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const share = subtotal === 0 ? 0 : (lineSubtotal / subtotal) * totalDiscount;
    const discountAmount = roundMoney(share);
    const taxable = Math.max(lineSubtotal - discountAmount, 0);
    const tax = roundMoney(taxable * (line.taxRate / 100));
    return {
      ...line,
      discountAmount,
      tax,
      amount: roundMoney(taxable + tax),
    };
  });
}

export async function incrementDiscountUses(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.discount.updateMany({
    where: { id: { in: ids } },
    data: { usedCount: { increment: 1 } },
  });
}

export type Decimal = Prisma.Decimal;
