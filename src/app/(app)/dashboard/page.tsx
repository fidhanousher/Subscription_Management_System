import { runBillingAction } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? new Date(to) : new Date();

  const [
    activeSubscriptions,
    revenue,
    confirmedInvoices,
    overdueInvoices,
    recentPayments,
  ] = await Promise.all([
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: fromDate, lte: toDate } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      include: { payments: true },
    }),
    prisma.invoice.findMany({
      where: {
        status: "CONFIRMED",
        dueDate: { lt: new Date() },
      },
      include: { payments: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 8,
      include: { invoice: true },
    }),
  ]);

  const outstanding = confirmedInvoices
    .filter((inv) => inv.status === "CONFIRMED")
    .reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + Math.max(Number(inv.total) - paid, 0);
    }, 0);

  const overdueAmount = overdueInvoices.reduce((sum, inv) => {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + Math.max(Number(inv.total) - paid, 0);
  }, 0);

  const overdueCount = await prisma.invoice.count({
    where: { status: "CONFIRMED", dueDate: { lt: new Date() } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Finance overview</h1>
          <p className="text-sm text-muted">Active subscriptions, cash in, and what is still owed.</p>
        </div>
        <form action={runBillingAction}>
          <Button type="submit">Run billing now</Button>
        </form>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          From
          <input
            type="date"
            name="from"
            defaultValue={fromDate.toISOString().slice(0, 10)}
            className="ml-2 rounded-lg border border-line px-2 py-1"
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            name="to"
            defaultValue={toDate.toISOString().slice(0, 10)}
            className="ml-2 rounded-lg border border-line px-2 py-1"
          />
        </label>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active subscriptions" value={String(activeSubscriptions)} />
        <Kpi label="Revenue collected" value={formatMoney(revenue._sum.amount ?? 0)} />
        <Kpi label="Outstanding" value={formatMoney(outstanding)} />
        <Kpi
          label="Overdue invoices"
          value={`${overdueCount} · ${formatMoney(overdueAmount)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Overdue</h2>
          <ul className="space-y-2 text-sm">
            {overdueInvoices.length === 0 ? (
              <li className="text-muted">Nothing overdue.</li>
            ) : (
              overdueInvoices.map((inv) => (
                <li key={inv.id} className="flex justify-between">
                  <Link href={`/invoices/${inv.id}`} className="text-accent">
                    {inv.number}
                  </Link>
                  <span>
                    {inv.customerName} · {formatMoney(inv.total)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Recent payments</h2>
          <ul className="space-y-2 text-sm">
            {recentPayments.map((payment) => (
              <li key={payment.id} className="flex justify-between">
                <span>{payment.invoice.number}</span>
                <span>{formatMoney(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
