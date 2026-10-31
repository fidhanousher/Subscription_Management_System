import { createTaxAction, toggleTaxAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export default async function TaxesPage() {
  await requireAdmin();
  const taxes = await prisma.taxRule.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Tax rules" description="Applied automatically when invoices are generated." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th>Rate</th>
              <th>Applies to</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax) => (
              <tr key={tax.id} className="border-t border-line">
                <td className="px-5 py-3">{tax.name}</td>
                <td>{Number(tax.rate)}%</td>
                <td>{tax.appliesTo}</td>
                <td>{tax.active ? "Active" : "Off"}</td>
                <td>
                  <form action={toggleTaxAction}>
                    <input type="hidden" name="id" value={tax.id} />
                    <input type="hidden" name="active" value={String(tax.active)} />
                    <Button variant="secondary" type="submit">
                      Toggle
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Add tax</h2>
        <form action={createTaxAction} className="space-y-3">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Rate (%)">
            <Input name="rate" type="number" step="0.001" required />
          </Field>
          <Field label="Applies to">
            <Select name="appliesTo" defaultValue="ALL">
              <option value="ALL">All</option>
              <option value="PRODUCT">Products</option>
              <option value="SUBSCRIPTION">Subscriptions</option>
            </Select>
          </Field>
          <Button type="submit">Save tax</Button>
        </form>
      </Card>
    </div>
  );
}
