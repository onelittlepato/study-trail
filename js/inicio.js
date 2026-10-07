/* ============================================================
   STUDY TRAIL — inicio.js
   Home: Hoje, Próximos 7 dias, Stats, Resumo, Timeline + Calendário
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

/* ============ PRÓXIMOS 7 DIAS ============ */

function renderProximos() {
  const cont = document.getElementById("proximosContainer");
  if (!cont) return;

  const grupos = [];

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = formatarISO(d);

    const doDia = itens
      .filter(it => !it.concluida && pertenceAoDia(it, iso))
      .sort(compararDataPrioridade);

    if (doDia.length > 0) {
      grupos.push({ data: d, iso, itens: doDia, dias: i });
    }
  }

  if (grupos.length === 0) {
    cont.innerHTML = `
      <div class="proximos-box">
        <h2>🔮 Próximos 7 dias</h2>
        <p class="vazio" style="padding:1rem;">Nada agendado nos próximos 7 dias.</p>
      </div>
    `;
    return;
  }

  const totalItens = grupos.reduce((s, g) => s + g.itens.length, 0);

  cont.innerHTML = `
    <div class="proximos-box">
      <h2>🔮 Próximos 7 dias <span class="contador-secao">(${totalItens})</span></h2>
      ${grupos.map(g => `
        <div class="grupo-dia">
          <div class="titulo-dia">
            <span>${nomeDiaSemana(g.data.getDay())}, ${formatarBR(g.iso)}</span>
            <span class="qtd">${rotuloDia(g.dias)} • ${g.itens.length} item(ns)</span>
          </div>
          <ul>
            ${g.itens.map(t => {
              const cor = corDisciplina(t.disciplinaId);
              const inicioPeriodo = ehPeriodo(t) && t.dataInicio === g.iso;
              const label = inicioPeriodo ? "🚀 Início" : "";
              return `
                <li style="border-left:3px solid ${cor}; padding-left:0.6rem;">
                  <input type="checkbox" ${t.concluida ? "checked" : ""}
                         onchange="alternarItem(${t.id})">
                  <div class="info">
                    <strong>${escaparHtml(t.nome)}</strong>
                    <small>
                      📘 ${escaparHtml(nomeDisciplina(t.disciplinaId))}
                      • ${rotuloTipo(t.tipo)} • ${rotuloPrioridade(t.prioridade)}
                      ${label ? " • " + label : ""}
                    </small>
                  </div>
                </li>
              `;
            }).join("")}
          </ul>
        </div>
      `).join("")}
    </div>
  `;
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

/* ============ TIMELINE / CALENDÁRIO (toggle) ============ */

function mudarView(view) {
  viewTimeline = view;

  document.querySelectorAll("#viewToggle button").forEach(b => {
    b.classList.toggle("ativo", b.dataset.view === view);
  });

  const tl = document.getElementById("viewTimeline");
  const cal = document.getElementById("viewCalendario");
  if (!tl || !cal) return;

  if (view === "calendario") {
    tl.style.display = "none";
    cal.style.display = "block";
    renderCalendario();
  } else {
    tl.style.display = "block";
    cal.style.display = "none";
    renderTimeline();
  }
}

/* ============ TIMELINE ============ */

function renderTimeline() {
  const cont = document.getElementById("timeline");
  if (!cont) return;

  const comData = itens
    .filter(i => i.data || i.dataInicio)
    .sort(compararDataPrioridade);

  if (comData.length === 0) {
    cont.innerHTML = '<p class="vazio">Cadastre itens com data para vê-los aqui.</p>';
    return;
  }

  // agrupa por mês (usa primeiraData)
  const porMes = {};
  comData.forEach(t => {
    const iso = primeiraData(t);
    if (!iso || iso === "9999-12-31") return;
    const [ano, mes] = iso.split("-");
    const chave = `${ano}-${mes}`;
    if (!porMes[chave]) porMes[chave] = [];
    porMes[chave].push(t);
  });

  const hoje = hojeISO();

  cont.innerHTML = Object.entries(porMes).map(([chave, lista]) => {
    const [ano, mes] = chave.split("-");
    const pend = lista.filter(t => !t.concluida).length;

    const linhas = lista.map(t => {
      const cor = corDisciplina(t.disciplinaId);
      const passado = primeiraData(t) < hoje;

      // rótulo: data única ou intervalo
      const rotuloData = ehPeriodo(t)
        ? `${formatarBR(t.dataInicio)}–${formatarBR(t.dataFim)}`
        : formatarBR(t.data);

      return `
        <div class="item-timeline"
             style="border-left:3px solid ${cor}; padding-left:0.7rem;">
          <span class="data-tag"
                style="background:${cor}22; color:${cor};">
            ${rotuloData}
          </span>
          <div class="info">
            <strong class="${t.concluida ? 'concluida' : ''}">
              ${escaparHtml(t.nome)}
            </strong>
            <small>
              <span class="disc-tag" style="color:${cor};">
                📘 ${escaparHtml(nomeDisciplina(t.disciplinaId))}
              </span>
              • <span class="badge ${corTipo(t.tipo)}">${rotuloTipo(t.tipo)}</span>
              <span class="badge ${t.prioridade}">${rotuloPrioridade(t.prioridade)}</span>
              ${ehPeriodo(t) ? '<span class="badge periodo">📆</span>' : ""}
              ${passado && !t.concluida ? '<span class="badge atrasada">ATRASADA</span>' : ""}
            </small>
          </div>
          <input type="checkbox" ${t.concluida ? "checked" : ""}
                 onchange="alternarItem(${t.id})"
                 style="flex:0; min-width:auto; cursor:pointer;">
        </div>
      `;
    }).join("");

    return `
      <div class="mes-grupo">
        <div class="mes-titulo">
          <span>${nomeMes(parseInt(mes) - 1)} ${ano}</span>
          <span class="contador">${lista.length} item(ns) • ${pend} pendente(s)</span>
        </div>
        ${linhas}
      </div>
    `;
  }).join("");
}

/* ============ CALENDÁRIO ============ */

function mudarMesCal(delta) {
  mesCalendario.setMonth(mesCalendario.getMonth() + delta);
  renderCalendario();
}

function renderCalendario() {
  const grid = document.getElementById("calGrid");
  const titulo = document.getElementById("calTitulo");
  if (!grid || !titulo) return;

  const ano = mesCalendario.getFullYear();
  const mes = mesCalendario.getMonth();

  titulo.textContent = `${nomeMes(mes)} ${ano}`;

  // Cabeçalho (Seg..Dom)
  const cabecalho = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    .map(d => `<div class="cal-cabecalho">${d}</div>`)
    .join("");

  // Primeiro dia do mês e offset
  const primeiro = new Date(ano, mes, 1);
  const ultimo = new Date(ano, mes + 1, 0);
  const totalDias = ultimo.getDate();

  // Segunda-feira = 0
  let offset = primeiro.getDay() - 1;
  if (offset < 0) offset = 6;

  const hoje = hojeISO();
  const celulas = [];

  // Dias do mês anterior
  const mesAnteriorUltimo = new Date(ano, mes, 0).getDate();
  for (let i = offset - 1; i >= 0; i--) {
    const dia = mesAnteriorUltimo - i;
    const dObj = new Date(ano, mes - 1, dia);
    celulas.push({ iso: formatarISO(dObj), num: dia, fora: true });
  }

  // Dias do mês
  for (let d = 1; d <= totalDias; d++) {
    const dObj = new Date(ano, mes, d);
    celulas.push({ iso: formatarISO(dObj), num: d, fora: false });
  }

  // Completa até múltiplo de 7
  let proximo = 1;
  while (celulas.length % 7 !== 0) {
    const dObj = new Date(ano, mes + 1, proximo);
    celulas.push({ iso: formatarISO(dObj), num: proximo, fora: true });
    proximo++;
  }

  // Renderiza cada célula
  const diasHtml = celulas.map(c => {
    const doDia = itens
      .filter(it => pertenceAoDia(it, c.iso))
      .sort(compararDataPrioridade);

    const classeHoje = c.iso === hoje ? "hoje" : "";
    const classeFora = c.fora ? "fora-mes" : "";

    // Limita a 4 itens visíveis por dia
    const maxVisiveis = 4;
    const visiveis = doDia.slice(0, maxVisiveis);
    const restantes = doDia.length - visiveis.length;

    const itensHtml = visiveis.map(t => {
      const cor = corDisciplina(t.disciplinaId);
      const classeTipo = ehPeriodo(t) ? "periodo" : corTipo(t.tipo);
      const titulo = `${t.nome}\n📘 ${nomeDisciplina(t.disciplinaId)}\n${ehPeriodo(t)
        ? `📆 ${formatarBR(t.dataInicio)}–${formatarBR(t.dataFim)}`
        : `📅 ${formatarBR(t.data)}`}`;

      return `<div class="cal-item ${classeTipo} ${t.concluida ? 'concluida' : ''}"
                   style="background:${cor};"
                   title="${escaparHtml(titulo)}"
                   onclick="abrirDisciplina(${t.disciplinaId})">
                ${escaparHtml(t.nome)}
              </div>`;
    }).join("");

    const maisHtml = restantes > 0
      ? `<div style="font-size:0.65rem; color:var(--texto-fraco); text-align:center;">+${restantes} mais</div>`
      : "";

    return `
      <div class="cal-dia ${classeHoje} ${classeFora}">
        <div class="num-dia">${c.num}</div>
        ${itensHtml}
        ${maisHtml}
      </div>
    `;
  }).join("");

  grid.innerHTML = cabecalho + diasHtml;
}

/* ============ ORQUESTRADOR ============ */

function renderInicio() {
  renderHoje();
  renderProximos();
  renderStats();
  renderProgresso();
  renderAtrasadas();
  renderResumoDisciplinas();

  if (viewTimeline === "calendario") {
    renderCalendario();
  } else {
    renderTimeline();
  }
}
