export const runtime = "nodejs24.x";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  return res.status(200).json({
    ok: true,
    service: "askalni-ai",
    storyEngineConfigured: Boolean(process.env.OPENAI_API_KEY),
    videoEngineConfigured: Boolean(process.env.RUNWAYML_API_SECRET),
    node: process.version
  });
}