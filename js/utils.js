/* ============================================================
   STUDY TRAIL — utils.js
   Funções auxiliares puras (sem efeitos colaterais no app)
   ============================================================ */

/* ============ DATAS ============ */

/**
 * Retorna a segunda-feira da semana de uma data.
 * Considera segunda como início da semana (padrão BR).
 */
function getSegundaDaSemana(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay(); // 0 = domingo, 1 = segunda...
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Formata um objeto Date como "YYYY-MM-DD".
 */
function formatarISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * Formata uma string ISO "YYYY-MM-DD" como "DD/MM".
 */
function formatarBR(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * Formata uma string ISO completa como "DD/MM/YYYY".
 */
function formatarBRCompleto(iso) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Nome do dia da semana (0 = Domingo).
 */
function nomeDiaSemana(i) {
  return [
    "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
    "Quinta-feira", "Sexta-feira", "Sábado"
  ][i];
}

/**
 * Nome curto do dia da semana (0 = Dom).
 */
function nomeDiaSemanaCurto(i) {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][i];
}

/**
 * Nome do mês (0 = Janeiro).
 */
function nomeMes(i) {
  return [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ][i];
}

/**
 * Nome curto do mês (0 = Jan).
 */
function nomeMesCurto(i) {
  return [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ][i];
}

/**
 * Data por extenso em português: "Segunda-feira, 7 de Outubro".
 */
function dataPorExtenso(d) {
  return `${nomeDiaSemana(d.getDay())}, ${d.getDate()} de ${nomeMes(d.getMonth())}`;
}

/**
 * Rótulo relativo para um número de dias no futuro.
 * 0 → "Hoje", 1 → "Amanhã", N → "Em N dias".
 */
function rotuloDia(dias) {
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
}

/**
 * Diferença em dias entre duas datas ISO (a - b).
 * Positivo se 'a' é depois de 'b'.
 */
function diferencaDias(isoA, isoB) {
  const a = new Date(isoA + "T00:00:00");
  const b = new Date(isoB + "T00:00:00");
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a data ISO de hoje ("YYYY-MM-DD").
 */
function hojeISO() {
  return formatarISO(new Date());
}

/**
 * Verifica se uma data ISO está dentro de [inicio, fim] (inclusive).
 */
function dentroDoPeriodo(iso, inicio, fim) {
  return iso >= inicio && iso <= fim;
}

/**
 * Verifica se uma data ISO pertence ao item (data única ou período).
 */
function pertenceAoDia(item, iso) {
  if (item.dataInicio && item.dataFim) {
    return dentroDoPeriodo(iso, item.dataInicio, item.dataFim);
  }
  return item.data === iso;
}

/**
 * Retorna a primeira data relevante do item (para ordenação).
 */
function primeiraData(item) {
  return item.dataInicio || item.data || "9999-12-31";
}

/**
 * Verifica se o item é do tipo "período" (tem dataInicio e dataFim).
 */
function ehPeriodo(item) {
  return !!(item.dataInicio && item.dataFim && item.dataInicio !== item.dataFim);
}

/**
 * Conta quantos dias tem o período de um item.
 */
function duracaoPeriodo(item) {
  if (!ehPeriodo(item)) return 1;
  return diferencaDias(item.dataFim, item.dataInicio) + 1;
}

/* ============ RÓTULOS DE PRIORIDADE E TIPO ============ */

function rotuloPrioridade(p) {
  return { alta: "🔴 Alta", media: "🟡 Média", baixa: "🟢 Baixa" }[p] || p;
}

function rotuloTipo(t) {
  return { exame: "🎯 Exame", atividade: "📝 Atividade", tema: "📖 Tema" }[t] || t;
}

function corTipo(t) {
  if (t === "exame") return "exame";
  if (t === "tema") return "tema";
  return "atividade";
}

/* ============ SEGURANÇA ============ */

/**
 * Escapa caracteres HTML para evitar injeção em templates.
 */
function escaparHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

/* ============ IDs ============ */

/**
 * Gera um ID único baseado em timestamp + ruído.
 */
function gerarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/* ============ UI ============ */

/**
 * Mostra uma notificação toast.
 * @param {string} msg - Mensagem
 * @param {string} tipo - "sucesso" | "erro" | "aviso" | "" (neutro)
 * @param {number} duracao - Milissegundos visível
 */
function mostrarToast(msg, tipo = "", duracao = 2800) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast visivel" + (tipo ? " " + tipo : "");
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => {
    el.className = "toast";
  }, duracao);
}

/**
 * Confirmação com fallback para ambientes onde confirm() é bloqueado.
 */
function confirmar(msg) {
  return confirm(msg);
}

/* ============ VALIDAÇÃO ============ */

/**
 * Verifica se um valor é uma data ISO válida "YYYY-MM-DD".
 */
function ehDataISOValida(iso) {
  if (!iso || typeof iso !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(new Date(iso).getTime());
}

/**
 * Comparador: ordena por data crescente (itens sem data vão pro fim).
 */
function compararPorData(a, b) {
  return primeiraData(a).localeCompare(primeiraData(b));
}

/**
 * Comparador: prioridade (alta > media > baixa).
 */
function compararPorPrioridade(a, b) {
  const p = { alta: 0, media: 1, baixa: 2 };
  return p[a.prioridade] - p[b.prioridade];
}

/**
 * Comparador combinado: data, depois prioridade.
 */
function compararDataPrioridade(a, b) {
  const cmpData = compararPorData(a, b);
  if (cmpData !== 0) return cmpData;
  return compararPorPrioridade(a, b);
}

/* ============ LOG DE ERROS (dev) ============ */

window.addEventListener("error", (e) => {
  console.error("[Study Trail] Erro:", e.error || e.message);
});
