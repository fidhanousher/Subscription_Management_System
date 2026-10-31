import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";
import Link from "next/link";

const PAGE_SIZE = 25;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string; page?: string }>;
}) {
  const { status, view, page } = await searchParams;
  const skip = (Math.max(Number(page ?? 1), 1) - 1) * PAGE_SIZE;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (view === "outstanding") where.status = "CONFIRMED";
  if (view === "overdue") {
    where.status = "CONFIRMED";
    where.dueDate = { lt: new Date() };
  }
  if (view === "paid") where.status = "PAID";

  const [items, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { payments: true, subscription: true },
      orderBy: { issueDate: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ]);

  return (
    <Card>
      <CardHeader
        title="Invoices"
        description={`${total} invoices. Nothing is billed twice: each subscription period is unique.`}
      />
      <form className="flex flex-wrap gap-2 border-b border-line px-5 py-3 text-sm">
        <Select name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          {["DRAFT", "CONFIRMED", "PAID", "CANCELLED"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select name="view" defaultValue={view ?? ""}>
          <option value="">All</option>
          <option value="outstanding">Outstanding</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </Select>
        <button className="text-accent">Filter</button>
      </form>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-muted">
          <tr>
            <th className="px-5 py-2">Number</th>
            <th>Customer</th>
            <th>Period</th>
            <th>Due</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((inv) => {
            const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const overdue = inv.status === "CONFIRMED" && inv.dueDate < new Date();
            return (
              <tr key={inv.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/invoices/${inv.id}`} className="text-accent">
                    {inv.number}
                  </Link>
                </td>
                <td>{inv.customerName}</td>
                <td>{inv.periodKey}</td>
                <td>{formatDate(inv.dueDate)}</td>
                <td>{formatMoney(inv.total)}</td>
                <td>{formatMoney(paid)}</td>
                <td>
                  <StatusBadge value={overdue ? "OVERDUE" : inv.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
