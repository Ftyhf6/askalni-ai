export const runtime = "nodejs24.x";
export const maxDuration = 60;

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  if (!apiKey) {
    return res.status(503).json({
      error: "محرك القصة المجاني غير مفعّل. أنشئ مفتاح Gemini مجانيًا وأضفه في Vercel باسم GEMINI_API_KEY ثم أعد النشر.",
      code: "GEMINI_NOT_CONFIGURED"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (typeof body.idea !== "string" || body.idea.trim().length < 10) {
      return res.status(400).json({ error: "اكتب فكرة واضحة من 10 أحرف على الأقل." });
    }

    const duration = Math.min(60, Math.max(1, Number(body.duration) || 1));
    const system = `أنت محرك اسألني AI لصناعة القصص والأفلام. أنشئ قصة متكاملة ثم قسّمها إلى مشاهد مترابطة قابلة للإنتاج. حافظ على استمرارية الشخصيات والأماكن. لكل مشهد أدرج الحدث والحوار والكاميرا والإضاءة والصوت ووصفًا بصريًا واضحًا. عند تفعيل الوضع الديني، لا تعرض الإضافات الدرامية كحقائق، وافصل المادة الموثقة عن الإضافة الدرامية. لا تصوّر الأنبياء تصويرًا جسديًا تفصيليًا. أعد JSON صالحًا فقط بالشكل التالي: {"title":"", "logline":"", "genre":"", "durationMinutes":1, "assumptions":[], "religiousNotes":[], "characters":[{"name":"","role":"","visual":"","personality":""}], "world":"", "story":{"beginning":"","middle":"","climax":"","ending":""}, "scenes":[{"number":1,"durationSeconds":5,"location":"","action":"","dialogue":"","camera":"","lighting":"","sound":"","visualPrompt":""}], "productionPlan":{"imageStyle":"","videoStyle":"","audioStyle":"","continuity":""}}. أنشئ عددًا مناسبًا من المشاهد للمدة، مع تفضيل وصف غني ومفيد لكل مشهد.`;
    const user = `فكرة المستخدم: ${body.idea.trim()}
الشخصية: ${body.character || "اختر الشخصيات المناسبة"}
النمط البصري: ${body.style || "سينمائي"}
النوع: ${body.genre || "فيلم سينمائي"}
المدة المطلوبة: ${duration} دقيقة
لغة القصة: ${body.language || "العربية"}
الوضع الديني: ${body.religiousMode ? "مفعّل" : "غير مفعّل"}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.8 }
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) {
      console.error("Gemini API error:", response.status, raw.slice(0, 1000));
      const message = data?.error?.message || "";
      if (response.status === 429) return res.status(429).json({ error: "وصل محرك القصة إلى حد الاستخدام المجاني مؤقتًا. انتظر ثم حاول مجددًا.", code: "FREE_QUOTA_EXCEEDED" });
      if (response.status === 400 || response.status === 403) return res.status(502).json({ error: "رفض Gemini الطلب. تأكد من أن المفتاح صحيح وأن النموذج متاح في حسابك المجاني.", providerStatus: response.status });
      return res.status(502).json({ error: "تعذر تشغيل محرك القصة المجاني حاليًا.", providerStatus: response.status, details: message.slice(0, 180) });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!text) return res.status(502).json({ error: "لم يُرجع محرك Gemini نص القصة.", code: "AI_EMPTY_RESPONSE" });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start < 0 || end <= start) throw new Error("Invalid JSON response from Gemini");
      parsed = JSON.parse(text.slice(start, end + 1));
    }

    const asText = (value) => typeof value === "string" ? value : "";
    const asArray = (value) => Array.isArray(value) ? value : [];
    const story = {
      title: asText(parsed.title) || "قصة جديدة",
      logline: asText(parsed.logline),
      genre: asText(parsed.genre) || String(body.genre || "فيلم سينمائي"),
      durationMinutes: Math.min(60, Math.max(1, Number(parsed.durationMinutes) || duration)),
      assumptions: asArray(parsed.assumptions).map(String),
      religiousNotes: asArray(parsed.religiousNotes).map(String),
      characters: asArray(parsed.characters).map((c) => ({
        name: asText(c?.name) || "شخصية",
        role: asText(c?.role),
        visual: asText(c?.visual),
        personality: asText(c?.personality)
      })),
      world: asText(parsed.world),
      story: {
        beginning: asText(parsed.story?.beginning),
        middle: asText(parsed.story?.middle),
        climax: asText(parsed.story?.climax),
        ending: asText(parsed.story?.ending)
      },
      scenes: asArray(parsed.scenes).map((scene, index) => ({
        number: Number(scene?.number) || index + 1,
        durationSeconds: Number(scene?.durationSeconds) || 5,
        location: asText(scene?.location),
        action: asText(scene?.action),
        dialogue: asText(scene?.dialogue),
        camera: asText(scene?.camera),
        lighting: asText(scene?.lighting),
        sound: asText(scene?.sound),
        visualPrompt: asText(scene?.visualPrompt)
      })),
      productionPlan: {
        imageStyle: asText(parsed.productionPlan?.imageStyle),
        videoStyle: asText(parsed.productionPlan?.videoStyle),
        audioStyle: asText(parsed.productionPlan?.audioStyle),
        continuity: asText(parsed.productionPlan?.continuity)
      }
    };

    if (!story.scenes.length) return res.status(502).json({ error: "أعاد محرك Gemini قصة بلا مشاهد قابلة للإنتاج.", code: "AI_INVALID_STORY" });
    return res.status(200).json({ story });
  } catch (error) {
    console.error("Gemini story generation error:", error);
    if (error?.name === "AbortError") return res.status(504).json({ error: "استغرق إنشاء القصة وقتًا طويلًا. حاول مجددًا." });
    return res.status(500).json({ error: "حدث خطأ أثناء إنشاء القصة المجانية. حاول مرة أخرى." });
  }
}
