/* ============================================================
   STUDY TRAIL — app.js
   Inicialização, navegação e handlers globais
   ============================================================ */

/* ============ NAVEGAÇÃO ENTRE ABAS ============ */

function mostrarSecao(id, btn) {
  // Troca a seção ativa
  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  const secao = document.getElementById(id);
  if (secao) secao.classList.add("ativa");

  // Troca o botão ativo
  document.querySelectorAll("#navPrincipal button").forEach(b => b.classList.remove("ativo"));
  if (btn) btn.classList.add("ativo");

  // Reset da disciplina aberta ao sair da página dela
  if (id !== "paginaDisciplina") {
    disciplinaAberta = null;
  }
   
 // Reset do tema aberto ao sair da página dele
  if (id !== "paginaTema") {
    temaAberto = null;
  }

  // Renderiza conforme a aba
  switch (id) {
    case "inicio":
      if (typeof renderInicio === "function") renderInicio();
      break;
    case "semana":
      if (typeof renderSemana === "function") renderSemana();
      break;
    case "disciplinas":
      if (typeof renderListaDisciplinas === "function") renderListaDisciplinas();
      break;
    case "notas":
      if (typeof atualizarSelectDisciplinas === "function") atualizarSelectDisciplinas();
      if (typeof renderNotas === "function") renderNotas();
      break;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ============ ATALHOS DE TECLADO ============ */

function configurarAtalhos() {
  document.addEventListener("keydown", (e) => {
    // Ignora se estiver digitando em input/textarea/select
    const tag = (e.target.tagName || "").toLowerCase();
    const editando = ["input", "textarea", "select"].includes(tag);
    if (editando) return;

    // Não faz nada com modificadores (Ctrl, Alt, Meta)
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    switch (e.key.toLowerCase()) {
      case "1":
        clicarNav("Início");
        break;
      case "2":
        clicarNav("Semana");
        break;
      case "3":
        clicarNav("Disciplinas");
        break;
      case "4":
        clicarNav("Notas");
        break;
      case "h":
        if (typeof irParaSemanaAtual === "function") irParaSemanaAtual();
        break;
      case "t":
        if (typeof alternarTema === "function") alternarTema();
        break;
      case "escape":
        // Volta da página da disciplina para a lista
        if (document.getElementById("paginaDisciplina")?.classList.contains("ativa")) {
          if (typeof voltarParaDisciplinas === "function") voltarParaDisciplinas();
        }
        break;
    }
  });
}

/**
 * Clica num botão da nav pelo texto (usado pelos atalhos).
 */
function clicarNav(texto) {
  const btn = [...document.querySelectorAll("#navPrincipal button")]
    .find(b => b.textContent.includes(texto));
  if (btn) btn.click();
}

/* ============ PREVENÇÃO DE PERDA DE DADOS ============ */

function configurarAvisoAntesDeSair() {
  // Só avisa se houver dados não salvos... no nosso caso, tudo é salvo
  // na hora, então não precisamos. Mas deixamos o hook caso queira
  // adicionar algum form com "draft" no futuro.
}

/* ============ STATUS ONLINE/OFFLINE ============ */

function configurarStatusRede() {
  window.addEventListener("online", () => {
    mostrarToast("✅ Você está online.", "sucesso");
  });
  window.addEventListener("offline", () => {
    mostrarToast("📴 Você está offline. Seus dados continuam salvos localmente.", "aviso", 4000);
  });
}

/* ============ INICIALIZAÇÃO ============ */

function inicializar() {
  console.log("🎓 Study Trail iniciando...");

  // 1. Tema (claro/escuro) — antes de tudo pra evitar flash
  if (typeof inicializarTema === "function") {
    inicializarTema();
  }

  // 2. Carrega dados do localStorage
  if (typeof carregar === "function") {
    carregar();
  }

  // 3. Renderiza paleta da disciplina nova
  if (typeof renderPaleta === "function") {
    renderPaleta();
  }

  // 4. Select de disciplinas na aba Notas
  if (typeof atualizarSelectDisciplinas === "function") {
    atualizarSelectDisciplinas();
  }

  // 5. Formulário dinâmico da Home
  if (typeof renderFormDinamicoHome === "function") {
    renderFormDinamicoHome();
  }

  // 6. Renderiza todas as seções (não visíveis agora, mas prontas)
  if (typeof renderListaDisciplinas === "function") renderListaDisciplinas();
  if (typeof renderNotas === "function") renderNotas();
  if (typeof renderSemana === "function") renderSemana();
  if (typeof renderInicio === "function") renderInicio();

  // 7. Ativa a seção Início por padrão
  const btnInicio = document.querySelector("#navPrincipal button");
  mostrarSecao("inicio", btnInicio);

  // 8. Atalhos e eventos globais
  configurarAtalhos();
  configurarStatusRede();

  // 9. Aviso de boas-vindas na primeira visita
  const jaVisitou = localStorage.getItem("st_visitou");
  if (!jaVisitou) {
    mostrarToast("👋 Bem-vindo! Vá em 📚 Disciplinas para começar.", "", 5000);
    localStorage.setItem("st_visitou", "1");
  }

  console.log("✅ Study Trail pronto.");
}

/* ============ BOOT ============ */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializar);
} else {
  // já carregado (caso o script seja adicionado depois)
  inicializar();
}

/* ============ EXPOR FUNÇÕES GLOBAIS (para onclick="") ============ */
// Como usamos onclick="funcao()" direto no HTML, tudo que é chamado
// precisa estar acessível globalmente. Como todos os scripts são
// carregados sem "type=module", as funções já são globais por padrão.
// Este bloco serve apenas para documentar quais são as principais
// entradas globais esperadas.

/*
Funções expostas globalmente:
  - mostrarSecao, irParaSemanaAtual
  - alternarTema
  - adicionarDisciplina, removerDisciplina, editarDisciplina, mudarCorDisciplina
  - abrirDisciplina, voltarParaDisciplinas, atualizarBusca
  - selecionarTipoHome, selecionarTipoDisc
  - adicionarItemHome, adicionarItemDisc, alternarItem, removerItem
  - toggleNotas, editarObservacoes
  - toggleAnexos, adicionarLink, adicionarArquivo, removerAnexo, abrirAnexo
  - mudarSemana, irParaHoje
  - adicionarNota, removerNota
  - mudarView, mudarMesCal
  - exportarDados, importarDados, resetTotal
  - selecionarCor
*/
