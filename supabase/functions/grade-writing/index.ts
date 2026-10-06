import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GradeItem = {
  number: number;
  prompt: string;
  facts: string;
  modelAnswer: string;
  userAnswer: string;
};

type GradeResult = {
  number: number;
  criteria: [boolean, boolean, boolean];
  feedback: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", Connection: "keep-alive" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "GEMINI_API_KEY is not configured on the server." }, 503);

  let payload: { items?: GradeItem[] };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const items = payload.items?.filter((i) => i?.userAnswer?.trim()) ?? [];
  if (!items.length) return json({ results: [] });

  const rubric = `Grade each incident-report practice response using ONLY the facts block.
Criteria (all must be true for 1 point):
1. factsCorrect — required facts present, no unsupported details
2. oneSentence — one complete sentence
3. mechanics — spelling, grammar, capitalization, punctuation acceptable for a police report

Wording may differ from the model answer. Blank or off-topic answers get all false.

Return ONLY JSON (no markdown):
{"results":[{"number":66,"criteria":[true,false,true],"feedback":"2-4 sentences of specific, constructive feedback."}]}`;

  const prompt = `${rubric}\n\nITEMS:\n${JSON.stringify(items)}`;

  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.8-flash";
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error("Gemini error", geminiRes.status, errText);
    return json({ error: "Google AI grading failed. Try again later." }, 502);
  }

  const geminiJson = await geminiRes.json();
  const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return json({ error: "Empty response from Google AI." }, 502);

  let parsed: { results?: GradeResult[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Non-JSON Gemini output", text);
    return json({ error: "Could not parse AI grading response." }, 502);
  }

  const byNumber = new Map<number, GradeResult>();
  for (const r of parsed.results ?? []) {
    if (!Number.isInteger(r.number)) continue;
    const c = r.criteria;
    if (!Array.isArray(c) || c.length !== 3) continue;
    byNumber.set(r.number, {
      number: r.number,
      criteria: [Boolean(c[0]), Boolean(c[1]), Boolean(c[2])],
      feedback: String(r.feedback ?? "").slice(0, 2000),
    });
  }

  const results: GradeResult[] = items.map((item) => {
    const hit = byNumber.get(item.number);
    if (hit) return hit;
    return {
      number: item.number,
      criteria: [false, false, false],
      feedback: "AI could not grade this item. Use manual review or try again.",
    };
  });

  return json({ results });
});
