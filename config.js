// Configuração pública do Supabase para o Presença IFBA.
// Use somente a chave publishable (sb_publishable_...). NUNCA use service_role/secret aqui.
window.PRESENCA_SUPABASE_URL = 'https://kvcqgceqgmagqlcazrxa.supabase.co';
window.PRESENCA_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_pQ65ZzJSgmqHElLumvPFTQ_BblhviDt';

if (window.supabase && window.PRESENCA_SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
  window.supabaseClient = window.supabase.createClient(
    window.PRESENCA_SUPABASE_URL,
    window.PRESENCA_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
} else {
  console.warn('Presença IFBA: configure a chave publishable em config.js para habilitar o login.');
}
