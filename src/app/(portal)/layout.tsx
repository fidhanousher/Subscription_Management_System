import { PortalShell } from "@/components/app-shell";
import { requireCustomer } from "@/lib/rbac";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCustomer();
  return <PortalShell user={user}>{children}</PortalShell>;
}
