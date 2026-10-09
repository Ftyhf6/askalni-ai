export const runtime = "nodejs24.x";
export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "محرك Agnes غير مفعّل بعد. أضف مفتاح Agnes المجاني إلى Vercel باسم AGNES_API_KEY ثم أعد النشر.",
      code: "AGNES_NOT_CONFIGURED"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (prompt.length < 10) return res.status(400).json({ error: "وصف المشهد قصير جدًا." });

    const response = await fetch("https://apihub.agnes-ai.com/v1/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "agnes-video-v2.0",
        prompt,
        width: 1280,
        height: 720,
        num_frames: 121,
        frame_rate: 24
      }),
      signal: AbortSignal.timeout(50000)
    });

    const raw = await response.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) {
      console.error("Agnes video create error:", response.status, raw.slice(0, 800));
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ error: "رفض Agnes المفتاح. تحقق من أنك نسخت مفتاح Agnes العالمي الصحيح إلى AGNES_API_KEY." });
      }
      if (response.status === 429) return res.status(429).json({ error: "وصلت إلى حد طلبات Agnes مؤقتًا. انتظر قليلًا ثم حاول مجددًا." });
      return res.status(502).json({ error: "تعذر بدء إنشاء المشهد عبر Agnes حاليًا.", providerStatus: response.status });
    }

    const taskId = data.video_id || data.task_id || data.id;
    if (!taskId) return res.status(502).json({ error: "لم يُرجع Agnes رقم مهمة صالحًا." });
    return res.status(200).json({ taskId: String(taskId), status: data.status || "pending" });
  } catch (error) {
    console.error("Agnes video create exception:", error);
    return res.status(502).json({ error: "تعذر الاتصال بمحرك Agnes. حاول مرة أخرى لاحقًا." });
  }
}
