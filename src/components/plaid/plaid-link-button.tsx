"use client";

import { useState, useCallback, useEffect } from "react";
import { Landmark, Loader2, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaidLinkButtonProps {
  familyId: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

/**
 * PlaidLink button component that opens the Plaid Link modal.
 * Loads the Plaid Link script dynamically and handles the full
 * link → exchange → sync flow.
 */
export function PlaidLinkButton({
  familyId,
  onSuccess,
  className,
  variant = "default",
}: PlaidLinkButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [plaidReady, setPlaidReady] = useState(false);

  // Load the Plaid Link script on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).Plaid) {
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.async = true;
      script.onload = () => setPlaidReady(true);
      document.head.appendChild(script);
    } else {
      setPlaidReady(true);
    }
  }, []);

  const handleClick = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Get a link token from our API
      const tokenRes = await fetch("/api/plaid/create-link-token", {
        method: "POST",
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json();
        throw new Error(data.error || "Failed to create link token");
      }

      const { linkToken } = await tokenRes.json();

      // 2. Open Plaid Link
      const Plaid = (window as any).Plaid;
      if (!Plaid) {
        throw new Error("Plaid Link script not loaded");
      }

      const handler = Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken: string, metadata: any) => {
          try {
            // 3. Exchange the public token
            const exchangeRes = await fetch("/api/plaid/exchange-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                publicToken,
                familyId,
                institutionName: metadata.institution?.name || null,
                institutionId: metadata.institution?.institution_id || null,
              }),
            });

            if (!exchangeRes.ok) {
              const data = await exchangeRes.json();
              throw new Error(data.error || "Failed to link account");
            }

            const result = await exchangeRes.json();
            setSuccess(true);
            setLoading(false);

            // Reset success indicator after 3 seconds
            setTimeout(() => setSuccess(false), 3000);

            onSuccess?.();
          } catch (err: any) {
            setError(err.message);
            setLoading(false);
          }
        },
        onExit: (err: any) => {
          setLoading(false);
          if (err) {
            setError(err.display_message || "Link was closed");
          }
        },
        onEvent: (eventName: string) => {
          // Could log analytics events here
        },
      });

      handler.open();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [familyId, onSuccess]);

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        disabled={loading || !plaidReady}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : success ? (
          <Check className="w-4 h-4" />
        ) : (
          <Landmark className="w-4 h-4" />
        )}
        {success ? "Connected" : "Connect Account"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading || !plaidReady}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium transition-all",
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : success ? (
          <Check className="w-5 h-5" />
        ) : (
          <Landmark className="w-5 h-5" />
        )}
        {loading
          ? "Connecting..."
          : success
          ? "Account Connected!"
          : "Connect a Bank Account"}
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
