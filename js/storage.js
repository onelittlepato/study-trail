/* ============================================================
   STUDY TRAIL — storage.js
   Estado global + persistência em localStorage + migração
   ============================================================ */

/* ============ CHAVES DO LOCALSTORAGE ============ */
const STORAGE_KEYS = {
  disciplinas: "st_disciplinas",
  itens: "st_itens",
  notas: "st_notas",
  tema: "st_tema",
  versao: "st_versao"
};

/* ============ VERSÃO ATUAL ============ */
const VERSAO_ATUAL = 2;

/* ============ ESTADO GLOBAL ============ */
let disciplinas = [];
let itens = [];
let notas = [];

/* Estado de UI (não persistido) */
let semanaAtual = getSegundaDaSemana(new Date());
let disciplinaAberta = null;
let tipoSelecionadoHome = "tema";
let temaAberto = null;
let tipoSelecionadoDisc = "tema";
let buscaDisciplina = "";
let viewTimeline = "timeline";     // "timeline" | "calendario"
let mesCalendario = new Date();    // mês visível no calendário

/* ============ PERSISTÊNCIA ============ */

/**
 * Salva o estado atual no localStorage.
 */
function salvar() {
  try {
    localStorage.setItem(STORAGE_KEYS.disciplinas, JSON.stringify(disciplinas));
    localStorage.setItem(STORAGE_KEYS.itens, JSON.stringify(itens));
    localStorage.setItem(STORAGE_KEYS.notas, JSON.stringify(notas));
    localStorage.setItem(STORAGE_KEYS.versao, String(VERSAO_ATUAL));
  } catch (e) {
    console.error("[Storage] Falha ao salvar:", e);
    if (e.name === "QuotaExceededError") {
      mostrarToast("Armazenamento cheio. Remova anexos grandes.", "erro", 5000);
    }
  }
}

/**
 * Carrega o estado do localStorage.
 */
function carregar() {
  try {
    disciplinas = JSON.parse(localStorage.getItem(STORAGE_KEYS.disciplinas)) || [];
    itens = JSON.parse(localStorage.getItem(STORAGE_KEYS.itens)) || [];
    notas = JSON.parse(localStorage.getItem(STORAGE_KEYS.notas)) || [];
  } catch (e) {
    console.error("[Storage] Falha ao carregar:", e);
    disciplinas = [];
    itens = [];
    notas = [];
  }

  migrarSeNecessario();
  normalizarDados();
}

/**
 * Normaliza todos os dados após o carregamento,
 * garantindo que todos os campos existam.
 */
function normalizarDados() {
  // Disciplinas
  disciplinas.forEach(d => {
    if (!d.cor) d.cor = PALETA_CORES[0];
    if (d.professor === undefined) d.professor = "";
    if (d.horario === undefined) d.horario = "";
    if (d.semestre === undefined) d.semestre = "";
  });

  // Itens
  itens.forEach(i => {
    if (!i.temasVinculados) i.temasVinculados = [];
    if (i.observacoes === undefined) i.observacoes = "";
    if (!i.anexos) i.anexos = [];
    if (i.tipo === undefined) i.tipo = "atividade";

    // Compatibilidade período <-> data
    if (i.dataInicio === undefined) i.dataInicio = "";
    if (i.dataFim === undefined) i.dataFim = "";
    if (i.data === undefined) i.data = "";
  });

  // Notas
  notas.forEach(n => {
    if (!n.peso || n.peso < 1) n.peso = 1;
  });
}

/* ============ MIGRAÇÕES ============ */
/**
 * Migra dados de versões anteriores. Cada bloco só roda uma vez.
 */
function migrarSeNecessario() {
  const versaoSalva = parseInt(localStorage.getItem(STORAGE_KEYS.versao) || "0");

  if (versaoSalva === VERSAO_ATUAL) return;

  console.log(`[Storage] Migrando da versão ${versaoSalva} para ${VERSAO_ATUAL}`);

  // v0/v1 → v2: itens antigos ganham campos de período vazios
  // (já coberto em normalizarDados, mas deixamos hook pra futuras migrações)

  // Versões antigas usavam chaves diferentes (compatibilidade)
  const antigas = {
    disciplinas: "disciplinas",
    itens: "itens",
    notas: "notas",
    tarefas: "tarefas"
  };

  // Migra disciplinas antigas
  if (!localStorage.getItem(STORAGE_KEYS.disciplinas)) {
    const dOld = localStorage.getItem(antigas.disciplinas);
    if (dOld) {
      localStorage.setItem(STORAGE_KEYS.disciplinas, dOld);
      console.log("[Storage] Disciplinas migradas da chave antiga");
    }
  }

  // Migra itens antigos OU tarefas antigas
  if (!localStorage.getItem(STORAGE_KEYS.itens)) {
    const iOld = localStorage.getItem(antigas.itens);
    if (iOld) {
      localStorage.setItem(STORAGE_KEYS.itens, iOld);
      console.log("[Storage] Itens migrados da chave antiga");
    } else {
      const tarefasAntigas = JSON.parse(localStorage.getItem(antigas.tarefas) || "null");
      if (Array.isArray(tarefasAntigas) && tarefasAntigas.length > 0) {
        const convertidas = tarefasAntigas.map(t => ({
          id: t.id || gerarId(),
          disciplinaId: t.disciplinaId || null,
          nome: t.nome,
          tipo: t.tipo === "exame" ? "exame" : "atividade",
          data: t.data || "",
          dataInicio: "",
          dataFim: "",
          semana: "",
          prioridade: t.prioridade || "media",
          concluida: !!t.concluida,
          observacoes: "",
          temasVinculados: [],
          anexos: []
        }));
        localStorage.setItem(STORAGE_KEYS.itens, JSON.stringify(convertidas));
        console.log(`[Storage] ${convertidas.length} tarefas antigas migradas`);
      }
    }
  }

  // Migra notas antigas
  if (!localStorage.getItem(STORAGE_KEYS.notas)) {
    const nOld = localStorage.getItem(antigas.notas);
    if (nOld) {
      localStorage.setItem(STORAGE_KEYS.notas, nOld);
      console.log("[Storage] Notas migradas da chave antiga");
    }
  }

  localStorage.setItem(STORAGE_KEYS.versao, String(VERSAO_ATUAL));
}

/* ============ RESET ============ */
/**
 * Apaga TUDO. Uso: resetTotal() no console do navegador.
 */
function resetTotal() {
  if (!confirm("⚠️ Isso apaga TODOS os dados. Tem certeza?")) return;
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.clear();
  location.reload();
}

/* ============ EXPORT / IMPORT (backup) ============ */

/**
 * Exporta todo o estado como arquivo JSON.
 */
function exportarDados() {
  const dados = {
    versao: VERSAO_ATUAL,
    exportadoEm: new Date().toISOString(),
    disciplinas,
    itens,
    notas
  };
  const blob = new Blob(
    [JSON.stringify(dados, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dataHoje = formatarISO(new Date());
  a.href = url;
  a.download = `study-trail-backup-${dataHoje}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarToast("📤 Backup exportado!", "sucesso");
}

/**
 * Importa backup a partir de um <input type="file">.
 * @param {HTMLInputElement} input - input do tipo file
 */
function importarDados(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);

      if (!dados.disciplinas || !dados.itens || !dados.notas) {
        throw new Error("Arquivo de backup inválido.");
      }

      const confirmar = window.confirm(
        `⚠️ Isso vai SUBSTITUIR seus dados atuais por:\n\n` +
        `• ${dados.disciplinas.length} disciplina(s)\n` +
        `• ${dados.itens.length} item(ns)\n` +
        `• ${dados.notas.length} nota(s)\n\n` +
        `Continuar?`
      );

      if (!confirmar) {
        input.value = "";
        return;
      }

      disciplinas = dados.disciplinas;
      itens = dados.itens;
      notas = dados.notas;

      normalizarDados();
      salvar();

      mostrarToast("📥 Backup importado com sucesso!", "sucesso");
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      console.error("[Import]", err);
      mostrarToast("❌ Erro ao importar: " + err.message, "erro", 5000);
    } finally {
      input.value = "";
    }
  };
  reader.readAsText(file);
}
