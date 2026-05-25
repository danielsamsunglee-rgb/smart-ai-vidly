import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  dataUrl: z.string().min(20).max(30_000_000), // ~22MB base64 cap
  mimeType: z.string().min(1).max(100),
  languages: z.array(z.string().min(2).max(10)).min(1).max(15),
});

export type SubtitleCue = {
  start: number;
  end: number;
  source: string;
  translations: Record<string, string>;
};

export const generateSubtitles = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ cues: SubtitleCue[]; sourceLang?: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY 未配置，无法调用 AI 服务");
    }

    const langList = data.languages.join(", ");
    const prompt = `You are a professional video subtitler. Transcribe the spoken audio in this video with accurate timing in seconds. Then translate each segment into ALL of these target languages: ${langList}.

Rules:
- Detect the original spoken language.
- Split into natural caption segments, each 1-7 seconds long.
- "start" and "end" are seconds (numbers, may have decimals).
- "source" is the original transcription text.
- "translations" must contain exactly one entry per requested language code: ${langList}.
- If the video has no speech, return an empty cues array.

Return ONLY valid JSON in this exact shape, no markdown, no commentary:
{"sourceLang":"<detected code>","cues":[{"start":0.0,"end":2.5,"source":"...","translations":{"${data.languages[0]}":"...","..." :"..."}}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("AI 服务繁忙（速率限制），请稍后再试");
      if (res.status === 402) throw new Error("AI 额度不足，请联系管理员充值");
      throw new Error(`AI 调用失败 (${res.status}): ${txt.slice(0, 200)}`);
    }

    const json = await res.json();
    const text: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { cues?: SubtitleCue[]; sourceLang?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try extract JSON block
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { cues: [] };
    }

    const cues: SubtitleCue[] = Array.isArray(parsed.cues) ? parsed.cues : [];
    return { cues, sourceLang: parsed.sourceLang };
  });
