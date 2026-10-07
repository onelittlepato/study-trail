/* ============================================================
   STUDY TRAIL — inicio.js
   Home: Hoje, Próximos (7/30/semestre), Stats, Progresso, Atrasadas, Resumo
   ============================================================ */

/* ============ HOJE ============ */

function renderHoje() {
  const cont = document.getElementById("hojeContainer");
  if (!cont) return;

  const hoje = hojeISO();
  const hojeDate = new Date();

  const doDia = itens
    .filter(it => pertenceAoDia(it, hoje))
    .sort(compararDataPrioridade);

  const pendentes = doDia.filter(i => !i.concluida).length;
  const concluidas = doDia.filter(i => i.concluida).length;

  let listaHtml;
  if (doDia.length === 0) {
    listaHtml = '<div class="vazio-hoje">🎉 Nada marcado para hoje. Aproveite!</div>';
  } else {
    listaHtml = "<ul class='lista-hoje'>" +
      doDia.map(t => {
        const cor = corDisciplina(t.disciplinaId);
        const metaExtra = ehPeriodo(t) ? ' • 📆 período' : "";
        return `
          <li style="border-left:4px solid ${cor};">
            <input type="checkbox" ${t.concluida ? "checked" : ""}
                   onchange="alternarItem(${t.id})">
            <div class="info">
              <strong class="${t.concluida ? 'concluida' : ''}">
                ${escaparHtml(t.nome)}
              </strong>
              <small>
                📘 ${escaparHtml(nomeDisciplina(t.disciplinaId))}
                • ${rotuloTipo(t.tipo)}
                • ${rotuloPrioridade(t.prioridade)}${metaExtra}
              </small>
            </div>
          </li>
        `;
      }).join("") + "</ul>";
  }

  cont.innerHTML = `
    <div class="hoje-box">
      <div class="data-hoje">📅 Hoje</div>
      <h2>${dataPorExtenso(hojeDate)}</h2>
      ${doDia.length > 0 ? `
        <div style="font-size:0.9rem; margin-bottom:0.8rem; opacity:0.95;">
          <strong>${pendentes}</strong> pendente(s) •
          <strong>${concluidas}</strong> concluída(s)
        </div>
      ` : ""}
      ${listaHtml}
    </div>
  `;
}

/* ============ PRÓXIMOS (7 / 30 / semestre) ============ */

function mudarDiasProximos(valor) {
  diasProximos = valor;
  renderProximos();
}

function renderProximos() {
  const cont = document.getElementById("proximosContainer");
  if (!cont) return;

  const hoje = hojeISO();
  const inicio = adicionarDia(hoje, 1);
  const fim = calcularFimProximos(hoje);

  const itensIntervalo = itens.filter(i => {
    if (i.concluida) return false;
    return itemIntersectaIntervalo(i, inicio, fim);
  });

  const grupos = agruparPorDiaDeInicio(itensIntervalo, inicio, fim);

  const totalItens = itensIntervalo.length;
  const totalExames = itensIntervalo.filter(i => i.tipo === "exame").length;
  const totalAtiv = itensIntervalo.filter(i => i.tipo === "atividade").length;

  const botoes = `
    <div class="proximos-filtro">
      <button class="${diasProximos === 7 ? 'ativo' : ''}" onclick="mudarDiasProximos(7)">7 dias</button>
      <button class="${diasProximos === 30 ? 'ativo' : ''}" onclick="mudarDiasProximos(30)">Próximo mês</button>
      <button class="${diasProximos === 'semestre' ? 'ativo' : ''}" onclick="mudarDiasProximos('semestre')">Semestre</button>
    </div>
  `;

  if (grupos.length === 0) {
    cont.innerHTML = `
      <div class="proximos-wrapper">
        <div class="proximos-header">
          <h2>🔮 Próximos</h2>
          ${botoes}
        </div>
        <div class="proximos-vazio">
          🎉 Nada agendado para este período. Aproveite!
        </div>
      </div>
    `;
    return;
  }

  const gruposHtml = grupos.map(g => renderGrupoDia(g, hoje)).join("");

  cont.innerHTML = `
    <div class="proximos-wrapper">
      <div class="proximos-header">
        <h2>
          🔮 Próximos
          <span class="proximos-resumo">
            ${totalItens} item(ns)
            ${totalExames > 0 ? ' • 🎯 ' + totalExames : ''}
            ${totalAtiv > 0 ? ' • 📝 ' + totalAtiv : ''}
          </span>
        </h2>
        ${botoes}
      </div>
      <div class="proximos-lista">
        ${gruposHtml}
      </div>
    </div>
  `;
}

function calcularFimProximos(hojeIso) {
  if (diasProximos === "semestre") {
    const hoje = new Date(hojeIso + "T00:00:00");
    const fimAno = new Date(hoje.getFullYear(), 11, 31);
    const maisSeisMeses = new Date(hoje);
    maisSeisMeses.setMonth(maisSeisMeses.getMonth() + 6);
    const fim = maisSeisMeses > fimAno ? maisSeisMeses : fimAno;
    return formatarISO(fim);
  }
  return adicionarDia(hojeIso, diasProximos);
}

function adicionarDia(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return formatarISO(d);
}

function itemIntersectaIntervalo(item, inicio, fim) {
  if (item.dataInicio && item.dataFim) {
    return item.dataInicio <= fim && item.dataFim >= inicio;
  }
  if (item.data) {
    return item.data >= inicio && item.data <= fim;
  }
  return false;
}

function primeiroDiaNoIntervalo(item, inicio) {
  if (item.dataInicio && item.dataFim) {
    return item.dataInicio < inicio ? inicio : item.dataInicio;
  }
  return item.data;
}

function agruparPorDiaDeInicio(lista, inicio, fim) {
  const mapa = {};

  lista.forEach(item => {
    const dia = primeiroDiaNoIntervalo(item, inicio);
    if (dia < inicio || dia > fim) return;

    if (!mapa[dia]) mapa[dia] = [];
    mapa[dia].push(item);
  });

  return Object.entries(mapa)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, itensGrupo]) => ({
      iso,
      itens: itensGrupo.sort(compararDataPrioridade)
    }));
}

function renderGrupoDia(grupo, hojeIso) {
  const data = new Date(grupo.iso + "T00:00:00");
  const ehHoje = grupo.iso === hojeIso;
  const ehAmanha = grupo.iso === adicionarDia(hojeIso, 1);
  const diasRestantes = diferencaDias(grupo.iso, hojeIso);

  let rotuloDia;
  if (ehHoje) rotuloDia = "Hoje";
  else if (ehAmanha) rotuloDia = "Amanhã";
  else if (diasRestantes < 7) rotuloDia = nomeDiaSemana(data.getDay());
  else rotuloDia = `${nomeDiaSemanaCurto(data.getDay())}, ${formatarBRCompleto(grupo.iso)}`;

  const labelEsquerda = ehHoje || ehAmanha
    ? `${rotuloDia} • ${formatarBRCompleto(grupo.iso)}`
    : rotuloDia;

  return `
    <div class="grupo-dia-card ${ehHoje ? 'hoje' : ''} ${ehAmanha ? 'amanha' : ''}">
      <div class="grupo-dia-header">
        <div class="grupo-dia-label">
          <span class="grupo-dia-ponto"></span>
          <strong>${labelEsquerda}</strong>
        </div>
        <span class="grupo-dia-contador">${grupo.itens.length} item(ns)</span>
      </div>
      <div class="grupo-dia-itens">
        ${grupo.itens.map(i => renderItemProximo(i, hojeIso)).join("")}
      </div>
    </div>
  `;
}

function renderItemProximo(item, hojeIso) {
  const cor = corDisciplina(item.disciplinaId);
  const atrasado = itemEhAtrasado(item);
  const ehExame = item.tipo === "exame";
  const ehTema = item.tipo === "tema";

  const icone = ehExame ? "🎯" : ehTema ? "📖" : "📝";
  const classeTipo = corTipo(item.tipo);

  let marcadorData = "";
  if (item.dataInicio && item.dataFim && item.dataInicio !== item.dataFim) {
    marcadorData = `<span class="prox-item-periodo">📆 ${formatarBR(item.dataInicio)} → ${formatarBR(item.dataFim)}</span>`;
  }

  const prioridadeCor = {
    alta: "#e74c3c",
    media: "#f39c12",
    baixa: "#27ae60"
  }[item.prioridade] || "#888";

  const discNome = nomeDisciplina(item.disciplinaId);

  return `
    <div class="prox-item ${atrasado ? 'atrasado' : ''}"
         style="--cor-disc:${cor};"
         onclick="abrirItemProximo(${item.id})">
      <div class="prox-item-barra"></div>
      <div class="prox-item-conteudo">
        <div class="prox-item-titulo">
          <span class="prox-item-icone">${icone}</span>
          <strong class="${item.concluida ? 'concluida' : ''}">${escaparHtml(item.nome)}</strong>
          ${marcadorData}
        </div>
        <div class="prox-item-meta">
          <span class="prox-item-disc" style="color:${cor};">${escaparHtml(discNome)}</span>
          <span class="prox-item-tipo badge ${classeTipo}">${rotuloTipo(item.tipo)}</span>
          ${atrasado ? '<span class="badge atrasada">ATRASADA</span>' : ""}
        </div>
      </div>
      <div class="prox-item-prioridade"
           style="background:${prioridadeCor};"
           title="Prioridade ${item.prioridade}"></div>
      <input type="checkbox"
             class="prox-item-check"
             ${item.concluida ? "checked" : ""}
             onclick="event.stopPropagation(); alternarItem(${item.id})">
    </div>
  `;
}

function abrirItemProximo(itemId) {
  const item = itens.find(x => x.id === itemId);
  if (!item) return;
  if (item.disciplinaId) {
    abrirDisciplina(item.disciplinaId);
  }
}

/* ============ ESTATÍSTICAS ============ */

function renderStats() {
  const cont = document.getElementById("gridStats");
  if (!cont) return;

  const total = itens.length;
  const exames = itens.filter(i => i.tipo === "exame").length;
  const atividades = itens.filter(i => i.tipo === "atividade").length;
  const temas = itens.filter(i => i.tipo === "tema").length;
  const periodos = itens.filter(i => ehPeriodo(i)).length;
  const atrasadas = itens.filter(i => itemEhAtrasado(i)).length;

  cont.innerHTML = `
    <div class="stat total"><div class="num">${total}</div><div class="rotulo">Total</div></div>
    <div class="stat exames"><div class="num">${exames}</div><div class="rotulo">Exames</div></div>
    <div class="stat atividades"><div class="num">${atividades}</div><div class="rotulo">Atividades</div></div>
    <div class="stat temas"><div class="num">${temas}</div><div class="rotulo">Temas</div></div>
    <div class="stat periodo"><div class="num">${periodos}</div><div class="rotulo">Períodos</div></div>
    <div class="stat atrasadas"><div class="num">${atrasadas}</div><div class="rotulo">Atrasadas</div></div>
  `;
}

/* ============ PROGRESSO ============ */

function renderProgresso() {
  const barra = document.getElementById("barraSemestre");
  const texto = document.getElementById("textoProgresso");
  if (!barra || !texto) return;

  const total = itens.length;
  const concluidas = itens.filter(i => i.concluida).length;
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  barra.style.width = Math.max(pct, 8) + "%";
  barra.textContent = pct + "%";
  texto.textContent = `${concluidas} de ${total} itens concluídos`;
}

/* ============ ATRASADAS ============ */

function renderAtrasadas() {
  const cont = document.getElementById("atrasadasContainer");
  if (!cont) return;

  const atr = itens
    .filter(i => itemEhAtrasado(i))
    .sort(compararDataPrioridade);

  if (atr.length === 0) {
    cont.innerHTML = "";
    return;
  }

  cont.innerHTML = `
    <div style="background:linear-gradient(135deg,#ffe5e5,#ffd0d0);
                border-left:4px solid #c0392b; padding:1rem;
                border-radius:8px; margin-bottom:1rem;">
      <h3 style="color:#c0392b; margin-bottom:0.5rem; font-size:0.95rem;">
        ⚠️ Atrasadas (${atr.length})
      </h3>
      <ul style="list-style:none;">
        ${atr.map(t => {
          const cor = corDisciplina(t.disciplinaId);
          const quando = ehPeriodo(t)
            ? `${formatarBR(t.dataInicio)}–${formatarBR(t.dataFim)}`
            : formatarBR(t.data);
          const icone = t.tipo === "exame" ? "🎯" : t.tipo === "tema" ? "📖" : "📝";
          return `
            <li style="padding:0.4rem 0; font-size:0.9rem;
                       display:flex; justify-content:space-between;
                       gap:0.5rem; flex-wrap:wrap;">
              <span>
                ${icone} <strong>${escaparHtml(t.nome)}</strong>
                <span class="disc-tag" style="color:${cor};">
                  — ${escaparHtml(nomeDisciplina(t.disciplinaId))}
                </span>
              </span>
              <span style="color:#c0392b; font-weight:600;">${quando}</span>
            </li>
          `;
        }).join("")}
      </ul>
    </div>
  `;
}

/* ============ RESUMO POR DISCIPLINA ============ */

function renderResumoDisciplinas() {
  const cont = document.getElementById("resumoDisciplinas");
  if (!cont) return;

  if (disciplinas.length === 0) {
    cont.innerHTML = '<p class="vazio">Cadastre disciplinas para vê-las aqui.</p>';
    return;
  }

  cont.innerHTML = disciplinas.map(d => {
    const di = itens.filter(i => i.disciplinaId === d.id);
    const pend = di.filter(i => !i.concluida).length;
    const ex = di.filter(i => i.tipo === "exame").length;
    const at = di.filter(i => i.tipo === "atividade").length;
    const te = di.filter(i => i.tipo === "tema").length;

    const rm = typeof resumoMediaDisciplina === "function"
      ? resumoMediaDisciplina(d.id)
      : { texto: "—", classe: "" };

    return `
      <div class="item-timeline"
           style="cursor:pointer; border-left:4px solid ${d.cor};
                  padding-left:0.8rem;"
           onclick="abrirDisciplina(${d.id})">
        <span class="data-tag"
              style="background:${d.cor}22; color:${d.cor};
                     min-width:auto; padding:0.3rem 0.7rem;">📘</span>
        <div class="info">
          <strong>${escaparHtml(d.nome)}</strong>
          <small>🎯 ${ex} • 📝 ${at} • 📖 ${te} • ⏳ ${pend} pendente(s)</small>
        </div>
        <span class="media-mini ${rm.classe}" style="font-size:1.1rem;">
          ${rm.texto}
        </span>
      </div>
    `;
  }).join("");
}

/* ============ ORQUESTRADOR ============ */

function renderInicio() {
  renderHoje();
  renderProximos();
  renderStats();
  renderProgresso();
  renderAtrasadas();
  renderResumoDisciplinas();
}
