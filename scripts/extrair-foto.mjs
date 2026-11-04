// Extrai a foto padrão da capa (FOTO_FEIRA, embutida em base64 no modelo) para assets/capa-feira.jpg.
//   node scripts/extrair-foto.mjs [caminho/do/feira-modelo.html]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = process.argv[2] || "feira-modelo.html";
const html = readFileSync(src, "utf8");
const m = html.match(/FOTO_FEIRA\s*=\s*"data:image\/jpeg;base64,([^"]+)"/);
if (!m) { console.error("Não achei FOTO_FEIRA em " + src); process.exit(1); }
mkdirSync("assets", { recursive: true });
const buf = Buffer.from(m[1], "base64");
writeFileSync("assets/capa-feira.jpg", buf);
console.log(`✔ assets/capa-feira.jpg criada (${Math.round(buf.length / 1024)} KB)`);
