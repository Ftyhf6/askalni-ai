export const runtime = "nodejs24.x";
export const maxDuration = 10;

// Free, deterministic story engine: deliberately makes no paid API calls and
// does not require OPENAI_API_KEY, RUNWAYML_API_SECRET, or any other secret.
const text = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

function buildFreeStory(body) {
  const idea = text(body.idea, "مغامرة غير متوقعة");
  const character = text(body.character, "بطل شجاع يبحث عن الحقيقة");
  const style = text(body.style, "سينمائي");
  const genre = text(body.genre, "فيلم سينمائي");
  const language = text(body.language, "العربية");
  const duration = Math.min(60, Math.max(1, Number(body.duration) || 1));
  const religiousMode = Boolean(body.religiousMode);
  const sceneCount = Math.min(8, Math.max(3, Math.ceil(duration / 2) + 2));

  const title = "حكاية " + idea.slice(0, 48);
  const characters = [
    {
      name: character,
      role: "الشخصية الرئيسية",
      visual: "تصميم بصري بأسلوب " + style + "، مع ملامح وملابس ثابتة في جميع المشاهد.",
      personality: "فضولي، شجاع، ويتعلم من نتائج قراراته."
    },
    {
      name: "رفيق الرحلة",
      role: "مساعد البطل",
      visual: "شخصية مساندة متناسقة مع عالم القصة وألوانه.",
      personality: "عملي وهادئ، يساعد البطل على رؤية حلول جديدة."
    },
    {
      name: "صاحب العقبة",
      role: "الشخصية التي تعقّد المهمة",
      visual: "مظهر مميز يسهل التعرف عليه في كل مشهد.",
      personality: "له دافع واضح، وليس مجرد عقبة بلا سبب."
    }
  ];

  const beats = [
    ["بداية الحكاية", "في عالم " + style + "، تبدأ الأحداث عندما يواجه " + character + " موقفًا غير عادي مرتبطًا بالفكرة: " + idea + ". يلاحظ البطل علامة صغيرة تكشف أن الأمر أكبر مما يبدو."],
    ["قرار صعب", "يحاول البطل فهم ما حدث، ويقابل رفيق الرحلة. تظهر معلومات جديدة وتصبح أمامهما خيارات متعارضة، فيقرران متابعة الأثر بدل التراجع."],
    ["تصاعد الخطر", "تقودهما الأدلة إلى مكان غير مألوف. تظهر عقبة غير متوقعة، ويكتشف البطل أن الحل السهل قد يسبب ضررًا لشخص آخر."],
    ["كشف الحقيقة", "تظهر حقيقة تغيّر فهم البطل للمشكلة. يواجه صاحب العقبة، ويكتشف أن وراء تصرفاته سببًا يحتاج إلى المواجهة لا إلى القوة وحدها."],
    ["الذروة", "تصل الأحداث إلى لحظة حاسمة؛ يضطر البطل إلى الاختيار بين مصلحته الشخصية وما يراه صوابًا. يتعاون الرفيق معه وتُحسم المواجهة بفعل واضح."],
    ["الخاتمة", "بعد انحسار الخطر، يعالج الأبطال آثار ما حدث. يعود البطل إلى حياته بتغيير ملموس، وتترك النهاية بابًا لمغامرة جديدة دون أن تلغي اكتمال هذه الحكاية."]
  ];

  const scenes = [];
  for (let i = 0; i < sceneCount; i++) {
    const beat = beats[Math.min(i, beats.length - 1)];
    const seconds = Math.max(5, Math.round((duration * 60) / sceneCount));
    scenes.push({
      number: i + 1,
      durationSeconds: seconds,
      location: [
        "المكان الرئيسي",
        "ممر أو طريق إلى الهدف",
        "موقع يكشف أول دليل",
        "مكان المواجهة",
        "ساحة الذروة",
        "مكان هادئ بعد الأحداث",
        "موقع جديد مرتبط بالنهاية",
        "لقطة ختامية واسعة"
      ][i] || "موقع مرتبط بالأحداث",
      action: beat[1],
      dialogue: i === 0
        ? "البطل: لا بد أن أفهم ما الذي يحدث."
        : i === sceneCount - 1
          ? "البطل: لم يتغير العالم وحده؛ لقد تغيرت أنا أيضًا."
          : "الرفيق: لن نصل إلى الحقيقة إلا إذا عملنا معًا.",
      camera: i === 0 ? "لقطة تأسيسية واسعة ثم اقتراب بطيء من البطل." : i === sceneCount - 1 ? "لقطة واسعة هادئة ثم تلاشي تدريجي." : "حركة تتبع ناعمة، ثم لقطة متوسطة لردود الفعل.",
      lighting: "إضاءة سينمائية متناسقة مع المزاج، مع الحفاظ على ألوان الشخصيات بين اللقطات.",
      sound: "مؤثرات بيئية خفيفة وموسيقى أصلية تتصاعد مع الحدث ثم تهدأ.",
      visualPrompt: "مشهد " + genre + " بأسلوب " + style + ". الفكرة: " + idea + ". الشخصية الرئيسية: " + character + ". " + beat[1] + " ثبات الوجوه والملابس والألوان، تكوين سينمائي، حركة طبيعية، دون نصوص أو شعارات."
    });
  }

  return {
    title,
    logline: "رحلة " + character + " لفهم سرّ يبدأ من: " + idea,
    genre,
    durationMinutes: duration,
    assumptions: [
      "تم إنشاء مسودة مجانية داخل التطبيق دون الاتصال بخدمة API مدفوعة.",
      "هذه مسودة قصصية أولية؛ قد تحتاج إلى إعادة صياغة يدوية لزيادة التفاصيل والخصوصية."
    ],
    religiousNotes: religiousMode
      ? ["هذه مسودة خيالية وليست مصدرًا تاريخيًا أو دينيًا موثقًا. راجع المصادر الموثوقة قبل نشر أي أحداث دينية، ولا تنسب الإضافات الدرامية إلى الوقائع."]
      : [],
    characters,
    world: "عالم " + style + " يخدم فكرة " + idea + "، مع قواعد بصرية ثابتة حتى يسهل إنتاج المشاهد لاحقًا.",
    story: {
      beginning: beats[0][1],
      middle: beats.slice(1, 4).map((b) => b[1]).join("\n\n"),
      climax: beats[4][1],
      ending: beats[5][1]
    },
    scenes,
    productionPlan: {
      imageStyle: style + "، مع لوحة ألوان ثابتة وتصميم موحد للشخصيات.",
      videoStyle: "لقطات قصيرة متتابعة، حركة كاميرا واضحة، واستمرارية بصرية بين المشاهد.",
      audioStyle: "حوار باللغة " + language + " مع مؤثرات بيئية وموسيقى مناسبة للمزاج.",
      continuity: "ثبّت شكل الشخصية الرئيسية وملابسها والألوان والمواقع بين جميع المشاهد."
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (typeof body.idea !== "string" || body.idea.trim().length < 10) {
      return res.status(400).json({ error: "اكتب فكرة واضحة من 10 أحرف على الأقل." });
    }

    return res.status(200).json({
      story: buildFreeStory(body),
      provider: "built-in-free-story-engine",
      note: "وضع مجاني لا يستخدم مفاتيح API مدفوعة. هذا مولّد مسودة قائم على قوالب، وليس نموذجًا لغويًا كبيرًا."
    });
  } catch (error) {
    console.error("Free story generation error:", error);
    return res.status(400).json({ error: "تعذر إنشاء القصة. راجع الفكرة وحاول مرة أخرى." });
  }
}
