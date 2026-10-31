import { createStaffAction } from "@/actions/catalog";
import { ActionForm } from "@/components/action-form";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export default async function StaffPage() {
  await requireAdmin();
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Internal team" description="Only the admin can add staff." />
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-muted">
            <tr>
              <th className="px-5 py-2">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-5 py-3">{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <StatusBadge value={user.role} />
                </td>
                <td>{formatDate(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Add staff</h2>
        <ActionForm action={createStaffAction} submitLabel="Add staff member">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Temporary password">
            <Input name="password" type="password" required />
          </Field>
        </ActionForm>
      </Card>
    </div>
  );
}
