/* ============================================================
   STUDY TRAIL — disciplinas.js
   CRUD de disciplinas + página dedicada (com busca)
   ============================================================ */

/* ============ ESTADO LOCAL ============ */
let corNova = PALETA_CORES[0];

/* ============ PALETA ============ */
function renderPaleta() {
  const cont = document.getElementById("paletaNova");
  if (!cont) return;
  cont.innerHTML = PALETA_CORES.map(c => `
    <button type="button"
            style="background:${c};"
            class="${c === corNova ? 'selecionada' : ''}"
            onclick="selecionarCor('${c}')"
            aria-label="Cor ${c}"></button>
  `).join("");
}

function selecionarCor(c) {
  corNova = c;
  renderPaleta();
}

/* ============ CRUD ============ */

function adicionarDisciplina() {
  const nome = document.getElementById("discNome")?.value.trim();
  const professor = document.getElementById("discProfessor")?.value.trim() || "";
  const horario = document.getElementById("discHorario")?.value.trim() || "";
  const semestre = document.getElementById("discSemestre")?.value.trim() || "";

  if (!nome) {
    mostrarToast("Digite o nome da disciplina.", "aviso");
    return;
  }

  disciplinas.push({
    id: gerarId(),
    nome,
    professor,
    horario,
    semestre,
    cor: corNova,
    criadoEm: new Date().toISOString()
  });

  document.getElementById("discNome").value = "";
  document.getElementById("discProfessor").value = "";
  document.getElementById("discHorario").value = "";

  // próxima cor da paleta (alterna automaticamente)
  const idx = PALETA_CORES.indexOf(corNova);
  corNova = PALETA_CORES[(idx + 1) % PALETA_CORES.length];
  renderPaleta();

  salvar();
  renderListaDisciplinas();
  atualizarSelectDisciplinas();
  renderFormDinamicoHome();
  reRenderTudo();
  mostrarToast("✅ Disciplina criada!", "sucesso");
}

function removerDisciplina(id) {
  const d = disciplinas.find(x => x.id === id);
  if (!d) return;

  const qtdItens = itens.filter(i => i.disciplinaId === id).length;
  const qtdNotas = notas.filter(n => n.disciplinaId === id).length;

  const msg = qtdItens + qtdNotas > 0
    ? `Remover "${d.nome}" e TUDO relacionado?\n\n• ${qtdItens} item(ns)\n• ${qtdNotas} nota(s)\n\nIsso não pode ser desfeito.`
    : `Remover a disciplina "${d.nome}"?`;

  if (!confirmar(msg)) return;

  disciplinas = disciplinas.filter(x => x.id !== id);
  itens = itens.filter(i => i.disciplinaId !== id);
  notas = notas.filter(n => n.disciplinaId !== id);

  if (disciplinaAberta === id) disciplinaAberta = null;

  salvar();
  renderListaDisciplinas();
  atualizarSelectDisciplinas();
  renderNotas();
  renderFormDinamicoHome();
  reRenderTudo();
  mostrarToast("Disciplina removida.", "");
}

function editarDisciplina(id) {
  const d = disciplinas.find(x => x.id === id);
  if (!d) return;

  const novoNome = prompt("Nome da disciplina:", d.nome);
  if (novoNome === null) return;
  const novoProf = prompt("Professor:", d.professor || "");
  if (novoProf === null) return;
  const novoHor = prompt("Horário:", d.horario || "");
  if (novoHor === null) return;
  const novoSem = prompt("Semestre:", d.semestre || "");
  if (novoSem === null) return;

  d.nome = novoNome.trim() || d.nome;
  d.professor = novoProf.trim();
  d.horario = novoHor.trim();
  d.semestre = novoSem.trim();

  salvar();
  renderListaDisciplinas();
  atualizarSelectDisciplinas();
  if (disciplinaAberta === id) renderPaginaDisciplina(id);
  reRenderTudo();
}

/**
 * Cicla para a próxima cor da paleta (botão 🎨).
 */
function mudarCorDisciplina(id) {
  const d = disciplinas.find(x => x.id === id);
  if (!d) return;
  const idx = PALETA_CORES.indexOf(d.cor);
  d.cor = PALETA_CORES[(idx + 1) % PALETA_CORES.length];
  salvar();
  renderListaDisciplinas();
  if (disciplinaAberta === id) renderPaginaDisciplina(id);
  reRenderTudo();
}

/* ============ LISTA (cards) ============ */

function renderListaDisciplinas() {
  const grid = document.getElementById("gridDisciplinas");
  if (!grid) return;

  if (disciplinas.length === 0) {
    grid.innerHTML = '<p class="vazio" style="grid-column: 1/-1;">Nenhuma disciplina cadastrada ainda. Adicione uma acima!</p>';
    return;
  }

  grid.innerHTML = disciplinas.map(d => {
    const di = itens.filter(i => i.disciplinaId === d.id);
    const ex = di.filter(i => i.tipo === "exame").length;
    const at = di.filter(i => i.tipo === "atividade").length;
    const te = di.filter(i => i.tipo === "tema").length;
    const pend = di.filter(i => !i.concluida).length;

    const nd = notas.filter(n => n.disciplinaId === d.id);
    let mediaHtml = '<span class="media-mini sem-nota">Sem notas</span>';
    if (nd.length > 0) {
      const sp = nd.reduce((s, n) => s + n.peso, 0);
      const sn = nd.reduce((s, n) => s + n.valor * n.peso, 0);
      const m = sp > 0 ? sn / sp : 0;
      const cls = m >= 7 ? "aprovado" : "reprovado";
      mediaHtml = `<span class="media-mini ${cls}">${m.toFixed(1)}</span>`;
    }

    return `
      <div class="disciplina-card" style="border-top-color:${d.cor};" onclick="abrirDisciplina(${d.id})">
        <h3>
          <span class="cor-bolinha" style="background:${d.cor};"></span>
          ${escaparHtml(d.nome)}
        </h3>
        <p class="prof">
          ${d.professor ? "👤 " + escaparHtml(d.professor) : ""}
          ${d.horario ? (d.professor ? " • " : "") + "⏰ " + escaparHtml(d.horario) : ""}
          ${!d.professor && !d.horario ? "Sem detalhes" : ""}
        </p>
        <div class="stats-mini">
          <span>🎯 ${ex}</span>
          <span>📝 ${at}</span>
          <span>📖 ${te}</span>
          <span>⏳ ${pend}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          ${mediaHtml}
          <div style="display:flex; gap:0.3rem;">
            <button class="btn neutro pequeno"
                    onclick="event.stopPropagation(); mudarCorDisciplina(${d.id})"
                    title="Mudar cor">🎨</button>
            <button class="btn perigo pequeno"
                    onclick="event.stopPropagation(); removerDisciplina(${d.id})"
                    title="Remover">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/* ============ NAVEGAÇÃO PARA A PÁGINA ============ */

function abrirDisciplina(id) {
  disciplinaAberta = id;
  tipoSelecionadoDisc = "tema";
  buscaDisciplina = "";

  document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
  document.getElementById("paginaDisciplina").classList.add("ativa");
  document.querySelectorAll("#navPrincipal button").forEach(b => b.classList.remove("ativo"));

  renderPaginaDisciplina(id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function voltarParaDisciplinas() {
  disciplinaAberta = null;
  buscaDisciplina = "";
  const btnDisc = [...document.querySelectorAll("#navPrincipal button")]
    .find(b => b.textContent.includes("Disciplinas"));
  if (typeof mostrarSecao === "function") {
    mostrarSecao("disciplinas", btnDisc);
  }
}

/* ============ BUSCA ============ */

function atualizarBusca(valor) {
  buscaDisciplina = valor;
  // re-renderiza só as listas, mantendo o foco no input
  renderPaginaDisciplina(disciplinaAberta, true);
}

/**
 * Filtra itens pelo termo de busca.
 * Procura em: nome, observações, semana, tags de anexos, nome de anexos.
 */
function filtrarItens(lista) {
  if (!buscaDisciplina.trim()) return lista;
  const termo = buscaDisciplina.toLowerCase().trim();

  return lista.filter(i => {
    if (i.nome.toLowerCase().includes(termo)) return true;
    if ((i.observacoes || "").toLowerCase().includes(termo)) return true;
    if ((i.semana || "").toLowerCase().includes(termo)) return true;

    if (i.anexos && i.anexos.length > 0) {
      return i.anexos.some(a =>
        a.nome.toLowerCase().includes(termo) ||
        (a.tags || []).some(t => t.toLowerCase().includes(termo))
      );
    }
    return false;
  });
}

/* ============ PÁGINA DA DISCIPLINA ============ */

/**
 * Renderiza a página completa de uma disciplina.
 * @param {number} id - ID da disciplina
 * @param {boolean} manterFoco - Se true, preserva o foco no campo de busca
 */
function renderPaginaDisciplina(id, manterFoco = false) {
  const d = disciplinas.find(x => x.id === id);
  if (!d) {
    voltarParaDisciplinas();
    return;
  }

  const itensDisc = itens.filter(i => i.disciplinaId === id);
  const temasTodos = itensDisc.filter(i => i.tipo === "tema");
  const examesTodos = itensDisc.filter(i => i.tipo === "exame");
  const atividadesTodos = itensDisc.filter(i => i.tipo === "atividade");

  // aplica filtro de busca
  const temas = filtrarItens(temasTodos).sort((a, b) =>
    (a.semana || "zzz").localeCompare(b.semana || "zzz")
  );
  const exames = filtrarItens(examesTodos).sort(compararDataPrioridade);
  const atividades = filtrarItens(atividadesTodos).sort(compararDataPrioridade);

  const container = document.getElementById("conteudoDisciplina");

  container.innerHTML = `
    <div class="disc-header" style="background:${d.cor};">
      <h2>📘 ${escaparHtml(d.nome)}</h2>
      <p>
        ${d.professor ? "👤 " + escaparHtml(d.professor) : ""}
        ${d.horario ? (d.professor ? " • " : "") + "⏰ " + escaparHtml(d.horario) : ""}
        ${d.semestre ? " • 📅 " + escaparHtml(d.semestre) : ""}
      </p>
      <div style="margin-top:0.8rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn pequeno" onclick="editarDisciplina(${d.id})">✏️ Editar</button>
        <button class="btn pequeno" onclick="mudarCorDisciplina(${d.id})">🎨 Cor</button>
        <button class="btn pequeno" onclick="removerDisciplina(${d.id})">🗑️ Excluir</button>
      </div>
    </div>

    <div class="busca-panel">
      <input type="text" id="buscaDisc"
             placeholder="Buscar por nome, semana, anotação, anexo ou tag..."
             value="${escaparHtml(buscaDisciplina)}"
             oninput="atualizarBusca(this.value)">
    </div>

     <div class="add-panel">
      <h3>➕ Adicionar em <em style="color:${d.cor};">${escaparHtml(d.nome)}</em></h3>

      <div class="add-tipo-grid">
        <button class="add-tipo-card" data-tipo="tema" onclick="abrirModalItem('tema', ${d.id})">
          <span class="add-tipo-icone">📖</span>
          <span class="add-tipo-label">Tema de estudo</span>
          <span class="add-tipo-desc">Conteúdo a estudar</span>
        </button>
        <button class="add-tipo-card" data-tipo="exame" onclick="abrirModalItem('exame', ${d.id})">
          <span class="add-tipo-icone">🎯</span>
          <span class="add-tipo-label">Exame / Prova</span>
          <span class="add-tipo-desc">Avaliação com data</span>
        </button>
        <button class="add-tipo-card" data-tipo="atividade" onclick="abrirModalItem('atividade', ${d.id})">
          <span class="add-tipo-icone">📝</span>
          <span class="add-tipo-label">Atividade / Trabalho</span>
          <span class="add-tipo-desc">Tarefa com prazo</span>
        </button>
      </div>
    </div>

    ${renderSecao("📖 Temas de Estudo", temas, temasTodos, examesTodos, atividadesTodos, d.cor, temasTodos.length)}
    ${renderSecao("🎯 Exames e Provas", exames, temasTodos, examesTodos, atividadesTodos, d.cor, examesTodos.length)}
    ${renderSecao("📝 Atividades e Trabalhos", atividades, temasTodos, examesTodos, atividadesTodos, d.cor, atividadesTodos.length)}
  `;

  renderFormDinamicoDisc(id);

  // restaura foco no campo de busca
  if (manterFoco) {
    const b = document.getElementById("buscaDisc");
    if (b) {
      b.focus();
      const len = b.value.length;
      b.setSelectionRange(len, len);
    }
  }
}

/**
 * Gera o HTML de uma seção (Temas, Exames ou Atividades).
 */
function renderSecao(titulo, itensFiltrados, temasTodos, exames, atividades, corDisc, totalSemFiltro) {
  const contador = buscaDisciplina
    ? `(${itensFiltrados.length} de ${totalSemFiltro})`
    : `(${itensFiltrados.length})`;

  let conteudo;
  if (itensFiltrados.length === 0) {
    conteudo = buscaDisciplina
      ? '<p class="vazio">Nenhum resultado para esta busca.</p>'
      : '<p class="vazio">Nada cadastrado ainda.</p>';
  } else {
    conteudo = itensFiltrados
      .map(i => renderItemCard(i, temasTodos, exames, atividades, corDisc))
      .join("");
  }

  return `
    <div class="card">
      <h2>${titulo} <span class="contador-secao">${contador}</span></h2>
      <div>${conteudo}</div>
    </div>
  `;
}
