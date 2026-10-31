import { signupAction } from "@/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
  return (
    <Card className="p-6">
      <h2 className="mb-1 text-lg font-semibold">Create your account</h2>
      <p className="mb-4 text-sm text-muted">
        Password must be more than eight characters and include upper, lower and a special
        character.
      </p>
      <ActionForm action={signupAction} submitLabel="Create account">
        <Field label="Name">
          <Input name="name" required />
        </Field>
        <Field label="Company">
          <Input name="company" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required />
        </Field>
        <Field label="Confirm password">
          <Input name="confirm" type="password" required />
        </Field>
      </ActionForm>
      <p className="mt-4 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-accent">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
