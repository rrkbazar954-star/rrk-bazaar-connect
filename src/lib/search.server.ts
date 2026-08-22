const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

type Parsed = { keywords: string[]; label?: string | undefined };

function extractJson(text: string): Parsed | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { keywords?: unknown; label?: unknown };
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k): k is string => typeof k === "string").slice(0, 8)
      : [];
    return { keywords, label: typeof parsed.label === "string" ? parsed.label : undefined };
  } catch {
    return null;
  }
}

async function callGateway(messages: unknown[]): Promise<Parsed> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { keywords: [] };

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.1 }),
  });

  if (!response.ok) {
    console.error("AI gateway error", response.status, await response.text());
    return { keywords: [] };
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";
  return extractJson(content) ?? { keywords: [] };
}

const TEXT_SYSTEM = `You normalise Indian grocery shopping queries for a neighbourhood store app.
The shopper may type Hindi (Devanagari), Hinglish (roman Hindi), Bengali or English.
Return ONLY JSON: {"keywords":["..."],"label":"short english product name"}
Rules:
- keywords must be short searchable words (1-2 words) covering the English name, the roman/Hinglish name and the Devanagari name of the product.
- Never invent brands unless the shopper named one.
Example input "mujhe doodh aur aata chahiye" -> {"keywords":["milk","doodh","दूध","atta","flour","आटा"],"label":"milk and atta"}`;

const IMAGE_SYSTEM = `You identify the main retail product in a photo taken inside an Indian home or shop.
Return ONLY JSON: {"keywords":["..."],"label":"short english product name"}
keywords must include the English product name, its roman Hindi name and its Devanagari name, plus the product category.`;

export async function interpretTextQuery(query: string): Promise<Parsed> {
  const result = await callGateway([
    { role: "system", content: TEXT_SYSTEM },
    { role: "user", content: query },
  ]);
  if (result.keywords.length === 0) {
    return { keywords: query.split(/\s+/).filter((w) => w.length > 1).slice(0, 5), label: query };
  }
  return result;
}

export async function interpretImage(imageDataUrl: string): Promise<Parsed> {
  return callGateway([
    { role: "system", content: IMAGE_SYSTEM },
    {
      role: "user",
      content: [
        { type: "text", text: "Which product is this? Answer with JSON only." },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ]);
}
