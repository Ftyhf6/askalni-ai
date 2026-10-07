export const runtime = "nodejs";

const RUNWAY_URL = "https://api.dev.runwayml.com/v1/recipes/multi_shot_video";
const RUNWAY_VERSION = "2026-06";

export default async function handler(req: Request): Promise<Response> {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
  const key = process.env.RUNWAYML_API_SECRET;
  if (!key) return json({ error: "محرك الفيديو غير مفعّل. أضف RUNWAYML_API_SECRET إلى Vercel ثم أعد النشر.", code: "VIDEO_NOT_CONFIGURED" }, 503);
  try {
    const body = await req.json() as { shots?: { prompt?: string; duration?: number }[]; audio?: boolean };
    const shots = Array.isArray(body.shots) ? body.shots : [];
    if (shots.length < 3 || shots.length > 5) return json({ error: "يجب إرسال 3 إلى 5 لقطات لكل مقطع." }, 400);
    const normalized = shots.map((shot) => ({ prompt: String(shot.prompt || "").trim().slice(0, 512), duration: Number(shot.duration) || 5 }));
    if (normalized.some((s) => s.prompt.length < 3 || s.duration < 1)) return json({ error: "بيانات اللقطات غير صالحة: يجب أن يكون لكل لقطة وصف صالح ومدة صحيحة." }, 400);
    const duration = normalized.reduce((sum, s) => sum + s.duration, 0);
    if (![5, 10, 15].includes(duration)) return json({ error: "مدة المقطع يجب أن تكون 5 أو 10 أو 15 ثانية." }, 400);
    const response = await fetch(RUNWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key, "X-Runway-Version": "2024-11-06" },
      body: JSON.stringify({ version: "2026-06", mode: "custom", duration: 15, ratio: "1280:720", audio: body.audio !== false, shots: normalized }),
    });
    const raw = await response.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) return json({ error: "تعذر بدء توليد الفيديو من Runway.", providerStatus: response.status, details: data?.error || data?.message || data }, 502);
    if (!data?.id) return json({ error: "مزود الفيديو لم يُرجع رقم المهمة." }, 502);
    return json({ taskId: data.id, status: data.status || "PENDING" }, 200);
  } catch { return json({ error: "حدث خطأ أثناء بدء تصنيع الفيديو." }, 500); }
}
