import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

export default async function PortalHomePage() {
  const user = await requireCustomer();
  const [subscriptions, invoices] = await Promise.all([
    prisma.subscription.findMany({
      where: { customerId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { customerId: user.id },
      orderBy: { issueDate: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hello, {user.name}</h1>
        <p className="text-sm text-muted">Your subscriptions and invoices, without emailing anyone.</p>
      </div>
      <Card>
        <CardHeader title="Subscriptions" />
        <table className="w-full text-sm">
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href="/portal/subscriptions" className="text-accent">
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
        <CardHeader title="Recent invoices" />
        <table className="w-full text-sm">
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href="/portal/invoices" className="text-accent">
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
