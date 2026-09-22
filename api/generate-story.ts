export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers: { "content-type": "application/json; charset=utf-8" } });
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return new Response(JSON.stringify({ error: "محرك الذكاء الاصطناعي غير مفعّل بعد. أضف OPENAI_API_KEY و OPENAI_MODEL إلى متغيرات Vercel ثم أعد النشر.", code: "AI_NOT_CONFIGURED" }), { status: 503, headers: { "content-type": "application/json; charset=utf-8" } });
  try {
    const body = await req.json() as { idea?: string; character?: string; style?: string; duration?: number; language?: string; genre?: string; religiousMode?: boolean };
    if (!body.idea?.trim()) return new Response(JSON.stringify({ error: "اكتب فكرة الفيلم أولاً." }), { status: 400, headers: { "content-type": "application/json; charset=utf-8" } });
    const duration = Math.min(60, Math.max(1, Number(body.duration) || 1));
    const system = "أنت محرك اسألني AI لصناعة القصص والأفلام. أنشئ قصة كاملة من البداية إلى النهاية، ثم قسّمها إلى مشاهد مترابطة قابلة للإنتاج. يمكن أن تكون الأعمال سينمائية أو فانتازيا أو خيالاً علمياً أو وحوشاً أو رعباً أو أكشن أو مغامرة أو كوميديا أو تاريخية. حافظ على استمرارية الشخصيات والأماكن. لكل مشهد أدرج الحدث والحوار والكاميرا والإضاءة والصوت ووصفاً بصرياً. عند تفعيل الوضع الديني: لا تعرض الإضافات الدرامية كحقائق، وافصل المادة الموثقة عن الإضافة الدرامية. الأنبياء يمثلون رمزياً كهيئة إنسانية من نور دون ملامح أو تفاصيل جسدية، وليس تصويراً حقيقياً لشكل النبي. أعد JSON فقط بالشكل: {title,logline,genre,durationMinutes,assumptions,religiousNotes,characters:[{name,role,visual,personality}],world,story:{beginning,middle,climax,ending},scenes:[{number,durationSeconds,location,action,dialogue,camera,lighting,sound,visualPrompt}],productionPlan:{imageStyle,videoStyle,audioStyle,continuity}}";
    const user = "فكرة المستخدم: " + body.idea.trim() + "\nالشخصية: " + (body.character || "اختر الشخصيات المناسبة") + "\nالنمط: " + (body.style || "سينمائي") + "\nالنوع: " + (body.genre || "فيلم سينمائي") + "\nالمدة: " + duration + " دقيقة\nاللغة: " + (body.language || "العربية") + "\nالوضع الديني: " + (body.religiousMode ? "مفعّل" : "غير مفعّل");
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + apiKey }, body: JSON.stringify({ model, input: [{ role: "system", content: [{ type: "input_text", text: system }] }, { role: "user", content: [{ type: "input_text", text: user }] }] }) });
    const raw = await response.text();
    if (!response.ok) return new Response(JSON.stringify({ error: "تعذر تشغيل محرك الذكاء الاصطناعي.", providerStatus: response.status }), { status: 502, headers: { "content-type": "application/json; charset=utf-8" } });
    const data = JSON.parse(raw) as { output_text?: string };
    const text = data.output_text?.trim() || "";
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const jsonText = match?.[1] || text;
    const start = jsonText.indexOf("{"); const end = jsonText.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("invalid-json");
    const story = JSON.parse(jsonText.slice(start, end + 1));
    return new Response(JSON.stringify({ story }), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  } catch {
    return new Response(JSON.stringify({ error: "حدث خطأ أثناء إنشاء القصة. تحقق من إعدادات محرك الذكاء الاصطناعي." }), { status: 500, headers: { "content-type": "application/json; charset=utf-8" } });
  }
}