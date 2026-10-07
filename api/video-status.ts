export const runtime = "nodejs";

export default async function handler(req: Request): Promise<Response> {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
  if (req.method !== "GET") return json({ error: "Method Not Allowed" }, 405);
  const key = process.env.RUNWAYML_API_SECRET;
  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!key) return json({ error: "محرك الفيديو غير مفعّل." }, 503);
  if (!taskId) return json({ error: "رقم مهمة الفيديو مفقود." }, 400);
  try {
    const response = await fetch("https://api.dev.runwayml.com/v1/tasks/" + encodeURIComponent(taskId), {
      headers: { "Authorization": "Bearer " + key, "X-Runway-Version": "2024-11-06" },
    });
    const raw = await response.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch {}
    if (!response.ok) return json({ error: "تعذر قراءة حالة الفيديو.", providerStatus: response.status }, 502);
    return json({ status: data.status, output: data.output || [], failure: data.failure || data.error || null }, 200);
  } catch { return json({ error: "تعذر الاتصال بمزود الفيديو." }, 502); }
}
