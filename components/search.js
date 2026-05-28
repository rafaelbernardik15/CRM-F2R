// ============================================================
// MODAL GLOBAL
// ============================================================
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('open');
  const modal = document.getElementById('modal');
  modal.classList.remove('modal-lg');
}

// ============================================================
// SEARCH GLOBAL
// ============================================================
function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(() => document.getElementById('global-search-input').focus(), 50);
}

function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('global-search-input').value = '';
  document.getElementById('search-results').innerHTML = renderDefaultSearchResults();
}

function renderDefaultSearchResults() {
  return `
    <div style="padding:14px 20px 8px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)">Navegação Rápida</div>
    ${[
      { icon:'📊', label:'Dashboard', sub:'Visão geral comercial', page:'dashboard' },
      { icon:'🔀', label:'Pipeline', sub:'Kanban de leads', page:'pipeline' },
      { icon:'⏰', label:'Follow-up', sub:'Contatos pendentes', page:'followup' },
      { icon:'📅', label:'Reuniões', sub:'Agenda e resultados', page:'reunioes' },
      { icon:'✅', label:'Tarefas', sub:'Central operacional', page:'tarefas' },
      { icon:'❤️', label:'Relacionamento', sub:'Dados pessoais dos leads', page:'relacionamento' },
      { icon:'🧠', label:'Inteligência', sub:'Score e heatmap comercial', page:'inteligencia' },
    ].map(r => `
      <div class="search-result-item" onclick="navigate('${r.page}');closeSearch()">
        <div class="search-result-icon">${r.icon}</div>
        <div class="search-result-text">
          <strong>${r.label}</strong>
          <span>${r.sub}</span>
        </div>
      </div>`).join('')}`;
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  const resultsEl = document.getElementById('search-results');

  if (!q) { resultsEl.innerHTML = renderDefaultSearchResults(); return; }

  // Buscar leads
  const leadResults = CRM.leads.filter(l =>
    l.name.toLowerCase().includes(q) ||
    l.company.toLowerCase().includes(q) ||
    l.segmento.toLowerCase().includes(q) ||
    l.origem.toLowerCase().includes(q) ||
    l.tags.some(t => t.toLowerCase().includes(q))
  );

  // Buscar reuniões
  const meetingResults = CRM.meetings.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.type.toLowerCase().includes(q)
  );

  // Buscar tarefas
  const taskResults = CRM.tasks.filter(t =>
    t.title.toLowerCase().includes(q)
  );

  if (leadResults.length === 0 && meetingResults.length === 0 && taskResults.length === 0) {
    resultsEl.innerHTML = `
      <div style="padding:40px;text-align:center;color:var(--text-muted)">
        <div style="font-size:32px;margin-bottom:8px">🔍</div>
        <div>Nenhum resultado para "<strong>${q}</strong>"</div>
      </div>`;
    return;
  }

  let html = '';

  if (leadResults.length > 0) {
    html += `<div style="padding:10px 20px 6px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)">Leads (${leadResults.length})</div>`;
    html += leadResults.slice(0,5).map(l => `
      <div class="search-result-item" onclick="navigate('lead','${l.id}');closeSearch()">
        <div class="search-result-icon">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,${CRM.getAdvisor(l.responsavel).color},#0F2C5955);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">${CRM.getInitials(l.name)}</div>
        </div>
        <div class="search-result-text">
          <strong>${l.name}</strong>
          <span>${l.company} · ${l.stage} · <span class="temp-dot ${CRM.tempClass(l.temp)}" style="display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:3px"></span>${CRM.tempLabel(l.temp)}</span>
        </div>
        <span style="font-size:11px;color:var(--teal);font-weight:600">${CRM.formatCurrency(l.patrimonio)}</span>
      </div>`).join('');
  }

  if (meetingResults.length > 0) {
    html += `<div style="padding:10px 20px 6px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)">Reuniões</div>`;
    html += meetingResults.slice(0,3).map(m => `
      <div class="search-result-item" onclick="navigate('reunioes');closeSearch()">
        <div class="search-result-icon">📅</div>
        <div class="search-result-text">
          <strong>${m.title}</strong>
          <span>${CRM.formatDate(m.date)} · ${m.time} · ${m.type}</span>
        </div>
      </div>`).join('');
  }

  if (taskResults.length > 0) {
    html += `<div style="padding:10px 20px 6px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)">Tarefas</div>`;
    html += taskResults.slice(0,3).map(t => `
      <div class="search-result-item" onclick="navigate('tarefas');closeSearch()">
        <div class="search-result-icon">✅</div>
        <div class="search-result-text">
          <strong>${t.title}</strong>
          <span>Prazo: ${CRM.formatDate(t.prazo)} · ${t.status}</span>
        </div>
      </div>`).join('');
  }

  resultsEl.innerHTML = html;
}

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl+K → abrir busca
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
    return;
  }
  // Escape → fechar overlays
  if (e.key === 'Escape') {
    closeSearch();
    closeModal();
    return;
  }
  // Números para navegação rápida
  if (!e.target.matches('input,textarea,select') && !e.metaKey && !e.ctrlKey) {
    const shortcuts = { '1':'dashboard','2':'pipeline','3':'followup','4':'reunioes','5':'tarefas','6':'relacionamento','7':'inteligencia' };
    if (shortcuts[e.key]) navigate(shortcuts[e.key]);
  }
});
