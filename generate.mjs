// توليد قصيدة «ديوان اليوم» جديدة تلقائيًّا عبر Anthropic API + بحث الويب.
// يُشغَّل يوميًّا من GitHub Actions. يحتاج ANTHROPIC_API_KEY في البيئة.
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const base = process.cwd();
const client = new Anthropic();

const files = fs.readdirSync(`${base}/entries`).filter(f => f.endsWith(".json")).sort();
const entries = files.map(f => JSON.parse(fs.readFileSync(`${base}/entries/${f}`, "utf8")));
const usedPoets = entries.map(e => e.poet);
const ERAS = ["العصر الجاهليّ", "العصر المخضرم / صدر الإسلام", "العصر الأمويّ", "العصر العباسيّ", "العصر الأندلسيّ", "عصر النهضة والإحياء", "العصر الحديث"];
// اختر العصر الأقلّ تغطيةً
const count = {}; ERAS.forEach(e => count[e] = 0); entries.forEach(e => { if (count[e.era] != null) count[e.era]++; });
const era = ERAS.slice().sort((a, b) => count[a] - count[b])[0];
const modern = ["عصر النهضة والإحياء", "العصر الحديث", "العصر المعاصر"].includes(era);

const SYSTEM = `أنت محرّر «ديوان اليوم». تختار شاعرًا مهمًّا وقصيدةً/أبياتًا من عصرٍ محدّد، وتشرحها.
قواعد صارمة:
- **ابحث في الويب** في مصادر أدبيّة موثوقة (aldiwan.net، الموسوعة الشعريّة poetry.dctabudhabi، أدب، ديوان العرب). **ممنوع مقالة ويكيبيديا كمصدر** (يجوز ويكي مصدر wikisource للنصّ التراثيّ فقط).
- **انقل الأبيات حرفيًّا من نتائج البحث فقط**. **لا تختلق بيتًا أو تعدّله إطلاقًا.** إن لم تجد نصًّا موثوقًا موثّقًا، أخرج {"skip":true} فقط.
- **شعر عموديّ حقيقيّ فقط** (لا شعر حرّ مرسل).
${modern ? "- الشاعر حديث/معاصر: إن كان حيًّا أو حديث الوفاة (حقوق محفوظة) فاختر **٦–٨ أبيات مختارة** مع الإسناد، وضع copyright_note مناسبة." : "- نصّ تراثيّ (ملكية عامّة): اختر ٨–١٢ بيتًا حرفيّة، copyright_note فارغة."}
- الشرح: **بلا نحو ولا صرف**؛ ركّز على معنى غريب الكلام + مقصد الشاعر بأسلوب مبسّط واضح.
أخرج **في نهاية ردّك** JSON فقط داخل \`\`\`json ... \`\`\`:
{"slug":"english-slug","era":"${era}","theme":"الغرض (غزل/رثاء/فخر/حكمة/…)","poet":"اسم الشاعر","poet_bio":"٢-٣ أسطر","poem_title":"...","intro":"سطران","verses":[{"s":"صدر البيت","a":"عجزه"}],"glossary":[{"word":"الكلمة","meaning":"معناها"}],"meaning":["فقرة شرح","...(٤-٦)"],"why":"لماذا تستحقّ","sources":[{"title":"...","url":"..."}],"copyright_note":""}`;

const USER = `اختر شاعرًا مهمًّا من «${era}» **لم يُطرَح من قبل** وقصيدةً/أبياتًا له، بغرضٍ متنوّع.
الشعراء المستعملون سابقًا (تجنّبهم): ${usedPoets.join(" | ")}
ابحث في الويب لتجد النصّ الموثّق والمصادر، ثم أخرج JSON.`;

async function ask() {
  let messages = [{ role: "user", content: USER }];
  for (let i = 0; i < 6; i++) {
    const r = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: SYSTEM,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages,
    });
    if (r.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: r.content }); continue; }
    return r.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  }
  throw new Error("توقّف كثيرًا (pause_turn)");
}

function extractJson(text) {
  const m = text.match(/```json\s*([\s\S]*?)```/);
  const s = m ? m[1] : (text.match(/\{[\s\S]*\}/) || [])[0];
  return JSON.parse(s);
}

function valid(e) {
  if (!e || e.skip) return "تخطّى (لا نصّ موثوق)";
  if (e.era !== era) return "عصر غير مطابق";
  if (!e.poet || usedPoets.includes(e.poet)) return "شاعر مكرّر أو مفقود";
  const raw = JSON.stringify(e);
  if (/wikipedia\.org\/wiki/i.test(raw)) return "مصدر ويكيبيديا ممنوع";
  if ((e.verses || []).length < 5) return "أبيات < ٥";
  if ((e.glossary || []).length < 3) return "غريب < ٣";
  if ((e.meaning || []).length < 3) return "شرح < ٣";
  if ((e.sources || []).length < 2) return "أقلّ من مصدرين";
  return null;
}

(async () => {
  let entry = null, err = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text = await ask();
      const e = extractJson(text);
      err = valid(e);
      if (!err) { entry = e; break; }
      console.error("محاولة", attempt + 1, "فشلت:", err);
      if (e && e.skip) break; // تخطٍّ مقصود: لا تكرّر
    } catch (ex) { err = ex.message; console.error("محاولة", attempt + 1, "خطأ:", ex.message); }
  }
  if (!entry) { console.error("تعذّر التوليد:", err); process.exit(1); }

  const nums = files.map(f => parseInt(f, 10)).filter(n => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  const slug = (entry.slug || "auto").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "auto";
  delete entry.slug; delete entry.skip;
  const name = `${String(n).padStart(2, "0")}-${slug}.json`;
  fs.writeFileSync(`${base}/entries/${name}`, JSON.stringify(entry, null, 2));
  console.log("✅ أُنشئت:", name, "|", entry.era, "|", entry.poet, "—", entry.poem_title);
})();
