import { resetPasswordAction } from "@/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return <Card className="p-6">Missing reset token.</Card>;
  }
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Choose a new password</h2>
      <ActionForm action={resetPasswordAction} submitLabel="Update password">
        <input type="hidden" name="token" value={token} />
        <Field label="New password">
          <Input name="password" type="password" required />
        </Field>
      </ActionForm>
    </Card>
  );
}
