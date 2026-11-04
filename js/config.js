/* Configuração pública do site.
   - Com SUPABASE_URL e SUPABASE_ANON_KEY preenchidos, o site usa o banco real.
   - Deixe os dois vazios para rodar no MODO DEMONSTRAÇÃO (dados só no navegador).
   A chave "anon" é pública por natureza (a segurança vem das regras RLS do banco).
   NUNCA coloque a service_role aqui. */
window.FEIRA_CONFIG = {
  SUPABASE_URL: "https://debphfbpqinwstugjfgz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYnBoZmJwcWlud3N0dWdqZmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NDU5OTYsImV4cCI6MjEwOTMyMTk5Nn0.E9kECt3ecT5K9hNuyu_dWiSr7zEjXHUjlUcRvxC9vFA"
};
