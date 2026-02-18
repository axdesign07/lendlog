"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithMagicLink } from "@/lib/auth";
import type { Translations } from "@/lib/i18n";
import { toast } from "sonner";

interface LoginPageProps {
  t: Translations;
}

export function LoginPage({ t }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await signInWithMagicLink(email.trim(), redirectTo);
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Magic link error:", msg);
      toast.error(msg || "Failed to send magic link");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t.appName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.loginDesc}
          </p>
        </div>

        {sent ? (
          /* Success state */
          <div className="rounded-2xl border bg-card p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.1)" }}>
              <CheckCircle2 className="h-7 w-7" style={{ color: "#10b981" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.checkEmail}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.checkEmailDesc}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        ) : (
          /* Login form */
          <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2"
              disabled={sending || !email.trim()}
            >
              {sending ? t.loading : t.sendMagicLink}
              {!sending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
