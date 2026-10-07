/* ============================================================
   STUDY TRAIL — anexos.js
   Anexos (links + arquivos) com tags em cada item
   ============================================================ */

const LIMITE_ARQUIVO_MB = 1.5;
const LIMITE_ARQUIVO_BYTES = LIMITE_ARQUIVO_MB * 1024 * 1024;

/* ============ UI: TOGGLE DA ÁREA ============ */
function toggleAnexos(itemId) {
  const el = document.getElementById("anexos-" + itemId);
  if (!el) return;
  el.classList.toggle("visivel");
}

/* ============ ADICIONAR LINK ============ */
function adicionarLink(itemId) {
  const urlInput = document.getElementById("linkUrl-" + itemId);
  const nomeInput = document.getElementById("linkNome-" + itemId);
  const tagsInput = document.getElementById("linkTags-" + itemId);

  if (!urlInput) return;

  const url = urlInput.value.trim();
  const nome = (nomeInput?.value || "").trim() || url;
  const tags = parsearTags(tagsInput?.value);

  if (!url) {
    mostrarToast("Cole um link primeiro.", "aviso");
    urlInput.focus();
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    mostrarToast("O link precisa começar com http:// ou https://", "erro");
    return;
  }

  const item = itens.find(i => i.id === itemId);
  if (!item) return;

  if (!item.anexos) item.anexos = [];
  item.anexos.push({
    id: gerarId(),
    tipo: "link",
    url,
    nome,
    tags,
    criadoEm: new Date().toISOString()
  });

  salvar();
  renderPaginaDisciplina(disciplinaAberta);
  mostrarToast("🔗 Link adicionado!", "sucesso");
}

/* ============ ADICIONAR ARQUIVO ============ */
function adicionarArquivo(itemId, input) {
  const file = input?.files?.[0];
  if (!file) return;

  if (file.size > LIMITE_ARQUIVO_BYTES) {
    mostrarToast(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máx: ${LIMITE_ARQUIVO_MB}MB. Use um link (Drive, Dropbox) para arquivos maiores.`,
      "erro",
      6000
    );
    input.value = "";
    return;
  }

  const tagsInput = document.getElementById("fileTags-" + itemId);
  const tags = parsearTags(tagsInput?.value);

  const reader = new FileReader();
  reader.onload = (e) => {
    const item = itens.find(i => i.id === itemId);
    if (!item) return;

    if (!item.anexos) item.anexos = [];
    item.anexos.push({
      id: gerarId(),
      tipo: "file",
      nome: file.name,
      mime: file.type || "application/octet-stream",
      tamanho: file.size,
      dataUrl: e.target.result,
      tags,
      criadoEm: new Date().toISOString()
    });

    try {
      salvar();
      renderPaginaDisciplina(disciplinaAberta);
      mostrarToast("📄 Arquivo anexado!", "sucesso");
    } catch (err) {
      // Provavelmente estourou o localStorage
      item.anexos.pop();
      mostrarToast(
        "Sem espaço. Remova anexos antigos ou use link externo.",
        "erro",
        6000
      );
    }
  };
  reader.onerror = () => {
    mostrarToast("Erro ao ler o arquivo.", "erro");
  };
  reader.readAsDataURL(file);
}

/* ============ REMOVER ANEXO ============ */
function removerAnexo(itemId, anexoId) {
  if (!confirmar("Remover este anexo?")) return;
  const item = itens.find(i => i.id === itemId);
  if (!item || !item.anexos) return;

  item.anexos = item.anexos.filter(a => a.id !== anexoId);
  salvar();
  renderPaginaDisciplina(disciplinaAberta);
  mostrarToast("Anexo removido.", "");
}

/* ============ ABRIR ANEXO ============ */
function abrirAnexo(itemId, anexoId) {
  const item = itens.find(i => i.id === itemId);
  const a = item?.anexos?.find(x => x.id === anexoId);
  if (!a) return;

  if (a.tipo === "link") {
    window.open(a.url, "_blank", "noopener,noreferrer");
    return;
  }

  // Arquivo: abre em nova aba
  const w = window.open();
  if (!w) {
    mostrarToast("Bloqueador de pop-up impediu a abertura.", "aviso");
    return;
  }
  w.document.write(`
    <title>${escaparHtml(a.nome)}</title>
    <style>
      body { margin: 0; background: #111; color: #eee; font-family: system-ui, sans-serif; }
      .bar { padding: 0.8rem 1rem; background: #222; display: flex; justify-content: space-between; align-items: center; }
      .bar a { color: #8ab4ff; text-decoration: none; font-weight: 600; }
      .bar a:hover { text-decoration: underline; }
      .content { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 60px); padding: 1rem; }
      img { max-width: 100%; max-height: calc(100vh - 100px); border-radius: 8px; }
      iframe { width: 100%; height: calc(100vh - 100px); border: none; }
      .info { text-align: center; }
    </style>
    <div class="bar">
      <span>${escaparHtml(a.nome)}</span>
      <a href="${a.dataUrl}" download="${escaparHtml(a.nome)}">⬇️ Baixar</a>
    </div>
    <div class="content">
      ${renderPreviewArquivo(a)}
    </div>
  `);
  w.document.close();
}

/**
 * Gera o HTML de preview para um anexo de arquivo.
 */
function renderPreviewArquivo(a) {
  const mime = a.mime || "";

  if (mime.startsWith("image/")) {
    return `<img src="${a.dataUrl}" alt="${escaparHtml(a.nome)}">`;
  }

  if (mime === "application/pdf") {
    return `<iframe src="${a.dataUrl}"></iframe>`;
  }

  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("xml")) {
    // Para texto, decodifica o base64
    try {
      const base64 = a.dataUrl.split(",")[1] || "";
      const texto = atob(base64);
      return `<pre style="text-align:left; max-width:100%; white-space:pre-wrap; font-size:0.85rem; background:#1a1a1a; padding:1rem; border-radius:8px; max-height:calc(100vh - 100px); overflow:auto;">${escaparHtml(texto)}</pre>`;
    } catch (e) {
      // Cai pro fallback abaixo
    }
  }

  return `<div class="info">
    <p style="font-size:3rem;">📄</p>
    <p>Pré-visualização não disponível para este tipo.</p>
    <p style="opacity:0.7; font-size:0.85rem; margin-top:0.5rem;">${escaparHtml(mime || "arquivo")}</p>
  </div>`;
}

/* ============ RENDER DA LISTA ============ */
function renderAnexos(itemId) {
  const item = itens.find(i => i.id === itemId);
  const anexos = item?.anexos || [];

  const listaHtml = anexos.length === 0
    ? `<p style="font-size:0.85rem; color:var(--texto-fraco);">Nenhum anexo ainda.</p>`
    : `<div class="anexos-lista">
        ${anexos.map(a => renderAnexoItem(itemId, a)).join("")}
      </div>`;

  return `
    ${listaHtml}

    <div style="margin-top:0.6rem;">
      <div class="add-anexo-form" style="margin-bottom:0.5rem;">
        <input type="text" id="linkUrl-${itemId}" placeholder="https://...">
        <input type="text" id="linkNome-${itemId}" placeholder="Nome (opcional)">
        <input type="text" id="linkTags-${itemId}" placeholder="tags: prova, cap1">
        <button class="btn pequeno" onclick="adicionarLink(${itemId})">➕ Link</button>
      </div>
      <div class="add-anexo-form">
        <input type="file" id="fileInput-${itemId}" onchange="adicionarArquivo(${itemId}, this)">
        <input type="text" id="fileTags-${itemId}" placeholder="tags do arquivo">
      </div>
      <p style="font-size:0.75rem; color:var(--texto-fraco); margin-top:0.3rem;">
        💡 Arquivos até ${LIMITE_ARQUIVO_MB}MB. Para maiores, use link (Drive, Dropbox).
      </p>
    </div>
  `;
}

/**
 * Renderiza um único item de anexo (linha da lista).
 */
function renderAnexoItem(itemId, a) {
  const icone = a.tipo === "file" ? "📄" : "🔗";
  const classe = a.tipo === "file" ? "tipo-anexo file" : "tipo-anexo";
  const tamanho = a.tamanho ? ` <small style="color:var(--texto-fraco);">(${formatarTamanho(a.tamanho)})</small>` : "";

  const tagsHtml = (a.tags || []).length > 0
    ? `<div class="anexo-tags">
        ${a.tags.map(t => `<span class="tag-chip">#${escaparHtml(t)}</span>`).join("")}
      </div>`
    : `<div class="anexo-tags"></div>`;

  return `
    <div class="anexo-item">
      <span class="${classe}">${icone}</span>
      <a href="javascript:void(0)" onclick="abrirAnexo(${itemId}, ${a.id})">
        ${escaparHtml(a.nome)}
      </a>${tamanho}
      ${tagsHtml}
      <button class="btn perigo pequeno"
              onclick="removerAnexo(${itemId}, ${a.id})"
              style="padding:0.2rem 0.5rem; font-size:0.75rem;"
              title="Remover anexo">✕</button>
    </div>
  `;
}

/* ============ HELPERS ============ */

/**
 * Converte string "tag1, tag2, tag3" em array limpo.
 */
function parsearTags(str) {
  if (!str) return [];
  return String(str)
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Formata bytes em algo legível: 1234 → "1.2 KB".
 */
function formatarTamanho(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}
