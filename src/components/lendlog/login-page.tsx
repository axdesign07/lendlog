"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithMagicLink } from "@/lib/auth";
import type { Translations } from "@/lib/i18n";
import { toast } from "sonner";

interface LoginPageProps {
  t: Translations;
}

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="w-full max-w-sm space-y-8"
      >
        {/* Logo */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight"
          >
            {t.appName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring, delay: 0.2 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            {t.loginDesc}
          </motion.p>
        </div>

        {sent ? (
          /* Success state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="rounded-2xl border bg-card p-8 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: "#10b981" }} />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold">{t.checkEmail}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.checkEmailDesc}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{email}</p>
          </motion.div>
        ) : (
          /* Login form */
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-card p-6 space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-12 pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 gap-2 rounded-2xl text-[15px] font-semibold"
              disabled={sending || !email.trim()}
            >
              {sending ? t.loading : t.sendMagicLink}
              {!sending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
