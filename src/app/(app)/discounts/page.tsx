import { createDiscountAction } from "@/actions/catalog";
import { ActionForm } from "@/components/action-form";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export default async function DiscountsPage() {
  await requireAdmin();
  const [discounts, products, subscriptions] = await Promise.all([
    prisma.discount.findMany({
      include: { products: { include: { product: true } }, subscriptions: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.subscription.findMany({
      select: { id: true, number: true },
      orderBy: { number: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Discounts"
          description="Admin-only rules. Eligible discounts apply on the next invoice automatically."
        />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th>Value</th>
              <th>Window</th>
              <th>Uses</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id} className="border-t border-line">
                <td className="px-5 py-3">{discount.name}</td>
                <td>
                  <StatusBadge value={discount.type} />{" "}
                  {discount.type === "PERCENT"
                    ? `${Number(discount.value)}%`
                    : Number(discount.value)}
                </td>
                <td>
                  {formatDate(discount.startDate)}
                  {discount.endDate ? ` – ${formatDate(discount.endDate)}` : ""}
                </td>
                <td>
                  {discount.usedCount}
                  {discount.maxUses != null ? ` / ${discount.maxUses}` : ""}
                </td>
                <td className="text-xs text-muted">
                  {discount.products.map((p) => p.product.name).join(", ") ||
                    (discount.applyToSubscription ? "Subscriptions" : "Any")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">New discount</h2>
        <ActionForm action={createDiscountAction} submitLabel="Save discount">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="PERCENT">
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </Select>
          </Field>
          <Field label="Value">
            <Input name="value" type="number" step="0.01" required />
          </Field>
          <Field label="Min purchase">
            <Input name="minPurchase" type="number" step="0.01" />
          </Field>
          <Field label="Min quantity">
            <Input name="minQuantity" type="number" />
          </Field>
          <Field label="Start">
            <Input name="startDate" type="date" required />
          </Field>
          <Field label="End">
            <Input name="endDate" type="date" />
          </Field>
          <Field label="Max uses">
            <Input name="maxUses" type="number" />
          </Field>
          <Field label="Specific product (optional)">
            <Select name="productId" defaultValue="">
              <option value="">Any product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Specific subscription (optional)">
            <Select name="subscriptionId" defaultValue="">
              <option value="">Any / none</option>
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.number}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="applyToSubscription" /> Apply to whole subscriptions
          </label>
        </ActionForm>
      </Card>
    </div>
  );
}
