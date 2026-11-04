/* Camada de dados da Feira Alterosa.
   window.FeiraBackend expõe a mesma interface em dois modos:
   - "supabase": banco real (Postgres + Auth + Storage), quando js/config.js está preenchido;
   - "demo": tudo no navegador (localStorage), exatamente como o feira-modelo.html. */
(function () {
  "use strict";
  const C = window.FEIRA_CONFIG || {};

  const CATS = {"Hortifruti":"#3c7d3a","Comidas":"#a8523a","Laticínios":"#b0861a","Flores":"#a24a6c","Peixes":"#2f6a8f","Temperos":"#87552a","Artesanato":"#6a5a96","Bebidas":"#2a7d73","Doces":"#b35f78","Padaria":"#946032"};
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
  const digits = s => String(s ?? "").replace(/\D/g, "");

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
    const w = Math.min(maxW, im.naturalWidth || im.width);
    const h = Math.round((im.naturalHeight || im.height) * w / (im.naturalWidth || im.width));
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
     MODO DEMONSTRAÇÃO (localStorage) — mesmo comportamento do modelo
     ===================================================================== */
  function DemoBackend() {
    const K_ST = "feira-barracas-v5", K_CFG = "feira-config-v3";
    const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
    const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
    const ss = {
      get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
      set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
      del: k => { try { sessionStorage.removeItem(k); } catch (e) {} }
    };
    let raw = load(K_ST, null);
    if (!Array.isArray(raw)) raw = SEED.map(s => ({ ...s }));
    raw.forEach(s => { if (!s.pin) s.pin = "1234"; if (!s.photos) s.photos = Array.from({ length: 10 }, (_, i) => "demo:" + (s.id * 10 + i)); });
    let cfg = Object.assign({ ...DEFAULT_CFG }, load(K_CFG, {}));
    let admin = ss.get("feira-admin") === "1";
    let seller = +ss.get("feira-vendedor") || null;
    const save = () => store(K_ST, raw);
    const find = id => raw.find(s => String(s.id) === String(id));
    const view = s => ({
      id: s.id, num: s.num, name: s.name, owner: s.owner, cat: s.cat, wa: s.wa, ig: s.ig || "", desc: s.desc || "",
      logo: s.logo || null, img: s.img || null, pin: s.pin,
      photos: (s.photos || []).map((p, i) => ({ id: i, url: photoSrc(p) }))
    });

    return {
      mode: "demo", minPin: 4,
      async init() {},
      async load() { return { cfg: { ...cfg, imgs: [...(cfg.imgs || [])] }, stalls: raw.map(view) }; },
      isAdmin: () => admin,
      sellerStallId: () => seller,
      async adminLogin(user, pw) {
        if (user.trim() === "admin" && pw === "feira123") { admin = true; ss.set("feira-admin", "1"); return true; }
        return false;
      },
      async adminLogout() { admin = false; ss.del("feira-admin"); },
      async sellerLogin(wa, pw) {
        const s = raw.find(x => digits(x.wa) === digits(wa) && x.pin === pw.trim());
        if (!s) return null;
        seller = s.id; ss.set("feira-vendedor", String(s.id));
        return s.id;
      },
      async sellerLogout() { seller = null; ss.del("feira-vendedor"); },
      async saveCfg(data, covers) {
        cfg.name = data.name || cfg.name; cfg.city = data.city; cfg.wa = data.wa; cfg.tag = data.tag;
        if (covers) cfg.imgs = await Promise.all(covers.map(blobToDataURL));
        if (!store(K_CFG, cfg)) throw new Error("O navegador ficou sem espaço para guardar as fotos da capa.");
      },
      async saveStall(editId, d, imgs, pin) {
        const data = { num: d.num, name: d.name, owner: d.owner, cat: d.cat, wa: d.wa, ig: d.ig, desc: d.desc };
        if (pin) data.pin = pin;
        if (imgs.logo !== undefined) data.logo = imgs.logo ? await blobToDataURL(imgs.logo) : null;
        if (imgs.ban !== undefined) data.img = imgs.ban ? await blobToDataURL(imgs.ban) : null;
        if (editId != null) Object.assign(find(editId), data);
        else raw.push({ id: Date.now(), photos: [], logo: null, img: null, ...data });
        save();
      },
      async deleteStall(id) { raw = raw.filter(x => String(x.id) !== String(id)); save(); },
      async addPhotos(stallId, blobs) {
        const s = find(stallId);
        const urls = await Promise.all(blobs.map(blobToDataURL));
        s.photos.push(...urls.slice(0, 10 - s.photos.length));
        return save();
      },
      async removePhoto(stallId, i) { find(stallId).photos.splice(i, 1); save(); },
      async movePhoto(stallId, i, j) { const ph = find(stallId).photos; [ph[i], ph[j]] = [ph[j], ph[i]]; save(); },
      async saveSellerInfo(stallId, desc, ig) { const s = find(stallId); s.desc = desc; s.ig = ig; save(); }
    };
  }

  /* =====================================================================
     MODO SUPABASE — Postgres + Auth + Storage (bucket "feira")
     ===================================================================== */
  function SupaBackend() {
    const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    const BUCKET = "feira";
    const DOM = C.EMAIL_FEIRANTE_DOMINIO || "feirante.feiraalterosa.app";
    const emailFeirante = wa => `55${digits(wa)}@${DOM}`;
    const pubUrl = p => p ? sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl : null;
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    let role = null, myStall = null;
    const cache = { stalls: [], coverPaths: [] };

    async function resolveRole() {
      role = null; myStall = null;
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const id = session.user.id;
      const { data: a } = await sb.from("admins").select("user_id").eq("user_id", id).maybeSingle();
      if (a) { role = "admin"; return; }
      const { data: b } = await sb.from("barracas").select("id").eq("user_id", id).maybeSingle();
      if (b) { role = "feirante"; myStall = b.id; }
    }
    async function signOut() { await sb.auth.signOut(); role = null; myStall = null; }
    async function upload(path, blob) {
      const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", cacheControl: "31536000", upsert: false });
      if (error) throw new Error("Não foi possível enviar a imagem: " + error.message);
      return path;
    }
    async function removeFiles(paths) {
      paths = (paths || []).filter(Boolean);
      if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    }
    /* operações que mexem em contas de login rodam no servidor (api/barracas.js, com a service_role) */
    async function api(method, body, query = "") {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) throw new Error("Sua sessão expirou. Entre de novo.");
      const r = await fetch("/api/barracas" + query, {
        method,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: body ? JSON.stringify(body) : undefined
      });
      let j = {};
      try { j = await r.json(); } catch (_) {}
      if (!r.ok) throw new Error(j.error || "Não foi possível salvar agora. Tente de novo.");
      return j;
    }
    const stallById = id => cache.stalls.find(s => String(s.id) === String(id));
    const throwIf = (error, msg) => { if (error) throw new Error(msg || error.message); };

    return {
      mode: "supabase", minPin: 6,
      async init() { await resolveRole(); },
      async load() {
        const [c, b, f] = await Promise.all([
          sb.from("feira_config").select("*").eq("id", 1).maybeSingle(),
          sb.from("barracas_publicas").select("*"),
          sb.from("barraca_fotos").select("id,barraca_id,path,ordem").order("ordem")
        ]);
        throwIf(c.error); throwIf(b.error); throwIf(f.error);
        const conf = c.data || {};
        cache.coverPaths = conf.fotos_capa || [];
        const cfg = {
          name: conf.nome || DEFAULT_CFG.name, city: conf.cidade || "", wa: conf.whatsapp || "",
          tag: conf.frase_capa || "", imgs: cache.coverPaths.map(pubUrl)
        };
        const fotos = {};
        (f.data || []).forEach(x => (fotos[x.barraca_id] = fotos[x.barraca_id] || []).push({ id: x.id, path: x.path, ordem: x.ordem, url: pubUrl(x.path) }));
        cache.stalls = (b.data || []).map(r => ({
          id: r.id, num: r.numero, name: r.nome, owner: r.proprietario, cat: r.categoria, wa: r.whatsapp,
          ig: r.instagram || "", desc: r.descricao || "",
          logo: pubUrl(r.logo_path), img: pubUrl(r.banner_path), logoPath: r.logo_path, banPath: r.banner_path,
          photos: fotos[r.id] || []
        }));
        return { cfg, stalls: cache.stalls };
      },
      isAdmin: () => role === "admin",
      sellerStallId: () => myStall,
      async adminLogin(email, pw) {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pw });
        if (error) return false;
        await resolveRole();
        if (role !== "admin") { await signOut(); return false; }
        return true;
      },
      adminLogout: signOut,
      async sellerLogin(wa, pw) {
        const { error } = await sb.auth.signInWithPassword({ email: emailFeirante(wa), password: pw.trim() });
        if (error) return null;
        await resolveRole();
        if (role !== "feirante") { await signOut(); return null; }
        return myStall;
      },
      sellerLogout: signOut,
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
        if (error) { if (covers) await removeFiles(paths); throw new Error("Não foi possível salvar os dados da feira: " + error.message); }
        if (covers) await removeFiles(old);
      },
      async saveStall(editId, d, imgs, pin) {
        const body = { numero: d.num, nome: d.name, proprietario: d.owner, categoria: d.cat, whatsapp: d.wa, instagram: d.ig, descricao: d.desc };
        if (pin) body.senha = pin;
        let id = editId;
        if (editId != null) await api("PATCH", { id: editId, ...body });
        else id = (await api("POST", body)).id;
        const prev = stallById(id) || {};
        const upd = {}, toRemove = [];
        for (const [key, col, prevPath, folder] of [["logo", "logo_path", prev.logoPath, "logo"], ["ban", "banner_path", prev.banPath, "banner"]]) {
          const v = imgs[key];
          if (v === undefined) continue;
          upd[col] = v ? await upload(`barracas/${id}/${folder}/${uid()}.jpg`, v) : null;
          if (prevPath) toRemove.push(prevPath);
        }
        if (Object.keys(upd).length) {
          const { error } = await sb.from("barracas").update(upd).eq("id", id);
          throwIf(error, "A barraca foi salva, mas as imagens não: " + (error && error.message));
          await removeFiles(toRemove);
        }
      },
      async deleteStall(id) { await api("DELETE", null, "?id=" + encodeURIComponent(id)); },
      async addPhotos(stallId, blobs) {
        const s = stallById(stallId);
        let ordem = s.photos.length;
        const rows = [];
        try {
          for (const bl of blobs) rows.push({ barraca_id: stallId, path: await upload(`barracas/${stallId}/fotos/${uid()}.jpg`, bl), ordem: ordem++ });
          const { error } = await sb.from("barraca_fotos").insert(rows);
          if (error) throw new Error(/10/.test(error.message) ? "Só cabem 10 fotos por barraca." : "Não foi possível salvar as fotos: " + error.message);
        } catch (e) { await removeFiles(rows.map(r => r.path)); throw e; }
        return true;
      },
      async removePhoto(stallId, i) {
        const s = stallById(stallId), p = s.photos[i];
        const { error } = await sb.from("barraca_fotos").delete().eq("id", p.id);
        throwIf(error, "Não foi possível remover a foto: " + (error && error.message));
        await removeFiles([p.path]);
        const rest = s.photos.filter((_, k) => k !== i);
        for (let k = i; k < rest.length; k++) await sb.from("barraca_fotos").update({ ordem: k }).eq("id", rest[k].id);
      },
      async movePhoto(stallId, i, j) {
        const ph = stallById(stallId).photos;
        const r1 = await sb.from("barraca_fotos").update({ ordem: j }).eq("id", ph[i].id);
        const r2 = await sb.from("barraca_fotos").update({ ordem: i }).eq("id", ph[j].id);
        throwIf(r1.error || r2.error, "Não foi possível mudar a ordem.");
      },
      async saveSellerInfo(stallId, desc, ig) {
        const { error } = await sb.rpc("atualizar_minha_barraca", { p_descricao: desc, p_instagram: ig });
        throwIf(error, "Não foi possível salvar: " + (error && error.message));
      }
    };
  }

  const useSupabase = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase);
  window.FEIRA_CATS = CATS;
  window.FeiraImg = { compress };
  window.FeiraBackend = useSupabase ? SupaBackend() : DemoBackend();
})();
