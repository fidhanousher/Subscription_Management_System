import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" }, take: 20 },
    },
  });
  if (!customer || customer.role !== "CUSTOMER") notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={customer.name}
          description={`${customer.email}${customer.company ? ` · ${customer.company}` : ""}`}
        />
      </Card>
      <Card>
        <CardHeader title="Subscriptions" />
        <table className="w-full text-sm">
          <tbody>
            {customer.subscriptions.map((sub) => (
              <tr key={sub.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/subscriptions/${sub.id}`} className="text-accent">
                    {sub.number}
                  </Link>
                </td>
                <td>{sub.plan.name}</td>
                <td>
                  <StatusBadge value={sub.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardHeader title="Invoices" />
        <table className="w-full text-sm">
          <tbody>
            {customer.invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/invoices/${inv.id}`} className="text-accent">
                    {inv.number}
                  </Link>
                </td>
                <td>
                  <StatusBadge value={inv.status} />
                </td>
                <td className="px-5">{formatMoney(inv.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
