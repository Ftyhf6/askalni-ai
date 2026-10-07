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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" }, // يضمن إرجاع JSON صالح
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

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

    // محاولة تحويل النص إلى JSON
    let story;
    try {
      story = JSON.parse(text);
    } catch (e) {
      // في حال وجود أي نص إضافي
      const start = text.indexOf("{"); 
      const end = text.lastIndexOf("}");
      if (start >= 0 && end > start) {
        story = JSON.parse(text.slice(start, end + 1));
      } else {
        throw new Error("Invalid JSON response from AI");
      }
    }

    return res.status(200).json({ story });

  } catch (error) {
    console.error("Story generation error:", error);
    return res.status(500).json({ 
      error: "حدث خطأ أثناء إنشاء القصة. تحقق من إعدادات محرك الذكاء الاصطناعي." 
    });
  }
}