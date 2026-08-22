import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "लॉगिन — RRK Bazaar" },
      { name: "description", content: "RRK Bazaar में लॉगिन करें या नया खाता बनाएँ।" },
      { property: "og:title", content: "लॉगिन — RRK Bazaar" },
      { property: "og:description", content: "RRK Bazaar में लॉगिन करें या नया खाता बनाएँ।" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || password.length < 6) {
      toast.error("Email और 6+ अक्षर का पासवर्ड डालें");
      return;
    }
    setBusy(true);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/` },
          });
    setBusy(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      toast.success("Email पर भेजी गई लिंक से खाता पक्का करें");
      return;
    }
    toast.success(t("login"));
    void navigate({ to: "/" });
  }

  return (
    <AppShell>
      <PageHeader title={t("login")} subtitle="RRK Bazaar" />
      <div className="space-y-3 p-4">
        <Input
          className="h-12"
          type="email"
          inputMode="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          className="h-12"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button className="h-12 w-full font-bold" onClick={submit} disabled={busy}>
          {mode === "login" ? t("login") : "नया खाता बनाएँ"}
        </Button>
        <Button
          variant="ghost"
          className="h-11 w-full"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "नया खाता बनाएँ" : t("login")}
        </Button>
      </div>
    </AppShell>
  );
}
