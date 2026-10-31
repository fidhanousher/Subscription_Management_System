import { invoiceStatusAction, recordPaymentAction } from "@/actions/billing";
import { ActionForm } from "@/components/action-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lines: true, payments: true, subscription: true },
  });
  if (!invoice) notFound();
  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = Math.max(Number(invoice.total) - paid, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={invoice.number}
          description={`${invoice.customerName} · ${invoice.customerEmail}`}
          actions={
            <div className="flex gap-2">
              <StatusBadge value={invoice.status} />
              <Link
                href={`/invoices/${invoice.id}/print`}
                className="rounded-lg border border-line px-3 py-1 text-sm"
              >
                Print
              </Link>
            </div>
          }
        />
        <div className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-4">
          <p>Issued {formatDate(invoice.issueDate)}</p>
          <p>Due {formatDate(invoice.dueDate)}</p>
          <p>Period {invoice.periodKey}</p>
          <p>
            Subscription{" "}
            <Link href={`/subscriptions/${invoice.subscriptionId}`} className="text-accent">
              {invoice.subscription.number}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
          {invoice.status === "DRAFT" ? (
            <form action={invoiceStatusAction}>
              <input type="hidden" name="id" value={invoice.id} />
              <input type="hidden" name="next" value="CONFIRMED" />
              <Button type="submit">Confirm</Button>
            </form>
          ) : null}
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" ? (
            <>
              <form action={invoiceStatusAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="next" value="SEND" />
                <Button type="submit" variant="secondary">
                  Send
                </Button>
              </form>
              <form action={invoiceStatusAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="next" value="CANCELLED" />
                <Button type="submit" variant="danger">
                  Cancel
                </Button>
              </form>
            </>
          ) : null}
        </div>
      </Card>
      <Card>
        <CardHeader title="Lines" />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Tax</th>
              <th>Discount</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-t border-line">
                <td className="px-5 py-3">{line.description}</td>
                <td>{line.quantity}</td>
                <td>{formatMoney(line.unitPrice)}</td>
                <td>{Number(line.taxRate)}%</td>
                <td>{formatMoney(line.discountAmount)}</td>
                <td>{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 px-5 py-4 text-right text-sm">
          <p>Subtotal {formatMoney(invoice.subtotal)}</p>
          <p>Discount {formatMoney(invoice.discountTotal)}</p>
          <p>Tax {formatMoney(invoice.taxTotal)}</p>
          <p className="text-base font-semibold">Total {formatMoney(invoice.total)}</p>
          <p>Paid {formatMoney(paid)}</p>
          <p>Outstanding {formatMoney(outstanding)}</p>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Payments" />
          <ul className="space-y-2 px-5 py-4 text-sm">
            {invoice.payments.map((payment) => (
              <li key={payment.id} className="flex justify-between">
                <span>
                  {payment.method.replaceAll("_", " ")} · {formatDate(payment.paidAt)}
                </span>
                <span>{formatMoney(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
        {invoice.status !== "CANCELLED" && invoice.status !== "DRAFT" ? (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Record payment</h2>
            <ActionForm action={recordPaymentAction} submitLabel="Save payment">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Field label="Amount">
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={outstanding || Number(invoice.total)}
                  required
                />
              </Field>
              <Field label="Method">
                <Select name="method" defaultValue="BANK_TRANSFER">
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CARD_OFFLINE">Card (offline)</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </Select>
              </Field>
              <Field label="Date">
                <Input
                  name="paidAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </Field>
              <Field label="Note">
                <Textarea name="note" rows={2} />
              </Field>
            </ActionForm>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
