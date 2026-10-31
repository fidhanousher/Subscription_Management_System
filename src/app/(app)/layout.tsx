import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/rbac";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return <AppShell user={user}>{children}</AppShell>;
}
