/* ============================================================
   STUDY TRAIL — tema-pagina.js
   Página dedicada a cada tema de estudo
   ============================================================ */

/* ============ NAVEGAÇÃO ============ */

/**
 * Abre a página de um tema específico.
 */
function abrirTema(temaId) {
  const t = itens.find(x => x.id === temaId && x.tipo === "tema");
  if (!t) {
    mostrarToast("Tema não encontrado.", "erro");
    return;
  }

  temaAberto = temaId;

  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  document.getElementById("paginaTema").classList.add("ativa");
  document.querySelectorAll("#navPrincipal button").forEach(b => b.classList.remove("ativo"));

  renderPaginaTema(temaId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Volta para a disciplina do tema aberto.
 */
function voltarParaDisciplina() {
  const t = itens.find(x => x.id === temaAberto);
  const discId = t?.disciplinaId;

  temaAberto = null;

  if (discId) {
    abrirDisciplina(discId);
  } else {
    // se não tem disciplina, volta pra lista
    voltarParaDisciplinas();
  }
}

/* ============ RENDER PRINCIPAL ============ */

function renderPaginaTema(temaId) {
  const tema = itens.find(x => x.id === temaId);
  if (!tema) return voltarParaDisciplina();

  const d = disciplinas.find(x => x.id === tema.disciplinaId);
  const corDisc = d ? d.cor : "#888";

  // Exames e atividades que têm este tema vinculado
  const exames = itens.filter(i =>
    i.tipo === "exame" && (i.temasVinculados || []).includes(temaId)
  ).sort(compararDataPrioridade);

  const atividades = itens.filter(i =>
    i.tipo === "atividade" && (i.temasVinculados || []).includes(temaId)
  ).sort(compararDataPrioridade);

  const totalVinculados = exames.length + atividades.length;
  const temObs = tema.observacoes && tema.observacoes.trim().length > 0;
  const temAnexos = tema.anexos && tema.anexos.length > 0;

  // Meta: data/período + semana + prioridade
  const metaHtml = [];
  if (ehPeriodo(tema)) {
    const dur = duracaoPeriodo(tema);
    metaHtml.push(`<span class="badge periodo">📆 ${formatarBR(tema.dataInicio)} – ${formatarBR(tema.dataFim)} (${dur} dias)</span>`);
  } else if (tema.data) {
    metaHtml.push(`<span class="badge">📅 ${formatarBR(tema.data)}</span>`);
  }
  if (tema.semana) metaHtml.push(`<span class="badge tema">${escaparHtml(tema.semana)}</span>`);
  if (tema.concluida) metaHtml.push(`<span class="badge baixa">✅ Concluído</span>`);

  const container = document.getElementById("conteudoTema");

  container.innerHTML = `
    <!-- Header do tema -->
    <div class="tema-header" style="background:${corDisc};">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <h2 style="margin-bottom:0.3rem;">
            ${tema.concluida ? "✅" : "📖"} ${escaparHtml(tema.nome)}
          </h2>
          <p style="opacity:0.9; font-size:0.9rem;">
            ${d ? "📘 " + escaparHtml(d.nome) : "Sem disciplina"}
            ${d?.professor ? " • 👤 " + escaparHtml(d.professor) : ""}
          </p>
        </div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          <button class="btn pequeno" style="background:rgba(255,255,255,0.2);"
                  onclick="alternarItem(${tema.id})"
                  title="${tema.concluida ? 'Desmarcar concluído' : 'Marcar como concluído'}">
            ${tema.concluida ? "↩️ Reabrir" : "✅ Concluir"}
          </button>
          <button class="btn pequeno" style="background:rgba(255,255,255,0.2);"
                  onclick="editarTemaInline(${tema.id})"
                  title="Editar">✏️ Editar</button>
          <button class="btn pequeno" style="background:rgba(255,255,255,0.2);"
                  onclick="removerTemaComConfirmacao(${tema.id})"
                  title="Excluir">🗑️</button>
        </div>
      </div>

      ${metaHtml.length > 0 ? `
        <div style="margin-top:0.8rem; display:flex; gap:0.4rem; flex-wrap:wrap;">
          ${metaHtml.join(" ")}
        </div>
      ` : ""}
    </div>

    <!-- Resumo rápido -->
    <div class="grid-cards">
      <div class="stat exames">
        <div class="num">${exames.length}</div>
        <div class="rotulo">Exames</div>
      </div>
      <div class="stat atividades">
        <div class="num">${atividades.length}</div>
        <div class="rotulo">Atividades</div>
      </div>
      <div class="stat total">
        <div class="num">${temAnexos ? tema.anexos.length : 0}</div>
        <div class="rotulo">Anexos</div>
      </div>
    </div>

    <!-- Anotações -->
    <div class="card">
      <h2>📓 Anotações
        <button class="btn pequeno neutro" style="float:right;"
                onclick="toggleEditarAnotacoesTema(${tema.id})"
                id="btnEditarObsTema">
          ✏️ Editar
        </button>
      </h2>

      <div id="obsTemaView" style="white-space:pre-wrap; padding:0.5rem 0; min-height:40px; color:${temObs ? 'var(--texto)' : 'var(--texto-fraco)'};">
        ${temObs ? escaparHtml(tema.observacoes) : "<em>Sem anotações ainda. Clique em ✏️ Editar para adicionar.</em>"}
      </div>

      <div id="obsTemaEdit" style="display:none;">
        <textarea id="obsTemaTextarea"
                  placeholder="Fórmulas, resumos, links, dúvidas..."
                  style="width:100%; min-height:140px; margin-bottom:0.5rem;">${escaparHtml(tema.observacoes || "")}</textarea>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn" onclick="salvarAnotacoesTema(${tema.id})">💾 Salvar</button>
          <button class="btn neutro" onclick="cancelarEditarAnotacoesTema()">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Anexos -->
    <div class="card">
      <h2>📎 Anexos e links <span class="contador-secao">(${temAnexos ? tema.anexos.length : 0})</span></h2>
      ${renderAnexos(tema.id)}
    </div>

    <!-- Exames relacionados -->
    <div class="card">
      <h2>🎯 Exames que cobram este tema <span class="contador-secao">(${exames.length})</span></h2>
      ${exames.length === 0
        ? '<p class="vazio">Nenhum exame vinculado ainda.</p>'
        : '<div>' + exames.map(e => renderItemRelacionado(e, corDisc)).join("") + '</div>'
      }
    </div>

    <!-- Atividades relacionadas -->
    <div class="card">
      <h2>📝 Atividades relacionadas <span class="contador-secao">(${atividades.length})</span></h2>
      ${atividades.length === 0
        ? '<p class="vazio">Nenhuma atividade vinculada ainda.</p>'
        : '<div>' + atividades.map(a => renderItemRelacionado(a, corDisc)).join("") + '</div>'
      }
    </div>

    <!-- Ações rápidas -->
    <div class="add-panel">
      <h3>➕ Adicionar item já vinculado a este tema</h3>
      <div class="tipo-selector" id="tipoSelectorTema">
        <button data-tipo="exame" onclick="selecionarTipoTema('exame')">
          <span class="icone">🎯</span><span>Novo exame</span>
        </button>
        <button data-tipo="atividade" onclick="selecionarTipoTema('atividade')">
          <span class="icone">📝</span><span>Nova atividade</span>
        </button>
      </div>
      <div id="formDinamicoTema"></div>
    </div>
  `;

  // inicia no tipo "exame"
  selecionarTipoTema("exame");
}

/* ============ ANOTAÇÕES INLINE ============ */

function toggleEditarAnotacoesTema(temaId) {
  const view = document.getElementById("obsTemaView");
  const edit = document.getElementById("obsTemaEdit");
  const btn = document.getElementById("btnEditarObsTema");
  if (!view || !edit) return;

  const editando = edit.style.display !== "none";
  if (editando) {
    view.style.display = "block";
    edit.style.display = "none";
    if (btn) btn.textContent = "✏️ Editar";
  } else {
    view.style.display = "none";
    edit.style.display = "block";
    if (btn) btn.textContent = "👁️ Ver";
    document.getElementById("obsTemaTextarea")?.focus();
  }
}

function salvarAnotacoesTema(temaId) {
  const t = itens.find(x => x.id === temaId);
  if (!t) return;
  const txt = document.getElementById("obsTemaTextarea")?.value || "";
  t.observacoes = txt;
  salvar();
  renderPaginaTema(temaId);
  mostrarToast("📓 Anotações salvas!", "sucesso");
}

function cancelarEditarAnotacoesTema() {
  const view = document.getElementById("obsTemaView");
  const edit = document.getElementById("obsTemaEdit");
  const btn = document.getElementById("btnEditarObsTema");
  if (view) view.style.display = "block";
  if (edit) edit.style.display = "none";
  if (btn) btn.textContent = "✏️ Editar";
}

/* ============ EDITAR TEMA INLINE ============ */

function editarTemaInline(temaId) {
  const t = itens.find(x => x.id === temaId);
  if (!t) return;

  const nome = prompt("Nome do tema:", t.nome);
  if (nome === null) return;
  const semana = prompt("Semana (opcional, ex: Sem 3):", t.semana || "");
  if (semana === null) return;

  t.nome = nome.trim() || t.nome;
  t.semana = semana.trim();

  salvar();
  renderPaginaTema(temaId);
  reRenderTudo();
  mostrarToast("Tema atualizado.", "sucesso");
}

/* ============ REMOVER TEMA ============ */

function removerTemaComConfirmacao(temaId) {
  const t = itens.find(x => x.id === temaId);
  if (!t) return;

  const vinculados = itens.filter(i =>
    i.temasVinculados && i.temasVinculados.includes(temaId)
  ).length;

  const msg = vinculados > 0
    ? `Remover o tema "${t.nome}"?\n\nEle está vinculado a ${vinculados} item(ns).\nO vínculo será removido automaticamente.`
    : `Remover o tema "${t.nome}"?`;

  if (!confirmar(msg)) return;

  const discId = t.disciplinaId;

  // Remove o tema
  itens = itens.filter(x => x.id !== temaId);
  // Limpa vínculos em outros itens
  itens.forEach(i => {
    if (i.temasVinculados) {
      i.temasVinculados = i.temasVinculados.filter(tid => tid !== temaId);
    }
  });

  salvar();
  mostrarToast("Tema removido.", "");

  // Volta para a disciplina
  if (discId) {
    abrirDisciplina(discId);
  } else {
    voltarParaDisciplinas();
  }
}

/* ============ ITEM RELACIONADO (exame/atividade) ============ */

function renderItemRelacionado(item, corDisc) {
  const hoje = hojeISO();
  const atrasado = itemEhAtrasado(item);

  const rotuloData = ehPeriodo(item)
    ? `📆 ${formatarBR(item.dataInicio)} – ${formatarBR(item.dataFim)}`
    : item.data
      ? `📅 ${formatarBR(item.data)}`
      : "Sem data";

  return `
    <div class="item-card ${item.tipo} ${item.concluida ? 'concluida' : ''}"
         style="border-left-color:${corDisc}; cursor:pointer;"
         onclick="abrirItemParaEditar(${item.id})">
      <div class="item-header">
        <input type="checkbox" ${item.concluida ? "checked" : ""}
               onclick="event.stopPropagation(); alternarItem(${item.id})"
               style="margin-top:0.3rem;">
        <div class="titulo">
          <strong class="${item.concluida ? 'concluida' : ''}">
            ${item.tipo === "exame" ? "🎯" : "📝"} ${escaparHtml(item.nome)}
          </strong>
          <small>
            ${rotuloData}
            • <span class="badge ${item.prioridade}">${rotuloPrioridade(item.prioridade)}</span>
            ${atrasado ? ' • <span class="badge atrasada">ATRASADA</span>' : ""}
          </small>
        </div>
        <button class="btn neutro pequeno"
                onclick="event.stopPropagation(); desvincularTema(${item.id}, ${temaAberto})"
                title="Desvincular deste tema">
          ✂️
        </button>
      </div>
    </div>
  `;
}

/**
 * Ao clicar num item relacionado, abre a disciplina dele.
 */
function abrirItemParaEditar(itemId) {
  const item = itens.find(x => x.id === itemId);
  if (!item) return;
  if (item.disciplinaId) {
    abrirDisciplina(item.disciplinaId);
  }
}

/**
 * Remove o vínculo entre item e tema.
 */
function desvincularTema(itemId, temaId) {
  const item = itens.find(x => x.id === itemId);
  if (!item) return;
  item.temasVinculados = (item.temasVinculados || []).filter(id => id !== temaId);
  salvar();
  renderPaginaTema(temaId);
  reRenderTudo();
  mostrarToast("Vínculo removido.", "");
}

/* ============ FORMULÁRIO: NOVO ITEM VINCULADO ============ */

let tipoSelecionadoTema = "exame";

function selecionarTipoTema(tipo) {
  tipoSelecionadoTema = tipo;
  renderFormDinamicoTema(temaAberto);
  document.querySelectorAll("#tipoSelectorTema button").forEach(b => {
    b.classList.toggle("ativo", b.dataset.tipo === tipo);
  });
}

function renderFormDinamicoTema(temaId) {
  const form = document.getElementById("formDinamicoTema");
  if (!form || !temaId) return;

  const tema = itens.find(x => x.id === temaId);
  if (!tema) return;

  const isExame = tipoSelecionadoTema === "exame";
  const labelData = isExame ? "Data do exame" : "Data de entrega";
  const labelBotao = isExame ? "🎯 Adicionar exame" : "📝 Adicionar atividade";

  form.innerHTML = `
    <div class="campo">
      <label>Nome ${isExame ? "do exame" : "da atividade"}</label>
      <input type="text" id="temaItemNome"
             placeholder="${isExame ? 'Ex: P1, Prova Final' : 'Ex: Lista 1, Trabalho em grupo'}">
    </div>

    <div class="modo-data-toggle">
      <label><input type="radio" name="temaModo" value="unica" checked onchange="toggleModoData('tema')"> 📅 Data única</label>
      <label><input type="radio" name="temaModo" value="periodo" onchange="toggleModoData('tema')"> 📆 Período</label>
    </div>

    <div id="temaModoUnica">
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
        <div class="campo">
          <label>${labelData}</label>
          <input type="date" id="temaData">
        </div>
        <div class="campo">
          <label>Prioridade</label>
          <select id="temaPrioridade">
            <option value="baixa">🟢 Baixa</option>
            <option value="media" selected>🟡 Média</option>
            <option value="alta">🔴 Alta</option>
          </select>
        </div>
      </div>
    </div>

    <div id="temaModoPeriodo" style="display:none;">
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem;">
        <div class="campo">
          <label>Início</label>
          <input type="date" id="temaDataInicio">
        </div>
        <div class="campo">
          <label>Fim</label>
          <input type="date" id="temaDataFim">
        </div>
      </div>
      <div class="campo">
        <label>Prioridade</label>
        <select id="temaPrioridadePeriodo">
          <option value="baixa">🟢 Baixa</option>
          <option value="media" selected>🟡 Média</option>
          <option value="alta">🔴 Alta</option>
        </select>
      </div>
    </div>

    <div class="campo">
      <label>Notas / Anotações (opcional)</label>
      <textarea id="temaObs" placeholder="Detalhes, requisitos, links..."></textarea>
    </div>

    <p style="font-size:0.85rem; color:var(--texto-fraco); margin-bottom:0.8rem;">
      💡 Este item será automaticamente vinculado ao tema <strong>${escaparHtml(tema.nome)}</strong>.
    </p>

    <button class="btn" onclick="adicionarItemNoTema(${temaId})">${labelBotao}</button>
  `;

  sincronizarPrioridade("tema");
}

function adicionarItemNoTema(temaId) {
  const tema = itens.find(x => x.id === temaId);
  if (!tema) return;

  const nome = (document.getElementById("temaItemNome")?.value || "").trim();
  if (!nome) {
    mostrarToast("Digite o nome do item.", "aviso");
    return;
  }

  const dados = lerModoData("tema");
  const obs = document.getElementById("temaObs")?.value.trim() || "";

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
    disciplinaId: tema.disciplinaId,
    nome,
    tipo: tipoSelecionadoTema,
    data: dados.modo === "unica" ? dados.data : "",
    dataInicio: dados.modo === "periodo" ? dados.dataInicio : "",
    dataFim: dados.modo === "periodo" ? dados.dataFim : "",
    prioridade: dados.prioridade,
    observacoes: obs,
    temasVinculados: [temaId]      // ← já vinculado!
  }));

  salvar();
  renderPaginaTema(temaId);
  reRenderTudo();
  mostrarToast(`✅ ${tipoSelecionadoTema === "exame" ? "Exame" : "Atividade"} adicionado(a)!`, "sucesso");
}
