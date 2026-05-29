// ============================================================
// PIPELINE KANBAN
// ============================================================
function renderPipeline() {
  const content = document.getElementById('page-content');
  const leads = CRM.leads;

  // Preserva scroll
  const wrapper = document.getElementById('kanban-wrapper');
  const scrollLeft = wrapper ? wrapper.scrollLeft : 0;

  // Filtros ativos
  const filters = window._pipelineFilters || { temp: 'all', resp: 'all' };
  window._pipelineFilters = filters;

  const filteredLeads = leads.filter(l => {
    if (filters.temp !== 'all' && l.temp !== filters.temp) return false;
    if (filters.resp !== 'all' && l.responsavel !== filters.resp) return false;
    return true;
  });

  content.innerHTML = `
    <div class="section-header mb-3">
      <div>
        <div class="section-title"><span class="icon">📊</span>Pipeline Comercial</div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:2px">${filteredLeads.length} leads · Arraste para mover entre etapas</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <!-- Filtro temperatura -->
        <select class="form-select" style="width:130px;padding:6px 12px;font-size:12px" onchange="window._pipelineFilters={...window._pipelineFilters,temp:this.value};renderPipeline()">
          <option value="all" ${filters.temp==='all'?'selected':''}>🌡 Temperatura</option>
          <option value="hot" ${filters.temp==='hot'?'selected':''}>🔥 Quente</option>
          <option value="warm" ${filters.temp==='warm'?'selected':''}>🌤 Morno</option>
          <option value="cold" ${filters.temp==='cold'?'selected':''}>❄️ Frio</option>
        </select>
        <!-- Filtro Consultor -->
        <select class="form-select" style="width:150px;padding:6px 12px;font-size:12px" onchange="window._pipelineFilters={...window._pipelineFilters,resp:this.value};renderPipeline()">
          <option value="all" ${filters.resp==='all'?'selected':''}>👤 Consultor</option>
          ${CRM.advisors.map(a => `<option value="${a.id}" ${filters.resp===a.id?'selected':''}>${a.name.split(' ')[0]}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" onclick="openNewLeadModal()">+ Novo Lead</button>
      </div>
    </div>

    <div class="kanban-wrapper" id="kanban-wrapper">
      ${CRM.stageOrder.map(stage => renderKanbanCol(stage, filteredLeads)).join('')}
    </div>
  `;

  initDragDrop();

  setTimeout(() => {
    const newWrapper = document.getElementById('kanban-wrapper');
    if (newWrapper) newWrapper.scrollLeft = scrollLeft;
  }, 0);
}

function renderKanbanCol(stage, leads) {
  const stageLeads = leads.filter(l => l.stage === stage);
  const totalPat = stageLeads.reduce((a, l) => a + (l.patrimonio || 0), 0);
  const color = CRM.stageColor[stage];

  return `
    <div class="kanban-col" data-stage="${stage}" 
         ondragover="handleDragOver(event)" 
         ondrop="handleDrop(event,'${stage}')"
         ondragleave="handleDragLeave(event)">
      <div class="kanban-col-header">
        <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;box-shadow:0 0 6px ${color}55"></div>
        <div class="kanban-col-name">${stage}</div>
        <div class="kanban-count">${stageLeads.length}</div>
      </div>
      ${stageLeads.length > 0 ? `<div style="padding:4px 10px 2px;font-size:10.5px;color:var(--text-muted);border-bottom:1px solid var(--border)">
        💎 ${CRM.formatCurrency(totalPat)}
      </div>` : ''}
      <div class="kanban-cards" id="col-${stage.replace(/\s+/g,'-')}">
        ${stageLeads.map(l => renderLeadCard(l)).join('')}
        <div class="kanban-drop-placeholder" style="display:none;height:80px;border:2px dashed var(--accent);border-radius:var(--radius-md);background:var(--accent-light);opacity:0.5"></div>
      </div>
    </div>`;
}

function renderLeadCard(l) {
  const adv = CRM.getAdvisor(l.responsavel);
  const days = CRM.daysSince(l.ultimoContato);
  const daysColor = days > 7 ? 'var(--rose)' : days > 3 ? 'var(--amber)' : 'var(--text-muted)';
  const tags = l.tags || [];
  const score = l.score || 0;
  const chancePercent = l.chancePercent || 0;
  const patrimonio = l.patrimonio || 0;

  return `
    <div class="lead-card" 
         draggable="true"
         data-lead-id="${l.id}"
         ondragstart="handleDragStart(event,'${l.id}')"
         ondragend="handleDragEnd(event)"
         onclick="navigate('lead','${l.id}')">
      <div class="lead-card-top">
        <div>
          <div class="lead-name">${l.name}</div>
          <div class="lead-company">${l.company || '—'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-icon" style="width:20px;height:20px;font-size:10px;padding:0;opacity:0.5" onclick="deleteLead(event, '${l.id}')" title="Excluir lead">🗑️</button>
          <div class="temp-dot ${CRM.tempClass(l.temp)}" title="${CRM.tempLabel(l.temp)}"></div>
        </div>
      </div>

      <div class="lead-card-meta">
        <span class="badge badge-${l.temp === 'hot' ? 'hot' : l.temp === 'warm' ? 'amber' : 'rose'}" style="font-size:10px">
          ${CRM.tempLabel(l.temp)}
        </span>
        ${tags.slice(0,2).map(t => `<span class="badge badge-muted" style="font-size:10px">${t}</span>`).join('')}
      </div>

      <div class="lead-card-row">
        <span title="Patrimônio estimado">💎 <strong style="color:var(--teal)">${CRM.formatCurrency(patrimonio)}</strong></span>
        <span style="font-size:10px;color:var(--accent);font-weight:600">${chancePercent}%</span>
      </div>
      <div class="lead-card-row mt-1">
        <span style="color:${daysColor};font-size:10.5px" title="Último contato">🕐 ${days === 0 ? 'Hoje' : days === 1 ? 'Ontem' : `${days}d atrás`}</span>
        <div class="avatar sm" style="background:linear-gradient(135deg,${adv.color},${adv.color}88)" title="${adv.name}">${adv.initials}</div>
      </div>

      ${l.proximoContato ? `<div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:4px">
        📅 Próx: ${CRM.formatDate(l.proximoContato)}
      </div>` : ''}

      <div class="score-bar mt-2" title="Score: ${score}">
        <div class="score-bar-fill" style="width:${score}%;background:linear-gradient(90deg,${CRM.getScoreColor(score)},${CRM.getScoreColor(score)}88)"></div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:4px">
        <span style="font-size:9.5px;color:var(--text-disabled)">Score</span>
        <span style="font-size:9.5px;color:${CRM.getScoreColor(score)};font-weight:700">${score}</span>
      </div>
    </div>`;
}

// ─── DRAG AND DROP ───────────────────────────────────────────
function initDragDrop() {
  // Inicializado via atributos HTML inline nos cards e colunas
}

function handleDragStart(event, leadId) {
  CRM.dragData = leadId;
  CRM.isDragging = true;
  // Armazena no dataTransfer como fallback (necessário para alguns navegadores)
  event.dataTransfer.setData('text/plain', leadId);
  event.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    const card = document.querySelector(`[data-lead-id="${leadId}"]`);
    if (card) card.classList.add('dragging');
  }, 0);
}

function handleDragEnd(event) {
  CRM.isDragging = false;
  // Remove classe de todos os cards
  document.querySelectorAll('.lead-card.dragging').forEach(c => c.classList.remove('dragging'));
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
  
  // Renderiza a UI se o onSnapshot chegou enquanto arrastava
  if (CRM.pendingRender && CRM.currentPage === 'pipeline') {
    CRM.pendingRender = false;
    renderPipeline();
  }
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('drag-over');
  }
}

function handleDrop(event, newStage) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');

  // Recupera o id do lead tanto do CRM.dragData quanto do dataTransfer
  const leadId = CRM.dragData || event.dataTransfer.getData('text/plain');
  CRM.dragData = null;

  if (!leadId) return;

  const lead = CRM.getLead(leadId);
  if (!lead || lead.stage === newStage) return;

  const oldStage = lead.stage;
  const novoContato = new Date().toISOString().split('T')[0];

  // Monta timeline sem mutar o array original do Firestore
  const updatedTimeline = [
    {
      type: 'move',
      label: `Movido para: ${newStage}`,
      desc: `Lead avançou de "${oldStage}" para "${newStage}"`,
      date: novoContato,
      icon: '📋'
    },
    ...(lead.timeline || [])
  ];

  // Persiste no Firestore — onSnapshot atualizará o estado canônico
  // A UI só será re-renderizada no handleDragEnd (quando o arraste finalizar com segurança)
  updateDocument('leads', leadId, {
    stage: newStage,
    ultimoContato: novoContato,
    timeline: updatedTimeline
  }).then(() => {
    showToast(`${lead.name} movido para "${newStage}"`, 'success');
  }).catch(e => {
    showToast(`Erro ao mover: ${e.message}`, 'error');
  });
}

// ─── NOVO LEAD MODAL ─────────────────────────────────────────
function openNewLeadModal() {
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = '+ Novo Lead';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Nome *</label>
        <input class="form-input" id="nl-name" placeholder="Nome completo">
      </div>
      <div class="form-group">
        <label class="form-label">Empresa *</label>
        <input class="form-input" id="nl-company" placeholder="Nome da empresa">
      </div>
      <div class="form-group">
        <label class="form-label">Cargo</label>
        <input class="form-input" id="nl-cargo" placeholder="CEO, Diretor...">
      </div>
      <div class="form-group">
        <label class="form-label">Segmento</label>
        <input class="form-input" id="nl-segmento" placeholder="Agro, Saúde, Tech...">
      </div>
      <div class="form-group">
        <label class="form-label">WhatsApp</label>
        <input class="form-input" id="nl-whatsapp" placeholder="+55 11 99999-0000">
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input class="form-input" id="nl-email" placeholder="email@empresa.com">
      </div>
      <div class="form-group">
        <label class="form-label">Patrimônio Estimado</label>
        <input class="form-input" id="nl-patrimonio" type="number" placeholder="1000000">
      </div>
      <div class="form-group">
        <label class="form-label">Origem</label>
        <select class="form-select" id="nl-origem">
          <option>Indicação</option><option>LinkedIn</option><option>Instagram</option>
          <option>Evento</option><option>Prospectação ativa</option><option>Site</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Temperatura</label>
        <select class="form-select" id="nl-temp">
          <option value="cold">❄️ Frio</option>
          <option value="warm">🌤 Morno</option>
          <option value="hot">🔥 Quente</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Responsável</label>
        <select class="form-select" id="nl-resp">
          ${CRM.advisors.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Observações</label>
      <textarea class="form-textarea" id="nl-obs" placeholder="Contexto inicial, como conheceu, interesse..."></textarea>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Criar Lead';
  document.getElementById('modal-confirm').onclick = saveNewLead;
  modal.classList.add('open');
}

function saveNewLead() {
  const name = document.getElementById('nl-name').value.trim();
  const company = document.getElementById('nl-company').value.trim();
  if (!name || !company) { showToast('Preencha nome e empresa', 'error'); return; }

  // Não incluir o campo 'id' — o Firestore gerará o ID e ele será injetado
  // automaticamente pelo onSnapshot via { id: doc.id, ...doc.data() }
  const newLead = {
    name, company,
    cargo: document.getElementById('nl-cargo').value,
    segmento: document.getElementById('nl-segmento').value,
    cidade: '', whatsapp: document.getElementById('nl-whatsapp').value,
    email: document.getElementById('nl-email').value,
    instagram: '', linkedin: '',
    stage: 'Novo lead',
    temp: document.getElementById('nl-temp').value,
    patrimonio: parseInt(document.getElementById('nl-patrimonio').value) || 0,
    origem: document.getElementById('nl-origem').value,
    indicadoPor: '', potencial: 'A definir', timing: 'A definir',
    interesse: '', perfil: '', dorPrincipal: '', motivador: '',
    objecao: '', necessidade: '', nivelRelacionamento: 'Inicial',
    chancePercent: 10, ultimoContato: new Date().toISOString().split('T')[0],
    proximoContato: '', responsavel: document.getElementById('nl-resp').value,
    score: 20, tags: [], obs: document.getElementById('nl-obs').value,
    aniversario: '', hobbies: '', filhos: '', timeCoracao: '', viagens: '', canalPreferido: 'WhatsApp',
    timeline: [{
      type: 'note', label: 'Lead criado',
      desc: document.getElementById('nl-obs').value || 'Novo lead adicionado ao CRM.',
      date: new Date().toISOString().split('T')[0], icon: '🌱'
    }]
  };

  addDocument('leads', newLead).then(() => {
    closeModal();
    showToast(`Lead "${name}" criado com sucesso!`, 'success');
  }).catch(e => {
    showToast(`Erro ao criar lead: ${e.message}`, 'error');
  });
}

window.deleteLead = function(event, leadId) {
  event.stopPropagation();
  if (confirm('Tem certeza que deseja excluir este lead do pipeline? Esta ação não pode ser desfeita.')) {
    deleteDocument('leads', leadId).then(() => {
      showToast('Lead excluído com sucesso.', 'success');
    }).catch(e => {
      showToast(`Erro ao excluir lead: ${e.message}`, 'error');
    });
  }
}
