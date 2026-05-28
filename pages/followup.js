// ============================================================
// FOLLOW-UP INTELIGENTE
// ============================================================
function renderFollowup() {
  const content = document.getElementById('page-content');
  const activeTab = window._followupTab || 'all';
  window._followupTab = activeTab;

  const tabs = [
    { id:'all', label:'Todos', count: CRM.followups.length },
    { id:'urgent', label:'🔴 Urgentes', count: CRM.followups.filter(f=>f.prioridade==='urgent').length },
    { id:'important', label:'🟡 Importantes', count: CRM.followups.filter(f=>f.prioridade==='important').length },
    { id:'normal', label:'🔵 Normais', count: CRM.followups.filter(f=>f.prioridade==='normal').length },
  ];

  const filtered = activeTab === 'all' ? CRM.followups : CRM.followups.filter(f => f.prioridade === activeTab);

  // Cálculos rápidos
  const overdue = CRM.followups.filter(f => {
    const d = new Date(f.vencimento + 'T00:00:00');
    return d < new Date();
  }).length;

  content.innerHTML = `
    <div class="page-hero">
      <h1>Follow-up Inteligente</h1>
      <p>Central de acompanhamento e priorização de contatos</p>
    </div>

    <!-- MINI WIDGETS -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
      ${miniWidget('⏰','Vencidos', overdue, 'var(--rose)')}
      ${miniWidget('🔴','Urgentes', CRM.followups.filter(f=>f.prioridade==='urgent').length, 'var(--rose)')}
      ${miniWidget('🟡','Importantes', CRM.followups.filter(f=>f.prioridade==='important').length, 'var(--amber)')}
      ${miniWidget('📴','Leads Parados +7d', CRM.leads.filter(l=>CRM.daysSince(l.ultimoContato)>7&&l.stage!=='Fechado'&&l.stage!=='Perdido').length, 'var(--amber)')}
    </div>

    <!-- TABS -->
    <div class="followup-tabs">
      ${tabs.map(t => `
        <div class="followup-tab ${activeTab===t.id?'active':''}" onclick="window._followupTab='${t.id}';renderFollowup()">
          ${t.label} <span style="margin-left:4px;opacity:0.7">(${t.count})</span>
        </div>
      `).join('')}
    </div>

    <!-- BOTÃO RÁPIDO -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="btn btn-primary" onclick="openQuickContactModal()">
        📱 Registrar Contato Rápido
      </button>
    </div>

    <!-- LISTA -->
    <div class="followup-list">
      ${filtered.map(f => renderFollowupItem(f)).join('')}
      ${filtered.length === 0 ? `
        <div style="text-align:center;padding:60px;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:12px">✅</div>
          <div style="font-size:16px;font-weight:600;margin-bottom:4px">Tudo em dia!</div>
          <div style="font-size:13px">Nenhum follow-up pendente nesta categoria.</div>
        </div>
      ` : ''}
    </div>

    <!-- LEADS SEM CONTATO +7 DIAS -->
    <div class="section-header mt-4">
      <div class="section-title"><span class="icon">📴</span>Leads Parados — sem contato há mais de 7 dias</div>
    </div>
    <div class="followup-list">
      ${CRM.leads.filter(l => CRM.daysSince(l.ultimoContato)>7 && l.stage!=='Fechado' && l.stage!=='Perdido').map(l => {
        const days = CRM.daysSince(l.ultimoContato);
        const adv = CRM.getAdvisor(l.responsavel);
        return `
          <div class="followup-item ${days > 14 ? 'urgent' : 'important'}" onclick="navigate('lead','${l.id}')">
            <div class="temp-dot ${CRM.tempClass(l.temp)}" style="width:10px;height:10px;flex-shrink:0"></div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-weight:600;font-size:13.5px">${l.name}</span>
                <span class="badge badge-muted" style="font-size:10px">${l.company}</span>
                <span class="badge badge-${l.temp==='hot'?'hot':l.temp==='warm'?'amber':'rose'}" style="font-size:10px">${CRM.tempLabel(l.temp)}</span>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${l.stage} · ${l.interesse || 'Interesse não definido'}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:14px;font-weight:800;color:${days>14?'var(--rose)':'var(--amber)'}">${days}d</div>
              <div style="font-size:10px;color:var(--text-muted)">sem contato</div>
            </div>
            <div class="avatar sm" style="background:linear-gradient(135deg,${adv.color},${adv.color}88);flex-shrink:0">${adv.initials}</div>
            <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openContactModal('${l.id}')">Contatar</button>
          </div>`;
      }).join('')}
    </div>
  `;
}

function renderFollowupItem(f) {
  const l = CRM.getLead(f.leadId);
  if (!l) return '';
  const adv = CRM.getAdvisor(f.responsavel);
  const isOverdue = new Date(f.vencimento + 'T00:00:00') < new Date();

  const prioLabel = { urgent: '🔴 URGENTE', important: '🟡 IMPORTANTE', normal: '🔵 NORMAL' };
  const prioColors = { urgent: 'var(--rose)', important: 'var(--amber)', normal: 'var(--accent)' };

  return `
    <div class="followup-item ${f.prioridade}" onclick="navigate('lead','${f.leadId}')">
      <div style="text-align:center;flex-shrink:0;min-width:70px">
        <div class="priority-indicator ${f.prioridade}" style="font-size:9px">${prioLabel[f.prioridade]}</div>
        <div style="font-size:10.5px;color:${isOverdue?'var(--rose)':'var(--text-muted)'};margin-top:4px">
          ${isOverdue ? '⚠ VENCIDO' : '📅 ' + CRM.formatDate(f.vencimento)}
        </div>
      </div>
      <div class="temp-dot ${CRM.tempClass(l.temp)}" style="width:10px;height:10px;flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap">
          <span style="font-weight:600;font-size:13.5px">${l.name}</span>
          <span class="badge badge-muted" style="font-size:10px">${l.stage}</span>
          <span style="font-size:11px;color:${prioColors[f.prioridade]};font-weight:600">${f.tipo}</span>
        </div>
        <div style="font-size:12px;color:var(--text-muted)">${f.desc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <div class="avatar sm" style="background:linear-gradient(135deg,${adv.color},${adv.color}88)" title="${adv.name}">${adv.initials}</div>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openContactModal('${f.leadId}')">📱 Contatar</button>
        <button class="btn btn-ghost btn-icon" style="width:28px;height:28px;font-size:12px;padding:0;color:var(--rose)" onclick="event.stopPropagation();deleteFollowup('${f.id}')" title="Excluir follow-up">🗑️</button>
      </div>
    </div>`;
}

window.deleteFollowup = function(id) {
  if (confirm('Tem certeza que deseja excluir este follow-up?')) {
    deleteDocument('followups', id).then(() => {
      showToast('Follow-up excluído com sucesso.', 'success');
    }).catch(e => showToast(`Erro ao excluir: ${e.message}`, 'error'));
  }
}

function miniWidget(icon, label, value, color) {
  return `<div class="card card-pad" style="display:flex;align-items:center;gap:14px">
    <div style="font-size:24px">${icon}</div>
    <div>
      <div style="font-size:22px;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:11.5px;color:var(--text-muted)">${label}</div>
    </div>
  </div>`;
}

// ─── QUICK CONTACT MODAL ─────────────────────────────────────
function openQuickContactModal() {
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = '📱 Registrar Contato Rápido';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Lead</label>
      <select class="form-select" id="qc-lead">
        ${CRM.leads.filter(l=>l.stage!=='Fechado'&&l.stage!=='Perdido').map(l=>`<option value="${l.id}">${l.name} — ${l.company}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Tipo de Contato</label>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${['💬 WhatsApp','📞 Ligação','📹 Reunião virtual','🤝 Reunião presencial','☕ Café','📧 E-mail'].map(t => `
          <label style="display:flex;align-items:center;gap:6px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 10px;cursor:pointer;font-size:12px;transition:all 0.2s">
            <input type="radio" name="qc-type" value="${t.split(' ').slice(1).join(' ')}" style="accent-color:var(--accent)"> ${t}
          </label>
        `).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Resumo</label>
      <textarea class="form-textarea" id="qc-desc" placeholder="O que foi conversado?"></textarea>
    </div>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Próximo Contato</label>
        <input class="form-input" id="qc-next" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">Nova Temperatura</label>
        <select class="form-select" id="qc-temp">
          <option value="">— manter atual —</option>
          <option value="cold">❄️ Frio</option>
          <option value="warm">🌤 Morno</option>
          <option value="hot">🔥 Quente</option>
        </select>
      </div>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Registrar';
  document.getElementById('modal-confirm').onclick = () => {
    const leadId = document.getElementById('qc-lead').value;
    saveQuickContact(leadId);
  };
  modal.classList.add('open');
}

function saveQuickContact(leadId) {
  const l = CRM.getLead(leadId);
  if (!l) return;
  const typeEl = document.querySelector('input[name="qc-type"]:checked');
  const type = typeEl ? typeEl.value : 'Contato';
  const desc = document.getElementById('qc-desc').value.trim();
  const nextDate = document.getElementById('qc-next').value;
  const temp = document.getElementById('qc-temp').value;

  const icons = { 'WhatsApp':'💬', 'Ligação':'📞', 'Reunião virtual':'📹', 'Reunião presencial':'🤝', 'Café':'☕', 'E-mail':'📧' };

  const timeline = l.timeline || [];
  timeline.unshift({
    type: type.toLowerCase().replace(' ',''),
    label: type, desc: desc || 'Contato registrado rápido.',
    date: new Date().toISOString().split('T')[0],
    icon: icons[type] || '📋'
  });

  const updates = {
    timeline: timeline,
    ultimoContato: new Date().toISOString().split('T')[0]
  };
  if (nextDate) updates.proximoContato = nextDate;
  if (temp) updates.temp = temp;

  updateDocument('leads', leadId, updates).then(() => {
    const followupsToDelete = CRM.followups.filter(f => f.leadId === leadId);
    Promise.all(followupsToDelete.map(f => deleteDocument('followups', f.id))).then(() => {
      closeModal();
      showToast(`Contato "${type}" registrado com sucesso!`, 'success');
    });
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}
