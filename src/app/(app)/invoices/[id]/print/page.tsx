import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/rbac";
import { formatDate, formatMoney } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 print:p-0">
      <div className="flex justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Brightloop Software</p>
          <h1 className="text-3xl font-semibold">Invoice {invoice.number}</h1>
        </div>
        <p className="text-sm">{invoice.status}</p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted">Bill to</p>
          <p className="font-medium">{invoice.customerName}</p>
          <p>{invoice.customerEmail}</p>
        </div>
        <div className="text-right">
          <p>Issued {formatDate(invoice.issueDate)}</p>
          <p>Due {formatDate(invoice.dueDate)}</p>
          <p>Period {invoice.periodKey}</p>
        </div>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="py-2">{line.description}</td>
              <td>{line.quantity}</td>
              <td>{formatMoney(line.unitPrice)}</td>
              <td>{formatMoney(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 text-right text-sm">
        <p>Subtotal {formatMoney(invoice.subtotal)}</p>
        <p>Discount {formatMoney(invoice.discountTotal)}</p>
        <p>Tax {formatMoney(invoice.taxTotal)}</p>
        <p className="text-lg font-semibold">Total {formatMoney(invoice.total)}</p>
      </div>
    </div>
  );
}
