import { loginAction } from "@/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Sign in</h2>
      <ActionForm action={loginAction} submitLabel="Sign in">
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required autoComplete="current-password" />
        </Field>
      </ActionForm>
      <p className="mt-4 text-sm text-muted">
        New customer?{" "}
        <Link href="/signup" className="text-accent">
          Create an account
        </Link>
      </p>
      <p className="mt-1 text-sm text-muted">
        <Link href="/forgot-password" className="text-accent">
          Forgot password
        </Link>
      </p>
    </Card>
  );
}
