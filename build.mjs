import fs from "fs";
const base="/Users/mac/poetry-daily";
const V="2";
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const arNum=n=>String(n).replace(/[0-9]/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
const pad=n=>String(n).padStart(3,"0");

const files=fs.readdirSync(`${base}/entries`).filter(f=>f.endsWith(".json")).sort();
const entries=files.map((f,i)=>{ const j=JSON.parse(fs.readFileSync(`${base}/entries/${f}`,"utf8"));
  const day=i+1; return {...j, day, id:"p"+day, file:`days/day-${pad(day)}.html`}; });
const total=entries.length;

const HEAD=(title,pre)=>`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${pre}assets/style.css?v=${V}">
<link rel="manifest" href="${pre}app.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#7b2d55">
<link rel="apple-touch-icon" href="${pre}assets/icon.svg">
<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${pre}sw.js').catch(function(){});});}</script>
</head>`;
const THEMEJS=`document.getElementById('tt').addEventListener('click',function(){var r=document.documentElement,t=r.getAttribute('data-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.setAttribute('data-theme',d?'light':'dark');localStorage.setItem('risala-theme',d?'light':'dark');});`;

function dayPage(e, prev, next){
  const verses=(e.verses||[]).map(v=> (v.a&&v.a.trim())
    ? `<div class="bayt"><span class="h sadr">${esc(v.s)}</span><span class="h ajz">${esc(v.a)}</span></div>`
    : `<div class="bayt single">${esc(v.s)}</div>`).join("\n      ");
  const gloss=(e.glossary||[]).map(g=>`<div class="t"><span class="ar">${esc(g.word)}</span><span class="gm">${esc(g.meaning)}</span></div>`).join("");
  const mean=(e.meaning||[]).map(p=>`<p>${esc(p)}</p>`).join("\n      ");
  const src=(e.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>`).join("");
  const prevA=prev?`<a href="day-${pad(prev)}.html">◀ السابق</a>`:`<a class="disabled">◀ السابق</a>`;
  const nextA=next?`<a href="day-${pad(next)}.html">التالي ▶</a>`:`<a class="disabled">التالي ▶</a>`;
  const cr=e.copyright_note?`<p class="cright">${esc(e.copyright_note)}</p>`:"";
  return `${HEAD("ديوان · "+e.poet,"../")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  <nav class="nav">
    <a class="home" href="../index.html">📜 ديوان اليوم</a>
    <span style="display:flex;gap:.5rem">${prevA}${nextA}</span>
    <span style="display:flex;gap:.45rem"><a href="../search.html">🔍</a><a href="../marks.html">🔖</a><a href="../archive.html">☰</a></span>
  </nav>
  <header class="mast">
    <p class="k">ديوان اليوم</p>
    <h1>${esc(e.poem_title||e.poet)}</h1>
    <p class="m">${esc(e.poet)} · اليوم ${arNum(e.day)} من ${arNum(total)}</p>
  </header>
  <article id="${e.id}">
    <div class="badges"><span class="badge">${esc(e.era)}</span><span class="badge2">${esc(e.theme)}</span></div>
    <div class="card"><h3>الشاعر</h3><p>${esc(e.poet_bio)}</p></div>
    ${e.intro?`<div class="card"><h3>عن القصيدة</h3><p>${esc(e.intro)}</p></div>`:""}
    <div class="matn">
      <div class="poem">
      ${verses}
      </div>
      <span class="lblx">شرح غريب الكلام</span>
      <div class="gloss">${gloss}</div>
      <span class="lblx">المعنى ومقصد الشاعر</span>
      <div class="meaning">
      ${mean}
      </div>
      ${e.why?`<div class="whybox"><span class="lblx" style="margin-top:0">لماذا تستحقّ</span>${esc(e.why)}</div>`:""}
      ${cr}
      <div class="sources"><span class="lbl">المصادر</span>${src}</div>
    </div>
  </article>
  <footer><p class="big">✦ نهاية قصيدة اليوم ✦</p><p><a href="../archive.html">كل العصور →</a></p></footer>
</div>
<script src="../assets/footnotes.js?v=${V}"></script>
</body></html>`;
}

entries.forEach((e,i)=>{ fs.writeFileSync(`${base}/days/day-${pad(e.day)}.html`, dayPage(e, i>0?i:null, i<total-1?i+2:null)); });

// index.json — التصنيف = العصر
const idx={ note:"فهرس القصائد", categories:[...new Set(entries.map(e=>e.era))],
  articles:entries.map(e=>({id:e.id,title:(e.poem_title||e.poet),category:e.era,poet:e.poet,theme:e.theme,reading_min:e.reading_min||5,day:e.day,file:e.file})) };
fs.writeFileSync(`${base}/index.json`, JSON.stringify(idx,null,2));
fs.writeFileSync(`${base}/manifest.json`, JSON.stringify({start:"2026-08-26",total},null,2));

const NAV=`<nav class="nav"><a class="home" href="index.html">📜 ديوان اليوم</a><span style="display:flex;gap:.45rem"><a href="search.html">🔍 بحث</a><a href="marks.html">🔖 علاماتي</a></span></nav>`;

// الرئيسية
fs.writeFileSync(`${base}/index.html`, `${HEAD("ديوان اليوم","")}
<body>
<button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">
  ${NAV}
  <header class="mast"><p class="k">قصيدةٌ كلّ يوم</p><h1>ديوان اليوم</h1><p class="m">شاعرٌ وقصيدة · عبر كلّ العصور</p></header>
  <div id="prog"></div>
  <div id="resume"></div>
  <a id="todayCard" class="today-card" href="#" style="display:none">
    <span class="k">📜 قصيدة اليوم</span><div class="tt2" id="tdTitle"></div><div class="mt" id="tdMeta"></div></a>
  <div class="sect-h">تصفّح العصور</div>
  <select class="catsel" id="catSel"><option value="">اختر عصرًا…</option></select>
  <ul class="archive-list" id="catList"></ul>
  <p style="text-align:center;margin:1.4rem 0 0;display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap">
    <a class="soft-link" href="archive.html">📁 المقروءة</a>
    <button id="cloudRestore" class="soft-link" style="cursor:pointer">☁↓ استعادة موضعي</button></p>
</div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function readMap(){try{return JSON.parse(localStorage.getItem('poem-read')||'{}');}catch(e){return {};}}
var READ=readMap();
(function(){var last=null;try{last=JSON.parse(localStorage.getItem('poem-last')||'null');}catch(e){}
 var b=document.getElementById('resume');
 if(last&&last.file){b.innerHTML='<a class="resume-btn" href="'+last.file+'?pg='+(last.page||1)+'"><span class="rt">▶ متابعة القراءة</span><span class="rs">'+(last.title?String(last.title).replace('ديوان · ',''):'آخر موضع')+' · صفحة '+arNum(last.page||1)+'</span></a>';}})();
Promise.all([fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}),fetch('manifest.json',{cache:'no-store'}).then(function(r){return r.json();})]).then(function(res){
 var j=res[0],m=res[1],arts=j.articles||[],cats=j.categories||[];
 var rc=arts.filter(function(a){return READ[a.id];}).length, pct=arts.length?Math.round(rc/arts.length*100):0;
 document.getElementById('prog').innerHTML='<div class="bar"><span style="width:'+pct+'%"></span></div><p class="pl">قرأتَ '+arNum(rc)+' من '+arNum(arts.length)+'</p>';
 var S=Date.UTC(2026,7,26),now=new Date();var t=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
 var n=Math.floor((t-S)/86400000)+1;if(n<1)n=1;if(n>m.total)n=m.total;var td=arts[n-1];
 if(td){var c=document.getElementById('todayCard');c.href=td.file;c.style.display='';
  document.getElementById('tdTitle').innerHTML=td.title+(READ[td.id]?'<span class="readmark">✓</span>':'');
  document.getElementById('tdMeta').textContent=td.poet+' · '+td.category;}
 var sel=document.getElementById('catSel'),list=document.getElementById('catList');
 cats.forEach(function(cc){var o=document.createElement('option');o.value=cc;o.textContent=cc;sel.appendChild(o);});
 sel.addEventListener('change',function(){list.innerHTML='';var cv=this.value;if(!cv)return;
  arts.filter(function(a){return a.category===cv;}).forEach(function(a){var li=document.createElement('li');var lnk=document.createElement('a');
   lnk.href=a.file;if(READ[a.id])lnk.className='read';
   lnk.innerHTML='<span class="d">'+a.title+(READ[a.id]?'<span class="readmark">✓</span>':'')+'</span><span class="t">'+a.poet+' · '+a.theme+'</span>';
   li.appendChild(lnk);list.appendChild(li);});});
});
document.getElementById('cloudRestore').addEventListener('click',function(){var b=this;b.textContent='☁ جارٍ…';
 fetch('https://kvdb.io/Hj8v3hbdFx6wBP8hrRyaUk/poem_pos',{cache:'no-store'}).then(function(r){return r.json();}).then(function(p){
  if(p&&p.file){location.href='/poetry-daily/'+p.file+'?pg='+(p.page||1);}else{b.textContent='لا يوجد موضع محفوظ';}}).catch(function(){b.textContent='تعذّر الاتصال';});});
${THEMEJS}
</script></body></html>`);

// الأرشيف (المقروءة)
fs.writeFileSync(`${base}/archive.html`, `${HEAD("ديوان · المقروءة","")}
<body><button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">${NAV}
  <header class="mast"><p class="k">ديوان اليوم</p><h1>المقروءة</h1><p class="m">القصائد التي أنهيتها ✓</p></header>
  <ul class="archive-list" id="list"><li>…</li></ul></div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function readMap(){try{return JSON.parse(localStorage.getItem('poem-read')||'{}');}catch(e){return {};}}
var R=readMap();
function fmt(ts){try{var d=new Date(ts);return arNum(d.getFullYear())+'-'+arNum(('0'+(d.getMonth()+1)).slice(-2))+'-'+arNum(('0'+d.getDate()).slice(-2));}catch(e){return '';}}
fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
 var arts=(j.articles||[]).filter(function(a){return R[a.id];}).sort(function(a,b){return R[b.id]-R[a.id];});
 var ul=document.getElementById('list');ul.innerHTML='';
 if(!arts.length){ul.innerHTML='<p style="color:var(--faint);text-align:center;margin:2rem 0">لا قصائد مقروءة بعد — أنهِ قصيدةً لتظهر هنا ✓</p>';return;}
 arts.forEach(function(a){var li=document.createElement('li');var lnk=document.createElement('a');lnk.href=a.file;
  lnk.innerHTML='<span class="d">'+a.title+'<span class="readmark">✓</span></span><span class="t">'+a.poet+' · '+a.category+' · '+fmt(R[a.id])+'</span>';
  li.appendChild(lnk);ul.appendChild(li);});});
${THEMEJS}
</script></body></html>`);

// البحث
fs.writeFileSync(`${base}/search.html`, `${HEAD("ديوان · البحث","")}
<body><button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">${NAV}
  <header class="mast"><p class="k">ديوان اليوم</p><h1>البحث</h1><p class="m">بالشاعر أو العنوان أو العصر</p></header>
  <input id="q" type="search" placeholder="مثال: المتنبّي، رثاء، أندلسي…" autocomplete="off" style="width:100%;font-family:var(--body);font-size:1.1rem;padding:.6rem .7rem;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);margin:0 0 1rem">
  <p id="count" style="color:var(--faint);font-size:.9rem"></p>
  <ul class="archive-list" id="res"></ul></div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
var norm=function(s){return (s||'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ً-ْ]/g,'').toLowerCase().trim();};
function readMap(){try{return JSON.parse(localStorage.getItem('poem-read')||'{}');}catch(e){return {};}}
var R=readMap(),DATA=[];
fetch('index.json',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){DATA=j.articles||[];run();});
function run(){var q=norm(document.getElementById('q').value);
 var res=DATA.filter(function(x){return !q||norm(x.title).indexOf(q)>=0||norm(x.poet).indexOf(q)>=0||norm(x.category).indexOf(q)>=0||norm(x.theme).indexOf(q)>=0;});
 var ul=document.getElementById('res');ul.innerHTML='';
 document.getElementById('count').textContent=res.length?('النتائج: '+arNum(res.length)):'لا نتائج';
 res.forEach(function(x){var li=document.createElement('li');var a=document.createElement('a');a.href=x.file;if(R[x.id])a.className='read';
  a.innerHTML='<span class="d">'+x.title+(R[x.id]?'<span class="readmark">✓</span>':'')+'</span><span class="t">'+x.poet+' · '+x.category+' · '+x.theme+'</span>';
  li.appendChild(a);ul.appendChild(li);});}
document.getElementById('q').addEventListener('input',run);
${THEMEJS}
</script></body></html>`);

// علاماتي
fs.writeFileSync(`${base}/marks.html`, `${HEAD("ديوان · علاماتي","")}
<body><button class="tt" id="tt" aria-label="تبديل الوضع">◐</button>
<div class="wrap">${NAV}
  <header class="mast"><p class="k">ديوان اليوم</p><h1>علاماتي</h1><p class="m">علاماتك وتظليلاتك</p></header>
  <div id="bm"></div><div id="hl"></div></div>
<script>
var arNum=function(n){return String(n).replace(/[0-9]/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]});};
function load(k){try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];}}
function render(){var bm=load('poem-bookmarks'),hl=load('poem-highlights');
 var bs=document.getElementById('bm'),hs=document.getElementById('hl');
 bs.innerHTML='<div class="sect-h">العلامات ('+arNum(bm.length)+')</div>';
 if(!bm.length)bs.innerHTML+='<p style="color:var(--faint);text-align:center">لا علامات — اضغط 🔖 أثناء القراءة.</p>';
 bm.slice().reverse().forEach(function(b){var d=document.createElement('div');d.className='archive-list';var u=b.file+(b.page?('?pg='+b.page):'');
  d.innerHTML='<a href="'+u+'"><span class="d">'+(b.title||'موضع').replace('ديوان · ','')+'</span><span class="t">صفحة '+arNum(b.page||1)+'</span></a>';bs.appendChild(d);});
 hs.innerHTML='<div class="sect-h">التظليلات ('+arNum(hl.length)+')</div>';
 if(!hl.length)hs.innerHTML+='<p style="color:var(--faint);text-align:center">لا تظليلات — ظلّل نصًّا أثناء القراءة.</p>';
 hl.slice().reverse().forEach(function(h){var box=document.createElement('div');box.style.margin='0 0 1rem';
  box.innerHTML='<p style="font-size:1.05rem;line-height:1.8">«'+h.text+'»</p><div style="font-size:.85rem"><a href="'+h.file+'" style="color:var(--ink)">↩ اذهب للموضع</a></div>';hs.appendChild(box);});}
render();${THEMEJS}
</script></body></html>`);

// ---- Service Worker للقراءة دون إنترنت ----
const fonts=fs.readdirSync(`${base}/assets/fonts`).filter(f=>f.endsWith(".woff2")).map(f=>`assets/fonts/${f}`);
const CORE=["./","index.html","archive.html","search.html","marks.html",
  "manifest.json","index.json","app.webmanifest",
  `assets/style.css?v=${V}`,`assets/footnotes.js?v=${V}`,"assets/fonts.css","assets/icon.svg",
  ...fonts, ...entries.map(e=>e.file)];
fs.writeFileSync(`${base}/sw.js`, `const CACHE='poem-v${V}';
const CORE=${JSON.stringify(CORE)};
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))));});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const ks=await caches.keys();await Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(hit=>{const net=fetch(req).then(res=>{if(res&&res.status===200)c.put(req,res.clone());return res;}).catch(()=>hit);return hit||net;})));});
`);
console.log("✅ بُنيت", total, "قصيدة + كل الصفحات + sw.js");
entries.forEach(e=>console.log("  اليوم",e.day,"|",e.era,"|",e.poet,"—",(e.poem_title||"")));
