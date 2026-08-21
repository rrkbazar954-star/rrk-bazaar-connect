import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/AppShell";
import { ProductGrid } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cartQuery, searchProducts, similarProducts, type Product } from "@/lib/queries";
import { interpretPhoto, interpretQuery } from "@/lib/search.functions";
import { listenOnce, speakGreeting, speechSupported } from "@/lib/voice";

const searchSchema = z.object({
  q: z.string().optional(),
  mode: z.enum(["voice", "photo"]).optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "खोजें — RRK Bazaar" },
      {
        name: "description",
        content: "टेक्स्ट, आवाज़ या फोटो से सामान खोजें — हिन्दी, Hinglish और English में।",
      },
      { property: "og:title", content: "खोजें — RRK Bazaar" },
      { property: "og:description", content: "आवाज़ और फोटो से खरीदारी — RRK Bazaar." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t, speechLocale } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { q, mode } = Route.useSearch();
  const runInterpretQuery = useServerFn(interpretQuery);
  const runInterpretPhoto = useServerFn(interpretPhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const autoStarted = useRef(false);

  const [term, setTerm] = useState(q ?? "");
  const [listening, setListening] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiLabel, setAiLabel] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

  const { data: cart } = useQuery(cartQuery(user?.id));

  const results = useQuery({
    queryKey: ["search", q],
    enabled: !!q,
    queryFn: async (): Promise<Product[]> => {
      setFallback(false);
      const interpreted = await runInterpretQuery({ data: { query: q as string } });
      setAiLabel(interpreted.label ?? null);
      const terms = [q as string, ...interpreted.keywords];
      const found = await searchProducts(terms);
      if (found.length) return found;
      setFallback(true);
      return similarProducts([...(interpreted.keywords ?? []), q as string]);
    },
  });

  async function startVoice() {
    if (!speechSupported()) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }
    setListening(true);
    try {
      await speakGreeting();
      const transcript = await listenOnce(speechLocale);
      setTerm(transcript);
      if (transcript.trim()) void navigate({ to: "/search", search: { q: transcript.trim() } });
    } catch {
      toast.error(t("no_results"));
    } finally {
      setListening(false);
    }
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });
      setImagePreview(dataUrl);
      const interpreted = await runInterpretPhoto({ data: { image: dataUrl } });
      const guess = interpreted.label ?? interpreted.keywords[0] ?? "";
      if (!guess) {
        toast.error(t("no_results"));
        return;
      }
      setTerm(guess);
      void navigate({ to: "/search", search: { q: guess } });
    } catch {
      toast.error(t("no_results"));
    } finally {
      setPhotoBusy(false);
    }
  }

  useEffect(() => {
    if (autoStarted.current) return;
    if (mode === "voice") {
      autoStarted.current = true;
      void startVoice();
    }
    if (mode === "photo") {
      autoStarted.current = true;
      cameraRef.current?.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <AppShell>
      <header className="brand-gradient sticky top-0 z-30 px-4 pb-4 pt-5 text-primary-foreground">
        <h1 className="text-lg">{t("search")}</h1>
        <form
          className="mt-3 flex items-center gap-2 rounded-2xl bg-card p-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            if (term.trim()) void navigate({ to: "/search", search: { q: term.trim() } });
          }}
        >
          <SearchIcon className="ml-2 size-5 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={t("search_placeholder")}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none"
          />
        </form>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-12 gap-2 font-bold"
            onClick={startVoice}
            disabled={listening}
          >
            {listening ? <Loader2 className="size-5 animate-spin" /> : <Mic className="size-5" />}
            {listening ? t("listening") : t("voice_search")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-12 gap-2 font-bold"
            onClick={() => fileRef.current?.click()}
            disabled={photoBusy}
          >
            {photoBusy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
            {t("photo_search")}
          </Button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void handlePhoto(event.target.files?.[0])}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handlePhoto(event.target.files?.[0])}
        />
      </header>

      <div className="px-4 py-4">
        {imagePreview && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <img src={imagePreview} alt="" className="size-16 rounded-xl object-cover" />
            <p className="text-sm text-muted-foreground">{aiLabel ?? t("photo_search")}</p>
          </div>
        )}

        {results.isFetching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("search")}...
          </div>
        )}

        {!!q && !results.isFetching && (
          <>
            <h2 className="mb-3 text-base">
              {fallback ? t("similar_products") : `${t("search")}: ${q}`}
            </h2>
            {results.data?.length ? (
              <ProductGrid products={results.data} cartItems={cart ?? []} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("no_results")}</p>
            )}
          </>
        )}

        {!q && !results.isFetching && (
          <p className="text-sm text-muted-foreground">{t("search_placeholder")}</p>
        )}
      </div>
    </AppShell>
  );
}
