/* ============================================================
   STUDY TRAIL — tema.js
   Alternância entre modo claro e escuro (persistida)
   ============================================================ */

const TEMAS = {
  CLARO: "claro",
  ESCURO: "escuro"
};

/**
 * Aplica um tema ao documento e persiste a escolha.
 * @param {string} tema - "claro" | "escuro"
 */
function aplicarTema(tema) {
  if (tema !== TEMAS.CLARO && tema !== TEMAS.ESCURO) {
    tema = TEMAS.CLARO;
  }

  document.documentElement.setAttribute("data-tema", tema);

  // Atualiza o botão (☀️ no escuro, 🌙 no claro)
  const btn = document.getElementById("btnTema");
  if (btn) {
    btn.textContent = tema === TEMAS.ESCURO ? "☀️" : "🌙";
    btn.title = tema === TEMAS.ESCURO
      ? "Mudar para tema claro"
      : "Mudar para tema escuro";
  }

  // Atualiza theme-color do navegador (barra do celular)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", tema === TEMAS.ESCURO ? "#12141c" : "#4a6cf7");
  }

  try {
    localStorage.setItem("st_tema", tema);
  } catch (e) {
    console.warn("[Tema] Não foi possível salvar preferência:", e);
  }
}

/**
 * Alterna entre claro e escuro.
 */
function alternarTema() {
  const atual = document.documentElement.getAttribute("data-tema") || TEMAS.CLARO;
  aplicarTema(atual === TEMAS.CLARO ? TEMAS.ESCURO : TEMAS.CLARO);
}

/**
 * Retorna o tema salvo ou detecta preferência do sistema.
 */
function temaInicial() {
  try {
    const salvo = localStorage.getItem("st_tema");
    if (salvo === TEMAS.CLARO || salvo === TEMAS.ESCURO) return salvo;
  } catch (e) { /* ignora */ }

  // Detecta preferência do sistema
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return TEMAS.ESCURO;
  }
  return TEMAS.CLARO;
}

/**
 * Inicializa o tema (chamar no carregamento).
 */
function inicializarTema() {
  aplicarTema(temaInicial());

  // Reage a mudanças de preferência do sistema
  // (só se o usuário não tiver escolhido manualmente)
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      const salvo = localStorage.getItem("st_tema");
      if (!salvo) {
        aplicarTema(e.matches ? TEMAS.ESCURO : TEMAS.CLARO);
      }
    });
  }
}
