import { createProductAction } from "@/actions/catalog";
import { ActionForm } from "@/components/action-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

export default async function ProductsPage() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Products" description="Catalog with optional variants such as brand." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th>Type</th>
              <th>Sales</th>
              <th>Variants</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/products/${product.id}`} className="text-accent">
                    {product.name}
                  </Link>
                </td>
                <td>{product.type}</td>
                <td>{formatMoney(product.salesPrice)}</td>
                <td>{product.variants.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Add product</h2>
        <ActionForm action={createProductAction} submitLabel="Save product">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Type">
            <Input name="type" placeholder="Software, Add-on…" required />
          </Field>
          <Field label="Sales price">
            <Input name="salesPrice" type="number" step="0.01" required />
          </Field>
          <Field label="Cost price">
            <Input name="costPrice" type="number" step="0.01" required />
          </Field>
          <Field label="Notes">
            <Textarea name="notes" rows={3} />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
