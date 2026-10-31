import { billNowAction, transitionSubscriptionAction } from "@/actions/subscriptions";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      customer: true,
      plan: true,
      lines: true,
      invoices: { orderBy: { issueDate: "desc" } },
    },
  });
  if (!sub) notFound();

  const actions: { next: string; label: string }[] = [];
  if (sub.status === "DRAFT") actions.push({ next: "QUOTATION", label: "Move to quotation" });
  if (sub.status === "DRAFT" || sub.status === "QUOTATION") {
    actions.push({ next: "CONFIRMED", label: "Confirm" });
  }
  if (sub.status === "CONFIRMED" || sub.status === "QUOTATION") {
    actions.push({ next: "ACTIVE", label: "Activate" });
  }
  if (sub.status === "ACTIVE" && sub.plan.allowPause) {
    actions.push({ next: "PAUSED", label: "Pause" });
  }
  if (sub.status === "PAUSED") actions.push({ next: "RESUME", label: "Resume" });
  if (["ACTIVE", "PAUSED", "CONFIRMED"].includes(sub.status) && sub.plan.allowEarlyClose) {
    actions.push({ next: "CLOSED", label: "Close" });
  }
  if (sub.status === "CLOSED" && sub.plan.allowRenew) {
    actions.push({ next: "ACTIVE", label: "Renew" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={sub.number}
          description={`${sub.customer.name} · ${sub.plan.name}`}
          actions={<StatusBadge value={sub.status} />}
        />
        <div className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-3">
          <p>Start {formatDate(sub.startDate)}</p>
          <p>Expiry {sub.expiryDate ? formatDate(sub.expiryDate) : "open"}</p>
          <p>Terms {sub.paymentTerms}</p>
          <p>Next bill {sub.nextBillingAt ? formatDate(sub.nextBillingAt) : "—"}</p>
          <p>Quote valid {sub.quoteValidUntil ? formatDate(sub.quoteValidUntil) : "—"}</p>
          <p>Last period {sub.lastBilledPeriodKey ?? "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
          {actions.map((action) => (
            <form action={transitionSubscriptionAction} key={action.label}>
              <input type="hidden" name="id" value={sub.id} />
              <input type="hidden" name="next" value={action.next} />
              <Button type="submit" variant="secondary">
                {action.label}
              </Button>
            </form>
          ))}
          {sub.status === "ACTIVE" ? (
            <form action={billNowAction}>
              <input type="hidden" name="id" value={sub.id} />
              <Button type="submit">Generate invoice</Button>
            </form>
          ) : null}
        </div>
      </Card>
      <Card>
        <CardHeader title="Lines" />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Item</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Tax</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {sub.lines.map((line) => (
              <tr key={line.id} className="border-t border-line">
                <td className="px-5 py-3">{line.description}</td>
                <td>{line.quantity}</td>
                <td>{formatMoney(line.unitPrice)}</td>
                <td>{Number(line.taxRate)}%</td>
                <td>{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardHeader title="Invoices" />
        <table className="w-full text-sm">
          <tbody>
            {sub.invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/invoices/${inv.id}`} className="text-accent">
                    {inv.number}
                  </Link>
                </td>
                <td>{inv.periodKey}</td>
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
