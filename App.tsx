import { useMemo, useState } from "react";

type Story = {
  title: string; logline: string; genre: string; durationMinutes: number;
  assumptions: string[]; religiousNotes: string[];
  characters: { name: string; role: string; visual: string; personality: string }[];
  world: string;
  story: { beginning: string; middle: string; climax: string; ending: string };
  scenes: { number: number; durationSeconds: number; location: string; action: string; dialogue: string; camera: string; lighting: string; sound: string; visualPrompt: string }[];
  productionPlan: { imageStyle: string; videoStyle: string; audioStyle: string; continuity: string };
};

const characters = [
  ["pineapple", "السيد أناناس", "🍍", "فاكهة", "رأس أناناس مع جسم إنسان"],
  ["tomato", "السيد طماطم", "🍅", "خضار", "رأس طماطم مع جسم إنسان"],
  ["cat", "قط بشري", "🐱", "حيوان", "رأس قط مع جسم إنسان"],
  ["falcon", "الصقر اليمني", "🦅", "حيوان", "شخصية بطابع عربي/يمني"],
  ["human", "شخصية بشرية", "🧑", "إنسان", "مظهر بشري قابل للتخصيص"],
  ["robot", "شخصية آلية", "🤖", "خيالي", "روبوت بجسم بشري"],
] as const;

const styles = ["سينمائي", "واقعي", "كرتوني", "خيالي", "فانتازيا", "خيال علمي", "وحوش", "رعب", "أكشن", "تاريخي", "يمني", "حضري", "ريفي", "كلاسيكي"];
const genres = ["فيلم سينمائي", "فانتازيا", "خيال علمي", "وحوش", "رعب", "مغامرة", "أكشن", "كوميديا", "دراما", "تاريخي", "قصة دينية"];

export default function App() {
  const [idea, setIdea] = useState("");
  const [character, setCharacter] = useState("");
  const [customCharacter, setCustomCharacter] = useState("");
  const [style, setStyle] = useState("سينمائي");
  const [genre, setGenre] = useState("فيلم سينمائي");
  const [duration, setDuration] = useState(3);
  const [language, setLanguage] = useState("العربية");
  const [religiousMode, setReligiousMode] = useState(false);
  const [step, setStep] = useState<"idea" | "details" | "confirm" | "done">("idea");
  const [filter, setFilter] = useState("الكل");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [filmSegments, setFilmSegments] = useState<{ index: number; taskId: string; status: string; url?: string }[]>([]);
  const [filmGenerating, setFilmGenerating] = useState(false);
  const [filmProgress, setFilmProgress] = useState(0);
  const [filmError, setFilmError] = useState("");
  const [freeVideoGenerating, setFreeVideoGenerating] = useState(false);
  const [freeVideoUrl, setFreeVideoUrl] = useState("");
  const [freeVideoError, setFreeVideoError] = useState("");

  const visible = useMemo(() => filter === "الكل" ? characters : characters.filter((c) => c[3] === filter), [filter]);
  const price = duration <= 1 ? 0 : duration;

  function nextFromIdea() {
    if (idea.trim().length < 10) return setError("اكتب فكرة واضحة من 10 أحرف على الأقل.");
    setError(""); setStep("details");
  }

  function nextFromDetails() {
    if (!character.trim() && !customCharacter.trim()) return setError("اختر شخصية أو اكتب وصف شخصية.");
    setError(""); setStep("confirm");
  }

  async function generate() {
    setGenerating(true); setError("");
    try {
      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea, character: customCharacter.trim() || character, style, duration, language, genre, religiousMode }),
      });
      const raw = await response.text();
      let data: { error?: string; story?: Story } | null = null;
      try { data = JSON.parse(raw); } catch {
        const clean = raw.replace(/\s+/g, " ").trim();
        throw new Error(clean ? `خطأ من الخادم: ${clean.slice(0, 240)}` : "تعذر قراءة استجابة الخادم.");
      }
      if (!response.ok) throw new Error(data?.error || "تعذر إنشاء القصة.");
      if (!data?.story) throw new Error("الخادم لم يُرجع قصة صالحة.");
      setStory(data.story); setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إنشاء القصة.");
    } finally {
      setGenerating(false);
    }
  }

  async function createFreeVideo() {
    if (!story?.scenes?.length || freeVideoGenerating) return;
    setFreeVideoGenerating(true); setFreeVideoError(""); setFreeVideoUrl("");
    try {
      const scene = story.scenes[0];
      const prompt = [
        "Cinematic movie shot, photorealistic, high detail, professional film production, 16:9 landscape.",
        "Keep character identity and visual continuity consistent.",
        "Location: " + scene.location + ". Action: " + scene.action + ". Camera: " + scene.camera + ". Lighting: " + scene.lighting + ". Sound/mood: " + scene.sound + ". Visual direction: " + scene.visualPrompt,
        "Natural realistic motion, cinematic camera movement, coherent anatomy, no subtitles, no text, no watermark."
      ].join(" ");
      const response = await fetch("https://kingnish-wan2-2-fast.hf.space/gradio_api/call/generate_video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: [prompt, "low quality, blurry, distorted anatomy, extra fingers, duplicate people, subtitles, text, watermark, static image", 3.5, 1, 3, 4, Math.floor(Math.random() * 2147483647), true] })
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok || !created?.event_id) throw new Error(created?.error || "تعذر إرسال الفيديو المجاني إلى ZeroGPU.");
      const eventResponse = await fetch("https://kingnish-wan2-2-fast.hf.space/gradio_api/call/generate_video/" + encodeURIComponent(created.event_id), { headers: { "accept": "text/event-stream" } });
      if (!eventResponse.ok || !eventResponse.body) throw new Error("تعذر متابعة طابور ZeroGPU.");
      const reader = eventResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let videoUrl = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload || payload === "null") continue;
          let parsed: any;
          try { parsed = JSON.parse(payload); } catch { continue; }
          if (event.includes("error")) throw new Error(typeof parsed === "string" ? parsed : "فشل توليد الفيديو المجاني.");
          if (event.includes("complete") && Array.isArray(parsed)) {
            const first = parsed[0];
            if (typeof first === "string") videoUrl = first;
            else if (first?.url) videoUrl = first.url;
            else if (first?.path) videoUrl = "https://kingnish-wan2-2-fast.hf.space/file=" + first.path;
          }
        }
      }
      if (!videoUrl) throw new Error("انتهى الطلب دون رابط فيديو. قد تكون حصة ZeroGPU ممتلئة أو الطابور مزدحمًا.");
      setFreeVideoUrl(videoUrl);
    } catch (e) {
      setFreeVideoError(e instanceof Error ? e.message : "تعذر إنشاء الفيديو المجاني.");
    } finally {
      setFreeVideoGenerating(false);
    }
  }

  async function createFilm() {
    if (!story?.scenes?.length || filmGenerating) return;
    setFilmGenerating(true); setFilmError(""); setFilmSegments([]); setFilmProgress(0);
    try {
      const scenes = story.scenes;
      const groups: typeof scenes[] = [];
      for (let i = 0; i < scenes.length; i += 3) groups.push(scenes.slice(i, i + 3));
      const completed: { index: number; taskId: string; status: string; url?: string }[] = [];
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const shots = group.map((scene) => ({
          prompt: [
            "Cinematic Hollywood-style fantasy/action film, photorealistic, highly detailed, consistent characters and world, dramatic lighting, realistic materials, natural motion, professional cinematography.",
            "Keep the same character appearance, wardrobe, environment and visual language across the whole film.",
            "Location: " + scene.location + ". Action: " + scene.action + ". Dialogue: " + scene.dialogue + ". Camera: " + scene.camera + ". Lighting: " + scene.lighting + ". Sound: " + scene.sound + ". Visual direction: " + scene.visualPrompt,
          ].join(" "),
          duration: 5,
        }));
        while (shots.length < 3) shots.push({ prompt: "Cinematic establishing transition shot matching the previous scene, same characters and environment, realistic film production.", duration: 5 });
        const createResponse = await fetch("/api/generate-film-segment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ shots, audio: true }),
        });
        const created = await createResponse.json().catch(() => ({}));
        if (!createResponse.ok) throw new Error(created?.error || "تعذر بدء تصنيع مقطع الفيلم.");
        let status = "PENDING"; let url: string | undefined;
        const deadline = Date.now() + 10 * 60 * 1000;
        while (!["SUCCEEDED", "FAILED", "CANCELED"].includes(status)) {
          if (Date.now() > deadline) throw new Error("انتهت مهلة انتظار المقطع " + (i + 1) + ". أعد المحاولة لاحقًا.");
          await new Promise((r) => setTimeout(r, 6000));
          const statusResponse = await fetch("/api/video-status?taskId=" + encodeURIComponent(created.taskId), { cache: "no-store" });
          const data = await statusResponse.json().catch(() => ({}));
          if (!statusResponse.ok) throw new Error(data?.error || "تعذر متابعة تصنيع الفيلم.");
          status = data.status;
          url = Array.isArray(data.output) ? data.output[0] : undefined;
          if (["FAILED", "CANCELED"].includes(status)) throw new Error(data.failure || ("فشل تصنيع المقطع " + (i + 1) + "."));
        }
        if (status !== "SUCCEEDED" || !url) throw new Error("اكتمل الطلب دون رابط فيديو للمقطع " + (i + 1) + ".");
        const item = { index: i + 1, taskId: created.taskId, status, url };
        completed.push(item); setFilmSegments([...completed]); setFilmProgress(Math.round(((i + 1) / groups.length) * 100));
      }
    } catch (e) {
      setFilmError(e instanceof Error ? e.message : "تعذر تصنيع الفيلم.");
    } finally {
      setFilmGenerating(false);
    }
  }

  function reset() {
    setIdea(""); setCharacter(""); setCustomCharacter(""); setStyle("سينمائي"); setGenre("فيلم سينمائي");
    setDuration(3); setLanguage("العربية"); setReligiousMode(false); setStory(null); setFilter("الكل"); setError(""); setStep("idea"); setFreeVideoUrl(""); setFreeVideoError("");
  }

  return <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-xl font-bold">اسألني AI</div><div className="text-xs text-slate-400">صناعة أفلام بالذكاء الاصطناعي من الجوال</div></div>
        <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">وضع الفيديو المجاني</div>
      </header>
      <section className="mb-6 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">🎬 محرك الفيديو المجاني</h2>
            <p className="mt-2 text-sm text-slate-300">يعمل عبر Hugging Face ZeroGPU من الهاتف، باستخدام نماذج فيديو مفتوحة. لا يحتاج Runway أو رصيد OpenAI.</p>
            <p className="mt-2 text-xs text-slate-400">الحساب المجاني له حصة GPU يومية محدودة، لذلك لا نعد بفيديوهات مجانية بلا حدود.</p>
          </div>
          <a href="https://huggingface.co/spaces/zerogpu-aoti/wan2-2-fp8da-aoti-faster" target="_blank" rel="noreferrer" className="shrink-0 rounded-2xl bg-emerald-400 px-5 py-3 text-center font-bold text-slate-950">فتح Wan 2.2 المجاني</a>
        </div>
      </section>

      {error && <div role="alert" className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {step === "idea" && <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <h1 className="text-3xl font-bold">ماذا تريد أن نصنع؟</h1>
        <p className="mt-2 text-slate-400">أفلام سينمائية، فانتازيا، خيال علمي، وحوش، رعب، مغامرات، قصص دينية وغيرها.</p>
        <textarea value={idea} onChange={(e) => { setIdea(e.target.value); setError(""); }} placeholder="مثال: أريد فيلماً عن وحش عملاق يظهر في مدينة مستقبلية..." className="mt-5 min-h-44 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-amber-400" />
        <button onClick={nextFromIdea} className="mt-4 w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">تحليل الفكرة والمتابعة</button>
        <p className="mt-3 text-center text-xs text-slate-500">المرحلة الأولى: إنشاء القصة فقط. لن يبدأ تصنيع الفيلم إلا بعد ظهور القصة وضغطك على زر «ابدأ تصنيع الفيلم».</p>
      </section>}

      {step === "details" && <section className="space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-2xl font-bold">الشخصيات والأسلوب</h2>
          <div className="mt-4 flex flex-wrap gap-2">{["الكل", "فاكهة", "خضار", "حيوان", "إنسان", "خيالي"].map((x) => <button key={x} onClick={() => setFilter(x)} className={"rounded-full px-3 py-1.5 text-sm " + (filter === x ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-300")}>{x}</button>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{visible.map((c) => <button key={c[0]} onClick={() => { setCharacter(c[4]); setCustomCharacter(""); }} className={"rounded-2xl border p-4 text-right " + (character === c[4] ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-slate-900")}><div className="text-4xl">{c[2]}</div><div className="mt-2 font-semibold">{c[1]}</div><div className="mt-1 text-xs text-slate-400">{c[4]}</div></button>)}</div>
          <input value={customCharacter} onChange={(e) => { setCustomCharacter(e.target.value); setCharacter(""); }} placeholder="أو اكتب شخصية من ابتكارك..." className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none" />
          <label className="mt-5 block text-sm font-semibold">النمط البصري</label>
          <div className="mt-2 flex flex-wrap gap-2">{styles.map((x) => <button key={x} onClick={() => setStyle(x)} className={"rounded-xl border px-3 py-2 text-sm " + (style === x ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-white/10 bg-slate-900 text-slate-300")}>{x}</button>)}</div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-xl font-bold">تفاصيل الفيلم</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="rounded-2xl bg-slate-900 p-4"><span className="text-sm text-slate-400">نوع العمل</span><select value={genre} onChange={(e) => setGenre(e.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none">{genres.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="rounded-2xl bg-slate-900 p-4"><span className="text-sm text-slate-400">المدة</span><input type="number" min={1} max={60} value={duration} onChange={(e) => setDuration(Math.min(60, Math.max(1, Number(e.target.value) || 1)))} className="mt-2 w-full bg-transparent text-2xl font-bold outline-none" /></label>
            <label className="rounded-2xl bg-slate-900 p-4"><span className="text-sm text-slate-400">اللغة</span><select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none"><option>العربية</option><option>English</option><option>اردو</option><option>کوردی</option></select></label>
            <div className="rounded-2xl bg-slate-900 p-4"><span className="text-sm text-slate-400">التكلفة</span><div className="mt-2 text-2xl font-bold">{price === 0 ? "مجاني" : "$" + price}</div><div className="text-xs text-slate-500">أول دقيقة مجانية، ثم $1 لكل دقيقة إضافية.</div></div>
          </div>
          <button onClick={() => setReligiousMode(!religiousMode)} className={"mt-4 w-full rounded-2xl px-4 py-3 text-right " + (religiousMode ? "bg-amber-400 text-slate-950" : "bg-slate-900 text-slate-300")}>{religiousMode ? "الوضع الديني مفعّل — ضوابط خاصة للأنبياء والمصادر" : "تفعيل الوضع الديني عند صناعة قصص الأنبياء"}</button>
        </div>

        <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5">
          <h2 className="text-xl font-bold">المراجعة</h2><p className="mt-3 text-sm text-slate-200">{idea}</p>
          <div className="mt-2 text-sm text-slate-400">الشخصية: {customCharacter || character} • النوع: {genre} • النمط: {style} • {duration} دقيقة</div>
          <div className="mt-4 flex gap-3"><button onClick={nextFromDetails} className="flex-1 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">مراجعة التنفيذ</button><button onClick={() => setStep("idea")} className="rounded-2xl border border-white/10 px-5 py-3">تعديل</button></div>
        </div>
      </section>}

      {step === "confirm" && <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
        <div className="text-center"><div className="text-5xl">🎬</div><h2 className="mt-3 text-3xl font-bold">جاهز لإنشاء القصة</h2><p className="mt-2 text-slate-400">سيتم الآن إنشاء القصة فقط، مع الشخصيات والعالم والمشاهد اللازمة لاحقًا للإنتاج. بعد ظهور القصة ستقرر أنت متى يبدأ تصنيع الفيلم.</p></div>
        <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-sm">التكلفة: <b>{price === 0 ? "مجاني" : "$" + price}</b></div>
        <button disabled={generating} onClick={generate} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-bold text-slate-950 disabled:opacity-60">{generating ? "⏳ جارٍ إنشاء القصة فقط..." : "✍️ ابدأ إنشاء القصة"}</button>
        <button onClick={() => setStep("details")} className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3">العودة للتعديل</button>
      </section>}

      {step === "done" && story && <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <div className="text-4xl">🎞️</div><h2 className="mt-2 text-3xl font-bold">{story.title}</h2><p className="mt-2 text-slate-300">{story.logline}</p>
        <div className="mt-5 space-y-4 text-right">
          <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">القصة</h3><p className="mt-2">{story.story.beginning}</p><p className="mt-2">{story.story.middle}</p><p className="mt-2">{story.story.climax}</p><p className="mt-2">{story.story.ending}</p></article>
          <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">الشخصيات</h3>{story.characters.map((c) => <div key={c.name} className="mt-3 border-b border-white/10 pb-3"><b>{c.name}</b> — {c.role}<div className="text-sm text-slate-400">{c.visual}</div></div>)}</article>
          <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">المشاهد ({story.scenes.length})</h3>{story.scenes.map((s) => <div key={s.number} className="mt-3 rounded-xl border border-white/10 p-4"><b>المشهد {s.number}: {s.location}</b><p className="mt-1 text-sm">{s.action}</p><p className="mt-1 text-xs text-slate-500">الكاميرا: {s.camera} • الصوت: {s.sound}</p></div>)}</article>
          <article className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
            <h3 className="text-xl font-bold">🆓 تجربة فيديو مجانية من داخل اسألني AI</h3>
            <p className="mt-2 text-sm text-slate-300">سنحوّل المشهد الأول من القصة إلى مقطع سينمائي قصير باستخدام Wan 2.2 Text-to-Video على Hugging Face ZeroGPU، بدون Runway وبدون رصيد OpenAI.</p>
            <button disabled={freeVideoGenerating} onClick={createFreeVideo} className="mt-4 w-full rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">{freeVideoGenerating ? "⏳ جارٍ انتظار ZeroGPU..." : "🎥 إنشاء أول مشهد مجانًا"}</button>
            {freeVideoError && <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{freeVideoError}</div>}
            {freeVideoUrl && <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950"><video controls playsInline preload="metadata" src={freeVideoUrl} className="w-full" /><div className="p-3 text-xs text-slate-400">تم إنشاء المقطع المجاني من المشهد الأول.</div></div>}
            <p className="mt-3 text-xs text-slate-500">ZeroGPU مجاني لكن الحصة اليومية محدودة، وقد يزداد وقت الانتظار عند ازدحام الطابور.</p>
          </article>

          <article className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
            <h3 className="text-xl font-bold">🎬 تصنيع الفيلم الكامل</h3>
            <p className="mt-2 text-sm text-slate-300">يحوّل المشاهد إلى مقاطع سينمائية 16:9 متتابعة مع حركة كاميرا وإضاءة وصوت، ثم يعرض المقاطع بالترتيب. هذا هو مسار التصنيع الفعلي، وليس مجرد كتابة قصة.</p>
            <div className="mt-3 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-400">المسار المدفوع: Runway. أما المسار المجاني الآن فيستخدم Wan 2.2 عبر ZeroGPU من داخل التطبيق. المقطع المجاني قصير لأن الحصة اليومية محدودة.</div>
            <button disabled={filmGenerating} onClick={createFilm} className="mt-4 w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-60">{filmGenerating ? "🎞️ جارٍ تصنيع الفيلم... " + filmProgress + "%" : "🎥 ابدأ تصنيع الفيلم"}</button>
            {filmError && <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{filmError}</div>}
            {filmSegments.length > 0 && <div className="mt-4 space-y-4">
              <div className="text-sm text-slate-300">تم تصنيع {filmSegments.length} مقطعًا.</div>
              {filmSegments.map((seg) => <div key={seg.taskId} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                <div className="px-3 py-2 text-xs text-slate-400">المقطع {seg.index}</div>
                <video controls playsInline preload="metadata" src={seg.url} className="w-full" />
              </div>)}
            </div>}
            <p className="mt-3 text-xs text-slate-500">ملاحظة: روابط الفيديو من مزود التوليد مؤقتة، لذلك مرحلة الإنتاج النهائية ستحتاج تخزينًا دائمًا وتجميع المقاطع في ملف MP4 واحد.</p>
          </article>
          {religiousMode && story.religiousNotes.length > 0 && <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">ملاحظات الوضع الديني</h3>{story.religiousNotes.map((n, i) => <p key={i} className="mt-2 text-sm">{n}</p>)}</article>}
        </div>
        <p className="mt-5 text-sm text-slate-300">تم إنشاء القصة أولًا بنجاح. تصنيع الفيلم مرحلة منفصلة ولا يبدأ تلقائيًا. اضغط «ابدأ تصنيع الفيلم» فقط عندما تريد تحويل هذه القصة إلى فيديو.</p>
        <button onClick={reset} className="mt-4 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">إنشاء عمل جديد</button>
      </section>}

      <footer className="mt-6 text-center text-xs text-slate-600">اسألني AI • 1–60 دقيقة • <a href="/privacy.html" className="underline">سياسة الخصوصية</a></footer>
    </div>
  </main>;
}
