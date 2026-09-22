import { useMemo, useState } from "react";

type Character = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  style: string;
  description: string;
};

const characters: Character[] = [
  { id: "pineapple", name: "السيد أناناس", emoji: "🍍", category: "فاكهة", style: "كرتوني", description: "رأس أناناس مع جسم إنسان" },
  { id: "tomato", name: "السيد طماطم", emoji: "🍅", category: "خضار", style: "كرتوني", description: "رأس طماطم مع جسم إنسان" },
  { id: "cat", name: "قط بشري", emoji: "🐱", category: "حيوان", style: "واقعي", description: "رأس قط مع جسم إنسان" },
  { id: "falcon", name: "الصقر اليمني", emoji: "🦅", category: "حيوان", style: "حضاري", description: "شخصية بطابع عربي/يمني" },
  { id: "human", name: "شخصية بشرية", emoji: "🧑", category: "إنسان", style: "واقعي", description: "مظهر بشري قابل للتخصيص" },
  { id: "robot", name: "شخصية آلية", emoji: "🤖", category: "خيالي", style: "مستقبلي", description: "روبوت بجسم بشري" },
];

const styles = ["كرتوني", "حقيقي", "واقعي", "حضري", "ريفي", "كلاسيكي", "يمني", "خيالي", "سينمائي"];
const categories = ["فاكهة", "خضار", "حيوان", "إنسان", "خيالي"];

function App() {
  const [idea, setIdea] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [customCharacter, setCustomCharacter] = useState("");
  const [style, setStyle] = useState("سينمائي");
  const [duration, setDuration] = useState(3);
  const [language, setLanguage] = useState("العربية");
  const [step, setStep] = useState<"idea" | "details" | "confirm" | "done">("idea");
  const [filter, setFilter] = useState("الكل");
  const [error, setError] = useState("");

  const visibleCharacters = useMemo(
    () => filter === "الكل" ? characters : characters.filter((c) => c.category === filter),
    [filter],
  );

  const characterText = customCharacter.trim() || selectedCharacter?.description || "";
  const price = duration <= 1 ? 0 : duration;

  function analyzeIdea() {
    const trimmed = idea.trim();
    if (trimmed.length < 10) {
      setError("اكتب فكرة أوضح (10 أحرف على الأقل) حتى يتمكن اسألني من فهم المطلوب.");
      return;
    }
    setError("");
    setStep("details");
  }

  function goToConfirm() {
    if (!characterText) {
      setError("اختر شخصية أو اكتب وصفًا لها قبل المتابعة.");
      return;
    }
    if (!style) {
      setError("اختر نمطًا بصريًا قبل المتابعة.");
      return;
    }
    setError("");
    setStep("confirm");
  }

  function confirmPlan() {
    setError("");
    setStep("done");
  }

  function startNewStory() {
    setIdea("");
    setSelectedCharacter(null);
    setCustomCharacter("");
    setStyle("سينمائي");
    setDuration(3);
    setLanguage("العربية");
    setFilter("الكل");
    setError("");
    setStep("idea");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold">اسألني AI</div>
            <div className="text-xs text-slate-400">من الفكرة إلى قصة وفيديو</div>
          </div>
          <div className="w-fit rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-200">الدقيقة الأولى مجانية</div>
        </header>

        {error && (
          <div role="alert" className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {step === "idea" && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="mb-5">
              <h1 className="text-3xl font-bold">ماذا تريد أن نصنع؟</h1>
              <p className="mt-2 text-slate-400">اكتب فكرتك بطريقتك الطبيعية. اسألني سيحللها ثم يسألك عن التفاصيل الضرورية الناقصة.</p>
            </div>
            <textarea
              value={idea}
              onChange={(e) => { setIdea(e.target.value); if (error) setError(""); }}
              placeholder="مثال: أريد قصة ممتعة عن السيد أناناس الذي يصل إلى مدينة مستقبلية ويبحث عن صديقه..."
              aria-label="فكرة القصة أو الفيديو"
              className="min-h-44 w-full resize-none rounded-2xl border border-white/10 bg-slate-900 p-4 outline-none placeholder:text-slate-500 focus:border-amber-400"
            />
            <button type="button" onClick={analyzeIdea} className="mt-4 w-full rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950 hover:bg-amber-300">
              تحليل الفكرة والمتابعة
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">لن يبدأ التنفيذ قبل اكتمال التفاصيل وتأكيدك الصريح.</p>
          </section>
        )}

        {step === "details" && (
          <section className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <h2 className="text-2xl font-bold">اختر الشخصية والمظهر</h2>
              <p className="mt-1 text-sm text-slate-400">يمكنك اختيار شخصية جاهزة أو كتابة شخصية خاصة بك.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["الكل", ...categories].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setFilter(item)}
                    aria-pressed={filter === item}
                    className={`rounded-full px-3 py-1.5 text-sm ${filter === item ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-300"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {visibleCharacters.map((character) => (
                  <button
                    type="button"
                    key={character.id}
                    onClick={() => { setSelectedCharacter(character); setCustomCharacter(""); setError(""); }}
                    aria-pressed={selectedCharacter?.id === character.id}
                    className={`rounded-2xl border p-4 text-right transition ${selectedCharacter?.id === character.id ? "border-amber-400 bg-amber-400/10" : "border-white/10 bg-slate-900 hover:border-white/25"}`}
                  >
                    <div className="text-4xl" aria-hidden="true">{character.emoji}</div>
                    <div className="mt-2 font-semibold">{character.name}</div>
                    <div className="mt-1 text-xs text-slate-400">{character.description}</div>
                  </button>
                ))}
              </div>

              <input
                value={customCharacter}
                onChange={(e) => { setCustomCharacter(e.target.value); setSelectedCharacter(null); if (error) setError(""); }}
                placeholder="أو اكتب وصف الشخصية التي تريدها..."
                aria-label="وصف شخصية مخصصة"
                className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-amber-400"
              />

              <label className="mt-5 block text-sm font-semibold">النمط البصري</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {styles.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => { setStyle(item); if (error) setError(""); }}
                    aria-pressed={style === item}
                    className={`rounded-xl border px-3 py-2 text-sm ${style === item ? "border-amber-400 bg-amber-400/10 text-amber-200" : "border-white/10 bg-slate-900 text-slate-300"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
              <h2 className="text-xl font-bold">تفاصيل التنفيذ</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <label className="rounded-2xl bg-slate-900 p-4">
                  <span className="text-sm text-slate-400">المدة بالدقائق</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    step={1}
                    value={duration}
                    onChange={(e) => setDuration(Math.min(60, Math.max(1, Number(e.target.value) || 1)))}
                    className="mt-2 w-full bg-transparent text-2xl font-bold outline-none"
                    aria-label="مدة الفيديو بالدقائق"
                  />
                </label>
                <label className="rounded-2xl bg-slate-900 p-4">
                  <span className="text-sm text-slate-400">اللغة</span>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" aria-label="لغة التنفيذ">
                    <option>العربية</option>
                    <option>English</option>
                    <option>اردو</option>
                    <option>کوردی</option>
                  </select>
                </label>
                <div className="rounded-2xl bg-slate-900 p-4">
                  <span className="text-sm text-slate-400">السعر عند التنفيذ</span>
                  <div className="mt-2 text-2xl font-bold">{price === 0 ? "مجاني" : `$${price}`}</div>
                  <div className="text-xs text-slate-500">الدقيقة الأولى مجانية، وكل دقيقة إضافية بسعر دولار واحد.</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5">
              <h2 className="text-xl font-bold">ملخص ما فهمه اسألني</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-200">
                <div><span className="text-slate-400">الفكرة:</span> {idea}</div>
                <div><span className="text-slate-400">الشخصية:</span> {characterText}</div>
                <div><span className="text-slate-400">النمط:</span> {style}</div>
                <div><span className="text-slate-400">المدة:</span> {duration} دقيقة</div>
                <div><span className="text-slate-400">اللغة:</span> {language}</div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={goToConfirm} className="flex-1 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950">اكتمال التفاصيل → مراجعة التنفيذ</button>
                <button type="button" onClick={() => { setError(""); setStep("idea"); }} className="rounded-2xl border border-white/10 px-5 py-3">تعديل الفكرة</button>
              </div>
            </div>
          </section>
        )}

        {step === "confirm" && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="text-center">
              <div className="text-5xl" aria-hidden="true">🎬</div>
              <h2 className="mt-3 text-3xl font-bold">جاهز للتنفيذ</h2>
              <p className="mx-auto mt-2 max-w-2xl text-slate-400">سيتم تحويل الوصف إلى قصة، ثم بناء الشخصيات والمشاهد والحوار وحركة الكاميرا والمؤثرات والصور/الفيديو وفق التفاصيل أعلاه.</p>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-sm">
              <div className="font-semibold">التكلفة: {price === 0 ? "مجاني" : `$${price}`}</div>
              <div className="mt-1 text-slate-400">لا يبدأ التنفيذ إلا بعد ضغط زر «ابدأ التنفيذ».</div>
            </div>
            <button type="button" onClick={confirmPlan} className="mt-5 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-bold text-slate-950">ابدأ التنفيذ</button>
            <button type="button" onClick={() => { setError(""); setStep("details"); }} className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3">العودة للتعديل</button>
          </section>
        )}

        {step === "done" && (
          <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-7 text-center">
            <div className="text-5xl" aria-hidden="true">✅</div>
            <h2 className="mt-3 text-3xl font-bold">تم تأكيد طلبك</h2>
            <p className="mt-2 text-slate-300">تم حفظ المواصفات داخل هذه الجلسة، وهذه المرحلة جاهزة لربط محرك الذكاء الاصطناعي الفعلي وتوليد المشاهد والفيديو.</p>
            <button type="button" onClick={startNewStory} className="mt-5 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">إنشاء قصة جديدة</button>
          </section>
        )}

        <footer className="mt-6 text-center text-xs text-slate-600">اسألني AI • تجربة عربية أولاً • 1–60 دقيقة</footer>
      </div>
    </main>
  );
}

export default App;
