/* ============================================================
   MODAL DE EDIÇÃO DE ITEM — abre ao clicar num card do roadmap
   ============================================================ */

function abrirModalEdicao(itemId) {
  const item = itens.find(x => x.id === itemId);
  if (!item) return;

  modalItemEditando = itemId;

  const overlay = document.getElementById("modalOverlay");
  const conteudo = document.getElementById("modalConteudo");
  if (!overlay || !conteudo) return;

  const icone = item.tipo === "exame" ? "🎯" : item.tipo === "tema" ? "📖" : "📝";
  const titulo = item.tipo === "exame" ? "Editar exame"
               : item.tipo === "tema" ? "Editar tema"
               : "Editar atividade";

  const isTema = item.tipo === "tema";
  const temPeriodo = item.dataInicio && item.dataFim && item.dataInicio !== item.dataFim;
  const modoAtual = temPeriodo ? "periodo" : item.data ? "unica" : "sem-data";

  // opções de disciplinas
  const opcoesDisc = '<option value="">— Sem disciplina —</option>' +
    disciplinas.map(d => `
      <option value="${d.id}" ${d.id === item.disciplinaId ? "selected" : ""}>
        ${escaparHtml(d.nome)}
      </option>
    `).join("");

  // links existentes
  const links = item.links || [];
  const linksHtml = links.length === 0
    ? '<p style="font-size:0.8rem; color:var(--texto-fraco); padding:0.4rem 0;">Nenhum link ainda.</p>'
    : links.map((l, idx) => `
        <div class="link-item">
          <span class="link-icone">🔗</span>
          <a class="link-nome" href="${escaparHtml(l.url)}" target="_blank" rel="noopener">
            ${escaparHtml(l.nome || l.url)}
          </a>
          <button class="link-remover" onclick="removerLinkModal(${idx})" title="Remover">✕</button>
        </div>
      `).join("");

  conteudo.innerHTML = `
    <div class="modal-header">
      <h3><span class="modal-icone">${icone}</span>${titulo}</h3>
      <button class="modal-fechar" onclick="fecharModal()" aria-label="Fechar">✕</button>
    </div>

    <div class="modal-body">

      <div class="campo">
        <label>Título</label>
        <input type="text" id="editNome" value="${escaparHtml(item.nome)}" autofocus>
      </div>

      <div class="linha-dupla">
        <div class="campo">
          <label>Disciplina</label>
          <select id="editDisciplina">
            ${opcoesDisc}
          </select>
        </div>
        <div class="campo">
          <label>Prioridade</label>
          <select id="editPrioridade">
            <option value="baixa" ${item.prioridade === "baixa" ? "selected" : ""}>🟢 Baixa</option>
            <option value="media" ${item.prioridade === "media" ? "selected" : ""}>🟡 Média</option>
            <option value="alta" ${item.prioridade === "alta" ? "selected" : ""}>🔴 Alta</option>
          </select>
        </div>
      </div>

      ${isTema ? `
        <div class="campo">
          <label>Semana</label>
          <input type="text" id="editSemana" value="${escaparHtml(item.semana || "")}" placeholder="Ex: Sem 3">
        </div>
      ` : ""}

      <div class="campo">
        <label>Quando</label>
        <div class="modo-data-toggle">
          <label><input type="radio" name="editModo" value="sem-data" ${modoAtual === "sem-data" ? "checked" : ""} onchange="mudarModoEditModal(this.value)"> 🚫 Sem data</label>
          <label><input type="radio" name="editModo" value="unica" ${modoAtual === "unica" ? "checked" : ""} onchange="mudarModoEditModal(this.value)"> 📅 Data</label>
          <label><input type="radio" name="editModo" value="periodo" ${modoAtual === "periodo" ? "checked" : ""} onchange="mudarModoEditModal(this.value)"> 📆 Período</label>
        </div>
      </div>

      <div id="editModoUnica" style="display:${modoAtual === "unica" ? "block" : "none"};">
        <div class="campo">
          <label>Data</label>
          <input type="date" id="editData" value="${escaparHtml(item.data || "")}">
        </div>
      </div>

      <div id="editModoPeriodo" style="display:${modoAtual === "periodo" ? "block" : "none"};">
        <div class="linha-dupla">
          <div class="campo">
            <label>Início</label>
            <input type="date" id="editDataInicio" value="${escaparHtml(item.dataInicio || "")}">
          </div>
          <div class="campo">
            <label>Fim</label>
            <input type="date" id="editDataFim" value="${escaparHtml(item.dataFim || "")}">
          </div>
        </div>
      </div>

      <div class="campo">
        <label>Anotações</label>
        <textarea id="editObs" placeholder="Fórmulas, resumo, links...">${escaparHtml(item.observacoes || "")}</textarea>
      </div>

      <div class="campo">
        <label>Links</label>
        <div class="links-lista" id="editLinksLista">
          ${linksHtml}
        </div>
        <div class="link-add-form">
          <input type="text" id="editLinkNome" placeholder="Nome do link">
          <input type="text" id="editLinkUrl" placeholder="https://...">
          <button class="btn pequeno neutro" onclick="adicionarLinkModal()">+ Adicionar</button>
        </div>
      </div>

    </div>

    <div class="modal-footer">
      <button class="btn perigo" onclick="removerItemModal()">🗑️ Excluir</button>
      <div class="modal-footer-dir">
        <button class="btn neutro" onclick="fecharModal()">Cancelar</button>
        <button class="btn" onclick="salvarEdicaoModal()">💾 Salvar</button>
      </div>
    </div>
  `;

  overlay.classList.add("aberto");
  document.body.classList.add("modal-aberto");

  setTimeout(() => {
    document.getElementById("editNome")?.focus();
  }, 100);
}

function fecharModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.classList.remove("aberto");
  document.body.classList.remove("modal-aberto");
  modalItemEditando = null;
  setTimeout(() => {
    document.getElementById("modalConteudo").innerHTML = "";
  }, 250);
}

function fecharModalSeFora(event) {
  if (event.target.id === "modalOverlay") fecharModal();
}

function mudarModoEditModal(modo) {
  const unica = document.getElementById("editModoUnica");
  const periodo = document.getElementById("editModoPeriodo");
  if (unica) unica.style.display = modo === "unica" ? "block" : "none";
  if (periodo) periodo.style.display = modo === "periodo" ? "block" : "none";
}

function adicionarLinkModal() {
  const item = itens.find(x => x.id === modalItemEditando);
  if (!item) return;

  const nome = (document.getElementById("editLinkNome")?.value || "").trim();
  const url = (document.getElementById("editLinkUrl")?.value || "").trim();

  if (!url) {
    mostrarToast("Cole o link.", "aviso");
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    mostrarToast("Link precisa começar com http:// ou https://", "erro");
    return;
  }

  if (!item.links) item.links = [];
  item.links.push({ nome: nome || url, url });

  document.getElementById("editLinkNome").value = "";
  document.getElementById("editLinkUrl").value = "";

  renderLinksModal();
  mostrarToast("🔗 Link adicionado", "sucesso");
}

function removerLinkModal(idx) {
  const item = itens.find(x => x.id === modalItemEditando);
  if (!item || !item.links) return;
  item.links.splice(idx, 1);
  renderLinksModal();
}

function renderLinksModal() {
  const item = itens.find(x => x.id === modalItemEditando);
  const cont = document.getElementById("editLinksLista");
  if (!cont || !item) return;

  const links = item.links || [];
  if (links.length === 0) {
    cont.innerHTML = '<p style="font-size:0.8rem; color:var(--texto-fraco); padding:0.4rem 0;">Nenhum link ainda.</p>';
    return;
  }

  cont.innerHTML = links.map((l, idx) => `
    <div class="link-item">
      <span class="link-icone">🔗</span>
      <a class="link-nome" href="${escaparHtml(l.url)}" target="_blank" rel="noopener">
        ${escaparHtml(l.nome || l.url)}
      </a>
      <button class="link-remover" onclick="removerLinkModal(${idx})" title="Remover">✕</button>
    </div>
  `).join("");
}

function salvarEdicaoModal() {
  const item = itens.find(x => x.id === modalItemEditando);
  if (!item) return;

  const nome = (document.getElementById("editNome")?.value || "").trim();
  if (!nome) {
    mostrarToast("Digite um título.", "aviso");
    return;
  }

  const discVal = document.getElementById("editDisciplina")?.value || "";
  const prioridade = document.getElementById("editPrioridade")?.value || "media";
  const semana = (document.getElementById("editSemana")?.value || "").trim();
  const obs = (document.getElementById("editObs")?.value || "").trim();

  const radio = document.querySelector('input[name="editModo"]:checked');
  const modo = radio ? radio.value : "sem-data";

  let data = "", dataInicio = "", dataFim = "";

  if (modo === "unica") {
    data = document.getElementById("editData")?.value || "";
  } else if (modo === "periodo") {
    dataInicio = document.getElementById("editDataInicio")?.value || "";
    dataFim = document.getElementById("editDataFim")?.value || "";
    if (!dataInicio || !dataFim) {
      mostrarToast("Preencha início e fim.", "aviso");
      return;
    }
    if (dataFim < dataInicio) {
      mostrarToast("Data final antes da inicial.", "aviso");
      return;
    }
  }

  item.nome = nome;
  item.disciplinaId = discVal ? parseInt(discVal) : null;
  item.prioridade = prioridade;
  item.semana = semana;
  item.observacoes = obs;
  item.data = data;
  item.dataInicio = dataInicio;
  item.dataFim = dataFim;

  salvar();
  fecharModal();
  reRenderTudo();
  mostrarToast("✅ Item atualizado!", "sucesso");
}

function removerItemModal() {
  const item = itens.find(x => x.id === modalItemEditando);
  if (!item) return;
  if (!confirmar(`Remover "${item.nome}"?`)) return;

  itens = itens.filter(x => x.id !== item.id);
  itens.forEach(i => {
    if (i.temasVinculados) {
      i.temasVinculados = i.temasVinculados.filter(tid => tid !== item.id);
    }
  });

  salvar();
  fecharModal();
  reRenderTudo();
  mostrarToast("Item removido.", "");
}

// Fecha modal com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const overlay = document.getElementById("modalOverlay");
    if (overlay?.classList.contains("aberto")) fecharModal();
  }
});
