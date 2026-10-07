export const runtime = "nodejs24.x";
export const maxDuration = 60;

const RUNWAY_URL = "https://api.dev.runwayml.com/v1/recipes/multi_shot_video";
const RUNWAY_VERSION = "2026-06";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  const key = process.env.RUNWAYML_API_SECRET;
  if (!key) return res.status(503).json({ error: "محرك الفيديو غير مفعّل. أضف RUNWAYML_API_SECRET إلى Vercel ثم أعد النشر.", code: "VIDEO_NOT_CONFIGURED" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const shots = Array.isArray(body.shots) ? body.shots : [];
    if (shots.length < 3 || shots.length > 5) return res.status(400).json({ error: "يجب إرسال 3 إلى 5 لقطات لكل مقطع." });
    const normalized = shots.map((shot) => ({ prompt: String(shot?.prompt || "").trim().slice(0, 512), duration: Number(shot?.duration) || 5 }));
    if (normalized.some((s) => s.prompt.length < 3 || !Number.isFinite(s.duration) || s.duration < 1)) return res.status(400).json({ error: "بيانات اللقطات غير صالحة." });
    const duration = normalized.reduce((sum, s) => sum + s.duration, 0);
    if (![5, 10, 15].includes(duration)) return res.status(400).json({ error: "مدة المقطع يجب أن تكون 5 أو 10 أو 15 ثانية." });
    const response = await fetch(RUNWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key, "X-Runway-Version": "2024-11-06" },
      body: JSON.stringify({ version: RUNWAY_VERSION, mode: "custom", duration, ratio: "1280:720", audio: body.audio !== false, shots: normalized })
    });
    const raw = await response.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) {
      console.error("Runway create error:", response.status, raw);
      return res.status(502).json({ error: "تعذر بدء توليد الفيديو من Runway.", providerStatus: response.status, details: data?.error || data?.message || null });
    }
    if (!data?.id) return res.status(502).json({ error: "مزود الفيديو لم يُرجع رقم المهمة." });
    return res.status(200).json({ taskId: data.id, status: data.status || "PENDING" });
  } catch (error) {
    console.error("Video generation error:", error);
    return res.status(500).json({ error: "حدث خطأ أثناء بدء تصنيع الفيديو." });
  }
}