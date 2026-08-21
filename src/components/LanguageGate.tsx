import { useState } from "react";

import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/icon-master.png";

/** First-run welcome + language chooser. Renders over the app until a language is stored. */
export function LanguageGate({ children }: { children: React.ReactNode }) {
  const { hasChosen, setLang, lang } = useI18n();
  const [picked, setPicked] = useState<Lang>(lang);

  if (hasChosen) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-10">
      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <img src={logo} alt="RRK Bazaar" width={96} height={96} className="size-24 rounded-3xl float-shadow" />
        <h1 className="mt-6 text-2xl leading-snug">RRK Bazaar में आपका स्वागत है</h1>
        <p className="mt-2 text-base text-muted-foreground">आपकी जरूरत, आपके पास।</p>

        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          भाषा चुनें / Choose language
        </p>
        <ul className="mt-4 grid w-full grid-cols-2 gap-3">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => setPicked(l.code)}
                className={cn(
                  "flex min-h-20 w-full flex-col items-center justify-center rounded-2xl border-2 bg-card px-3 py-3 transition-all",
                  picked === l.code ? "border-primary card-shadow" : "border-border",
                )}
              >
                <span className="text-lg font-bold">{l.label}</span>
                <span className="text-xs text-muted-foreground">{l.english}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Button size="lg" className="mt-8 h-14 w-full max-w-md text-base" onClick={() => setLang(picked)}>
        आगे बढ़ें / Continue
      </Button>
    </div>
  );
}
