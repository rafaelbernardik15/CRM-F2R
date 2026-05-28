// ============================================================
// RELACIONAMENTO PESSOAL
// ============================================================
function renderRelacionamento() {
  const content = document.getElementById('page-content');
  const leads = CRM.leads;

  // Aniversários próximos (30 dias)
  const today = new Date();
  const upcomingBirthdays = leads.filter(l => {
    if (!l.aniversario) return false;
    const bday = new Date(l.aniversario);
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const nextYear = new Date(today.getFullYear()+1, bday.getMonth(), bday.getDate());
    const next = thisYear >= today ? thisYear : nextYear;
    return (next - today) / 86400000 <= 30;
  }).map(l => {
    const bday = new Date(l.aniversario);
    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    const next = thisYear >= today ? thisYear : new Date(today.getFullYear()+1, bday.getMonth(), bday.getDate());
    const daysLeft = Math.ceil((next - today) / 86400000);
    return { ...l, bdayDays: daysLeft, bdayDate: next };
  }).sort((a,b) => a.bdayDays - b.bdayDays);

  const activeTab = window._relTab || 'contacts';
  window._relTab = activeTab;

  content.innerHTML = `
    <div class="page-hero">
      <h1>Relacionamento</h1>
      <p>Humanize o atendimento com dados pessoais que criam conexões reais</p>
    </div>

    <!-- ANIVERSÁRIOS PRÓXIMOS -->
    ${upcomingBirthdays.length > 0 ? `
      <div class="card card-pad mb-4" style="border-left:3px solid var(--amber);background:linear-gradient(135deg,var(--amber-light),transparent)">
        <div style="font-size:13px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px">
          🎂 Aniversários nos próximos 30 dias
          <span class="badge badge-amber">${upcomingBirthdays.length}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${upcomingBirthdays.map(l => `
            <div onclick="navigate('lead','${l.id}')" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px 16px;cursor:pointer;transition:all 0.2s;min-width:180px"
              onmouseover="this.style.borderColor='var(--amber)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-weight:600;font-size:13px;margin-bottom:2px">${l.name.split(' ')[0]}</div>
              <div style="font-size:11.5px;color:var(--text-muted)">${l.company}</div>
              <div style="font-size:12px;color:var(--amber);font-weight:700;margin-top:6px">
                🎂 ${l.bdayDays === 0 ? '🎉 HOJE!' : l.bdayDays === 1 ? 'Amanhã' : `Em ${l.bdayDays} dias`}
              </div>
              <div style="font-size:11px;color:var(--text-muted)">${l.bdayDate.toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- TABS -->
    <div class="tabs">
      <span class="tab-btn ${activeTab==='contacts'?'active':''}" onclick="window._relTab='contacts';renderRelacionamento()">👥 Todos os Contatos</span>
      <span class="tab-btn ${activeTab==='vip'?'active':''}" onclick="window._relTab='vip';renderRelacionamento()">⭐ VIPs</span>
      <span class="tab-btn ${activeTab==='events'?'active':''}" onclick="window._relTab='events';renderRelacionamento()">🎯 Eventos Importantes</span>
    </div>

    ${activeTab === 'contacts' ? renderRelContacts(leads) : ''}
    ${activeTab === 'vip' ? renderRelContacts(leads.filter(l => l.tags.includes('VIP'))) : ''}
    ${activeTab === 'events' ? renderRelEvents() : ''}
  `;
}

function renderRelContacts(leads) {
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
      ${leads.map(l => {
        const adv = CRM.getAdvisor(l.responsavel);
        return `
          <div class="card card-pad" style="cursor:pointer;transition:all 0.2s"
            onclick="navigate('lead','${l.id}')"
            onmouseover="this.style.borderColor='var(--border-hover)';this.style.transform='translateY(-2px)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
            <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
              <div class="avatar lg" style="background:linear-gradient(135deg,${adv.color},${adv.color}55)">
                ${CRM.getInitials(l.name)}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:14px">${l.name}</div>
                <div style="font-size:12px;color:var(--text-muted)">${l.cargo} · ${l.company}</div>
                <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                  <span class="temp-dot ${CRM.tempClass(l.temp)}" style="margin-top:3px"></span>
                  ${l.tags.map(t=>`<span class="badge badge-muted" style="font-size:10px">${t}</span>`).join('')}
                </div>
              </div>
              ${l.aniversario ? `<div style="text-align:center;font-size:10.5px;color:var(--amber)">🎂<br>${new Date(l.aniversario).toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}</div>` : ''}
            </div>

            <div class="divider"></div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
              ${l.hobbies ? relField('🎯 Hobbies', l.hobbies) : ''}
              ${l.filhos ? relField('👶 Família', l.filhos) : ''}
              ${l.timeCoracao ? relField('⚽ Time', l.timeCoracao) : ''}
              ${l.viagens ? relField('✈️ Viagens', l.viagens) : ''}
              ${relField('📱 Canal Pref.', l.canalPreferido)}
              ${l.cidade ? relField('📍 Cidade', l.cidade) : ''}
            </div>

            <div class="divider"></div>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="font-size:11px;color:var(--text-muted)">
                💎 ${CRM.formatCurrency(l.patrimonio)} · ${l.interesse || 'interesse a definir'}
              </div>
              <div style="font-size:11px;color:var(--text-muted)">
                🕐 ${CRM.daysSince(l.ultimoContato)}d atrás
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function relField(label, value) {
  return `<div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:8px;min-width:0">
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">${label}</div>
    <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${value}</div>
  </div>`;
}

function renderRelEvents() {
  const events = CRM.events;
  const impactColors = { 'Alto':'var(--rose)', 'Médio':'var(--amber)', 'Baixo':'var(--accent)' };

  return `
    <div style="margin-bottom:16px">
      <button class="btn btn-primary btn-sm" onclick="openNewEventModal()">+ Registrar Evento</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${events.map(ev => {
        const lead = CRM.getLead(ev.leadId);
        return `
          <div class="card card-pad" style="cursor:pointer;border-left:3px solid ${impactColors[ev.impact]}"
            onclick="navigate('lead','${ev.leadId}')">
            <div style="display:flex;align-items:flex-start;gap:16px">
              <div style="font-size:28px;flex-shrink:0">${ev.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                  <span style="font-weight:700;font-size:14px">${ev.type}</span>
                  <span class="badge" style="background:${impactColors[ev.impact]}22;color:${impactColors[ev.impact]};font-size:10px">Impacto ${ev.impact}</span>
                </div>
                <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${ev.desc}</div>
                ${lead ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">👤 ${lead.name} · ${lead.company}</div>` : ''}
                <div style="background:var(--teal-light);border:1px solid rgba(0,212,170,0.2);border-radius:var(--radius-md);padding:8px 12px;font-size:12px;color:var(--teal)">
                  💡 Ação sugerida: ${ev.action}
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;font-size:11.5px;color:var(--text-muted)">
                📅 ${CRM.formatDate(ev.date)}
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function openNewEventModal() {
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = '🎯 Registrar Evento Importante';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Lead / Contato *</label>
      <select class="form-select" id="ne-lead">
        ${CRM.leads.map(l=>`<option value="${l.id}">${l.name} — ${l.company}</option>`).join('')}
      </select>
    </div>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Tipo de Evento</label>
        <select class="form-select" id="ne-type">
          ${['Venda de empresa','Compra de imóvel','Casamento','Nascimento de filho','Troca de carreira','Expansão de negócios','Herança','Aposentadoria','Outro'].map(t=>`<option>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Data *</label>
        <input class="form-input" id="ne-date" type="date">
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Descrição *</label>
        <input class="form-input" id="ne-desc" placeholder="Descreva o evento...">
      </div>
      <div class="form-group">
        <label class="form-label">Impacto Comercial</label>
        <select class="form-select" id="ne-impact">
          <option>Alto</option><option>Médio</option><option>Baixo</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Ação Sugerida</label>
        <input class="form-input" id="ne-action" placeholder="O que fazer?">
      </div>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Registrar Evento';
  document.getElementById('modal-confirm').onclick = saveNewEvent;
  modal.classList.add('open');
}

function saveNewEvent() {
  const leadId = document.getElementById('ne-lead').value;
  const type = document.getElementById('ne-type').value;
  const date = document.getElementById('ne-date').value;
  const desc = document.getElementById('ne-desc').value.trim();
  const impact = document.getElementById('ne-impact').value;
  const action = document.getElementById('ne-action').value.trim();

  if (!leadId || !date || !desc) {
    showToast('Preencha os campos obrigatórios (Lead, Data e Descrição)', 'error');
    return;
  }

  const icons = {
    'Venda de empresa': '🏆',
    'Compra de imóvel': '🏡',
    'Casamento': '💍',
    'Nascimento de filho': '👶',
    'Troca de carreira': '💼',
    'Expansão de negócios': '🚀',
    'Herança': '💰',
    'Aposentadoria': '🌴',
    'Outro': '🎯'
  };

  const newEvent = {
    leadId,
    icon: icons[type] || '🎯',
    type,
    desc,
    date,
    impact,
    action: action || 'Contatar lead para parabenizar/alinhar próximos passos.'
  };

  CRM.events.unshift(newEvent);
  closeModal();
  showToast('Evento registrado com sucesso!', 'success');
  renderRelacionamento();
}
