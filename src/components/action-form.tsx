"use client";

import { ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";

export function ActionForm({
  action,
  children,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      {children}
      <Button type="submit" disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </Button>
    </form>
  );
}
