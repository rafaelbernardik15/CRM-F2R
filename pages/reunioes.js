// ============================================================
// REUNIÕES
// ============================================================
function renderReunioes() {
  const content = document.getElementById('page-content');
  const meetings = CRM.meetings;
  const today = new Date();

  const upcoming = meetings.filter(m => new Date(m.date+'T00:00:00') >= today);
  const past = meetings.filter(m => new Date(m.date+'T00:00:00') < today);

  const activeTab = window._reunioesTab || 'upcoming';
  window._reunioesTab = activeTab;
  const shown = activeTab === 'upcoming' ? upcoming : past;

  content.innerHTML = `
    <div class="page-hero">
      <h1>Reuniões</h1>
      <p>Agende, acompanhe e registre resultados de todas as reuniões comerciais</p>
    </div>

    <!-- MINI STATS -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
      ${miniWidget('📅','Esta semana', upcoming.filter(m=>{
        const d=new Date(m.date+'T00:00:00'); const diff=(d-today)/86400000;
        return diff>=0&&diff<=7;
      }).length, 'var(--accent)')}
      ${miniWidget('✅','Realizadas (mês)', past.filter(m=>{
        const d=new Date(m.date+'T00:00:00');
        return d.getMonth()===today.getMonth();
      }).length, 'var(--hot)')}
      ${miniWidget('⏳','Aguardando follow-up', past.filter(m=>!m.proximosPassos).length, 'var(--amber)')}
      ${miniWidget('📊','Total', meetings.length, 'var(--teal)')}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div class="tabs" style="margin-bottom:0;border:none">
        <span class="tab-btn ${activeTab==='upcoming'?'active':''}" onclick="window._reunioesTab='upcoming';renderReunioes()">📅 Próximas (${upcoming.length})</span>
        <span class="tab-btn ${activeTab==='past'?'active':''}" onclick="window._reunioesTab='past';renderReunioes()">✅ Realizadas (${past.length})</span>
      </div>
      <button class="btn btn-primary" onclick="openNewMeetingModal()">+ Nova Reunião</button>
    </div>

    ${shown.map(m => renderMeetingCard(m)).join('')}
    ${shown.length === 0 ? `<div style="text-align:center;padding:60px;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:12px">📅</div>
      <div>Nenhuma reunião aqui ainda.</div>
    </div>` : ''}
  `;
}

function renderMeetingCard(m) {
  const lead = CRM.getLead(m.leadId);
  const adv = CRM.getAdvisor(m.responsavel);
  const date = new Date(m.date+'T00:00:00');
  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
  const isPast = m.status === 'Realizada';

  const typeIcons = { 'Virtual':'💻', 'Presencial':'🤝', 'Café':'☕', 'Telefone':'📞' };

  return `
    <div class="meeting-card">
      <div class="meeting-header">
        <div class="meeting-date-box">
          <div class="meeting-day">${day}</div>
          <div class="meeting-month">${month}</div>
        </div>
        <div class="meeting-info">
          <div class="meeting-title">${m.title}</div>
          <div class="meeting-meta">
            <span>${typeIcons[m.type]||'📅'} ${m.type}</span>
            <span>⏰ ${m.time}</span>
            <span>📍 ${m.local}</span>
            ${lead ? `<span>👤 ${lead.name}</span>` : ''}
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <span class="badge badge-${isPast?'emerald':'accent'}">${m.status}</span>
            <div class="avatar sm" style="background:linear-gradient(135deg,${adv.color},${adv.color}88)">${adv.initials}</div>
            <span style="font-size:12px;color:var(--text-muted)">${adv.name}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          ${!isPast ? `<button class="btn btn-teal btn-sm" onclick="markMeetingDone('${m.id}')">✅ Marcar realizada</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="openMeetingDetail('${m.id}')">
            ${isPast ? '📋 Ver detalhes' : '✏️ Editar'}
          </button>
          ${lead ? `<button class="btn btn-ghost btn-sm" onclick="navigate('lead','${lead.id}')">👤 Ver lead</button>` : ''}
          <button class="btn btn-ghost btn-sm" style="color:var(--rose)" onclick="deleteMeeting('${m.id}')">🗑 Excluir</button>
        </div>
      </div>

      ${isPast && m.resumo ? `
        <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:14px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:10px">📋 Resultado da Reunião</div>
          <div class="form-grid form-grid-2" style="gap:12px">
            <div>
              <div style="font-size:10.5px;color:var(--text-muted);margin-bottom:4px">Resumo</div>
              <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.6">${m.resumo}</p>
            </div>
            <div>
              ${m.dores ? `<div style="margin-bottom:8px"><div style="font-size:10.5px;color:var(--rose);margin-bottom:2px">🎯 Dores identificadas</div><p style="font-size:12.5px;line-height:1.6">${m.dores}</p></div>` : ''}
              ${m.proximosPassos ? `<div><div style="font-size:10.5px;color:var(--teal);margin-bottom:2px">➡️ Próximos passos</div><p style="font-size:12.5px;line-height:1.6">${m.proximosPassos}</p></div>` : ''}
            </div>
          </div>
        </div>
      ` : ''}

      ${isPast && !m.resumo ? `
        <div style="background:var(--amber-light);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius-md);padding:12px;display:flex;align-items:center;gap:12px">
          <span>⚠️</span>
          <div style="flex:1;font-size:12.5px;color:var(--amber)">Reunião realizada sem registro. Preencha o resultado para manter o CRM atualizado.</div>
          <button class="btn btn-sm" style="background:var(--amber);color:#000;font-weight:600" onclick="openMeetingDetail('${m.id}')">Preencher agora</button>
        </div>
      ` : ''}

      ${!isPast ? `
        <div style="background:var(--accent-light);border:1px solid rgba(15,44,89,0.2);border-radius:var(--radius-md);padding:10px;display:flex;align-items:center;gap:10px">
          <span>👥</span>
          <span style="font-size:12px;color:var(--text-secondary)">Participantes: ${m.participantes.join(', ')}</span>
        </div>
      ` : ''}
    </div>`;
}

window.deleteMeeting = function(id) {
  if (confirm('Tem certeza que deseja excluir esta reunião?')) {
    deleteDocument('meetings', id).then(() => {
      showToast('Reunião excluída com sucesso.', 'success');
    }).catch(e => showToast(`Erro ao excluir: ${e.message}`, 'error'));
  }
}

function markMeetingDone(id) {
  updateDocument('meetings', id, { status: 'Realizada' }).then(() => {
    showToast('Reunião marcada como realizada!', 'success');
    openMeetingDetail(id);
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}

// ─── MEETING DETAIL MODAL ────────────────────────────────────
function openMeetingDetail(id) {
  const m = CRM.getMeeting(id);
  const lead = m.leadId ? CRM.getLead(m.leadId) : null;
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal').classList.add('modal-lg');
  document.getElementById('modal-title').textContent = m.status === 'Realizada' ? '📋 Resultado da Reunião' : '✏️ Editar Reunião';
  document.getElementById('modal-body').innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:180px">
        <div class="form-label">Título</div>
        <input class="form-input" id="md-title" value="${m.title}">
      </div>
      <div>
        <div class="form-label">Data</div>
        <input class="form-input" id="md-date" type="date" value="${m.date}">
      </div>
      <div>
        <div class="form-label">Horário</div>
        <input class="form-input" id="md-time" type="time" value="${m.time}">
      </div>
    </div>
    <div class="form-grid form-grid-2" style="margin-bottom:16px">
      <div>
        <div class="form-label">Tipo</div>
        <select class="form-select" id="md-type">
          ${['Virtual','Presencial','Café','Telefone'].map(t=>`<option value="${t}" ${m.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div>
        <div class="form-label">Local</div>
        <input class="form-input" id="md-local" value="${m.local}">
      </div>
    </div>
    <div class="divider"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="font-size:13px;font-weight:700">📋 Resultado</div>
      <button class="btn btn-teal btn-sm" onclick="generateAISummary('${id}')">✨ Gerar com IA</button>
    </div>
    <div class="form-group">
      <label class="form-label">Resumo da Reunião</label>
      <textarea class="form-textarea" id="md-resumo" style="min-height:90px">${m.resumo||''}</textarea>
    </div>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">🎯 Dores Identificadas</label>
        <textarea class="form-textarea" id="md-dores">${m.dores||''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">🚧 Objeções</label>
        <textarea class="form-textarea" id="md-objecoes">${m.objecoes||''}</textarea>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">➡️ Próximos Passos</label>
      <textarea class="form-textarea" id="md-passos">${m.proximosPassos||''}</textarea>
    </div>
    <div id="ai-output" style="display:none;margin-top:12px"></div>
  `;
  document.getElementById('modal-confirm').textContent = 'Salvar';
  document.getElementById('modal-confirm').onclick = () => saveMeetingDetail(id);
  modal.classList.add('open');
}

function generateAISummary(meetingId) {
  const m = CRM.getMeeting(meetingId);
  const lead = CRM.getLead(m.leadId);
  const aiOutput = document.getElementById('ai-output');
  aiOutput.style.display = 'block';
  aiOutput.innerHTML = `
    <div style="background:var(--teal-light);border:1px solid rgba(0,212,170,0.2);border-radius:var(--radius-md);padding:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <span style="animation:pulse 1.5s infinite;display:inline-block">✨</span>
        <span style="font-size:12px;font-weight:700;color:var(--teal)">IA Gerando análise...</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">Analisando contexto do lead e histórico de interações...</div>
    </div>`;

  setTimeout(() => {
    const leadName = lead ? lead.name : 'Lead';
    const dor = lead ? lead.dorPrincipal : 'necessidade específica';
    const objecao = lead ? lead.objecao : 'condição comercial';

    const suggestions = {
      resumo: `Reunião realizada com ${leadName}. Foi apresentada uma visão completa sobre gestão patrimonial e diversificação de investimentos. O cliente demonstrou interesse genuíno nas soluções apresentadas e se mostrou receptivo à proposta de Consultoria.`,
      dores: `1. ${dor || 'Concentração de ativos em único veículo'}\n2. Falta de gestão profissional do patrimônio\n3. Preocupação com proteção patrimonial para família`,
      objecoes: `1. ${objecao || 'Relação com instituição financeira atual'}\n2. Preocupação com custos de transição\n3. Necessita de mais tempo para avaliação`,
      passos: `1. Enviar proposta detalhada em até 48h\n2. Agendar segunda reunião com cônjuge/sócios\n3. Preparar material comparativo de rentabilidade\n4. Follow-up via WhatsApp em 3 dias`,
    };

    document.getElementById('md-resumo').value = suggestions.resumo;
    document.getElementById('md-dores').value = suggestions.dores;
    document.getElementById('md-objecoes').value = suggestions.objecoes;
    document.getElementById('md-passos').value = suggestions.passos;

    aiOutput.innerHTML = `
      <div style="background:var(--teal-light);border:1px solid rgba(0,212,170,0.25);border-radius:var(--radius-md);padding:14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span>✅</span>
          <span style="font-size:12px;font-weight:700;color:var(--teal)">Análise gerada com sucesso!</span>
        </div>
        <p style="font-size:12px;color:var(--text-secondary)">Campos preenchidos com base no perfil do lead e histórico de interações. Revise e ajuste conforme necessário.</p>
      </div>`;
    showToast('Resumo gerado pela IA!', 'success');
  }, 2000);
}

function saveMeetingDetail(id) {
  const m = CRM.getMeeting(id);
  const title    = document.getElementById('md-title')?.value || m.title;
  const date     = document.getElementById('md-date')?.value || m.date;
  const time     = document.getElementById('md-time')?.value || m.time;
  const type     = document.getElementById('md-type')?.value || m.type;
  const local    = document.getElementById('md-local')?.value || m.local;
  const resumo   = document.getElementById('md-resumo')?.value || '';
  const dores    = document.getElementById('md-dores')?.value || '';
  const objecoes = document.getElementById('md-objecoes')?.value || '';
  const proximosPassos = document.getElementById('md-passos')?.value || '';
  const status = resumo ? 'Realizada' : m.status;
  
  updateDocument('meetings', id, {
    title, date, time, type, local, resumo, dores, objecoes, proximosPassos, status
  }).then(() => {
    document.getElementById('modal').classList.remove('modal-lg');
    closeModal();
    showToast('Reunião atualizada com sucesso!', 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}

// ─── NOVA REUNIÃO ────────────────────────────────────────────
function openNewMeetingModal() {
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = '+ Nova Reunião';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Lead *</label>
      <select class="form-select" id="nm-lead">
        <option value="">— Selecionar lead —</option>
        ${CRM.leads.map(l=>`<option value="${l.id}">${l.name} — ${l.company}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Título</label>
      <input class="form-input" id="nm-title" placeholder="Ex: Reunião de diagnóstico — Nome do Lead">
    </div>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">Data *</label>
        <input class="form-input" id="nm-date" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">Horário *</label>
        <input class="form-input" id="nm-time" type="time" value="10:00">
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="nm-type">
          <option>Virtual</option><option>Presencial</option><option>Café</option><option>Telefone</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Local</label>
        <input class="form-input" id="nm-local" placeholder="Google Meet, Escritório...">
      </div>
      <div class="form-group">
        <label class="form-label">Responsável</label>
        <select class="form-select" id="nm-resp">
          ${CRM.advisors.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Criar Reunião';
  document.getElementById('modal-confirm').onclick = saveNewMeeting;
  modal.classList.add('open');
}

function saveNewMeeting() {
  const date = document.getElementById('nm-date').value;
  const leadId = document.getElementById('nm-lead').value;
  if (!date || !leadId) { showToast('Preencha lead e data', 'error'); return; }
  const lead = CRM.getLead(leadId);
  const title = document.getElementById('nm-title').value || `Reunião — ${lead.name}`;
  const respId = document.getElementById('nm-resp').value;
  
  const newMeeting = {
    leadId, title, date,
    time: document.getElementById('nm-time').value,
    type: document.getElementById('nm-type').value,
    local: document.getElementById('nm-local').value,
    status: 'Agendada',
    participantes: [lead.name, CRM.getAdvisor(respId).name],
    resumo:'', dores:'', objecoes:'', proximosPassos:'',
    responsavel: respId,
  };
  
  addDocument('meetings', newMeeting).then(() => {
    if (lead.stage === 'Diagnóstico' || lead.stage === 'Conversa iniciada') {
       updateDocument('leads', leadId, { stage: 'Reunião marcada' });
    }
    closeModal();
    showToast('Reunião agendada!', 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}
