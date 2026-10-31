import { addVariantAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { formatMoney } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={product.name}
          description={`${product.type} · sales ${formatMoney(product.salesPrice)} · cost ${formatMoney(product.costPrice)}`}
        />
        <div className="px-5 py-4 text-sm text-muted">{product.notes ?? "No notes."}</div>
      </Card>
      <Card>
        <CardHeader title="Variants" description="Choosing a variant adds its delta to the sales price." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th>Value</th>
              <th>Price delta</th>
              <th>Resulting price</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => (
              <tr key={variant.id} className="border-t border-line">
                <td className="px-5 py-3">{variant.name}</td>
                <td>{variant.value}</td>
                <td>{formatMoney(variant.priceDelta)}</td>
                <td>
                  {formatMoney(Number(product.salesPrice) + Number(variant.priceDelta))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addVariantAction} className="grid gap-3 border-t border-line p-5 sm:grid-cols-4">
          <input type="hidden" name="productId" value={product.id} />
          <Field label="Name">
            <Input name="name" placeholder="Brand" required />
          </Field>
          <Field label="Value">
            <Input name="value" placeholder="Odoo" required />
          </Field>
          <Field label="Price delta">
            <Input name="priceDelta" type="number" step="0.01" defaultValue="0" />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Add variant</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
