export const runtime = "nodejs24.x";
export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  const key = process.env.RUNWAYML_API_SECRET;
  const taskId = new URL(req.url, "http://localhost").searchParams.get("taskId");
  if (!key) return res.status(503).json({ error: "محرك الفيديو غير مفعّل.", code: "VIDEO_NOT_CONFIGURED" });
  if (!taskId) return res.status(400).json({ error: "رقم مهمة الفيديو مفقود." });
  try {
    const response = await fetch("https://api.dev.runwayml.com/v1/tasks/" + encodeURIComponent(taskId), { headers: { "Authorization": "Bearer " + key, "X-Runway-Version": "2024-11-06" } });
    const raw = await response.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) {
      console.error("Runway status error:", response.status, raw);
      return res.status(502).json({ error: "تعذر قراءة حالة الفيديو.", providerStatus: response.status });
    }
    return res.status(200).json({ status: data.status || "UNKNOWN", output: Array.isArray(data.output) ? data.output : [], failure: data.failure || data.error || null });
  } catch (error) {
    console.error("Video status error:", error);
    return res.status(502).json({ error: "تعذر الاتصال بمزود الفيديو." });
  }
}