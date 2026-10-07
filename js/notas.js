/* ============================================================
   STUDY TRAIL — notas.js
   Notas com peso + cálculo de média ponderada
   ============================================================ */

const NOTA_MINIMA_APROVACAO = 7;

/* ============ SELECT DE DISCIPLINAS ============ */

/**
 * Popula o <select> de disciplinas no formulário de nota.
 * Preserva o valor atual se ainda existir.
 */
function atualizarSelectDisciplinas() {
  const sel = document.getElementById("notaDisciplina");
  if (!sel) return;

  const valorAtual = sel.value;

  if (disciplinas.length === 0) {
    sel.innerHTML = '<option value="">⚠️ Cadastre uma disciplina primeiro</option>';
    return;
  }

  sel.innerHTML = '<option value="">Escolha a disciplina...</option>' +
    disciplinas.map(d =>
      `<option value="${d.id}">${escaparHtml(d.nome)}</option>`
    ).join("");

  // restaura seleção se ainda existir
  if (valorAtual && disciplinas.some(d => String(d.id) === valorAtual)) {
    sel.value = valorAtual;
  }
}

/* ============ CRUD ============ */

function adicionarNota() {
  const sel = document.getElementById("notaDisciplina");
  const discId = parseInt(sel?.value || "0");
  const avaliacao = (document.getElementById("notaAvaliacao")?.value || "").trim();
  const valorRaw = document.getElementById("notaValor")?.value;
  const pesoRaw = document.getElementById("notaPeso")?.value;

  const valor = parseFloat(valorRaw);
  const peso = parseFloat(pesoRaw) || 1;

  if (!discId) {
    mostrarToast("Escolha a disciplina.", "aviso");
    sel?.focus();
    return;
  }
  if (!avaliacao) {
    mostrarToast("Digite o nome da avaliação (ex: P1).", "aviso");
    document.getElementById("notaAvaliacao")?.focus();
    return;
  }
  if (isNaN(valor)) {
    mostrarToast("Digite a nota.", "aviso");
    document.getElementById("notaValor")?.focus();
    return;
  }
  if (valor < 0 || valor > 10) {
    mostrarToast("Nota deve ser entre 0 e 10.", "aviso");
    return;
  }
  if (peso < 1) {
    mostrarToast("Peso deve ser ≥ 1.", "aviso");
    return;
  }

  notas.push({
    id: gerarId(),
    disciplinaId: discId,
    avaliacao,
    valor,
    peso,
    criadoEm: new Date().toISOString()
  });

  // limpa campos (mantém a disciplina selecionada)
  document.getElementById("notaAvaliacao").value = "";
  document.getElementById("notaValor").value = "";
  document.getElementById("notaPeso").value = "1";

  salvar();
  renderNotas();
  renderListaDisciplinas();
  if (disciplinaAberta) renderPaginaDisciplina(disciplinaAberta);
  if (typeof renderInicio === "function") renderInicio();

  mostrarToast("✅ Nota adicionada!", "sucesso");
}

function removerNota(id) {
  const n = notas.find(x => x.id === id);
  if (!n) return;
  if (!confirmar(`Remover a nota "${n.avaliacao}" (${n.valor.toFixed(1)})?`)) return;

  notas = notas.filter(x => x.id !== id);
  salvar();
  renderNotas();
  renderListaDisciplinas();
  if (disciplinaAberta) renderPaginaDisciplina(disciplinaAberta);
  if (typeof renderInicio === "function") renderInicio();

  mostrarToast("Nota removida.", "");
}

/* ============ CÁLCULOS ============ */

/**
 * Calcula a média ponderada de uma lista de notas.
 * Retorna { media, somaPesos, total }.
 */
function calcularMedia(listaNotas) {
  const total = listaNotas.length;
  if (total === 0) return { media: 0, somaPesos: 0, total: 0 };

  const somaPesos = listaNotas.reduce((s, n) => s + n.peso, 0);
  const somaNotas = listaNotas.reduce((s, n) => s + n.valor * n.peso, 0);
  const media = somaPesos > 0 ? somaNotas / somaPesos : 0;

  return { media, somaPesos, total };
}

/**
 * Classifica uma média: "aprovado" | "reprovado" | "sem-nota".
 */
function classificarMedia(media, total) {
  if (total === 0) return "sem-nota";
  return media >= NOTA_MINIMA_APROVACAO ? "aprovado" : "reprovado";
}

/* ============ RENDER ============ */

function renderNotas() {
  const cont = document.getElementById("listaNotas");
  if (!cont) return;

  if (notas.length === 0) {
    cont.innerHTML = '<p class="vazio">Nenhuma nota cadastrada ainda.</p>';
    return;
  }

  // agrupa por disciplina
  const porDisc = {};
  notas.forEach(n => {
    if (!porDisc[n.disciplinaId]) porDisc[n.disciplinaId] = [];
    porDisc[n.disciplinaId].push(n);
  });

  cont.innerHTML = Object.entries(porDisc).map(([discId, lista]) =>
    renderBlocoDisciplina(parseInt(discId), lista)
  ).join("");
}

/**
 * Renderiza o bloco de notas de uma disciplina.
 */
function renderBlocoDisciplina(discId, lista) {
  const d = disciplinas.find(x => x.id === discId);
  const nome = d ? d.nome : "(Disciplina removida)";
  const cor = d ? d.cor : "#888";

  // ordena por data de criação
  const ordenadas = [...lista].sort((a, b) =>
    (a.criadoEm || "").localeCompare(b.criadoEm || "")
  );

  const { media, somaPesos, total } = calcularMedia(lista);
  const classe = classificarMedia(media, total);

  const linhas = ordenadas.map(n => `
    <li>
      <div class="tarefa-info">
        <strong>${escaparHtml(n.avaliacao)}</strong>
        <small>
          Nota: <strong>${n.valor.toFixed(1)}</strong>
          • Peso: ${n.peso}
        </small>
      </div>
      <button class="btn perigo pequeno"
              onclick="removerNota(${n.id})"
              title="Remover nota">🗑️</button>
    </li>
  `).join("");

  const statusIcone = classe === "aprovado" ? "✅ Aprovado" : "⚠️ Abaixo de 7";
  const statusClasse = classe === "aprovado" ? "aprovado" : "reprovado";

  return `
    <div style="margin-bottom:1.5rem;">
      <h3 style="margin-bottom:0.5rem; border-left:4px solid ${cor}; padding-left:0.5rem;">
        📘 ${escaparHtml(nome)}
      </h3>
      <ul class="lista">${linhas}</ul>
      <div class="media-box">
        <div style="font-size:0.85rem; color:var(--texto-suave); margin-bottom:0.3rem;">
          ${total} nota(s) • soma dos pesos: ${somaPesos}
        </div>
        Média ponderada:
        <strong class="${statusClasse}">${media.toFixed(2)}</strong>
        <div style="font-size:0.85rem; margin-top:0.3rem;">
          ${statusIcone}
        </div>
      </div>
    </div>
  `;
}

/* ============ MÉDIA POR DISCIPLINA (usada em outros módulos) ============ */

/**
 * Retorna a média ponderada de uma disciplina (para exibir no card).
 * Retorna null se não houver notas.
 */
function mediaDaDisciplina(discId) {
  const lista = notas.filter(n => n.disciplinaId === discId);
  if (lista.length === 0) return null;
  const { media } = calcularMedia(lista);
  return media;
}

/**
 * Retorna o rótulo curto para o card da disciplina.
 */
function resumoMediaDisciplina(discId) {
  const m = mediaDaDisciplina(discId);
  if (m === null) return { texto: "Sem notas", classe: "sem-nota" };
  if (m >= NOTA_MINIMA_APROVACAO) return { texto: m.toFixed(1), classe: "aprovado" };
  return { texto: m.toFixed(1), classe: "reprovado" };
}
