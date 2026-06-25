// ============================================================
// TAREFAS
// ============================================================
function renderTarefas() {
  const content = document.getElementById('page-content');
  const tasks = CRM.tasks;
  const today = new Date();

  const cols = [
    { id:'aberto',    label:'Aberto',    color:'#0F2C59', dot:'#0F2C59' },
    { id:'andamento', label:'Em Andamento', color:'#F59E0B', dot:'#F59E0B' },
    { id:'atrasado',  label:'Atrasado',  color:'#F43F5E', dot:'#F43F5E' },
    { id:'concluido', label:'Concluído', color:'#10B981', dot:'#10B981' },
  ];

  const totals = {
    aberto: tasks.filter(t=>t.status==='aberto').length,
    andamento: tasks.filter(t=>t.status==='andamento').length,
    atrasado: tasks.filter(t=>t.status==='atrasado').length,
    concluido: tasks.filter(t=>t.status==='concluido').length,
  };

  content.innerHTML = `
    <div class="page-hero">
      <h1>Tarefas</h1>
      <p>Central operacional — organize e priorize todas as ações comerciais</p>
    </div>

    <!-- STATS TOP -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
      ${cols.map(c => `
        <div class="card card-pad" style="border-left:3px solid ${c.dot}">
          <div style="font-size:24px;font-weight:800;color:${c.dot}">${totals[c.id]}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${c.label}</div>
        </div>`).join('')}
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn btn-primary" onclick="openNewTaskModal()">+ Nova Tarefa</button>
    </div>

    <div class="tasks-board">
      ${cols.map(col => `
        <div class="task-col">
          <div class="task-col-header">
            <div class="task-col-dot" style="background:${col.dot}"></div>
            <span style="font-size:13px;font-weight:600;flex:1">${col.label}</span>
            <span class="kanban-count">${totals[col.id]}</span>
          </div>
          <div class="task-col-body">
            ${tasks.filter(t => t.status === col.id).map(t => renderTaskCard(t)).join('')}
            ${tasks.filter(t=>t.status===col.id).length===0
              ? `<div style="padding:24px;text-align:center;color:var(--text-disabled);font-size:12px">Nenhuma tarefa</div>`
              : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTaskCard(t) {
  const lead = t.leadId ? CRM.getLead(t.leadId) : null;
  const adv = CRM.getAdvisor(t.responsavel);
  const dueDate = new Date(t.prazo + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const isOverdue = dueDate < today && t.status !== 'concluido';
  const daysLeft = Math.ceil((dueDate - today) / 86400000);

  const prioColors = { 'Alta':'var(--rose)', 'Média':'var(--amber)', 'Baixa':'var(--accent)' };
  const statusNext = { 'aberto':'andamento', 'andamento':'concluido', 'atrasado':'concluido', 'concluido':'aberto' };
  const statusLabel = { 'aberto':'▶ Iniciar', 'andamento':'✅ Concluir', 'atrasado':'✅ Concluir', 'concluido':'↩ Reabrir' };

  return `
    <div class="task-item" onclick="openTaskDetail('${t.id}')">
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
        <div style="width:10px;height:10px;border-radius:2px;background:${prioColors[t.prioridade]||'var(--accent)'};flex-shrink:0;margin-top:3px"></div>
        <div class="task-title" style="flex:1">${t.title}</div>
        <button class="btn btn-ghost btn-icon" style="width:20px;height:20px;font-size:10px;padding:0;opacity:0.5;color:var(--rose)" onclick="event.stopPropagation();deleteTaskList('${t.id}')" title="Excluir tarefa">🗑️</button>
      </div>
      <div class="task-meta">
        <span class="badge badge-muted" style="font-size:10px">${t.prioridade}</span>
        ${lead ? `<span class="badge badge-accent" style="font-size:10px;cursor:pointer" onclick="event.stopPropagation();navigate('lead','${lead.id}')">${lead.name.split(' ')[0]}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
        <div class="task-due ${isOverdue?'overdue':''}">
          📅 ${isOverdue ? `⚠ ${Math.abs(daysLeft)}d atraso` : daysLeft === 0 ? 'Hoje' : daysLeft === 1 ? 'Amanhã' : `${daysLeft}d restantes`}
        </div>
        <div class="avatar sm" style="background:linear-gradient(135deg,${adv.color},${adv.color}88)" title="${adv.name}">${adv.initials}</div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm" style="flex:1;font-size:11px"
          onclick="moveTask('${t.id}','${statusNext[t.status]}')">${statusLabel[t.status]}</button>
      </div>
    </div>`;
}

window.deleteTaskList = function(taskId) {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    deleteDocument('tasks', taskId).then(() => {
      showToast('Tarefa excluída com sucesso.', 'success');
    }).catch(e => showToast(`Erro ao excluir: ${e.message}`, 'error'));
  }
}

function moveTask(taskId, newStatus) {
  const labels = { aberto:'Aberta', andamento:'Em Andamento', concluido:'Concluída', atrasado:'Atrasada' };
  updateDocument('tasks', taskId, { status: newStatus }).then(() => {
    showToast(`Tarefa movida para "${labels[newStatus]}"`, 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}

// ─── TASK DETAIL ─────────────────────────────────────────────
function openTaskDetail(taskId) {
  const t = CRM.tasks.find(t => t.id === taskId);
  const lead = t.leadId ? CRM.getLead(t.leadId) : null;
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = '✏️ Tarefa';
  
  const leadsDisponiveis = CRM.leads;
  
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Título *</label>
      <input class="form-input" id="td-title" value="${t.title}">
    </div>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Prioridade</label>
        <select class="form-select" id="td-prio">
          ${['Alta','Média','Baixa'].map(p=>`<option value="${p}" ${p===t.prioridade?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="td-status">
          ${[{v:'aberto',l:'Aberto'},{v:'andamento',l:'Em Andamento'},{v:'concluido',l:'Concluído'},{v:'atrasado',l:'Atrasado'}].map(s=>`<option value="${s.v}" ${s.v===t.status?'selected':''}>${s.l}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Prazo</label>
        <input class="form-input" id="td-prazo" type="date" value="${t.prazo}">
      </div>
      <div class="form-group">
        <label class="form-label">Responsável</label>
        <select class="form-select" id="td-resp">
          ${CRM.advisors.map(a=>`<option value="${a.id}" ${a.id===t.responsavel?'selected':''}>${a.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Lead Relacionado</label>
        <input type="text" id="td-lead-search" class="form-input" placeholder="🔍 Buscar lead..." style="margin-bottom:6px">
        <select class="form-select" id="td-lead">
          <option value="">— Nenhum —</option>
          ${leadsDisponiveis.map(l=>`<option value="${l.id}" ${l.id===t.leadId?'selected':''}>${l.name} — ${l.company}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-ghost btn-sm" onclick="deleteTask('${taskId}');closeModal()">🗑 Excluir</button>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Salvar';
  document.getElementById('modal-confirm').onclick = () => saveTaskDetail(taskId);
  
  // Filtro de leads
  document.getElementById('td-lead-search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = leadsDisponiveis.filter(l => l.name.toLowerCase().includes(term) || (l.company||'').toLowerCase().includes(term));
    document.getElementById('td-lead').innerHTML = '<option value="">— Nenhum —</option>' + 
      filtered.map(l => `<option value="${l.id}" ${l.id===t.leadId?'selected':''}>${l.name} — ${l.company}</option>`).join('');
  });

  modal.classList.add('open');
}

function saveTaskDetail(taskId) {
  const t = CRM.tasks.find(t => t.id === taskId);
  const title = document.getElementById('td-title').value || t.title;
  const prioridade = document.getElementById('td-prio').value;
  const status = document.getElementById('td-status').value;
  const prazo = document.getElementById('td-prazo').value;
  const responsavel = document.getElementById('td-resp').value;
  const leadId = document.getElementById('td-lead').value || null;
  
  updateDocument('tasks', taskId, {
    title, prioridade, status, prazo, responsavel, leadId
  }).then(() => {
    closeModal();
    showToast('Tarefa atualizada!', 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}

function deleteTask(taskId) {
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    deleteDocument('tasks', taskId).then(() => {
      showToast('Tarefa removida', 'info');
      closeModal();
    }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
  }
}

// ─── NOVA TAREFA ─────────────────────────────────────────────
function openNewTaskModal() {
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = '+ Nova Tarefa';
  
  const leadsDisponiveis = CRM.leads;
  
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Título *</label>
      <input class="form-input" id="nt-title" placeholder="Descreva a tarefa...">
    </div>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Prioridade</label>
        <select class="form-select" id="nt-prio">
          <option value="Alta">🔴 Alta</option>
          <option value="Média" selected>🟡 Média</option>
          <option value="Baixa">🟢 Baixa</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Prazo *</label>
        <input class="form-input" id="nt-prazo" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">Responsável</label>
        <select class="form-select" id="nt-resp">
          ${CRM.advisors.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Lead Relacionado</label>
        <input type="text" id="nt-lead-search" class="form-input" placeholder="🔍 Buscar lead..." style="margin-bottom:6px">
        <select class="form-select" id="nt-lead">
          <option value="">— Nenhum —</option>
          ${leadsDisponiveis.map(l=>`<option value="${l.id}">${l.name} — ${l.company||''}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Criar Tarefa';
  document.getElementById('modal-confirm').onclick = saveNewTask;
  
  // Filtro de leads
  document.getElementById('nt-lead-search').addEventListener('input', (e) => {
    const t = e.target.value.toLowerCase();
    const filtered = leadsDisponiveis.filter(l => l.name.toLowerCase().includes(t) || (l.company||'').toLowerCase().includes(t));
    document.getElementById('nt-lead').innerHTML = '<option value="">— Nenhum —</option>' + 
      filtered.map(l => `<option value="${l.id}">${l.name} — ${l.company||''}</option>`).join('');
  });

  modal.classList.add('open');
}

function saveNewTask() {
  const title = document.getElementById('nt-title').value.trim();
  const prazo = document.getElementById('nt-prazo').value;
  if (!title || !prazo) { showToast('Preencha título e prazo', 'error'); return; }
  const today = new Date(); today.setHours(0,0,0,0);
  const dueDate = new Date(prazo + 'T00:00:00');
  
  const newTask = {
    title,
    prioridade: document.getElementById('nt-prio').value,
    prazo,
    responsavel: document.getElementById('nt-resp').value,
    leadId: document.getElementById('nt-lead').value || null,
    status: dueDate < today ? 'atrasado' : 'aberto',
  };

  addDocument('tasks', newTask).then(() => {
    closeModal();
    showToast('Tarefa criada!', 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}
