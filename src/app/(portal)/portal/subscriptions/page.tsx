import { transitionSubscriptionAction } from "@/actions/subscriptions";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/rbac";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function PortalSubscriptionsPage() {
  const user = await requireCustomer();
  const subscriptions = await prisma.subscription.findMany({
    where: { customerId: user.id },
    include: { plan: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your subscriptions</h1>
      {subscriptions.map((sub) => (
        <Card key={sub.id}>
          <CardHeader
            title={sub.number}
            description={sub.plan.name}
            actions={<StatusBadge value={sub.status} />}
          />
          <div className="px-5 py-3 text-sm text-muted">
            Start {formatDate(sub.startDate)}
            {sub.expiryDate ? ` · expiry ${formatDate(sub.expiryDate)}` : ""} · {sub.paymentTerms}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {sub.lines.map((line) => (
                <tr key={line.id} className="border-t border-line">
                  <td className="px-5 py-2">{line.description}</td>
                  <td>× {line.quantity}</td>
                  <td className="px-5">{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2 px-5 py-4">
            {sub.status === "ACTIVE" && sub.plan.allowPause ? (
              <form action={transitionSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="next" value="PAUSED" />
                <Button type="submit" variant="secondary">
                  Pause
                </Button>
              </form>
            ) : null}
            {sub.status === "PAUSED" ? (
              <form action={transitionSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="next" value="RESUME" />
                <Button type="submit">Resume</Button>
              </form>
            ) : null}
            {sub.status === "ACTIVE" && sub.plan.allowEarlyClose ? (
              <form action={transitionSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="next" value="CLOSED" />
                <Button type="submit" variant="danger">
                  Close
                </Button>
              </form>
            ) : null}
            {sub.status === "CLOSED" && sub.plan.allowRenew ? (
              <form action={transitionSubscriptionAction}>
                <input type="hidden" name="id" value={sub.id} />
                <input type="hidden" name="next" value="ACTIVE" />
                <Button type="submit">Renew</Button>
              </form>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
