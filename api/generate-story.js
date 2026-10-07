export const runtime = "nodejs24.x";
export const maxDuration = 60; // في حال كانت خطتك تسمح، وإلا سيعمل بحد 10 ثواني تلقائياً

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini"; // تم تصحيح الموديل

export default async function handler(req, res) {
  // التحقق من طريقة الطلب
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  if (!apiKey) {
    return res.status(503).json({ 
      error: "محرك الذكاء الاصطناعي غير مفعّل بعد. أضف OPENAI_API_KEY إلى متغيرات Vercel ثم أعد النشر.", 
      code: "AI_NOT_CONFIGURED" 
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    
    if (!body.idea?.trim()) {
      return res.status(400).json({ error: "اكتب فكرة الفيلم أولاً." });
    }

    const duration = Math.min(60, Math.max(1, Number(body.duration) || 1));

    const system = "أنت محرك اسألني AI لصناعة القصص والأفلام. أنشئ قصة كاملة من البداية إلى النهاية، ثم قسّمها إلى مشاهد مترابطة قابلة للإنتاج. يمكن أن تكون الأعمال سينمائية أو فانتازيا أو خيالاً علمياً أو وحوشاً أو رعباً أو أكشن أو مغامرة أو كوميديا أو تاريخية. حافظ على استمرارية الشخصيات والأماكن. لكل مشهد أدرج الحدث والحوار والكاميرا والإضاءة والصوت ووصفاً بصرياً. عند تفعيل الوضع الديني: لا تعرض الإضافات الدرامية كحقائق، وافصل المادة الموثقة عن الإضافة الدرامية. الأنبياء يمثلون رمزياً كهيئة إنسانية من نور دون ملامح أو تفاصيل جسدية، وليس تصويراً حقيقياً لشكل النبي. أعد JSON فقط بالشكل: {title,logline,genre,durationMinutes,assumptions,religiousNotes,characters:[{name,role,visual,personality}],world,story:{beginning,middle,climax,ending},scenes:[{number,durationSeconds,location,action,dialogue,camera,lighting,sound,visualPrompt}],productionPlan:{imageStyle,videoStyle,audioStyle,continuity}}";
    
    const user = "فكرة المستخدم: " + body.idea.trim() + "\nالشخصية: " + (body.character || "اختر الشخصيات المناسبة") + "\nالنمط: " + (body.style || "سينمائي") + "\nالنوع: " + (body.genre || "فيلم سينمائي") + "\nالمدة: " + duration + " دقيقة\nاللغة: " + (body.language || "العربية") + "\nالوضع الديني: " + (body.religiousMode ? "مفعّل" : "غير مفعّل");

    // استخدام الواجهة القياسية والأسرع
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" }, // يضمن إرجاع JSON صالح
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      return res.status(502).json({ 
        error: "تعذر تشغيل محرك الذكاء الاصطناعي.", 
        providerStatus: response.status 
      });
    }

    const data = await response.json();
    
    // استخراج النص مباشرة
    const text = data.choices?.[0]?.message?.content?.trim();
    
    if (!text) {
      return res.status(502).json({ 
        error: "لم يُرجع محرك الذكاء الاصطناعي نص القصة.", 
        code: "AI_EMPTY_RESPONSE" 
      });
    }

    // تحويل JSON مع تطبيع الحقول حتى لا تنهار الواجهة إذا كان الرد ناقصًا.
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const startJson = text.indexOf("{");
      const endJson = text.lastIndexOf("}");
      if (startJson >= 0 && endJson > startJson) parsed = JSON.parse(text.slice(startJson, endJson + 1));
      else throw new Error("Invalid JSON response from AI");
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

    if (!story.scenes.length) {
      return res.status(502).json({ error: "محرك الذكاء الاصطناعي أعاد قصة بلا مشاهد قابلة للإنتاج.", code: "AI_INVALID_STORY" });
    }

    return res.status(200).json({ story });

  } catch (error) {
    console.error("Story generation error:", error);
    return res.status(500).json({ 
      error: "حدث خطأ أثناء إنشاء القصة. تحقق من إعدادات محرك الذكاء الاصطناعي." 
    });
  }
}