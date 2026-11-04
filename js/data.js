/* Camada de dados da Feira Alterosa.
   window.FeiraBackend expõe a mesma interface em dois modos:
   - "supabase": banco real (Postgres + Auth + Storage), quando js/config.js está preenchido;
   - "demo": tudo no navegador (localStorage), como o feira-modelo.html.
   Cada barraca tem: 1 logo, até 5 imagens de banner ("banners") e até 10 fotos de produtos ("fotos"). */
(function () {
  "use strict";
  const C = window.FEIRA_CONFIG || {};

  const CATS = {"Hortifruti":"#3c7d3a","Comidas":"#a8523a","Laticínios":"#b0861a","Flores":"#a24a6c","Peixes":"#2f6a8f","Temperos":"#87552a","Artesanato":"#6a5a96","Bebidas":"#2a7d73","Doces":"#b35f78","Padaria":"#946032"};
  const LIMITS = { fotos: 10, banners: 5 };
  const SEED = [
    {id:1,num:12,name:"Hortifruti da Maria",owner:"Maria Aparecida",cat:"Hortifruti",wa:"31987654321",ig:"hortifrutidamaria",desc:"Verduras colhidas no sábado, frutas da estação e cheiro-verde."},
    {id:2,num:3,name:"Pastel do Seu João",owner:"João Batista",cat:"Comidas",wa:"31991234567",ig:"pasteldoseujoao",desc:"Pastel na hora: carne, queijo, palmito e o especial de bacalhau."},
    {id:3,num:7,name:"Queijos Serra Azul",owner:"Rosângela Lima",cat:"Laticínios",wa:"31975551234",ig:"queijosserraazul",desc:"Queijo minas, canastra curado, requeijão de corte e manteiga."},
    {id:4,num:18,name:"Flores da Dona Lúcia",owner:"Lúcia Ferreira",cat:"Flores",wa:"31964443322",ig:"floresdadonalucia",desc:"Buquês, vasos de orquídea e mudas para horta."},
    {id:5,num:21,name:"Peixaria Mar Aberto",owner:"Carlos Nunes",cat:"Peixes",wa:"31958887766",ig:"peixariamaraberto",desc:"Sardinha, tilápia, camarão limpo e filé de pescada."},
    {id:6,num:26,name:"Temperos & Cia",owner:"Fátima Souza",cat:"Temperos",wa:"31943332211",ig:"temperosecia",desc:"Ervas secas, pimentas, castanhas e grãos a granel."},
    {id:7,num:30,name:"Mãos de Barro",owner:"Ana Clara Rocha",cat:"Artesanato",wa:"31932221100",ig:"maosdebarro",desc:"Cerâmica feita à mão: canecas, travessas e vasinhos."},
    {id:8,num:1,name:"Caldo de Cana do Zé",owner:"José Ribeiro",cat:"Bebidas",wa:"31921110099",ig:"caldodecanadoze",desc:"Caldo de cana com limão ou abacaxi, gelado na hora."},
    {id:9,num:15,name:"Frutas do Kenji",owner:"Kenji Tanaka",cat:"Hortifruti",wa:"31919998877",ig:"frutasdokenji",desc:"Caqui, morango, uva e banana direto do sítio."},
    {id:10,num:34,name:"Doces da Vó Nena",owner:"Antônia Silva",cat:"Doces",wa:"31908887766",ig:"docesdavonena",desc:"Doce de leite, goiabada cascão, cocada e pé de moleque."},
    {id:11,num:40,name:"Pães da Fazenda",owner:"Roberto Alves",cat:"Padaria",wa:"31997776655",ig:"paesdafazenda",desc:"Pão de fermentação natural, broa de milho e rosca."},
    {id:12,num:44,name:"Ovos Sítio Bom Sucesso",owner:"Marcos Pereira",cat:"Hortifruti",wa:"31986665544",ig:"sitiobomsucesso",desc:"Ovos caipiras, mel e mandioca descascada."}
  ];
  const DEFAULT_CFG = {name:"Feira Alterosa",city:"Betim",wa:"31999990000",tag:"Todo domingo, das 7h às 13h, em Betim.",imgs:[]};
  const sortStalls = list => list.sort((a, b) => a.num - b.num);

  /* ---------- imagens: compressão no navegador antes do envio ---------- */
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler essa imagem.")); };
      im.src = url;
    });
  }
  /* largura máxima maxW, JPEG qualidade 0,8 (~200 KB para 1000px) */
  async function compress(file, maxW, quality = 0.8) {
    const im = await loadImage(file);
    const W = im.naturalWidth || im.width, H = im.naturalHeight || im.height;
    const w = Math.min(maxW, W), h = Math.round(H * w / W);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(im, 0, 0, w, h);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", quality));
    if (!blob) throw new Error("Não foi possível preparar essa imagem.");
    return blob;
  }
  const blobToDataURL = blob => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  /* fotos ilustrativas do modo demonstração (mesma arte do modelo) */
  function produceArt(seed) {
    const sets=[["#3c7d3a","#d33b2c","#f0a52b","#7cb342"],["#a8523a","#f2c14e","#e98a2c","#fff1c9"],["#b0861a","#fff4d6","#f3d27a","#e9c46a"],["#2f6a8f","#d9534f","#f0a52b","#5cb85c"],["#6a3b7a","#d33b2c","#f6c64a","#4f9a3a"]];
    const c=sets[seed%sets.length];let dots="";let r=seed*97+13;const rnd=()=>{r=(r*9301+49297)%233280;return r/233280};
    for(let i=0;i<70;i++){dots+=`<circle cx="${(rnd()*820).toFixed(0)}" cy="${(rnd()*640).toFixed(0)}" r="${(28+rnd()*30).toFixed(0)}" fill="${c[1+Math.floor(rnd()*3)]}" stroke="rgba(0,0,0,.12)" stroke-width="3"/>`}
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${c[0]}"/>${dots}<rect x="0" y="520" width="800" height="80" fill="#7a4d2e"/><rect x="0" y="512" width="800" height="12" fill="#956140"/></svg>`);
  }
  const photoSrc = p => String(p).startsWith("demo:") ? produceArt(+String(p).slice(5)) : p;

  /* =====================================================================
     MODO DEMONSTRAÇÃO (localStorage)
     ===================================================================== */
  function DemoBackend() {
    const K_ST = "feira-barracas-v6", K_CFG = "feira-config-v3";
    const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
    const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
    const ss = {
      get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
      set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
      del: k => { try { sessionStorage.removeItem(k); } catch (e) {} }
    };
    let raw = load(K_ST, null);
    if (!Array.isArray(raw)) raw = SEED.map(s => ({ ...s, logo: null, banners: [], fotos: Array.from({ length: 10 }, (_, i) => "demo:" + (s.id * 10 + i)) }));
    raw.forEach(s => { s.banners = s.banners || []; s.fotos = s.fotos || []; });
    let cfg = Object.assign({ ...DEFAULT_CFG }, load(K_CFG, {}));
    let admin = ss.get("feira-admin") === "1";
    const save = () => store(K_ST, raw);
    const find = id => raw.find(s => String(s.id) === String(id));
    const imgs = list => list.map((p, i) => ({ id: i, url: photoSrc(p) }));
    const view = s => {
      const banners = imgs(s.banners);
      return {
        id: s.id, num: s.num, name: s.name, owner: s.owner, cat: s.cat, wa: s.wa, ig: s.ig || "", desc: s.desc || "",
        logo: s.logo || null, banners, img: banners[0] ? banners[0].url : null, photos: imgs(s.fotos)
      };
    };

    return {
      mode: "demo",
      async init() {},
      async load() { return { cfg: { ...cfg, imgs: [...(cfg.imgs || [])] }, stalls: sortStalls(raw.map(view)) }; },
      isAdmin: () => admin,
      async adminLogin(user, pw) {
        if (user.trim() === "admin" && pw === "feira123") { admin = true; ss.set("feira-admin", "1"); return true; }
        return false;
      },
      async adminLogout() { admin = false; ss.del("feira-admin"); },
      async saveCfg(data, covers) {
        cfg.name = data.name || cfg.name; cfg.city = data.city; cfg.wa = data.wa; cfg.tag = data.tag;
        if (covers) cfg.imgs = await Promise.all(covers.map(blobToDataURL));
        if (!store(K_CFG, cfg)) throw new Error("O navegador ficou sem espaço para guardar as fotos da capa.");
      },
      async saveStall(editId, d, logo) {
        const data = { num: d.num, name: d.name, owner: d.owner, cat: d.cat, wa: d.wa, ig: d.ig, desc: d.desc };
        if (logo !== undefined) data.logo = logo ? await blobToDataURL(logo) : null;
        let id = editId;
        if (editId != null) Object.assign(find(editId), data);
        else { id = Date.now(); raw.push({ id, fotos: [], banners: [], logo: null, ...data }); }
        save();
        return id;
      },
      async deleteStall(id) { raw = raw.filter(x => String(x.id) !== String(id)); save(); },
      async addImages(stallId, kind, blobs) {
        const list = find(stallId)[kind];
        const urls = await Promise.all(blobs.map(blobToDataURL));
        list.push(...urls.slice(0, LIMITS[kind] - list.length));
        return save();
      },
      async removeImage(stallId, kind, i) { find(stallId)[kind].splice(i, 1); save(); },
      async moveImage(stallId, kind, i, j) { const l = find(stallId)[kind]; [l[i], l[j]] = [l[j], l[i]]; save(); }
    };
  }

  /* =====================================================================
     MODO SUPABASE — Postgres + Auth + Storage (bucket "feira")
     Todas as escritas são feitas pelo admin logado; as regras RLS garantem isso.
     ===================================================================== */
  function SupaBackend() {
    const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    const BUCKET = "feira";
    const TABLE = { fotos: "barraca_fotos", banners: "barraca_banners" };
    const pubUrl = p => p ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : null;
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const code = n => String(n).padStart(2, "0") + "-777";
    let admin = false;
    const cache = { stalls: [], coverPaths: [] };
    const stallById = id => cache.stalls.find(s => String(s.id) === String(id));
    const fail = msg => { throw new Error(msg); };

    async function checkAdmin() {
      admin = false;
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const { data } = await sb.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
      admin = !!data;
    }
    async function upload(path, blob) {
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000", upsert: false });
      if (error) fail("Não foi possível enviar a imagem: " + error.message);
      return path;
    }
    async function removeFiles(paths) {
      paths = (paths || []).filter(Boolean);
      if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    }
    async function listFiles(folder) {
      const { data } = await sb.storage.from(BUCKET).list(folder, { limit: 1000 });
      let out = [];
      for (const item of data || []) {
        const p = `${folder}/${item.name}`;
        if (item.id) out.push(p); else out = out.concat(await listFiles(p));
      }
      return out;
    }
    const friendly = (error, num) => {
      if (error.code === "23505") return `A barraca ${code(num)} já está ocupada. Escolha outro número.`;
      if (error.code === "42501" || /row-level security/i.test(error.message)) return "Sua sessão de administrador expirou. Saia e entre de novo.";
      return "Não foi possível salvar: " + error.message;
    };

    return {
      mode: "supabase",
      async init() { await checkAdmin(); },
      async load() {
        const [c, b, f, bn] = await Promise.all([
          sb.from("feira_config").select("*").eq("id", 1).maybeSingle(),
          sb.from("barracas_publicas").select("*"),
          sb.from("barraca_fotos").select("id,barraca_id,path,ordem").order("ordem"),
          sb.from("barraca_banners").select("id,barraca_id,path,ordem").order("ordem")
        ]);
        for (const r of [c, b, f, bn]) if (r.error) throw r.error;
        const conf = c.data || {};
        cache.coverPaths = conf.fotos_capa || [];
        const cfg = {
          name: conf.nome || DEFAULT_CFG.name, city: conf.cidade || "", wa: conf.whatsapp || "",
          tag: conf.frase_capa || "", imgs: cache.coverPaths.map(pubUrl)
        };
        const group = rows => {
          const out = {};
          (rows || []).forEach(x => (out[x.barraca_id] = out[x.barraca_id] || []).push({ id: x.id, path: x.path, url: pubUrl(x.path) }));
          return out;
        };
        const fotos = group(f.data), banners = group(bn.data);
        cache.stalls = sortStalls((b.data || []).map(r => {
          const bl = banners[r.id] || [];
          return {
            id: r.id, num: r.numero, name: r.nome, owner: r.proprietario, cat: r.categoria, wa: r.whatsapp,
            ig: r.instagram || "", desc: r.descricao || "",
            logo: pubUrl(r.logo_path), logoPath: r.logo_path,
            banners: bl, img: bl[0] ? bl[0].url : null, photos: fotos[r.id] || []
          };
        }));
        return { cfg, stalls: cache.stalls };
      },
      isAdmin: () => admin,
      /* aceita o usuário ("adminfeiraalteraso") ou o e-mail completo */
      async adminLogin(user, pw) {
        let email = user.trim().toLowerCase();
        if (!email.includes("@")) email += "@" + (C.ADMIN_EMAIL_DOMINIO || "feiraalterosa.app");
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) return false;
        await checkAdmin();
        if (!admin) { await sb.auth.signOut(); return false; }
        return true;
      },
      async adminLogout() { await sb.auth.signOut(); admin = false; },
      async saveCfg(data, covers) {
        const old = cache.coverPaths;
        let paths = old;
        if (covers) {
          paths = [];
          for (let i = 0; i < covers.length; i++) paths.push(await upload(`capa/${uid()}-${i + 1}.jpg`, covers[i]));
        }
        const { error } = await sb.from("feira_config").upsert({
          id: 1, nome: data.name, cidade: data.city || null, whatsapp: data.wa || null, frase_capa: data.tag || null, fotos_capa: paths
        });
        if (error) { if (covers) await removeFiles(paths); fail(friendly(error)); }
        if (covers) await removeFiles(old);
      },
      async saveStall(editId, d, logo) {
        const row = {
          numero: d.num, nome: d.name, proprietario: d.owner, categoria: d.cat, whatsapp: d.wa,
          instagram: d.ig || null, descricao: (d.desc || "").slice(0, 180) || null
        };
        let id = editId;
        if (editId != null) {
          const { error } = await sb.from("barracas").update(row).eq("id", editId);
          if (error) fail(friendly(error, d.num));
        } else {
          const { data, error } = await sb.from("barracas").insert(row).select("id").single();
          if (error) fail(friendly(error, d.num));
          id = data.id;
        }
        if (logo !== undefined) {
          const prev = (stallById(id) || {}).logoPath;
          const path = logo ? await upload(`barracas/${id}/logo/${uid()}.jpg`, logo) : null;
          const { error } = await sb.from("barracas").update({ logo_path: path }).eq("id", id);
          if (error) fail("A barraca foi salva, mas a logo não: " + error.message);
          if (prev) await removeFiles([prev]);
        }
        return id;
      },
      async deleteStall(id) {
        const files = await listFiles(`barracas/${id}`);
        const { error } = await sb.from("barracas").delete().eq("id", id); /* fotos e banners saem em cascata */
        if (error) fail(friendly(error));
        await removeFiles(files);
      },
      async addImages(stallId, kind, blobs) {
        const list = stallById(stallId)[kind === "fotos" ? "photos" : "banners"];
        let ordem = list.length;
        const rows = [];
        try {
          for (const bl of blobs) rows.push({ barraca_id: stallId, path: await upload(`barracas/${stallId}/${kind}/${uid()}.jpg`, bl), ordem: ordem++ });
          const { error } = await sb.from(TABLE[kind]).insert(rows);
          if (error) fail(/Limite/.test(error.message) ? `Só cabem ${LIMITS[kind]} imagens aqui.` : friendly(error));
        } catch (e) { await removeFiles(rows.map(r => r.path)); throw e; }
        return true;
      },
      async removeImage(stallId, kind, i) {
        const list = stallById(stallId)[kind === "fotos" ? "photos" : "banners"], p = list[i];
        const { error } = await sb.from(TABLE[kind]).delete().eq("id", p.id);
        if (error) fail(friendly(error));
        await removeFiles([p.path]);
        const rest = list.filter((_, k) => k !== i);
        for (let k = i; k < rest.length; k++) await sb.from(TABLE[kind]).update({ ordem: k }).eq("id", rest[k].id);
      },
      async moveImage(stallId, kind, i, j) {
        const list = stallById(stallId)[kind === "fotos" ? "photos" : "banners"];
        const r1 = await sb.from(TABLE[kind]).update({ ordem: j }).eq("id", list[i].id);
        const r2 = await sb.from(TABLE[kind]).update({ ordem: i }).eq("id", list[j].id);
        if (r1.error || r2.error) fail("Não foi possível mudar a ordem.");
      }
    };
  }

  const useSupabase = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  window.FEIRA_CATS = CATS;
  window.FEIRA_LIMITS = LIMITS;
  window.FeiraImg = { compress };
  window.FeiraBackend = useSupabase ? SupaBackend() : DemoBackend();
})();
