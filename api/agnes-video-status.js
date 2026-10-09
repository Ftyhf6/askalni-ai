export const runtime = "nodejs24.x";
export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  const apiKey = process.env.AGNES_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "محرك Agnes غير مفعّل. أضف AGNES_API_KEY إلى Vercel." });

  const taskId = typeof req.query?.taskId === "string" ? req.query.taskId.trim() : "";
  if (!taskId || taskId.length > 200) return res.status(400).json({ error: "رقم المهمة غير صالح." });

  try {
    const url = new URL("https://apihub.agnes-ai.com/agnesapi");
    url.searchParams.set("video_id", taskId);
    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20000),
      cache: "no-store"
    });
    const raw = await response.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) {
      console.error("Agnes video status error:", response.status, raw.slice(0, 800));
      return res.status(502).json({ error: "تعذر متابعة حالة المشهد عبر Agnes.", providerStatus: response.status });
    }

    const sourceStatus = String(data.status || data.state || "pending").toLowerCase();
    const status = ["completed", "complete", "succeeded", "success", "done"].includes(sourceStatus)
      ? "completed"
      : ["failed", "error", "cancelled", "canceled"].includes(sourceStatus)
        ? "failed"
        : "pending";
    const videoUrl = data.video_url || data.url || data.output?.video_url || data.output?.url || null;
    return res.status(200).json({
      status,
      progress: Number(data.progress) || 0,
      videoUrl,
      error: data.error || data.message || null
    });
  } catch (error) {
    console.error("Agnes status exception:", error);
    return res.status(502).json({ error: "تعذر الاتصال بمحرك Agnes أثناء متابعة المشهد." });
  }
}
