/* Configuração pública do site.
   - Deixe SUPABASE_URL e SUPABASE_ANON_KEY vazios para rodar no MODO DEMONSTRAÇÃO
     (dados no navegador, igual ao feira-modelo.html).
   - Preencha com os dados do seu projeto Supabase (Project Settings → API) para usar o banco real.
   A chave "anon"/"publishable" é pública por natureza. NUNCA coloque a service_role aqui. */
window.FEIRA_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  /* domínio técnico usado para transformar o WhatsApp do feirante em e-mail de login.
     Precisa ser igual à variável EMAIL_FEIRANTE_DOMINIO da Vercel. */
  EMAIL_FEIRANTE_DOMINIO: "feirante.feiraalterosa.app"
};
