import fs from 'fs';
const ROOT = process.cwd();
const built = JSON.parse(fs.readFileSync(ROOT + '/scripts/_built.json', 'utf8'));
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nis = (n) => '₪' + Number(n).toLocaleString('en-US');
const items = built.slice().sort((a, b) => (a.brandEn || a.brand || '').localeCompare(b.brandEn || b.brand || '', 'en') || (a.m || 9e9) - (b.m || 9e9));

const cards = items.map((x) => `    <a class="card rev" href="${esc(x.file)}">
      <div class="ph"><img loading="lazy" src="${esc(x.thumb)}" alt="${esc(x.name)}"></div>
      <div class="cb">
        <div class="br" dir="ltr">${esc(x.brandEn || x.brand || '')}</div>
        <div class="nm" dir="ltr">${esc(x.modelEn || x.name)}</div>
        <div class="pr">${x.m > 0 ? `<span>החל מ-</span> ${nis(x.m)} <span>/ חודש</span>` : '<span>הצעה אישית</span>'}</div>
      </div>
      <div class="go">לדף הרכב <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
    </a>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>דפי הנחיתה של Car2Buy · כל הרכבים החדשים</title>
<meta name="description" content="דפי נחיתה לכל הרכבים החדשים של Car2Buy — רכב חדש 0 ק&quot;מ, 100% מימון בריבית הטובה בישראל, טרייד-אין וליווי אישי.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
  :root{ --ink:#08090b; --ink-2:#101216; --gold:#F5691E; --gold-l:#ff8a4b; --muted:rgba(255,255,255,.64); --line:rgba(255,255,255,.13); --r:18px; --ease:cubic-bezier(.32,.72,0,1); --back:cubic-bezier(.34,1.56,.64,1); }
  *{margin:0;padding:0;box-sizing:border-box;} html{scroll-behavior:smooth;overflow-x:clip;}
  body{font-family:"Heebo","Noto Sans Hebrew",sans-serif;background:var(--ink);color:#fff;line-height:1.5;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
  img{max-width:100%;display:block;} a{color:inherit;text-decoration:none;}
  .wrap{width:100%;max-width:1280px;margin-inline:auto;padding-inline:clamp(16px,4vw,44px);}
  .top{position:sticky;inset-block-start:0;z-index:50;display:flex;justify-content:space-between;align-items:center;padding:14px clamp(16px,4vw,44px);background:rgba(8,9,11,.8);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);}
  .top .b{font-weight:900;font-size:20px;} .top .b i{color:var(--gold);font-style:normal;}
  .top .tel{background:var(--gold);color:#fff;font-weight:800;font-size:14px;padding:10px 16px;border-radius:8px;}
  .hero{padding:clamp(48px,8vw,96px) 0 clamp(28px,4vw,44px);text-align:center;}
  .hero .k{color:var(--gold-l);font-weight:800;font-size:13px;letter-spacing:.2em;text-transform:uppercase;}
  .hero h1{font-size:clamp(32px,6vw,68px);font-weight:900;letter-spacing:-.03em;margin-top:12px;line-height:1.02;} .hero h1 span{color:var(--gold);}
  .hero p{color:var(--muted);font-size:clamp(15px,1.8vw,19px);margin:16px auto 0;max-width:52ch;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:clamp(14px,1.8vw,22px);padding-block:clamp(20px,3vw,36px) clamp(60px,9vw,110px);}
  .card{background:var(--ink-2);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;transition:transform .5s var(--back),border-color .3s,box-shadow .3s;}
  .card:hover{transform:translateY(-4px);border-color:rgba(245,105,30,.5);box-shadow:0 24px 50px -24px rgba(0,0,0,.8);}
  .card .ph{aspect-ratio:16/10;background:#181a1f;overflow:hidden;} .card .ph img{width:100%;height:100%;object-fit:cover;transition:transform .6s var(--ease);}
  .card:hover .ph img{transform:scale(1.05);}
  .cb{padding:16px 18px 6px;flex:1;} .br{color:var(--muted);font-size:12.5px;font-weight:700;letter-spacing:.06em;} .nm{font-size:20px;font-weight:900;letter-spacing:-.02em;margin-top:3px;}
  .pr{margin-top:10px;font-size:22px;font-weight:900;color:var(--gold);} .pr span{color:var(--muted);font-size:13px;font-weight:600;}
  .go{display:flex;align-items:center;gap:8px;padding:12px 18px 16px;color:#fff;font-weight:700;font-size:14px;} .go svg{width:16px;height:16px;stroke:var(--gold);transition:transform .4s var(--ease);}
  .card:hover .go svg{transform:translateX(-5px);}
  .foot{padding:30px 0 60px;text-align:center;color:var(--muted);font-size:13px;border-top:1px solid var(--line);} .foot b{color:#fff;} .foot a{color:var(--gold-l);}
  .rev{opacity:0;transform:translateY(22px);transition:opacity .7s var(--back),transform .7s var(--back);} .rev.in{opacity:1;transform:none;}
  @media(prefers-reduced-motion:reduce){ .rev{opacity:1;transform:none;} }
</style>
</head>
<body>
<header class="top"><span class="b">Car<i>2</i>Buy</span><a class="tel" href="tel:+972723319929">072-3319929</a></header>
<section class="hero"><div class="wrap">
  <div class="k">דפי הנחיתה שלנו</div>
  <h1>כל הרכבים החדשים <span>שלנו</span></h1>
  <p>${items.length} דגמים · רכב חדש 0 ק"מ · 100% מימון בריבית הטובה בישראל · טרייד-אין וליווי אישי עד קבלת המפתח. בחרו רכב וקבלו הצעה אישית.</p>
</div></section>
<main class="wrap"><div class="grid">
${cards}
</div></main>
<footer class="foot"><div class="wrap"><b>Car2Buy</b> · <a href="tel:+972723319929">072-3319929</a> · המחירים להמחשה, ההצעה הסופית נתפרת אישית בכפוף לאישור גוף מימון וזמינות במלאי.</div></footer>
<script>
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.1});
  document.querySelectorAll('.rev').forEach(function(el){io.observe(el);});
</script>
</body>
</html>`;
fs.writeFileSync(ROOT + '/landings.html', html, 'utf8');
console.log('wrote landings.html with', items.length, 'cars');
