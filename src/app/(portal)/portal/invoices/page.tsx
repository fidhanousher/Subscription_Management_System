import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function PortalInvoicesPage() {
  const user = await requireCustomer();
  const invoices = await prisma.invoice.findMany({
    where: { customerId: user.id },
    include: { lines: true, payments: true },
    orderBy: { issueDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your invoices</h1>
      {invoices.map((inv) => {
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        return (
          <Card key={inv.id}>
            <CardHeader
              title={inv.number}
              description={`Issued ${formatDate(inv.issueDate)} · due ${formatDate(inv.dueDate)}`}
              actions={<StatusBadge value={inv.status} />}
            />
            <table className="w-full text-sm">
              <tbody>
                {inv.lines.map((line) => (
                  <tr key={line.id} className="border-t border-line">
                    <td className="px-5 py-2">{line.description}</td>
                    <td>× {line.quantity}</td>
                    <td className="px-5">{formatMoney(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 text-sm">
              Total {formatMoney(inv.total)} · Paid {formatMoney(paid)}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
