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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إنشاء القصة.");
      setStory(data.story); setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إنشاء القصة.");
    } finally {
      setGenerating(false);
    }
  }

  function reset() {
    setIdea(""); setCharacter(""); setCustomCharacter(""); setStyle("سينمائي"); setGenre("فيلم سينمائي");
    setDuration(3); setLanguage("العربية"); setReligiousMode(false); setStory(null); setFilter("الكل"); setError(""); setStep("idea");
  }

  return <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="text-xl font-bold">اسألني AI</div><div className="text-xs text-slate-400">من الفكرة إلى قصة وخطة فيلم</div></div>
        <div className="rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-200">الدقيقة الأولى مجانية</div>
      </header>

      {error && <div role="alert" className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {step === "idea" && <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
        <h1 className="text-3xl font-bold">ماذا تريد أن نصنع؟</h1>
        <p className="mt-2 text-slate-400">أفلام سينمائية، فانتازيا، خيال علمي، وحوش، رعب، مغامرات، قصص دينية وغيرها.</p>
        <textarea value={idea} onChange={(e) => { setIdea(e.target.value); setError(""); }} placeholder="مثال: أريد فيلماً عن وحش عملاق يظهر في مدينة مستقبلية..." className="mt-5 min-h-44 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 outline-none focus:border-amber-400" />
        <button onClick={nextFromIdea} className="mt-4 w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">تحليل الفكرة والمتابعة</button>
        <p className="mt-3 text-center text-xs text-slate-500">لن يبدأ إنشاء الفيلم قبل مراجعتك وتأكيدك.</p>
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
        <div className="text-center"><div className="text-5xl">🎬</div><h2 className="mt-3 text-3xl font-bold">جاهز لإنشاء القصة</h2><p className="mt-2 text-slate-400">سيكتب اسألني القصة من البداية للنهاية، ثم يبني الشخصيات والعالم والمشاهد والحوار والكاميرا والصوت وخطة الإنتاج.</p></div>
        <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-sm">التكلفة: <b>{price === 0 ? "مجاني" : "$" + price}</b></div>
        <button disabled={generating} onClick={generate} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-bold text-slate-950 disabled:opacity-60">{generating ? "⏳ جارٍ إنشاء القصة والمشاهد..." : "ابدأ إنشاء القصة والفيلم"}</button>
        <button onClick={() => setStep("details")} className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3">العودة للتعديل</button>
      </section>}

      {step === "done" && story && <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <div className="text-4xl">🎞️</div><h2 className="mt-2 text-3xl font-bold">{story.title}</h2><p className="mt-2 text-slate-300">{story.logline}</p>
        <div className="mt-5 space-y-4 text-right">
          <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">القصة</h3><p className="mt-2">{story.story.beginning}</p><p className="mt-2">{story.story.middle}</p><p className="mt-2">{story.story.climax}</p><p className="mt-2">{story.story.ending}</p></article>
          <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">الشخصيات</h3>{story.characters.map((c) => <div key={c.name} className="mt-3 border-b border-white/10 pb-3"><b>{c.name}</b> — {c.role}<div className="text-sm text-slate-400">{c.visual}</div></div>)}</article>
          <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">المشاهد ({story.scenes.length})</h3>{story.scenes.map((s) => <div key={s.number} className="mt-3 rounded-xl border border-white/10 p-4"><b>المشهد {s.number}: {s.location}</b><p className="mt-1 text-sm">{s.action}</p><p className="mt-1 text-xs text-slate-500">الكاميرا: {s.camera} • الصوت: {s.sound}</p></div>)}</article>
          {religiousMode && story.religiousNotes.length > 0 && <article className="rounded-2xl bg-slate-950/70 p-5"><h3 className="font-bold">ملاحظات الوضع الديني</h3>{story.religiousNotes.map((n, i) => <p key={i} className="mt-2 text-sm">{n}</p>)}</article>}
        </div>
        <p className="mt-5 text-sm text-slate-300">تم إنشاء القصة وخطة الفيلم. إخراج فيديو فعلي يحتاج ربط مولد الفيديو والصور والصوت في المرحلة التالية.</p>
        <button onClick={reset} className="mt-4 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">إنشاء عمل جديد</button>
      </section>}

      <footer className="mt-6 text-center text-xs text-slate-600">اسألني AI • 1–60 دقيقة • <a href="/privacy.html" className="underline">سياسة الخصوصية</a></footer>
    </div>
  </main>;
}
