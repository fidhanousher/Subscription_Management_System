import { forgotPasswordAction } from "@/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Reset password</h2>
      <ActionForm action={forgotPasswordAction} submitLabel="Send reset link">
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
      </ActionForm>
      <p className="mt-4 text-sm">
        <Link href="/login" className="text-accent">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
