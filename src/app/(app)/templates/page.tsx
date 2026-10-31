import { createFromTemplateAction, createTemplateAction } from "@/actions/subscriptions";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export default async function TemplatesPage() {
  const [templates, customers, plans, products] = await Promise.all([
    prisma.quotationTemplate.findMany({
      include: { plan: true, lines: { include: { product: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { name: "asc" } }),
    prisma.plan.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Quotation templates"
          description="Start an offer from a template that already has the plan and product lines."
        />
        <div className="space-y-6 p-5">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-sm text-muted">
                    {template.plan.name} · valid {template.validityDays} days
                  </p>
                </div>
              </div>
              <ul className="mt-3 text-sm">
                {template.lines.map((line) => (
                  <li key={line.id}>
                    {line.product.name} × {line.quantity} @ {formatMoney(line.unitPrice)}
                  </li>
                ))}
              </ul>
              <form action={createFromTemplateAction} className="mt-4 grid gap-3 sm:grid-cols-4">
                <input type="hidden" name="templateId" value={template.id} />
                <Field label="Customer">
                  <Select name="customerId" required>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Start">
                  <Input name="startDate" type="date" required />
                </Field>
                <Field label="Expiry">
                  <Input name="expiryDate" type="date" />
                </Field>
                <div className="flex items-end">
                  <Button type="submit">Create quotation</Button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">New template</h2>
        <ActionForm action={createTemplateAction} submitLabel="Save template">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input name="name" required />
            </Field>
            <Field label="Validity (days)">
              <Input name="validityDays" type="number" defaultValue={30} />
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
            <Field label="Product line">
              <Select name="productId" required>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantity">
              <Input name="quantity" type="number" defaultValue={1} />
            </Field>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
