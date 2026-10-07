/* ============================================================
   STUDY TRAIL — itens.js
   CRUD de temas, exames e atividades + formulários + render
   ============================================================ */

/* ============ PALETA DE CORES (usada também por disciplinas) ============ */
const PALETA_CORES = [
  "#4a6cf7", "#e74c3c", "#27ae60", "#f39c12",
  "#8e44ad", "#16a085", "#e67e22", "#2980b9",
  "#c0392b", "#d35400", "#2c3e50", "#7f8c8d"
];

/* ============ HELPERS ============ */
function nomeDisciplina(id) {
  const d = disciplinas.find(x => x.id === id);
  return d ? d.nome : "(Sem disciplina)";
}

function corDisciplina(id) {
  const d = disciplinas.find(x => x.id === id);
  return d ? d.cor : "#888";
}

/* ============ CRUD BÁSICO ============ */

/**
 * Cria um item novo (usado por Home e Disciplina).
 */
function criarItem({ disciplinaId, nome, tipo, data, dataInicio, dataFim, semana, prioridade, observacoes, temasVinculados }) {
  return {
    id: gerarId(),
    disciplinaId: disciplinaId ?? null,
    nome,
    tipo,
    data: data || "",
    dataInicio: dataInicio || "",
    dataFim: dataFim || "",
    semana: semana || "",
    prioridade: prioridade || "media",
    concluida: false,
    observacoes: observacoes || "",
    temasVinculados: temasVinculados || [],
    anexos: [],
    criadoEm: new Date().toISOString()
  };
}

/**
 * Alterna o status de concluído de um item.
 */
function alternarItem(id) {
  const i = itens.find(x => x.id === id);
  if (!i) return;
  i.concluida = !i.concluida;
  salvar();
  reRenderTudo();
}

/**
 * Remove um item e limpa referências em outros.
 */
function removerItem(id) {
  if (!confirmar("Remover este item?")) return;
  itens = itens.filter(x => x.id !== id);
  // limpa vínculos de outros itens
  itens.forEach(i => {
    if (i.temasVinculados) {
      i.temasVinculados = i.temasVinculados.filter(tid => tid !== id);
    }
  });
  salvar();
  reRenderTudo();
  mostrarToast("Item removido.", "");
}

/**
 * Edita as anotações (usa prompt por simplicidade).
 */
function editarObservacoes(id) {
  const i = itens.find(x => x.id === id);
  if (!i) return;
  const nova = prompt("Editar anotações:", i.observacoes || "");
  if (nova === null) return;
  i.observacoes = nova.trim();
  salvar();
  reRenderTudo();
}

/**
 * Abre/fecha o painel de anotações.
 */
function toggleNotas(id) {
  const el = document.getElementById("notas-" + id);
  if (el) el.classList.toggle("visivel");
}

/* ============ FORMULÁRIO DINÂMICO (HOME) ============ */

function selecionarTipoHome(tipo) {
  tipoSelecionadoHome = tipo;
  renderFormDinamicoHome();
  document.querySelectorAll("#tipoSelectorHome button").forEach(b => {
    b.classList.toggle("ativo", b.dataset.tipo === tipo);
  });
}

function renderFormDinamicoHome() {
  const form = document.getElementById("formDinamicoHome");
  if (!form) return;

  const opcoesDisciplinas = disciplinas.length === 0
    ? '<option value="">⚠️ Cadastre uma disciplina primeiro</option>'
    : '<option value="">— Sem disciplina —</option>' +
      disciplinas.map(d => `<option value="${d.id}">${escaparHtml(d.nome)}</option>`).join("");

  let html = "";

  const campoDisciplina = `
    <div class="campo">
      <label>📚 Disciplina</label>
      <select id="homeDisciplina" onchange="atualizarTemasDisponiveis('home')">
        ${opcoesDisciplinas}
      </select>
    </div>
  `;

  if (tipoSelecionadoHome === "tema") {
    html = `
      ${campoDisciplina}
      <div class="campo">
        <label>Nome do tema</label>
        <input type="text" id="homeNome" placeholder="Ex: Limites e continuidade">
      </div>

      <div class="campo">
        <label>Semana (opcional)</label>
        <input type="text" id="homeSemana" placeholder="Ex: Sem 3">
      </div>

      <div class="modo-data-toggle">
        <label><input type="radio" name="homeModo" value="sem-data" checked onchange="toggleModoData('home')"> 🚫 Sem data</label>
        <label><input type="radio" name="homeModo" value="unica" onchange="toggleModoData('home')"> 📅 Data única</label>
        <label><input type="radio" name="homeModo" value="periodo" onchange="toggleModoData('home')"> 📆 Período de dias</label>
      </div>

      <div id="homeModoUnica" style="display:none;">
        <div class="campo">
          <label>Data do tema</label>
          <input type="date" id="homeData">
        </div>
      </div>

      <div id="homeModoPeriodo" style="display:none;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
          <div class="campo">
            <label>Início</label>
            <input type="date" id="homeDataInicio">
          </div>
          <div class="campo">
            <label>Fim</label>
            <input type="date" id="homeDataFim">
          </div>
        </div>
      </div>

      <div class="campo">
        <label>Prioridade</label>
        <select id="homePrioridade">
          <option value="baixa">🟢 Baixa</option>
          <option value="media" selected>🟡 Média</option>
          <option value="alta">🔴 Alta</option>
        </select>
      </div>

      <div class="campo">
        <label>Notas / Anotações (opcional)</label>
        <textarea id="homeObs" placeholder="Fórmulas, links, lembretes..."></textarea>
      </div>
      <button class="btn" onclick="adicionarItemHome()">📖 Adicionar tema</button>
    `;
  } else {
    // exame e atividade compartilham layout (data ou período + temas vinculados)
    const labelData = tipoSelecionadoHome === "exame" ? "Data" : "Data de entrega";
    const labelTemas = tipoSelecionadoHome === "exame"
      ? "📖 Temas cobrados (opcional)"
      : "📖 Temas relacionados (opcional)";
    const labelBotao = tipoSelecionadoHome === "exame"
      ? "🎯 Adicionar exame"
      : "📝 Adicionar atividade";

    html = `
      ${campoDisciplina}
      <div class="campo">
        <label>Nome ${tipoSelecionadoHome === "exame" ? "do exame" : "da atividade"}</label>
        <input type="text" id="homeNome" placeholder="${tipoSelecionadoHome === "exame" ? "Ex: P1, Prova Final" : "Ex: Lista 1, Trabalho em grupo"}">
      </div>

      <div class="modo-data-toggle">
        <label><input type="radio" name="homeModo" value="unica" checked onchange="toggleModoData('home')"> 📅 Data única</label>
        <label><input type="radio" name="homeModo" value="periodo" onchange="toggleModoData('home')"> 📆 Período de dias</label>
      </div>

      <div id="homeModoUnica">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
          <div class="campo">
            <label>${labelData}</label>
            <input type="date" id="homeData">
          </div>
          <div class="campo">
            <label>Prioridade</label>
            <select id="homePrioridade">
              <option value="baixa">🟢 Baixa</option>
              <option value="media" selected>🟡 Média</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
        </div>
      </div>

      <div id="homeModoPeriodo" style="display:none;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
          <div class="campo">
            <label>Início</label>
            <input type="date" id="homeDataInicio">
          </div>
          <div class="campo">
            <label>Fim</label>
            <input type="date" id="homeDataFim">
          </div>
        </div>
        <div class="campo">
          <label>Prioridade</label>
          <select id="homePrioridadePeriodo">
            <option value="baixa">🟢 Baixa</option>
            <option value="media" selected>🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </select>
        </div>
      </div>

      <div class="campo">
        <label>${labelTemas}</label>
        <div id="temasContainer">
          <p style="font-size:0.85rem; color:var(--texto-fraco); padding:0.5rem;">Escolha uma disciplina acima.</p>
        </div>
      </div>
      <div class="campo">
        <label>Notas / Anotações (opcional)</label>
        <textarea id="homeObs" placeholder="Conteúdo, sala, dicas..."></textarea>
      </div>
      <button class="btn" onclick="adicionarItemHome()">${labelBotao}</button>
    `;
  }

  form.innerHTML = html;

  // duplica o select de prioridade (um por modo) para simplificar leitura
  sincronizarPrioridade('home');

  if (tipoSelecionadoHome !== "tema") {
    atualizarTemasDisponiveis("home");
  }
}

/* ============ FORMULÁRIO DINÂMICO (DISCIPLINA) ============ */

function selecionarTipoDisc(tipo) {
  tipoSelecionadoDisc = tipo;
  renderFormDinamicoDisc(disciplinaAberta);
  document.querySelectorAll("#tipoSelectorDisc button").forEach(b => {
    b.classList.toggle("ativo", b.dataset.tipo === tipo);
  });
}

function renderFormDinamicoDisc(disciplinaId) {
  const form = document.getElementById("formDinamicoDisc");
  if (!form || !disciplinaId) return;

  const temasDisponiveis = itens.filter(i =>
    i.disciplinaId === disciplinaId && i.tipo === "tema"
  );

  let html = "";

  if (tipoSelecionadoDisc === "tema") {
    html = `
      <div class="campo">
        <label>Nome do tema</label>
        <input type="text" id="discNomeItem" placeholder="Ex: Limites e continuidade">
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
        <div class="campo">
          <label>Semana</label>
          <input type="text" id="discSemana" placeholder="Ex: Sem 3">
        </div>
        <div class="campo">
          <label>Prioridade</label>
          <select id="discPrioridade">
            <option value="baixa">🟢 Baixa</option>
            <option value="media" selected>🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </select>
        </div>
      </div>
      <div class="campo">
        <label>Notas / Anotações (opcional)</label>
        <textarea id="discObs" placeholder="Fórmulas, links, lembretes..."></textarea>
      </div>
      <button class="btn" onclick="adicionarItemDisc(${disciplinaId})">📖 Adicionar tema</button>
    `;
  } else {
    const labelData = tipoSelecionadoDisc === "exame" ? "Data" : "Data de entrega";
    const labelTemas = tipoSelecionadoDisc === "exame"
      ? "📖 Temas cobrados neste exame (opcional)"
      : "📖 Temas relacionados (opcional)";
    const labelBotao = tipoSelecionadoDisc === "exame"
      ? "🎯 Adicionar exame"
      : "📝 Adicionar atividade";

    const checkTemas = temasDisponiveis.length === 0
      ? '<p style="font-size:0.85rem; color:var(--texto-fraco); padding:0.5rem;">Nenhum tema cadastrado ainda.</p>'
      : `<div class="check-temas">
          ${temasDisponiveis.map(t => `
            <label>
              <input type="checkbox" value="${t.id}" class="tema-check-disc">
              ${escaparHtml(t.nome)} ${t.semana ? `<small style="color:var(--texto-fraco);">(${escaparHtml(t.semana)})</small>` : ""}
            </label>
          `).join("")}
        </div>`;

    html = `
      <div class="campo">
        <label>Nome ${tipoSelecionadoDisc === "exame" ? "do exame" : "da atividade"}</label>
        <input type="text" id="discNomeItem" placeholder="${tipoSelecionadoDisc === "exame" ? "Ex: P1, Prova Final" : "Ex: Lista 1, Trabalho em grupo"}">
      </div>

      <div class="modo-data-toggle">
        <label><input type="radio" name="discModo" value="unica" checked onchange="toggleModoData('disc')"> 📅 Data única</label>
        <label><input type="radio" name="discModo" value="periodo" onchange="toggleModoData('disc')"> 📆 Período de dias</label>
      </div>

      <div id="discModoUnica">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
          <div class="campo">
            <label>${labelData}</label>
            <input type="date" id="discData">
          </div>
          <div class="campo">
            <label>Prioridade</label>
            <select id="discPrioridade">
              <option value="baixa">🟢 Baixa</option>
              <option value="media" selected>🟡 Média</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
        </div>
      </div>

      <div id="discModoPeriodo" style="display:none;">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
          <div class="campo">
            <label>Início</label>
            <input type="date" id="discDataInicio">
          </div>
          <div class="campo">
            <label>Fim</label>
            <input type="date" id="discDataFim">
          </div>
        </div>
        <div class="campo">
          <label>Prioridade</label>
          <select id="discPrioridadePeriodo">
            <option value="baixa">🟢 Baixa</option>
            <option value="media" selected>🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </select>
        </div>
      </div>

      <div class="campo">
        <label>${labelTemas}</label>
        ${checkTemas}
      </div>
      <div class="campo">
        <label>Notas / Anotações (opcional)</label>
        <textarea id="discObs" placeholder="Detalhes, requisitos, links..."></textarea>
      </div>
      <button class="btn" onclick="adicionarItemDisc(${disciplinaId})">${labelBotao}</button>
    `;
  }

  form.innerHTML = html;
}

/* ============ HELPERS DE MODO DATA / PERÍODO ============ */

/**
 * Alterna entre modo "unica" e "periodo" no formulário.
 */
function toggleModoData(escopo) {
  const unica = document.getElementById(escopo + "ModoUnica");
  const periodo = document.getElementById(escopo + "ModoPeriodo");
  const radio = document.querySelector(`input[name="${escopo}Modo"]:checked`);
  if (!unica || !periodo || !radio) return;

  if (radio.value === "periodo") {
    unica.style.display = "none";
    periodo.style.display = "block";
  } else {
    unica.style.display = "block";
    periodo.style.display = "none";
  }
}

/**
 * Sincroniza as prioridades entre os dois selects (unica e periodo)
 * para que escolher uma prioridade num modo reflita no outro.
 */
function sincronizarPrioridade(escopo) {
  const sUnica = document.getElementById(escopo + "Prioridade");
  const sPeriodo = document.getElementById(escopo + "PrioridadePeriodo");
  if (!sUnica || !sPeriodo) return;

  sUnica.addEventListener("change", () => { sPeriodo.value = sUnica.value; });
  sPeriodo.addEventListener("change", () => { sUnica.value = sPeriodo.value; });
}

/**
 * Lê o modo atual do formulário e retorna os campos de data/prioridade.
 */
function lerModoData(escopo) {
  const radio = document.querySelector(`input[name="${escopo}Modo"]:checked`);
  const modo = radio ? radio.value : "unica";

  if (modo === "periodo") {
    return {
      modo: "periodo",
      dataInicio: document.getElementById(escopo + "DataInicio")?.value || "",
      dataFim: document.getElementById(escopo + "DataFim")?.value || "",
      data: "",
      prioridade: document.getElementById(escopo + "PrioridadePeriodo")?.value || "media"
    };
  }
  return {
    modo: "unica",
    data: document.getElementById(escopo + "Data")?.value || "",
    dataInicio: "",
    dataFim: "",
    prioridade: document.getElementById(escopo + "Prioridade")?.value || "media"
  };
}

/* ============ ADICIONAR VIA HOME ============ */

function adicionarItemHome() {
  const discIdStr = document.getElementById("homeDisciplina")?.value || "";
  const disciplinaId = discIdStr ? parseInt(discIdStr) : null;
  const nome = (document.getElementById("homeNome")?.value || "").trim();

  if (!nome) {
    mostrarToast("Digite o nome do item.", "aviso");
    return;
  }

  // Tema: pode ter data, período, ou nenhum dos dois
  if (tipoSelecionadoHome === "tema") {
    const semana = document.getElementById("homeSemana")?.value.trim() || "";
    const prioridade = document.getElementById("homePrioridade")?.value || "media";
    const obs = document.getElementById("homeObs")?.value.trim() || "";
    const dados = lerModoData("home");

    // Validações de período
    if (dados.modo === "periodo") {
      if (!dados.dataInicio || !dados.dataFim) {
        mostrarToast("Preencha início e fim do período.", "aviso");
        return;
      }
      if (dados.dataFim < dados.dataInicio) {
        mostrarToast("Data final antes da inicial.", "aviso");
        return;
      }
    }

    itens.push(criarItem({
      disciplinaId, nome,
      tipo: "tema",
      data: dados.modo === "unica" ? dados.data : "",
      dataInicio: dados.modo === "periodo" ? dados.dataInicio : "",
      dataFim: dados.modo === "periodo" ? dados.dataFim : "",
      semana,
      prioridade,
      observacoes: obs
    }));
  } else {
    const dados = lerModoData("home");
    const obs = document.getElementById("homeObs")?.value.trim() || "";

    if (dados.modo === "periodo" && (!dados.dataInicio || !dados.dataFim)) {
      mostrarToast("Preencha início e fim do período.", "aviso");
      return;
    }
    if (dados.modo === "periodo" && dados.dataFim < dados.dataInicio) {
      mostrarToast("Data final antes da inicial.", "aviso");
      return;
    }

    const temasVinculados = [];
    document.querySelectorAll(".tema-check-home:checked").forEach(c => {
      temasVinculados.push(parseInt(c.value));
    });

    itens.push(criarItem({
      disciplinaId, nome,
      tipo: tipoSelecionadoHome,
      data: dados.data,
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim,
      prioridade: dados.prioridade,
      observacoes: obs,
      temasVinculados
    }));
  }

  salvar();
  renderFormDinamicoHome();
  reRenderTudo();
  mostrarToast("✅ Item adicionado!", "sucesso");
}

/* ============ ADICIONAR VIA DISCIPLINA ============ */

function adicionarItemDisc(disciplinaId) {
  const nome = (document.getElementById("discNomeItem")?.value || "").trim();
  if (!nome) {
    mostrarToast("Digite o nome do item.", "aviso");
    return;
  }

  if (tipoSelecionadoDisc === "tema") {
    const semana = document.getElementById("discSemana")?.value.trim() || "";
    const prioridade = document.getElementById("discPrioridade")?.value || "media";
    const obs = document.getElementById("discObs")?.value.trim() || "";

    itens.push(criarItem({
      disciplinaId, nome,
      tipo: "tema", semana, prioridade, observacoes: obs
    }));
  } else {
    const dados = lerModoData("disc");
    const obs = document.getElementById("discObs")?.value.trim() || "";

    if (dados.modo === "periodo" && (!dados.dataInicio || !dados.dataFim)) {
      mostrarToast("Preencha início e fim do período.", "aviso");
      return;
    }
    if (dados.modo === "periodo" && dados.dataFim < dados.dataInicio) {
      mostrarToast("Data final antes da inicial.", "aviso");
      return;
    }

    const temasVinculados = [];
    document.querySelectorAll(".tema-check-disc:checked").forEach(c => {
      temasVinculados.push(parseInt(c.value));
    });

    itens.push(criarItem({
      disciplinaId, nome,
      tipo: tipoSelecionadoDisc,
      data: dados.data,
      dataInicio: dados.dataInicio,
      dataFim: dados.dataFim,
      prioridade: dados.prioridade,
      observacoes: obs,
      temasVinculados
    }));
  }

  salvar();
  renderPaginaDisciplina(disciplinaId);
  reRenderTudo();
  mostrarToast("✅ Item adicionado!", "sucesso");
}

/* ============ TEMAS DISPONÍVEIS (checkbox) ============ */

function atualizarTemasDisponiveis(escopo) {
  const cont = document.getElementById("temasContainer");
  if (!cont || escopo !== "home") return;

  const discId = parseInt(document.getElementById("homeDisciplina")?.value || "0");
  if (!discId) {
    cont.innerHTML = '<p style="font-size:0.85rem; color:var(--texto-fraco); padding:0.5rem;">Escolha uma disciplina acima.</p>';
    return;
  }

  const temas = itens.filter(i => i.disciplinaId === discId && i.tipo === "tema");
  if (temas.length === 0) {
    cont.innerHTML = '<p style="font-size:0.85rem; color:var(--texto-fraco); padding:0.5rem;">Nenhum tema cadastrado nesta disciplina ainda.</p>';
    return;
  }

  cont.innerHTML = `<div class="check-temas">
    ${temas.map(t => `
      <label>
        <input type="checkbox" value="${t.id}" class="tema-check-home">
        ${escaparHtml(t.nome)} ${t.semana ? `<small style="color:var(--texto-fraco);">(${escaparHtml(t.semana)})</small>` : ""}
      </label>
    `).join("")}
  </div>`;
}

/* ============ RENDER: ITEM CARD (dentro da disciplina) ============ */

function renderItemCard(item, temasTodos, exames, atividades, corDisc) {
  const hoje = hojeISO();
  const atrasado = itemEhAtrasado(item);
  const temObs = item.observacoes && item.observacoes.trim().length > 0;
  const temAnexos = item.anexos && item.anexos.length > 0;

  // vínculos
  let vinculosHtml = "";

  if (item.tipo === "tema") {
    const usadosEm = [...exames, ...atividades].filter(x =>
      x.temasVinculados && x.temasVinculados.includes(item.id)
    );
    if (usadosEm.length > 0) {
      vinculosHtml = `
        <div class="item-vinculos">
          ${usadosEm.map(x => `
            <span class="vinculo-chip ${x.tipo === 'exame' ? 'exame' : ''}">
              ${x.tipo === 'exame' ? '🎯' : '📝'} ${escaparHtml(x.nome)}
            </span>
          `).join("")}
        </div>`;
    }
  } else {
    const nomes = (item.temasVinculados || [])
      .map(tid => itens.find(x => x.id === tid))
      .filter(Boolean);
    if (nomes.length > 0) {
      vinculosHtml = `
        <div class="item-vinculos">
          ${nomes.map(t => `
            <span class="vinculo-chip">📖 ${escaparHtml(t.nome)}${t.semana ? ' (' + escaparHtml(t.semana) + ')' : ''}</span>
          `).join("")}
        </div>`;
    }
  }

  // meta (data ou período, semana, prioridade, atraso)
  const metaHtml = [];
  if (ehPeriodo(item)) {
    metaHtml.push(`<span class="badge periodo">📆 ${formatarBR(item.dataInicio)} – ${formatarBR(item.dataFim)}</span>`);
  } else if (item.data) {
    metaHtml.push("📅 " + formatarBR(item.data));
  }
  if (item.semana) metaHtml.push(`<span class="badge tema">${escaparHtml(item.semana)}</span>`);
  if (atrasado) metaHtml.push('<span class="badge atrasada">ATRASADA</span>');

  return `
    <div class="item-card ${item.tipo} ${item.concluida ? 'concluida' : ''}" style="border-left-color:${corDisc};">
      <div class="item-header">
        <input type="checkbox" ${item.concluida ? "checked" : ""}
               onchange="alternarItem(${item.id})">
        <div class="titulo">
          <strong class="${item.concluida ? 'concluida' : ''}">${escaparHtml(item.nome)}</strong>
          <small>
            ${metaHtml.join(" • ")}
            • <span class="badge ${item.prioridade}">${rotuloPrioridade(item.prioridade)}</span>
            ${temAnexos ? ` • <span style="color:${corDisc}; font-weight:600;">📎 ${item.anexos.length}</span>` : ""}
          </small>
        </div>
        <div class="item-acoes">
          <button class="btn neutro pequeno" onclick="toggleNotas(${item.id})" title="Ver anotações">📓</button>
          <button class="btn neutro pequeno" onclick="editarObservacoes(${item.id})" title="Editar anotações">✏️</button>
          <button class="btn neutro pequeno" onclick="toggleAnexos(${item.id})" title="Anexos">📎</button>
          <button class="btn perigo pequeno" onclick="removerItem(${item.id})">🗑️</button>
        </div>
      </div>
      ${vinculosHtml}
      <div class="item-notas ${temObs ? 'visivel' : ''}" id="notas-${item.id}">
        <span class="rotulo-nota">📓 Anotações</span>
        ${temObs ? escaparHtml(item.observacoes) : '<em style="color:var(--texto-fraco);">Sem anotações. Clique em ✏️ para adicionar.</em>'}
      </div>
      <div class="anexos-area" id="anexos-${item.id}">
        <span class="rotulo-nota" style="color:${corDisc};">📎 Anexos e links</span>
        ${renderAnexos(item.id)}
      </div>
    </div>
  `;
}

/* ============ HELPERS DE STATUS ============ */

/**
 * Verifica se um item está atrasado (só faz sentido para data/período).
 */
function itemEhAtrasado(item) {
  if (item.concluida) return false;
  const hoje = hojeISO();
  if (ehPeriodo(item)) return item.dataFim < hoje;
  return !!item.data && item.data < hoje;
}

/**
 * Re-renderiza todas as áreas que dependem do estado global.
 */
function reRenderTudo() {
  if (typeof renderInicio === "function") renderInicio();
  if (typeof renderListaDisciplinas === "function") renderListaDisciplinas();
  if (typeof renderSemana === "function") renderSemana();
  if (typeof renderNotas === "function") renderNotas();
  if (disciplinaAberta && typeof renderPaginaDisciplina === "function") {
    renderPaginaDisciplina(disciplinaAberta);
  }
}
