"use client";

import { useState } from "react";
import { useRuntimeConfig } from "@/app/lib/runtimeConfigContext";
import { AuthNotConfigured } from "@/app/components/AuthNotConfigured";

export default function AccountPage() {
  const { clerk, convex } = useRuntimeConfig();
  if (!clerk || !convex) return <AuthNotConfigured />;
  return <AccountSettings />;
}

function AccountSettings() {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onDelete() {
    setStatus(null);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) {
        setStatus("Could not delete the account. Try again.");
        return;
      }
      setStatus("Your application data and sign-in have been deleted.");
      setConfirming(false);
    } catch {
      setStatus("Could not delete the account. Try again.");
    }
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-16 space-y-6">
      <h1 className="text-3xl font-semibold">Account</h1>
      <p className="text-sm text-muted-foreground">
        Deleting asks the server to remove your application, petitioner details,
        addresses, and employment, then delete the Clerk sign-in. A Clerk
        user.deleted webhook removes the same rows if the user is deleted in
        the Clerk dashboard. Convex backups age out on the plan retention
        window. Set that window in the Convex dashboard and mention it in the
        privacy policy.
      </p>
      {confirming ? (
        <div className="space-y-3">
          <p className="text-sm">This cannot be undone.</p>
          <button type="button" className="bg-destructive text-white px-4 py-2 rounded" onClick={onDelete}>
            Delete my application and sign-in
          </button>
          <button type="button" className="ml-3 text-sm underline" onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="border border-border px-4 py-2 rounded" onClick={() => setConfirming(true)}>
          Delete my application
        </button>
      )}
      {status && <p className="text-sm">{status}</p>}
    </main>
  );
}
