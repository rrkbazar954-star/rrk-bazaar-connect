const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

export type ProductDraft = {
  name: string;
  name_hi: string;
  description: string;
  unit: string;
  category: string;
  colors: string[];
  sizes: string[];
  keywords: string[];
};

const EMPTY: ProductDraft = {
  name: "",
  name_hi: "",
  description: "",
  unit: "",
  category: "",
  colors: [],
  sizes: [],
  keywords: [],
};

const SYSTEM = `You write product listings for an Indian neighbourhood marketplace app.
Look at the photo and reply with ONLY JSON in this shape:
{"name":"short english product name","name_hi":"हिन्दी नाम","description":"2 short selling sentences in simple Hindi","unit":"e.g. 1 pc / 500 g / 1 kg","category":"best matching category name in english","colors":["visible or likely colour options in english"],"sizes":["likely size options, e.g. S,M,L or 250g,500g"],"keywords":["english, hinglish and devanagari search words"]}
Rules: never invent a brand name. Keep description under 220 characters. colors and sizes may be empty arrays when the product has no variants.`;

function strArray(value: unknown, limit = 8): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim()).slice(0, limit)
    : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function describeProductImage(imageDataUrl: string): Promise<ProductDraft> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return EMPTY;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Write the listing for this product. JSON only." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error", response.status, await response.text());
    return EMPTY;
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return EMPTY;
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      name: str(parsed["name"]),
      name_hi: str(parsed["name_hi"]),
      description: str(parsed["description"]),
      unit: str(parsed["unit"]),
      category: str(parsed["category"]),
      colors: strArray(parsed["colors"], 10),
      sizes: strArray(parsed["sizes"], 10),
      keywords: strArray(parsed["keywords"], 12),
    };
  } catch {
    return EMPTY;
  }
}
