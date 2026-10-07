/* ============================================================
   STUDY TRAIL — semana.js
   Aba "Semana": navegação, agrupamento por dia, suporte a períodos
   ============================================================ */

/* ============ NAVEGAÇÃO ============ */

function mudarSemana(delta) {
  semanaAtual.setDate(semanaAtual.getDate() + delta * 7);
  renderSemana();
}

function irParaHoje() {
  semanaAtual = getSegundaDaSemana(new Date());
  renderSemana();
}

/**
 * Atalho global: vai para a aba Semana na semana atual.
 */
function irParaSemanaAtual() {
  semanaAtual = getSegundaDaSemana(new Date());
  const btnSemana = [...document.querySelectorAll("#navPrincipal button")]
    .find(b => b.textContent.includes("Semana"));
  if (typeof mostrarSecao === "function") mostrarSecao("semana", btnSemana);
}

/* ============ RENDER ============ */

function renderSemana() {
  const titulo = document.getElementById("tituloSemana");
  if (!titulo) return;

  const fimSemana = new Date(semanaAtual);
  fimSemana.setDate(fimSemana.getDate() + 6);

  titulo.textContent =
    `${formatarBR(formatarISO(semanaAtual))} a ${formatarBR(formatarISO(fimSemana))}`;

  const hoje = hojeISO();
  const diasContainer = document.getElementById("diasSemana");
  if (!diasContainer) return;
  diasContainer.innerHTML = "";

  let totalSemana = 0;
  let concluidasSemana = 0;

  for (let i = 0; i < 7; i++) {
    const dia = new Date(semanaAtual);
    dia.setDate(dia.getDate() + i);
    const diaISO = formatarISO(dia);

    // AQUI está o suporte a período: usa pertenceAoDia()
    const doDia = itens
      .filter(it => pertenceAoDia(it, diaISO))
      .sort(compararDataPrioridade);

    totalSemana += doDia.length;
    concluidasSemana += doDia.filter(t => t.concluida).length;

    const ehHoje = diaISO === hoje;
    const ehFimSemana = dia.getDay() === 0 || dia.getDay() === 6;

    let classe = "dia";
    if (ehHoje) classe += " hoje";
    else if (ehFimSemana) classe += " fim-semana";

    let conteudo;
    if (doDia.length === 0) {
      conteudo = '<p class="sem-tarefas">Nada para este dia 🎉</p>';
    } else {
      conteudo = "<ul>" + doDia.map(t => renderLinhaDia(t, diaISO, hoje)).join("") + "</ul>";
    }

    diasContainer.innerHTML += `
      <div class="${classe}">
        <h3>
          ${ehHoje ? "🔵 " : ""}${nomeDiaSemana(dia.getDay())}
          <span class="data-dia">${formatarBR(diaISO)}</span>
        </h3>
        ${conteudo}
      </div>
    `;
  }

  // Resumo
  const pendentes = totalSemana - concluidasSemana;
  const resumo = document.getElementById("resumoSemana");
  if (resumo) {
    resumo.innerHTML =
      `📊 <strong>${totalSemana}</strong> item(ns) • ` +
      `<strong>${concluidasSemana}</strong> concluído(s) • ` +
      `<strong>${pendentes}</strong> pendente(s)`;
  }

  renderSemData();
}

/**
 * Renderiza uma linha de item dentro de um dia da semana.
 */
function renderLinhaDia(t, diaISO, hoje) {
  const cor = corDisciplina(t.disciplinaId);
  const atrasado = itemEhAtrasado(t);

  // Se for período, mostra indicador "dia X de Y"
  let indicadorPeriodo = "";
  if (ehPeriodo(t)) {
    const totalDias = duracaoPeriodo(t);
    const diaAtual = diferencaDias(diaISO, t.dataInicio) + 1;
    indicadorPeriodo = `<span class="badge periodo">📆 dia ${diaAtual}/${totalDias}</span>`;
  }

  const atrasadoBadge = atrasado
    ? ' • <span class="badge atrasada">ATRASADA</span>'
    : "";

  return `
    <li>
      <input type="checkbox" ${t.concluida ? "checked" : ""}
             onchange="alternarItem(${t.id})" style="flex:0;">
      <div class="tarefa-info">
        <strong class="${t.concluida ? 'concluida' : ''}"
                style="border-left:3px solid ${cor}; padding-left:0.5rem;">
          ${escaparHtml(t.nome)}
        </strong>
        <small>
          <span class="disc-tag" style="color:${cor};">
            📘 ${escaparHtml(nomeDisciplina(t.disciplinaId))}
          </span>
          ${atrasadoBadge}
          • <span class="badge ${corTipo(t.tipo)}">${rotuloTipo(t.tipo)}</span>
          ${indicadorPeriodo ? " • " + indicadorPeriodo : ""}
        </small>
      </div>
      <span class="badge ${t.prioridade}">${rotuloPrioridade(t.prioridade)}</span>
    </li>
  `;
}

/**
 * Itens sem data e sem período (excluindo temas, que têm "semana" mas não data).
 */
function renderSemData() {
  const card = document.getElementById("cardSemData");
  const lista = document.getElementById("listaSemData");
  if (!card || !lista) return;

  const semData = itens.filter(it =>
    !it.data && !it.dataInicio && it.tipo !== "tema"
  );

  if (semData.length === 0) {
    card.style.display = "none";
    return;
  }

  card.style.display = "block";
  lista.innerHTML = semData.map(t => {
    const cor = corDisciplina(t.disciplinaId);
    return `
      <li>
        <input type="checkbox" ${t.concluida ? "checked" : ""}
               onchange="alternarItem(${t.id})" style="flex:0;">
        <div class="tarefa-info">
          <strong class="${t.concluida ? 'concluida' : ''}">${escaparHtml(t.nome)}</strong>
          <small>
            <span class="disc-tag" style="color:${cor};">
              📘 ${escaparHtml(nomeDisciplina(t.disciplinaId))}
            </span>
          </small>
        </div>
        <span class="badge ${corTipo(t.tipo)}">${rotuloTipo(t.tipo)}</span>
        <button class="btn perigo pequeno" onclick="removerItem(${t.id})">🗑️</button>
      </li>
    `;
  }).join("");
}
