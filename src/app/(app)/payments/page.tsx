import { recordPaymentAction } from "@/actions/billing";
import { ActionForm } from "@/components/action-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";
import Link from "next/link";

export default async function PaymentsPage() {
  const [payments, openInvoices] = await Promise.all([
    prisma.payment.findMany({
      include: { invoice: true },
      orderBy: { paidAt: "desc" },
      take: 50,
    }),
    prisma.invoice.findMany({
      where: { status: "CONFIRMED" },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Payments" description="Recorded against invoices. No live card charging." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Date</th>
              <th>Invoice</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-line">
                <td className="px-5 py-3">{formatDate(payment.paidAt)}</td>
                <td>
                  <Link href={`/invoices/${payment.invoiceId}`} className="text-accent">
                    {payment.invoice.number}
                  </Link>
                </td>
                <td>{payment.method.replaceAll("_", " ")}</td>
                <td>{formatMoney(payment.amount)}</td>
                <td className="text-muted">{payment.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Record payment</h2>
        <ActionForm action={recordPaymentAction} submitLabel="Save payment">
          <Field label="Invoice">
            <Select name="invoiceId" required>
              {openInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} · {inv.customerName} · {formatMoney(inv.total)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <Input name="amount" type="number" step="0.01" required />
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
    </div>
  );
}
