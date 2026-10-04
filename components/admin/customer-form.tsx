"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomerAction } from "@/lib/plan/actions";

export function CustomerForm() {
  const [state, formAction, pending] = useActionState(
    createCustomerAction,
    null
  );
  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          placeholder="+1 555 123 4567"
          autoComplete="tel"
        />
      </div>
      {state?.error ? (
        <div className="rounded-md bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save customer"}
        </Button>
      </div>
    </form>
  );
}
