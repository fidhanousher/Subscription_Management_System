import { createSubscriptionAction } from "@/actions/subscriptions";
import { ActionForm } from "@/components/action-form";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const PAGE_SIZE = 25;

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page } = await searchParams;
  const skip = (Math.max(Number(page ?? 1), 1) - 1) * PAGE_SIZE;
  const where = status ? { status: status as never } : {};
  const [items, total, customers, plans, products] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: { customer: true, plan: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.subscription.count({ where }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { name: "asc" } }),
    prisma.plan.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ include: { variants: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Subscriptions"
          description={`${total} on the books. Draft → Quotation → Confirmed → Active → Closed.`}
        />
        <form className="flex gap-2 border-b border-line px-5 py-3 text-sm">
          <Select name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {["DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <button className="text-accent">Filter</button>
        </form>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Number</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Start</th>
              <th>Next bill</th>
            </tr>
          </thead>
          <tbody>
            {items.map((sub) => (
              <tr key={sub.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/subscriptions/${sub.id}`} className="text-accent">
                    {sub.number}
                  </Link>
                </td>
                <td>{sub.customer.name}</td>
                <td>{sub.plan.name}</td>
                <td>
                  <StatusBadge value={sub.status} />
                </td>
                <td>{formatDate(sub.startDate)}</td>
                <td>{sub.nextBillingAt ? formatDate(sub.nextBillingAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">New subscription (draft)</h2>
        <ActionForm action={createSubscriptionAction} submitLabel="Create draft">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer">
              <Select name="customerId" required>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Plan">
              <Select name="planId" required>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Product">
              <Select name="productId" required>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Variant">
              <Select name="variantId" defaultValue="">
                <option value="">None</option>
                {products.flatMap((product) =>
                  product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {product.name} · {variant.value} (+{Number(variant.priceDelta)})
                    </option>
                  )),
                )}
              </Select>
            </Field>
            <Field label="Quantity">
              <Input name="quantity" type="number" defaultValue={1} />
            </Field>
            <Field label="Payment terms">
              <Select name="paymentTerms" defaultValue="Net 30">
                <option>Due on receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
              </Select>
            </Field>
            <Field label="Start">
              <Input name="startDate" type="date" required />
            </Field>
            <Field label="Expiry">
              <Input name="expiryDate" type="date" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea name="notes" rows={2} />
              </Field>
            </div>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
