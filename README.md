# 🎓 Study Trail

Organizador pessoal de estudos universitários. Funciona **100% offline** no navegador, sem servidor, sem frameworks, sem build.

👉 **Acesse online:** https://onelittlepato.github.io/study-trail/

---

## ✨ Funcionalidades

- 📚 **Disciplinas** com cor personalizada
- 📖 **Temas de estudo** organizados por semana
- 🎯 **Exames** com temas cobrados vinculados
- 📝 **Atividades e trabalhos** com prazos ou **período de dias**
- 📅 **Semana** — visão semanal de tudo, com navegação entre semanas
- 🏠 **Início** — o que é hoje, próximos 7 dias, timeline por mês e **calendário mensal**
- 📊 **Notas** com cálculo de média ponderada
- 📎 **Anexos** (links e arquivos) com tags para classificar
- 📓 **Anotações** em cada item
- 🔍 **Busca** dentro de cada disciplina
- 🌙 **Modo escuro**
- 💾 **Backup** exportar/importar em JSON

## 🚀 Como usar

### Online
Acesse: https://onelittlepato.github.io/study-trail/

### Localmente
1. Baixe ou clone o repositório
2. Abra `index.html` no navegador

Pronto! Não precisa de instalação.

```bash
git clone https://github.com/onelittlepato/study-trail.git
cd study-trail
# abra o index.html no navegador
```

## 💾 Seus dados

Tudo fica salvo **no seu navegador** via `localStorage`:

- ✅ Funciona offline
- ✅ Rápido e privado
- ⚠️ Não sincroniza entre dispositivos
- ⚠️ Limpar dados do navegador apaga tudo — use a **exportação** para backup!

## 🛠️ Stack

- HTML5, CSS3, JavaScript (vanilla)
- Zero dependências, zero build

## 📁 Estrutura

```
study-trail/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── utils.js        → funções auxiliares
│   ├── storage.js      → persistência + estado global
│   ├── tema.js         → modo claro/escuro
│   ├── anexos.js       → links e arquivos com tags
│   ├── itens.js        → CRUD de temas/exames/atividades
│   ├── disciplinas.js  → disciplinas + página da disciplina
│   ├── semana.js       → visão semanal
│   ├── notas.js        → notas e médias
│   ├── inicio.js       → home com hoje/próximos/timeline/calendário
│   └── app.js          → inicialização e navegação
├── README.md
├── LICENSE
└── .gitignore
```

## 📝 Licença

MIT — veja [LICENSE](LICENSE).
