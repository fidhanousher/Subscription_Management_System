import { createPlanAction } from "@/actions/catalog";
import { ActionForm } from "@/components/action-form";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function PlansPage() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Plans" description="Price, cadence, availability and lifecycle rules." />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-muted">
              <tr>
                <th className="px-5 py-2">Name</th>
                <th>Price</th>
                <th>Interval</th>
                <th>Min qty</th>
                <th>Available</th>
                <th>Rules</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-line">
                  <td className="px-5 py-3 font-medium">{plan.name}</td>
                  <td>{formatMoney(plan.price)}</td>
                  <td>
                    <StatusBadge value={plan.interval} />
                  </td>
                  <td>{plan.minQuantity}</td>
                  <td>
                    {formatDate(plan.availableFrom)}
                    {plan.availableTo ? ` – ${formatDate(plan.availableTo)}` : ""}
                  </td>
                  <td className="text-xs text-muted">
                    {[
                      plan.autoCloseOnEnd ? "auto-close" : null,
                      plan.allowEarlyClose ? "early close" : null,
                      plan.allowPause ? "pause" : null,
                      plan.allowRenew ? "renew" : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">New plan</h2>
        <ActionForm action={createPlanAction} submitLabel="Save plan">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Price">
            <Input name="price" type="number" step="0.01" required />
          </Field>
          <Field label="Billing interval">
            <Select name="interval" defaultValue="MONTHLY">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </Select>
          </Field>
          <Field label="Minimum quantity">
            <Input name="minQuantity" type="number" defaultValue={1} />
          </Field>
          <Field label="Available from">
            <Input name="availableFrom" type="date" required />
          </Field>
          <Field label="Available to">
            <Input name="availableTo" type="date" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="autoCloseOnEnd" defaultChecked /> Close on end date
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="allowEarlyClose" defaultChecked /> Allow early close
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="allowPause" defaultChecked /> Allow pause
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="allowRenew" defaultChecked /> Allow renew
          </label>
        </ActionForm>
      </Card>
    </div>
  );
}
