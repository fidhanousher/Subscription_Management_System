import { createCustomerAction } from "@/actions/customers";
import { ActionForm } from "@/components/action-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { _count: { select: { subscriptions: true, invoices: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Customers" description="Accounts that buy on subscription." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Subs</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-line">
                <td className="px-5 py-3">
                  <Link href={`/customers/${customer.id}`} className="text-accent">
                    {customer.name}
                  </Link>
                </td>
                <td>{customer.email}</td>
                <td>{customer.company ?? "—"}</td>
                <td>{customer._count.subscriptions}</td>
                <td>{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">New customer</h2>
        <ActionForm action={createCustomerAction} submitLabel="Create customer">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Company">
            <Input name="company" />
          </Field>
          <Field label="Portal password">
            <Input name="password" type="password" defaultValue="Customer123!" />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
