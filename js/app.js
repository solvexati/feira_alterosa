/* Feira Alterosa — telas e comportamento (portado do feira-modelo.html).
   As rotas usam o #hash, como no modelo: #inicio, #barracas, #mapa, #barraca-12, #admin.
   (A área do feirante foi retirada por enquanto: o admin coloca a logo e as 10 fotos de produtos.) */
(function () {
  "use strict";
  const B = window.FeiraBackend;
  const CATS = window.FEIRA_CATS;
  const compress = window.FeiraImg.compress;

  const WA_SVG='<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>';
  const IG_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>';
  const PHONE_SVG='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1Z"/></svg>';
  const ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const ARROW_L='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';

  /* ---------- utilidades ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const digits = s => String(s ?? "").replace(/\D/g, "");
  const pad = n => String(n).padStart(2, "0");
  const code = n => pad(n) + "-777";
  const fmtPhone = w => { const d = digits(w); return d.length === 11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}` : d.length === 10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}` : (w || ""); };
  const initials = n => n.split(/\s+/).filter(w => w.length > 2 && !/^(das|dos|the)$/i.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const color = s => CATS[s.cat] || "#2e6b45";
  const same = (a, b) => String(a) === String(b);
  const reduceMotion = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  /* logo: mostrada inteira (sem cortar) sobre fundo branco; sem logo, iniciais na cor da categoria */
  const thumb = s => s.logo
    ? `<span class="thumb has-logo"><img src="${esc(s.logo)}" alt="Logo de ${esc(s.name)}" loading="lazy"></span>`
    : `<span class="thumb" style="background:${color(s)}"><span>${esc(initials(s.name))}</span></span>`;
  /* imagem do cartão da loja: a 1ª foto de produto; sem fotos, listras na cor da categoria com as iniciais */
  const banner = (s, cls = "ban") => s.img
    ? `<div class="${cls}"><img src="${esc(s.img)}" alt="${esc(s.name)}" loading="lazy"></div>`
    : `<div class="${cls}" style="background:repeating-linear-gradient(135deg,${color(s)} 0 28px,color-mix(in srgb,${color(s)} 80%,#000) 28px 56px)"><span class="ini">${esc(initials(s.name))}</span></div>`;
  const waLink = (n, msg) => `https://wa.me/55${digits(n)}?text=${encodeURIComponent(msg)}`;

  function matches(s, q) {
    if (!q) return true;
    const words = norm(q).replace(/\b(loja|barraca|da|do|de|das|dos|e)\b/g, " ").split(/\s+/).filter(Boolean);
    const hay = norm(`${s.name} ${s.owner} ${s.cat} ${s.desc} ${s.num} ${pad(s.num)} ${code(s.num)}`);
    return words.every(w => hay.includes(w));
  }

  /* ---------- estado ---------- */
  let cfg = { name: "Feira Alterosa", city: "Betim", wa: "", tag: "", imgs: [] };
  let stalls = [];
  const sorted = () => [...stalls].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const rowCard = s => `<button class="row-card" style="--c:${color(s)}" data-stall="${s.num}">${thumb(s)}<span class="t"><b>${esc(s.name)}</b><small>${esc(s.cat)} · ${esc(s.owner)}</small><span class="num-badge">Barraca ${code(s.num)}</span></span></button>`;
  async function refresh() { const d = await B.load(); cfg = d.cfg; stalls = d.stalls; }

  /* ---------- ilustração de capa (usada se assets/capa-feira.jpg não existir) ---------- */
  function feiraArt(v) {
    const pal=v?["#e9a23b","#b8432a","#f3d27a","#3c7d3a"]:["#b8432a","#e9a23b","#f6e3c1","#2a6c9c"];
    const sky=v?["#f2b45c","#f6dca4"]:["#7fb4d6","#dcecf2"];
    let stallsSvg="";
    for(let i=0;i<5;i++){
      const x=i*170-30, c=pal[i%2], w=160;
      let stripes=""; for(let k=0;k<8;k++) stripes+=`<rect x="${x+k*20}" y="300" width="10" height="70" fill="#fff" opacity=".85"/>`;
      let sc=""; for(let k=0;k<8;k++) sc+=`<circle cx="${x+10+k*20}" cy="370" r="10" fill="${k%2?c:"#fff"}"/>`;
      let fruit=""; for(let k=0;k<9;k++){const fc=["#d33b2c","#f0a52b","#4f9a3a","#e8d14a","#8e3b7a"][(k+i)%5]; fruit+=`<circle cx="${x+18+k*16}" cy="${505+(k%2)*6}" r="9" fill="${fc}"/>`}
      stallsSvg+=`<g><rect x="${x+6}" y="370" width="6" height="230" fill="#5b3a26"/><rect x="${x+w-12}" y="370" width="6" height="230" fill="#5b3a26"/>
        <rect x="${x}" y="300" width="${w}" height="70" fill="${c}"/>${stripes}${sc}
        <rect x="${x+4}" y="520" width="${w-8}" height="80" fill="#7a4d2e"/><rect x="${x+4}" y="512" width="${w-8}" height="12" fill="#956140"/>${fruit}</g>`;
    }
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 820" preserveAspectRatio="xMidYMid slice">
     <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
     <rect width="800" height="820" fill="url(#s)"/><circle cx="620" cy="160" r="70" fill="#fff6d8" opacity=".8"/>
     <path d="M0 330 Q120 250 240 300 T480 290 T800 280 V420 H0Z" fill="#6c9a5a" opacity=".55"/>
     ${stallsSvg}<rect y="600" width="800" height="220" fill="#c9a77e"/><rect y="600" width="800" height="10" fill="#b38f66"/>
     <g fill="#2f2622" opacity=".75"><circle cx="150" cy="640" r="22"/><rect x="128" y="660" width="44" height="120" rx="20"/><circle cx="520" cy="650" r="20"/><rect x="500" y="668" width="40" height="110" rx="18"/><circle cx="690" cy="630" r="24"/><rect x="666" y="652" width="48" height="130" rx="22"/></g></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const FOTO_FEIRA = "assets/capa-feira.jpg";
  window.__feiraFallback = feiraArt(0);

  /* ---------- carrossel da capa (troca a cada 6s, setas, bolinhas e arrastar) ---------- */
  let slide = 0, timer;
  function renderHero() {
    /* com 1 foto só, repete a foto para os dois textos da capa continuarem girando (como no modelo) */
    const own = cfg.imgs || [];
    const imgs = own.length > 1 ? own : own.length === 1 ? [own[0], own[0]] : [FOTO_FEIRA, FOTO_FEIRA];
    if (slide >= imgs.length) slide = 0;
    const texts = [
      { pill: esc(cfg.city || "Feira livre"), h: esc(cfg.title || cfg.name), p: esc(cfg.tag), cta: "Ver barracas", long: (cfg.title || cfg.name).length > 26 },
      { pill: "Direto do produtor", h: "Fresquinho<br>toda semana", p: "Fale com o feirante <b>direto pelo WhatsApp</b>.", cta: "Buscar barraca" }
    ];
    $("#hero").innerHTML = imgs.map((src, i) => { const t = texts[i % texts.length]; return `<div class="slide ${i === slide ? "on" : ""}" aria-hidden="${i !== slide}"><img src="${esc(src)}" alt="Foto da ${esc(cfg.name)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} onerror="this.onerror=null;this.src=window.__feiraFallback">
      <div class="slide-txt"><span class="pill">${t.pill}</span><h1${t.long ? ' class="long"' : ""}>${t.h}</h1><p>${t.p}</p><button class="cta" data-nav="barracas">${t.cta}</button></div></div>`; }).join("")
      + (imgs.length > 1 ? `<button class="arrow l" data-sl="-1" aria-label="Foto anterior">${ARROW_L}</button>
      <button class="arrow r" data-sl="1" aria-label="Próxima foto">${ARROW}</button>
      <div class="dots">${imgs.map((_, i) => `<button class="${i === slide ? "on" : ""}" data-dot="${i}" aria-label="Foto ${i + 1}"></button>`).join("")}</div>` : "");
    renderHeroTimer();
  }
  function moveSlide(d, abs) {
    const n = $("#hero").querySelectorAll(".slide").length; if (n < 2) return;
    slide = abs != null ? abs : (slide + d + n) % n;
    $("#hero").querySelectorAll(".slide").forEach((el, i) => { el.classList.toggle("on", i === slide); el.setAttribute("aria-hidden", i !== slide); });
    $("#hero").querySelectorAll(".dots button").forEach((el, i) => el.classList.toggle("on", i === slide));
  }
  function renderHeroTimer() {
    clearInterval(timer);
    if ($("#hero").querySelectorAll(".slide").length > 1 && !reduceMotion()) timer = setInterval(() => moveSlide(1), 6000);
  }
  (function heroSwipe() {
    const h = $("#hero"); let x0 = null;
    h.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    h.addEventListener("touchend", e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { moveSlide(dx < 0 ? 1 : -1); renderHeroTimer(); }
    }, { passive: true });
  })();

  /* ---------- telas ---------- */
  let cat = "Todas", query = "";
  function renderHome() {
    renderHero();
    $("#bigCount").textContent = `${stalls.length} barracas · busque por nome ou número`;
    const pick = [...stalls].sort((a, b) => a.num - b.num).slice(0, 8);
    $("#strip").innerHTML = pick.map(s => `<button class="mini" data-stall="${s.num}">${banner(s)}<div class="tx"><b>${esc(s.name)}</b><small>Barraca ${code(s.num)} · ${esc(s.cat)}</small></div></button>`).join("");
    homeSearch();
  }
  function homeSearch() {
    const q = $("#homeQ").value.trim(), box = $("#homeResults");
    if (!q) { box.hidden = true; return; }
    const r = sorted().filter(s => matches(s, q)).slice(0, 5);
    box.hidden = false;
    box.innerHTML = r.length ? r.map(rowCard).join("") : `<p class="empty">Nenhuma barraca encontrada para “${esc(q)}”.</p>`;
  }
  function renderList() {
    $("#eyebrow").textContent = cfg.city || cfg.name;
    const usedCats = Object.keys(CATS).filter(c => stalls.some(s => s.cat === c));
    $("#cats").innerHTML = ["Todas", ...usedCats].map(c => `<button class="cat" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    $("#catLabel").textContent = cat === "Todas" ? "Categorias" : `Categoria: ${cat}`;
    const vis = sorted().filter(s => (cat === "Todas" || s.cat === cat) && matches(s, query));
    $("#cards").innerHTML = vis.length ? vis.map(rowCard).join("") : `<p class="empty">Nenhuma barraca com esse filtro. Limpe a busca ou escolha outra categoria.</p>`;
    const byNum = Object.fromEntries(stalls.map(s => [s.num, s]));
    const row = f => `<div class="mrow">${Array.from({ length: 12 }, (_, i) => { const n = f + i, s = byNum[n]; return s ? `<button class="slot on" style="--c:${color(s)}" data-stall="${n}" aria-label="Barraca ${code(n)}: ${esc(s.name)}" title="${esc(s.name)}">${code(n)}</button>` : `<span class="slot">${code(n)}</span>`; }).join("")}</div>`;
    $("#map").innerHTML = `${row(1)}<div class="aisle">Corredor A</div>${row(13)}${row(25)}<div class="aisle">Corredor B</div>${row(37)}`;
  }
  /* ---------- página da loja: banner no topo, dados da loja e grade com as fotos dos produtos ---------- */
  let lbPhotos = [], lbIndex = 0, lbName = "";
  function renderDetail(num) {
    const s = stalls.find(x => x.num === num);
    const v = $("#v-barraca");
    const back = `<button class="back" data-nav="barracas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>Barracas</button>`;
    if (!s) { v.innerHTML = `${back}<p class="empty">Essa barraca não está mais cadastrada.</p>`; document.title = cfg.name; return; }
    document.title = `${s.name} · Barraca ${code(s.num)} · ${cfg.name}`;
    const msg = "Olá! Vi sua barraca no site da " + cfg.name + ".";
    const ig = s.ig ? `<div class="c-row">${IG_SVG}<span>@${esc(s.ig)}</span><a class="icon" href="https://instagram.com/${esc(s.ig)}" target="_blank" rel="noopener" aria-label="Abrir Instagram">${ARROW}</a></div>` : "";
    const capa = s.banner
      ? `<div class="loja-capa"><img src="${esc(s.banner)}" alt="Banner de ${esc(s.name)}" fetchpriority="high"></div>`
      : `<div class="loja-capa" style="background:repeating-linear-gradient(135deg,${color(s)} 0 28px,color-mix(in srgb,${color(s)} 80%,#000) 28px 56px)"></div>`;
    const ph = s.photos || [];
    lbPhotos = ph; lbName = s.name;
    const prods = ph.length
      ? `<div class="prod-grid">${ph.map((p, i) => `<button class="prod" data-ph="${i}" aria-label="Abrir foto ${i + 1} de ${ph.length}"><img src="${esc(p.url)}" alt="Produto ${i + 1} de ${esc(s.name)}" loading="lazy"></button>`).join("")}</div>`
      : `<p class="note" style="margin:0">Esta barraca ainda não colocou fotos dos produtos.</p>`;
    v.innerHTML = `${back}
     <article class="detail loja">${capa}
      <div class="d-body">
        <div class="loja-info">
          <div class="loja-main">
            <div class="d-head">${thumb(s)}<span class="num-badge">Barraca ${code(s.num)}</span></div>
            <div><h1>${esc(s.name)}</h1><div class="owner">${esc(s.owner)} · ${esc(s.cat)}</div></div>
            ${s.desc ? `<p>${esc(s.desc)}</p>` : ""}
          </div>
          <div class="loja-contato">
            <div>
              <div class="c-row">${PHONE_SVG}<span>${esc(fmtPhone(s.wa))}</span><a class="icon" href="${waLink(s.wa, msg)}" target="_blank" rel="noopener" aria-label="WhatsApp" style="color:var(--wa)">${WA_SVG.replace("<svg", '<svg fill="currentColor"')}</a></div>
              ${ig}
            </div>
            <div class="d-actions"><a class="wa-btn" href="${waLink(s.wa, msg)}" target="_blank" rel="noopener">${WA_SVG}Chamar no WhatsApp</a>${s.ig ? `<a class="ig-btn" href="https://instagram.com/${esc(s.ig)}" target="_blank" rel="noopener">${IG_SVG}Ver no Instagram</a>` : ""}</div>
          </div>
        </div>
      </div>
      <section class="prods" aria-label="Produtos">
        <div class="sec-head"><h2>Produtos</h2>${ph.length ? `<span class="note">${ph.length} foto${ph.length > 1 ? "s" : ""} · toque para ampliar</span>` : ""}</div>
        ${prods}
      </section></article>`;
  }

  /* ---------- foto ampliada (sem passagem automática: só setas, teclado ou arrastar) ---------- */
  function lbShow(i) {
    const n = lbPhotos.length; if (!n) return;
    lbIndex = ((i % n) + n) % n;
    $("#lbImg").src = lbPhotos[lbIndex].url;
    $("#lbImg").alt = `Produto ${lbIndex + 1} de ${lbName}`;
    $("#lbCount").textContent = `${lbIndex + 1} / ${n}`;
    $("#lb").querySelectorAll(".arrow").forEach(b => b.hidden = n < 2);
    /* já pede a próxima foto para a troca ser instantânea */
    if (n > 1) { const pre = new Image(); pre.src = lbPhotos[(lbIndex + 1) % n].url; }
  }
  function lbOpen(i) { lbShow(i); $("#lb").hidden = false; document.body.classList.add("lock"); $("#lbClose").focus(); }
  function lbClose() { if ($("#lb").hidden) return; $("#lb").hidden = true; document.body.classList.remove("lock"); const b = document.querySelector(`[data-ph="${lbIndex}"]`); if (b) b.focus(); }
  document.addEventListener("click", e => {
    const p = e.target.closest("[data-ph]"); if (p) { lbOpen(+p.dataset.ph); return; }
    if (e.target.closest("[data-lb-close]")) lbClose();
    const a = e.target.closest("[data-lb]"); if (a) lbShow(lbIndex + +a.dataset.lb);
  });
  addEventListener("keydown", e => {
    if ($("#lb").hidden) return;
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowRight") lbShow(lbIndex + 1);
    else if (e.key === "ArrowLeft") lbShow(lbIndex - 1);
  });
  (function lbSwipe() {
    const el = $("#lb"); let x0 = null;
    el.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) lbShow(lbIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  /* ---------- rotas ---------- */
  function route() {
    const h = location.hash.slice(1) || "inicio";
    const m = h.match(/^barraca-(\d+)$/);
    const view = m ? "barraca" : h === "mapa" ? "barracas" : ["inicio", "barracas", "admin", "cadastro"].includes(h) ? h : "inicio";
    document.querySelectorAll("main .col > .view").forEach(v => v.hidden = v.id !== "v-" + view);
    $("#brand").textContent = cfg.name;
    if (view !== "barraca") document.title = `${cfg.name} · ${cfg.city || "Feira livre"}`;
    $("#fab").href = waLink(cfg.wa, "Olá! Vim pelo site da " + cfg.name + ".");
    $("#fab").innerHTML = WA_SVG;
    $("#fab").hidden = view === "admin" || view === "cadastro" || !digits(cfg.wa);
    $("#footName").textContent = cfg.name; $("#footCity").textContent = (cfg.city ? cfg.city + " · " : "") + "MG";
    clearInterval(timer);
    if (view === "inicio") renderHome();
    if (view === "barracas") {
      renderList();
      const showMap = h === "mapa";
      $("#mapBox").hidden = !showMap && $("#mapBtn").getAttribute("aria-expanded") !== "true";
      $("#mapBtn").setAttribute("aria-expanded", String(!$("#mapBox").hidden));
    }
    if (view === "barraca") renderDetail(+m[1]);
    if (view !== "barraca") lbClose();
    if (view === "admin") { const ok = B.isAdmin(); $("#loginBox").hidden = ok; $("#panelBox").hidden = !ok; if (ok) { renderAdmin(); loadRequests(); } }
    if (view === "cadastro") renderCadastro();
    renderDrawer();
    const tab = h === "mapa" ? "mapa" : view === "barraca" ? "barracas" : view;
    document.querySelectorAll("#tabbar [data-tab], .topnav [data-tab]").forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle("on", on); on ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"); });
    document.body.classList.toggle("no-tabs", view === "admin");
    window.scrollTo(0, 0);
  }
  const nav = t => { closeMenu(); if (location.hash === "#" + t) route(); else location.hash = t; };
  addEventListener("hashchange", route);

  /* ---------- menu lateral ---------- */
  function renderDrawer() { $("#drList").innerHTML = [...stalls].sort((a, b) => a.num - b.num).map(s => `<li><button data-stall="${s.num}"><span class="n">${code(s.num)}</span><span>${esc(s.name)}</span></button></li>`).join(""); }
  function openMenu() { $("#drawer").classList.add("open"); $("#scrim").hidden = false; $("#openMenu").setAttribute("aria-expanded", "true"); }
  function closeMenu() { $("#drawer").classList.remove("open"); $("#scrim").hidden = true; $("#openMenu").setAttribute("aria-expanded", "false"); }
  $("#openMenu").onclick = openMenu; $("#closeMenu").onclick = closeMenu; $("#scrim").onclick = closeMenu;

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-nav],[data-stall],[data-cat],[data-sl],[data-dot]"); if (!t) return;
    if (t.dataset.nav) nav(t.dataset.nav);
    else if (t.dataset.stall) nav("barraca-" + t.dataset.stall);
    else if (t.dataset.cat) { cat = t.dataset.cat; renderList(); }
    else if (t.dataset.sl) { moveSlide(+t.dataset.sl); renderHeroTimer(); }
    else if (t.dataset.dot) { moveSlide(0, +t.dataset.dot); renderHeroTimer(); }
  });
  $("#homeQ").addEventListener("input", homeSearch);
  $("#homeQ").addEventListener("keydown", e => { if (e.key === "Enter") { query = e.target.value.trim(); $("#q").value = query; cat = "Todas"; nav("barracas"); } });
  $("#q").addEventListener("input", e => { query = e.target.value.trim(); renderList(); });
  $("#catBtn").onclick = () => { const o = $("#cats").hidden; $("#cats").hidden = !o; $("#catBtn").setAttribute("aria-expanded", String(o)); };
  $("#mapBtn").onclick = () => { const o = $("#mapBox").hidden; $("#mapBox").hidden = !o; $("#mapBtn").setAttribute("aria-expanded", String(o)); };
  document.querySelector("[data-search]").addEventListener("click", () => {
    nav("barracas");
    setTimeout(() => { $("#q").focus(); document.querySelectorAll("#tabbar [data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === "buscar")); }, 80);
  });

  /* ---------- botões com estado "salvando" ---------- */
  async function busy(btn, label, fn) {
    const old = btn.textContent; btn.disabled = true; btn.textContent = label;
    try { return await fn(); } finally { btn.disabled = false; if (btn.textContent === label) btn.textContent = old; }
  }

  /* =========================== PAINEL ADM =========================== */
  $("#loginForm").addEventListener("submit", e => {
    e.preventDefault();
    busy($("#loginBtn"), "Entrando…", async () => {
      const ok = await B.adminLogin($("#lu").value, $("#lp").value);
      if (ok) { $("#lp").value = ""; $("#loginErr").hidden = true; route(); }
      else $("#loginErr").hidden = false;
    });
  });
  $("#logout").onclick = async () => { await B.adminLogout(); route(); };
  $("#fCat").innerHTML = Object.keys(CATS).map(c => `<option>${c}</option>`).join("");

  /* dados da feira */
  function fillCfg() { $("#cName").value = cfg.name; $("#cCity").value = cfg.city || ""; $("#cWa").value = fmtPhone(cfg.wa); $("#cTag").value = cfg.tag || ""; $("#cTitle").value = cfg.title || ""; tagCount(); renderCapa(); }
  const tagCount = () => { $("#cTagCount").textContent = `· ${$("#cTag").value.length}/220`; };
  $("#cTag").addEventListener("input", tagCount);
  $("#cfgForm").addEventListener("submit", e => {
    e.preventDefault();
    $("#cfgErr").hidden = true;
    busy($("#cfgBtn"), "Salvando…", async () => {
      try {
        await B.saveCfg({ name: $("#cName").value.trim() || cfg.name, city: $("#cCity").value.trim(), wa: digits($("#cWa").value), tag: $("#cTag").value.trim().replace(/s+/g, " "), title: $("#cTitle").value.trim() }, null);
        await refresh();
        $("#brand").textContent = cfg.name;
        fillCfg();
        $("#cfgOk").hidden = false; setTimeout(() => $("#cfgOk").hidden = true, 2500);
      } catch (err) { $("#cfgErr").textContent = err.message; $("#cfgErr").hidden = false; }
    });
  });

  /* fotos da capa (carrossel do topo): até 5, cada mudança já vale no site */
  function capaMsg(ok, txt) { const a = $(ok ? "#capaOk" : "#capaErr"), b = $(ok ? "#capaErr" : "#capaOk"); b.hidden = true; a.textContent = txt; a.hidden = false; clearTimeout(a._t); a._t = setTimeout(() => a.hidden = true, 5000); }
  function renderCapa() {
    const list = cfg.imgs || [], max = window.FEIRA_LIMITS.capa;
    $("#capaCount").textContent = `${list.length} de ${max}`;
    $("#capaGrid").innerHTML = Array.from({ length: max }, (_, i) => {
      if (list[i]) return `<div class="ph capa"><img src="${esc(list[i])}" alt="Capa ${i + 1}" loading="lazy"><span class="ph-n">${i + 1}</span>
        <div class="ph-act"><button type="button" data-cmv="${i}" data-d="-1" ${i ? "" : "disabled"} aria-label="Mover para antes">‹</button><button type="button" data-crm="${i}">Remover</button><button type="button" data-cmv="${i}" data-d="1" ${i < list.length - 1 ? "" : "disabled"} aria-label="Mover para depois">›</button></div></div>`;
      if (i === list.length) return `<label class="ph add capa"><input type="file" accept="image/*" multiple class="sr" id="capaFiles"><span>+</span><small>Adicionar</small></label>`;
      return `<div class="ph empty capa"><span>${i + 1}</span></div>`;
    }).join("");
  }
  let capaBusy = false;
  async function capaOp(fn) {
    if (capaBusy) return; capaBusy = true;
    $("#capaGrid").style.opacity = ".6";
    try { await fn(); } catch (err) { capaMsg(false, err.message); }
    finally { capaBusy = false; $("#capaGrid").style.opacity = ""; try { await refresh(); } catch (_) {} slide = 0; renderCapa(); }
  }
  $("#capaGrid").addEventListener("change", e => {
    if (e.target.id !== "capaFiles") return;
    const max = window.FEIRA_LIMITS.capa, room = max - (cfg.imgs || []).length, all = [...e.target.files], files = all.slice(0, room);
    if (all.length > room) capaMsg(false, `Só cabem mais ${room} foto(s) na capa. As demais foram ignoradas.`);
    if (!files.length) return;
    capaOp(async () => {
      const blobs = await Promise.all(files.map(f => compress(f, "capa")));
      const saved = await B.addCovers(blobs);
      if (saved) capaMsg(true, `${files.length} foto(s) adicionada(s) à capa. Já aparecem no site.`);
      else capaMsg(false, "As fotos aparecem agora, mas o navegador ficou sem espaço para guardá-las (modo demonstração).");
    });
  });
  $("#capaGrid").addEventListener("click", e => {
    const b = e.target.closest(".ph-act button"); if (!b) return;
    if (b.dataset.crm != null) capaOp(async () => { await B.removeCover(+b.dataset.crm); capaMsg(true, "Foto removida da capa."); });
    else if (b.dataset.cmv != null) { const i = +b.dataset.cmv, j = i + +b.dataset.d; capaOp(() => B.moveCover(i, j)); }
  });

  /* barracas */
  const LIMITS = window.FEIRA_LIMITS;
  let editId = null, confirmId = null;
  /* logo e banner da loja: {url, blob?}; "changed" diz se precisa salvar */
  let logo = null, logoChanged = false, banImg = null, banChanged = false;
  function showPrev() {
    $("#fPrev").innerHTML =
      (logo ? `<img src="${esc(logo.url)}" alt="Logo"><button type="button" class="btn ghost sm" id="rmLogo">Remover logo</button>` : "") +
      (banImg ? `<img src="${esc(banImg.url)}" alt="Banner" style="max-width:200px"><button type="button" class="btn ghost sm" id="rmBanner">Remover banner</button>` : "");
  }
  $("#fLogo").addEventListener("change", async e => {
    if (!e.target.files[0]) return;
    const blob = await compress(e.target.files[0], "logo");
    logo = { blob, url: URL.createObjectURL(blob) }; logoChanged = true; showPrev();
  });
  $("#fBanner").addEventListener("change", async e => {
    if (!e.target.files[0]) return;
    const blob = await compress(e.target.files[0], "banner");
    banImg = { blob, url: URL.createObjectURL(blob) }; banChanged = true; showPrev();
  });
  $("#fPrev").addEventListener("click", e => {
    if (e.target.id === "rmLogo") { logo = null; logoChanged = true; $("#fLogo").value = ""; showPrev(); }
    if (e.target.id === "rmBanner") { banImg = null; banChanged = true; $("#fBanner").value = ""; showPrev(); }
  });

  function renderAdmin() {
    fillCfg();
    const list = [...stalls].sort((a, b) => a.num - b.num);
    $("#adminCount").textContent = `${stalls.length} cadastradas · ${48 - stalls.length} vagas`;
    $("#adminList").innerHTML = list.length ? list.map(s => `<div class="a-row">${thumb(s)}<span class="t"><b>${code(s.num)} · ${esc(s.name)}</b><small>${esc(s.owner)} · ${esc(fmtPhone(s.wa))} · ${(s.photos || []).length} fotos</small></span>
      ${same(confirmId, s.id) ? `<span class="confirm">Remover? <button class="btn danger sm" data-del="${esc(s.id)}">Remover</button><button class="btn ghost sm" data-nodel="1">Cancelar</button></span>`
       : `<span class="actions"><button class="btn ghost sm" data-edit="${esc(s.id)}">Editar</button><button class="btn ghost sm" data-ask="${esc(s.id)}">Remover</button></span>`}</div>`).join("")
      : `<p class="empty">Nenhuma barraca cadastrada ainda. Clique em “+ Nova barraca”.</p>`;
  }
  $("#adminList").addEventListener("click", async e => {
    const d = e.target.dataset;
    if (d.ask) { confirmId = d.ask; renderAdmin(); }
    else if (d.nodel) { confirmId = null; renderAdmin(); }
    else if (d.del) {
      const s = stalls.find(x => same(x.id, d.del));
      e.target.disabled = true; e.target.textContent = "Removendo…";
      try { await B.deleteStall(s.id); confirmId = null; await refresh(); renderAdmin(); flash(`Barraca ${code(s.num)} removida.`); }
      catch (err) { confirmId = null; renderAdmin(); flash(err.message, true); }
    }
    else if (d.edit) { openEdit(stalls.find(x => same(x.id, d.edit))); openModal(); }
  });
  function openEdit(s) {
    resetForm(); editId = s.id;
    $("#fName").value = s.name; $("#fOwner").value = s.owner; $("#fNum").value = s.num; $("#fCat").value = s.cat; $("#fWa").value = fmtPhone(s.wa); $("#fIg").value = s.ig ? "@" + s.ig : ""; $("#fDesc").value = s.desc || "";
    logo = s.logo ? { url: s.logo } : null; banImg = s.banner ? { url: s.banner } : null; showPrev();
    $("#formTitle").textContent = `Editar barraca ${code(s.num)}`; $("#saveBtn").textContent = "Salvar alterações";
    $("#imgsLater").hidden = true; $("#imgsBox").hidden = false;
    renderImgs();
  }
  function resetForm() {
    editId = null; logo = null; logoChanged = false; banImg = null; banChanged = false;
    $("#stallForm").reset(); showPrev();
    $("#formTitle").textContent = "Nova barraca"; $("#saveBtn").textContent = "Cadastrar barraca"; $("#formErr").hidden = true;
    $("#imgsLater").hidden = false; $("#imgsBox").hidden = true; $("#imgsOk").hidden = true; $("#imgsErr").hidden = true;
  }
  function openModal() { $("#formErr").hidden = true; $("#stallModal").hidden = false; document.body.classList.add("lock"); setTimeout(() => $("#fName").focus(), 50); }
  function closeModal() { $("#stallModal").hidden = true; document.body.classList.remove("lock"); resetForm(); renderAdmin(); }
  $("#cancelEdit").onclick = closeModal;
  $("#newStall").onclick = () => { resetForm(); openModal(); };
  $("#stallModal").addEventListener("click", e => { if (e.target.closest("[data-close-modal]")) closeModal(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !$("#stallModal").hidden) closeModal(); });
  function flash(m, isErr) { const el = $("#formOk"); el.textContent = m; el.className = isErr ? "err" : "ok"; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => el.hidden = true, 3500); }
  $("#stallForm").addEventListener("submit", async e => {
    e.preventDefault();
    const num = +$("#fNum").value, wa = digits($("#fWa").value), err = $("#formErr");
    const taken = stalls.find(s => s.num === num && !same(s.id, editId));
    if (taken) { err.textContent = `A barraca ${code(num)} já está com “${taken.name}”. Escolha outro número.`; err.hidden = false; return; }
    if (wa.length < 10 || wa.length > 11) { err.textContent = "O WhatsApp precisa ter DDD e número, por exemplo (31) 98765-4321."; err.hidden = false; return; }
    const data = { num, name: $("#fName").value.trim(), owner: $("#fOwner").value.trim(), cat: $("#fCat").value, wa, ig: $("#fIg").value.trim().replace(/^@/, ""), desc: $("#fDesc").value.trim() };
    const isNew = editId == null;
    err.hidden = true;
    const btn = $("#saveBtn"), old = btn.textContent;
    btn.disabled = true; btn.textContent = "Salvando…";
    try {
      const id = await B.saveStall(editId, data,
        logoChanged ? (logo ? logo.blob : null) : undefined,
        banChanged ? (banImg ? banImg.blob : null) : undefined);
      await refresh();
      if (isNew) {
        /* continua no modal para colocar as fotos */
        openEdit(stalls.find(x => same(x.id, id)));
        imgMsg(true, `Barraca ${code(num)} cadastrada e já aparece no site. Agora coloque as fotos dos produtos.`);
      } else { closeModal(); flash(`Barraca ${code(num)} atualizada.`); }
    } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.textContent = old; }
    finally { btn.disabled = false; }
  });

  /* fotos dos produtos (até 10), dentro do modal */
  const editing = () => stalls.find(x => same(x.id, editId));
  const listOf = s => s.photos || [];
  function imgMsg(ok, txt) { const a = $(ok ? "#imgsOk" : "#imgsErr"), b = $(ok ? "#imgsErr" : "#imgsOk"); b.hidden = true; a.textContent = txt; a.hidden = false; clearTimeout(a._t); a._t = setTimeout(() => a.hidden = true, 5000); }
  function renderGrid(kind) {
    const s = editing(); if (!s) return;
    const ph = listOf(s), max = LIMITS.fotos, grid = $("#fotoGrid");
    $("#fotoCount").textContent = `${ph.length} de ${max}`;
    grid.innerHTML = Array.from({ length: max }, (_, i) => {
      if (ph[i]) return `<div class="ph"><img src="${esc(ph[i].url)}" alt="Imagem ${i + 1}" loading="lazy"><span class="ph-n">${i + 1}</span>
        <div class="ph-act"><button type="button" data-mv="${i}" data-d="-1" ${i ? "" : "disabled"} aria-label="Mover para antes">‹</button><button type="button" data-rm="${i}">Remover</button><button type="button" data-mv="${i}" data-d="1" ${i < ph.length - 1 ? "" : "disabled"} aria-label="Mover para depois">›</button></div></div>`;
      if (i === ph.length) return `<label class="ph add"><input type="file" accept="image/*" multiple class="sr" data-files="1"><span>+</span><small>Adicionar</small></label>`;
      return `<div class="ph empty"><span>${i + 1}</span></div>`;
    }).join("");
  }
  function renderImgs() { renderGrid("fotos"); }
  let imgBusy = false;
  async function imgOp(fn) {
    if (imgBusy) return; imgBusy = true;
    $("#imgsBox").style.opacity = ".6";
    try { await fn(); } catch (err) { imgMsg(false, err.message); }
    finally { imgBusy = false; $("#imgsBox").style.opacity = ""; try { await refresh(); } catch (_) {} renderImgs(); }
  }
  $("#imgsBox").addEventListener("change", e => {
    if (!e.target.dataset.files) return;
    const kind = e.target.closest(".ph-grid").dataset.kind, s = editing();
    const room = LIMITS[kind] - listOf(s, kind).length, all = [...e.target.files], files = all.slice(0, room);
    if (all.length > room) imgMsg(false, `Só cabem mais ${room} imagem(ns). As demais foram ignoradas.`);
    if (!files.length) return;
    imgOp(async () => {
      const blobs = await Promise.all(files.map(f => compress(f, "foto")));
      const saved = await B.addImages(s.id, kind, blobs);
      if (saved) imgMsg(true, `${files.length} imagem(ns) adicionada(s). Já aparecem no site.`);
      else imgMsg(false, "As imagens aparecem agora, mas o navegador ficou sem espaço para guardá-las (modo demonstração).");
    });
  });
  $("#imgsBox").addEventListener("click", e => {
    const b = e.target.closest(".ph-act button"); if (!b) return;
    const kind = b.closest(".ph-grid").dataset.kind, s = editing();
    if (b.dataset.rm != null) imgOp(async () => { await B.removeImage(s.id, kind, +b.dataset.rm); imgMsg(true, "Imagem removida."); });
    else if (b.dataset.mv != null) { const i = +b.dataset.mv, j = i + +b.dataset.d; imgOp(() => B.moveImage(s.id, kind, i, j)); }
  });

  /* ======================= QUERO SER FEIRANTE ======================= */
  const fmtCpf = v => { const d = digits(v).slice(0, 11); return d.length > 9 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : d.length > 6 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}` : d.length > 3 ? `${d.slice(0,3)}.${d.slice(3)}` : d; };
  const fmtTelLive = v => { const d = digits(v).slice(0, 11); if (d.length <= 2) return d; if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`; return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; };
  /* CPF válido: 11 dígitos, não todos iguais, e os dois dígitos verificadores corretos */
  function cpfValido(v) {
    const c = digits(v);
    if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === +c[9] && dv(10) === +c[10];
  }
  function renderCadastro() {
    const sel = $("#rCat");
    if (!sel.options.length) sel.innerHTML = `<option value="" disabled selected>Escolha uma categoria</option>` + Object.keys(CATS).map(c => `<option>${c}</option>`).join("") + `<option>Outra</option>`;
  }
  $("#rTel").addEventListener("input", e => { e.target.value = fmtTelLive(e.target.value); });
  $("#rCpf").addEventListener("input", e => { e.target.value = fmtCpf(e.target.value); });
  $("#cadNovo").onclick = () => { $("#cadForm").reset(); $("#cadOk").hidden = true; $("#cadBox").hidden = false; $("#rNome").focus(); };
  $("#cadForm").addEventListener("submit", e => {
    e.preventDefault();
    const err = $("#cadErr"), show = (msg, el) => { err.textContent = msg; err.hidden = false; if (el) el.focus(); };
    err.hidden = true;
    if ($("#rSite").value) return; /* robô preencheu o campo escondido */
    const nome = $("#rNome").value.trim().replace(/\s+/g, " "), tel = digits($("#rTel").value), cpf = digits($("#rCpf").value);
    const barraca = $("#rBarraca").value.trim(), categoria = $("#rCat").value, descricao = $("#rDesc").value.trim();
    if (nome.split(" ").length < 2 || nome.length < 5) return show("Escreva seu nome completo (nome e sobrenome).", $("#rNome"));
    if (tel.length < 10 || tel.length > 11) return show("O WhatsApp precisa ter DDD e número, por exemplo (31) 98765-4321.", $("#rTel"));
    if (!cpfValido(cpf)) return show("Esse CPF não é válido. Confira os números.", $("#rCpf"));
    if (barraca.length < 2) return show("Escreva o nome da barraca ou do seu negócio.", $("#rBarraca"));
    if (!categoria) return show("Escolha a categoria da barraca.", $("#rCat"));
    if (!$("#rOk").checked) return show("Marque a autorização para podermos entrar em contato.", $("#rOk"));
    busy($("#cadBtn"), "Enviando…", async () => {
      try {
        await B.sendRequest({ nome, telefone: tel, cpf, barraca, categoria, descricao });
        $("#cadOkTel").textContent = fmtPhone(tel);
        $("#cadBox").hidden = true; $("#cadOk").hidden = false; window.scrollTo(0, 0);
      } catch (ex) { show(ex.message); }
    });
  });

  /* ============ PAINEL: solicitações de novos feirantes ============ */
  const ST = { nova: "Nova", contatada: "Contatada", aprovada: "Aprovada", recusada: "Recusada" };
  let reqs = [], reqConfirm = null;
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); };
  const reqMsg = (ok, txt) => { const a = $(ok ? "#reqOk" : "#reqErr"), b = $(ok ? "#reqErr" : "#reqOk"); b.hidden = true; a.textContent = txt; a.hidden = !txt; clearTimeout(a._t); if (ok) a._t = setTimeout(() => a.hidden = true, 3500); };
  const visibleReqs = () => { const f = $("#reqFilter").value; return f ? reqs.filter(r => r.status === f) : reqs; };
  async function loadRequests() {
    $("#reqList").innerHTML = `<p class="note">Carregando…</p>`;
    try { reqs = await B.listRequests(); $("#reqErr").hidden = true; }
    catch (ex) { reqs = []; reqMsg(false, ex.message); }
    renderRequests();
  }
  function renderRequests() {
    const novas = reqs.filter(r => r.status === "nova").length;
    $("#reqCount").textContent = reqs.length ? `${reqs.length} pedido(s) · ${novas} nova(s)` : "Nenhum pedido ainda";
    const list = visibleReqs();
    $("#reqList").innerHTML = list.length ? list.map(r => `<div class="a-row req">
      <span class="t"><b>${esc(r.nome)}<span class="pill-st ${esc(r.status)}">${ST[r.status] || esc(r.status)}</span></b>
        <small>${esc(r.barraca)} · ${esc(r.categoria)}${r.descricao ? " · " + esc(r.descricao) : ""}</small>
        <small>WhatsApp <a href="${waLink(r.telefone, "Olá, " + r.nome.split(" ")[0] + "! Aqui é da organização da " + cfg.name + ". Recebemos seu pedido para ter uma barraca na feira.")}" target="_blank" rel="noopener">${esc(fmtPhone(r.telefone))}</a> · CPF ${esc(fmtCpf(r.cpf))} · ${esc(fmtDate(r.created_at))}</small></span>
      ${same(reqConfirm, r.id) ? `<span class="confirm">Apagar pedido? <button class="btn danger sm" data-rdel="${esc(r.id)}">Apagar</button><button class="btn ghost sm" data-rno="1">Cancelar</button></span>`
        : `<span class="actions"><select class="st" data-rst="${esc(r.id)}" aria-label="Situação do pedido">${Object.entries(ST).map(([k, v]) => `<option value="${k}" ${k === r.status ? "selected" : ""}>${v}</option>`).join("")}</select><button class="btn ghost sm" data-rpdf="${esc(r.id)}">Ficha PDF</button><button class="btn ghost sm" data-rask="${esc(r.id)}">Apagar</button></span>`}
    </div>`).join("") : `<p class="empty">${reqs.length ? "Nenhum pedido com essa situação." : "Quando alguém enviar o formulário “Quero ser feirante”, o pedido aparece aqui."}</p>`;
  }
  $("#reqFilter").addEventListener("change", renderRequests);
  $("#reqList").addEventListener("change", async e => {
    const id = e.target.dataset.rst; if (!id) return;
    try { await B.setRequestStatus(id, e.target.value); const r = reqs.find(x => same(x.id, id)); if (r) r.status = e.target.value; renderRequests(); reqMsg(true, "Situação atualizada."); }
    catch (ex) { reqMsg(false, ex.message); renderRequests(); }
  });
  $("#reqList").addEventListener("click", async e => {
    const d = e.target.dataset;
    if (d.rask) { reqConfirm = d.rask; renderRequests(); }
    else if (d.rno) { reqConfirm = null; renderRequests(); }
    else if (d.rdel) {
      try { await B.deleteRequest(d.rdel); reqs = reqs.filter(x => !same(x.id, d.rdel)); reqConfirm = null; renderRequests(); reqMsg(true, "Pedido apagado."); }
      catch (ex) { reqMsg(false, ex.message); }
    }
    else if (d.rpdf) { const r = reqs.find(x => same(x.id, d.rpdf)); if (r) pdfFicha(r).catch(ex => reqMsg(false, ex.message)); }
  });
  $("#reqPdf").onclick = () => {
    const list = visibleReqs();
    if (!list.length) { reqMsg(false, "Não há pedidos para colocar no PDF."); return; }
    pdfLista(list).catch(ex => reqMsg(false, ex.message));
  };

  /* PDF: a biblioteca só carrega quando o admin pede o arquivo */
  const loadScript = src => new Promise((ok, no) => { const sc = document.createElement("script"); sc.src = src; sc.onload = ok; sc.onerror = () => no(new Error("Não foi possível carregar o gerador de PDF. Confira a internet e tente de novo.")); document.head.appendChild(sc); });
  let pdfLib = null;
  async function getPdf() {
    if (!pdfLib) pdfLib = (async () => {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
      return window.jspdf.jsPDF;
    })().catch(e => { pdfLib = null; throw e; });
    return pdfLib;
  }
  const hoje = () => new Date().toLocaleDateString("pt-BR");
  const hojeArq = () => new Date().toISOString().slice(0, 10);
  const BRAND_RGB = [46, 107, 69];
  function pdfHeader(doc, title, sub) {
    const w = doc.internal.pageSize.getWidth();
    doc.setFillColor(...BRAND_RGB); doc.rect(0, 0, w, 22, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(cfg.name.toUpperCase(), 14, 14);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.text(`Gerado em ${hoje()}`, w - 14, 14, { align: "right" });
    doc.setTextColor(34, 41, 31); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(title, 14, 34);
    if (sub) { doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(105, 112, 95); doc.text(sub, 14, 41); }
  }
  function pdfFooter(doc) {
    const n = doc.getNumberOfPages(), w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140);
      doc.text("Documento interno · contém dados pessoais (LGPD). Não compartilhe fora da organização.", 14, h - 8);
      doc.text(`Página ${i} de ${n}`, w - 14, h - 8, { align: "right" });
    }
  }
  async function pdfLista(list) {
    const JsPDF = await getPdf();
    const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const f = $("#reqFilter").value;
    pdfHeader(doc, "Solicitações de novos feirantes", `${list.length} pedido(s)${f ? " · situação: " + ST[f] : ""}`);
    doc.autoTable({
      startY: 47,
      head: [["Data", "Nome completo", "WhatsApp", "CPF", "Barraca", "Categoria", "O que vai vender", "Situação"]],
      body: list.map(r => [fmtDate(r.created_at), r.nome, fmtPhone(r.telefone), fmtCpf(r.cpf), r.barraca, r.categoria, r.descricao || "", ST[r.status] || r.status]),
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2.2, valign: "middle", textColor: [34, 41, 31] },
      headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 240] },
      columnStyles: { 0: { cellWidth: 26 }, 2: { cellWidth: 30 }, 3: { cellWidth: 28 }, 7: { cellWidth: 22 } },
      margin: { left: 14, right: 14, bottom: 16 }
    });
    pdfFooter(doc);
    doc.save(`solicitacoes-feirantes-${hojeArq()}.pdf`);
    reqMsg(true, "PDF gerado.");
  }
  async function pdfFicha(r) {
    const JsPDF = await getPdf();
    const doc = new JsPDF({ unit: "mm", format: "a4" });
    pdfHeader(doc, "Ficha de solicitação de feirante", `Pedido recebido em ${fmtDate(r.created_at)}`);
    doc.autoTable({
      startY: 48, theme: "grid",
      body: [["Nome completo", r.nome], ["WhatsApp", fmtPhone(r.telefone)], ["CPF", fmtCpf(r.cpf)], ["Nome da barraca", r.barraca], ["Categoria", r.categoria], ["O que vai vender", r.descricao || "—"], ["Situação", ST[r.status] || r.status]],
      styles: { font: "helvetica", fontSize: 11, cellPadding: 4, textColor: [34, 41, 31] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 52, fillColor: [226, 238, 229] } },
      margin: { left: 14, right: 14 }
    });
    const y = doc.lastAutoTable.finalY + 22;
    doc.setDrawColor(150); doc.line(14, y, 100, y); doc.line(112, y, 196, y);
    doc.setFontSize(9); doc.setTextColor(105, 112, 95); doc.text("Assinatura do(a) solicitante", 14, y + 5); doc.text("Organização da feira", 112, y + 5);
    pdfFooter(doc);
    doc.save(`ficha-${r.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${hojeArq()}.pdf`);
  }

  /* ---------- início ---------- */
  function setupMode() {
    const demo = B.mode === "demo";
    $("#adminDemoNote").hidden = !demo;
    /* no Supabase o campo continua "Usuário": aceita o usuário ou o e-mail completo */
  }
  async function boot() {
    setupMode();
    /* /mapa, /barracas e ?mapa=1 abrem a tela correspondente */
    if (!location.hash) {
      const p = location.pathname.replace(/\/+$/, "");
      if (p === "/mapa" || new URLSearchParams(location.search).get("mapa") === "1") history.replaceState(null, "", "/#mapa");
      else if (p === "/barracas") history.replaceState(null, "", "/#barracas");
    }
    try { await B.init(); await refresh(); }
    catch (err) {
      console.error(err);
      $("#cards").innerHTML = `<p class="empty">Não foi possível carregar as barracas agora. Tente de novo em instantes.</p>`;
    }
    route();
  }
  boot();
})();
