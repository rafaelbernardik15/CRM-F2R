// ============================================================
// PÁGINA COMPLETA DO LEAD
// ============================================================
function renderLeadPage(leadId) {
  const content = document.getElementById('page-content');
  const l = CRM.getLead(leadId);
  if (!l) { content.innerHTML = '<p>Lead não encontrado.</p>'; return; }

  const adv = CRM.getAdvisor(l.responsavel);
  const days = CRM.daysSince(l.ultimoContato);

  content.innerHTML = `
    <!-- BACK + HEADER -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button class="btn btn-ghost btn-sm" onclick="navigate('pipeline')">← Pipeline</button>
      <div class="divider" style="height:16px;width:1px;margin:0"></div>
      <div style="display:flex;align-items:center;gap:8px">
        ${l.tags.map(t => `<span class="badge badge-muted">${t}</span>`).join('')}
      </div>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="openContactModal('${l.id}')">📱 Registrar Contato</button>
        <button class="btn btn-primary btn-sm" onclick="openEditLeadModal('${l.id}')">✏️ Editar</button>
      </div>
    </div>

    <!-- HERO DO LEAD -->
    <div class="card card-pad mb-4" style="background:linear-gradient(135deg,var(--bg-card) 0%,var(--bg-elevated) 100%)">
      <div style="display:flex;align-items:flex-start;gap:20px">
        <div class="avatar lg" style="background:linear-gradient(135deg,${adv.color},${adv.color}55);font-size:20px">
          ${CRM.getInitials(l.name)}
        </div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <h2 style="font-size:22px;font-weight:800;letter-spacing:-0.02em">${l.name}</h2>
            <span class="temp-dot ${CRM.tempClass(l.temp)}" style="width:11px;height:11px"></span>
            <span class="badge badge-${l.temp==='hot'?'hot':l.temp==='warm'?'amber':'rose'}">${CRM.tempLabel(l.temp)}</span>
            <span class="badge" style="background:var(--accent-light);color:var(--accent)">${l.stage}</span>
          </div>
          <div style="color:var(--text-muted);font-size:13.5px;margin-top:4px">${l.cargo} · ${l.company} · ${l.cidade}</div>
          <div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap">
            ${statPill('💎', 'Patrimônio', CRM.formatCurrency(l.patrimonio), 'var(--teal)')}
            ${statPill('🎯', 'Score', l.score + '/100', CRM.getScoreColor(l.score))}
            ${statPill('📈', 'Chance', l.chancePercent + '%', 'var(--accent)')}
            ${statPill('🕐', 'Últ. Contato', days === 0 ? 'Hoje' : days + ' dias', days > 7 ? 'var(--rose)' : 'var(--text-secondary)')}
            ${statPill('👤', 'Consultor', adv.name.split(' ')[0], adv.color)}
          </div>
        </div>
        <!-- Score ring visual -->
        <div style="text-align:center;flex-shrink:0">
          <div style="position:relative;width:72px;height:72px">
            <svg viewBox="0 0 72 72" style="transform:rotate(-90deg);width:72px;height:72px">
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-elevated)" stroke-width="6"/>
              <circle cx="36" cy="36" r="30" fill="none" 
                stroke="${CRM.getScoreColor(l.score)}" stroke-width="6"
                stroke-dasharray="${2*Math.PI*30}" 
                stroke-dashoffset="${2*Math.PI*30*(1-l.score/100)}"
                stroke-linecap="round"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
              <span style="font-size:17px;font-weight:800;color:${CRM.getScoreColor(l.score)}">${l.score}</span>
            </div>
          </div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Score</div>
        </div>
      </div>
    </div>

    <div class="lead-page-layout">
      <!-- COLUNA PRINCIPAL -->
      <div>
        <!-- Dados Básicos -->
        <div class="lead-section">
          <div class="lead-section-header" onclick="toggleSection(this)">
            <span style="font-size:16px">👤</span>
            <div class="lead-section-title">Dados Básicos</div>
            <span style="color:var(--text-muted)">▾</span>
          </div>
          <div class="lead-section-body">
            <div class="form-grid form-grid-3">
              ${field('Nome', l.name)}
              ${field('Empresa', l.company)}
              ${field('Cargo', l.cargo || '—')}
              ${field('Segmento', l.segmento || '—')}
              ${field('Cidade', l.cidade || '—')}
              ${field('Canal Preferido', l.canalPreferido || '—')}
            </div>
            <div class="divider"></div>
            <div class="form-grid form-grid-2">
              ${fieldLink('📱 WhatsApp', l.whatsapp, `https://wa.me/${l.whatsapp.replace(/\D/g,'')}`)}
              ${fieldLink('📧 E-mail', l.email, `mailto:${l.email}`)}
              ${fieldLink('📸 Instagram', l.instagram || '—', l.instagram ? `https://instagram.com/${l.instagram.replace('@','')}` : null)}
              ${fieldLink('💼 LinkedIn', l.linkedin || '—', l.linkedin ? `https://${l.linkedin}` : null)}
            </div>
          </div>
        </div>

        <!-- Informações Comerciais -->
        <div class="lead-section">
          <div class="lead-section-header" onclick="toggleSection(this)">
            <span style="font-size:16px">💼</span>
            <div class="lead-section-title">Informações Comerciais</div>
            <span style="color:var(--text-muted)">▾</span>
          </div>
          <div class="lead-section-body">
            <div class="form-grid form-grid-3">
              ${field('Origem', l.origem)}
              ${field('Quem Indicou', l.indicadoPor || '—')}
              ${field('Patrimônio Est.', CRM.formatCurrency(l.patrimonio))}
              ${field('Potencial', l.potencial)}
              ${field('Timing', l.timing)}
              ${field('Perfil', l.perfil || '—')}
            </div>
            <div class="divider"></div>
            <div class="form-grid form-grid-2">
              ${field('Interesse Principal', l.interesse || '—')}
              ${field('Nível de Relacionamento', l.nivelRelacionamento)}
            </div>
          </div>
        </div>

        <!-- Campos Estratégicos -->
        <div class="lead-section">
          <div class="lead-section-header" onclick="toggleSection(this)">
            <span style="font-size:16px">🧠</span>
            <div class="lead-section-title">Campos Estratégicos</div>
            <span style="color:var(--text-muted)">▾</span>
          </div>
          <div class="lead-section-body">
            <div class="form-grid form-grid-2">
              ${fieldHighlight('🎯 Dor Principal', l.dorPrincipal, 'var(--rose-light)', 'var(--rose)')}
              ${fieldHighlight('❤️ Motivador Emocional', l.motivador, 'var(--teal-light)', 'var(--teal)')}
              ${fieldHighlight('🚧 Objeção Principal', l.objecao, 'var(--amber-light)', 'var(--amber)')}
              ${fieldHighlight('💡 Necessidade Percebida', l.necessidade, 'var(--accent-light)', 'var(--accent)')}
            </div>
            <div class="divider"></div>
            <div style="display:flex;align-items:center;gap:16px">
              <div style="flex:1">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em">Chance de Fechamento</div>
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="progress" style="flex:1;height:8px">
                    <div class="progress-fill" style="width:${l.chancePercent}%;background:linear-gradient(90deg,var(--accent),var(--teal))"></div>
                  </div>
                  <span style="font-size:16px;font-weight:800;color:var(--accent)">${l.chancePercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="lead-section">
          <div class="lead-section-header" onclick="toggleSection(this)">
            <span style="font-size:16px">📋</span>
            <div class="lead-section-title">Timeline de Interações</div>
            <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="event.stopPropagation();openContactModal('${l.id}')">+ Registrar</button>
          </div>
          <div class="lead-section-body">
            <div class="timeline">
              ${l.timeline.map(t => `
                <div class="timeline-item">
                  <div class="timeline-icon">${t.icon}</div>
                  <div class="timeline-content">
                    <strong>${t.label}</strong>
                    <p>${t.desc}</p>
                    <div class="timeline-time">📅 ${CRM.formatDate(t.date)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- COLUNA LATERAL -->
      <div>
        <!-- Follow-up -->
        <div class="card card-pad mb-3">
          <div style="font-size:13px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px">
            ⏰ Follow-up
          </div>
          <div class="stat-row">
            <span class="stat-key">Último contato</span>
            <span class="stat-val" style="color:${days>7?'var(--rose)':'var(--text-primary)'}">${CRM.formatDate(l.ultimoContato)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Próximo contato</span>
            <span class="stat-val" style="color:var(--teal)">${CRM.formatDate(l.proximoContato)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Dias desde último</span>
            <span class="stat-val" style="color:${days>7?'var(--rose)':days>3?'var(--amber)':'var(--hot)'}">${days}d</span>
          </div>
          <div class="divider"></div>
          <button class="btn btn-primary w-full" onclick="openContactModal('${l.id}')">
            📱 Registrar Contato
          </button>
        </div>

        <!-- Etapa do Funil -->
        <div class="card card-pad mb-3">
          <div style="font-size:13px;font-weight:700;margin-bottom:14px">📊 Etapa no Pipeline</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${CRM.stageOrder.map(stage => `
              <button onclick="changeLeadStage('${l.id}','${stage}')" style="
                text-align:left;padding:7px 10px;border-radius:var(--radius-md);
                background:${l.stage===stage?'var(--accent-light)':'transparent'};
                color:${l.stage===stage?'var(--accent)':'var(--text-muted)'};
                font-size:12px;font-weight:${l.stage===stage?'600':'400'};
                border:1px solid ${l.stage===stage?'rgba(15,44,89,0.3)':'transparent'};
                cursor:pointer;transition:all 0.2s;
              " onmouseover="if(this.style.background==='transparent')this.style.background='var(--bg-elevated)'"
                 onmouseout="if(this.dataset.active!='true')this.style.background=${l.stage===stage?'\'var(--accent-light)\'':'\'transparent\''}"
              >
                <div style="width:8px;height:8px;border-radius:50%;background:${CRM.stageColor[stage]};display:inline-block;margin-right:8px"></div>
                ${stage}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Observações -->
        <div class="card card-pad mb-3">
          <div style="font-size:13px;font-weight:700;margin-bottom:10px">📝 Observações</div>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.7">${l.obs || 'Nenhuma observação registrada.'}</p>
        </div>

        <!-- Reuniões relacionadas -->
        ${(() => {
          const ms = CRM.meetings.filter(m => m.leadId === l.id);
          if (!ms.length) return '';
          return `<div class="card card-pad mb-3">
            <div style="font-size:13px;font-weight:700;margin-bottom:12px">📅 Reuniões</div>
            ${ms.map(m => `
              <div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="navigate('reunioes')">
                <div style="font-size:12.5px;font-weight:600">${m.title.split('—')[0]}</div>
                <div style="font-size:11.5px;color:var(--text-muted)">${CRM.formatDate(m.date)} · ${m.time} · ${m.type}</div>
                <span class="badge badge-${m.status==='Realizada'?'emerald':'accent'}" style="margin-top:4px">${m.status}</span>
              </div>
            `).join('')}
          </div>`;
        })()}
      </div>
    </div>
  `;
}

function statPill(icon, label, value, color) {
  return `<div style="display:flex;align-items:center;gap:6px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:6px 12px">
    <span>${icon}</span>
    <div>
      <div style="font-size:10px;color:var(--text-muted)">${label}</div>
      <div style="font-size:13px;font-weight:700;color:${color}">${value}</div>
    </div>
  </div>`;
}

function field(label, value) {
  return `<div>
    <div style="font-size:10.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${label}</div>
    <div style="font-size:13.5px;font-weight:500">${value}</div>
  </div>`;
}

function fieldLink(label, value, href) {
  return `<div>
    <div style="font-size:10.5px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${label}</div>
    ${href && value !== '—' ? `<a href="${href}" target="_blank" style="font-size:13.5px;font-weight:500;color:var(--accent);text-decoration:none" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${value}</a>` : `<div style="font-size:13.5px;font-weight:500">${value}</div>`}
  </div>`;
}

function fieldHighlight(label, value, bg, color) {
  return `<div style="background:${bg};border:1px solid ${color}33;border-radius:var(--radius-md);padding:12px">
    <div style="font-size:10.5px;color:${color};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;font-weight:600">${label}</div>
    <div style="font-size:13px">${value || '—'}</div>
  </div>`;
}

function toggleSection(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('span:last-child');
  body.style.display = body.style.display === 'none' ? '' : 'none';
  arrow.textContent = body.style.display === 'none' ? '▸' : '▾';
}

function changeLeadStage(leadId, newStage) {
  const lead = CRM.getLead(leadId);
  if (!lead || lead.stage === newStage) return;
  const old = lead.stage;
  const timeline = lead.timeline || [];
  timeline.unshift({
    type:'move', label:`Etapa alterada: ${newStage}`,
    desc:`De "${old}" para "${newStage}"`,
    date: new Date().toISOString().split('T')[0], icon:'📋'
  });
  
  updateDocument('leads', leadId, {
    stage: newStage,
    timeline: timeline
  }).then(() => {
    showToast(`Etapa atualizada: ${newStage}`, 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}

// ─── MODAL REGISTRAR CONTATO ─────────────────────────────────
function openContactModal(leadId) {
  const l = CRM.getLead(leadId);
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = `📱 Registrar Contato — ${l.name}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Tipo de Contato</label>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${['💬 WhatsApp','📞 Ligação','📹 Reunião virtual','🤝 Reunião presencial','☕ Café','📧 E-mail','🎤 Evento'].map(t => `
          <label style="display:flex;align-items:center;gap:6px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:8px 10px;cursor:pointer;font-size:12px;transition:all 0.2s"
            onmouseover="this.style.borderColor='var(--accent)'" onmouseout="if(!this.querySelector('input').checked)this.style.borderColor='var(--border)'">
            <input type="radio" name="contact-type" value="${t.split(' ').slice(1).join(' ')}" style="accent-color:var(--accent)"> ${t}
          </label>
        `).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Resumo do Contato</label>
      <textarea class="form-textarea" id="ct-desc" placeholder="O que foi discutido? Quais foram as dores identificadas? Próximos passos?"></textarea>
    </div>
    <div class="form-grid form-grid-3">
      <div class="form-group">
        <label class="form-label">Data do Contato</label>
        <input class="form-input" id="ct-date" type="date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">Próximo Contato</label>
        <input class="form-input" id="ct-nextdate" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">Temperatura Atual</label>
        <select class="form-select" id="ct-temp">
          <option value="cold" ${l.temp==='cold'?'selected':''}>❄️ Frio</option>
          <option value="warm" ${l.temp==='warm'?'selected':''}>🌤 Morno</option>
          <option value="hot" ${l.temp==='hot'?'selected':''}>🔥 Quente</option>
        </select>
      </div>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Registrar';
  document.getElementById('modal-confirm').onclick = () => saveContact(leadId);
  modal.classList.add('open');
}

function saveContact(leadId) {
  const l = CRM.getLead(leadId);
  const typeEl = document.querySelector('input[name="contact-type"]:checked');
  const type = typeEl ? typeEl.value : 'Contato';
  const desc = document.getElementById('ct-desc').value;
  const contactDate = document.getElementById('ct-date').value || new Date().toISOString().split('T')[0];
  const nextDate = document.getElementById('ct-nextdate').value;
  const temp = document.getElementById('ct-temp').value;

  const icons = { 'WhatsApp':'💬', 'Ligação':'📞', 'Reunião virtual':'📹', 'Reunião presencial':'🤝', 'Café':'☕', 'E-mail':'📧', 'Evento':'🎤' };

  const timeline = l.timeline || [];
  timeline.unshift({
    type: type.toLowerCase().replace(' ',''),
    label: type, desc: desc || 'Contato registrado.',
    date: contactDate,
    icon: icons[type] || '📋'
  });

  const updates = {
    timeline: timeline,
    ultimoContato: contactDate,
    temp: temp
  };
  if (nextDate) updates.proximoContato = nextDate;

  updateDocument('leads', leadId, updates).then(() => {
    closeModal();
    showToast(`Contato "${type}" registrado com sucesso!`, 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}

// ─── MODAL EDITAR LEAD ───────────────────────────────────────
function openEditLeadModal(leadId) {
  const l = CRM.getLead(leadId);
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = `✏️ Editar — ${l.name}`;
  document.getElementById('modal-body').innerHTML = `
    <div class="tabs">
      <span class="tab-btn active" onclick="switchEditTab(this,'edit-basic')">Dados Básicos</span>
      <span class="tab-btn" onclick="switchEditTab(this,'edit-comercial')">Comercial</span>
      <span class="tab-btn" onclick="switchEditTab(this,'edit-estrategico')">Estratégico</span>
    </div>

    <div id="edit-basic">
      <div class="form-grid form-grid-2">
        ${editField('Nome', 'ed-name', l.name)}
        ${editField('Empresa', 'ed-company', l.company)}
        ${editField('Cargo', 'ed-cargo', l.cargo)}
        ${editField('Segmento', 'ed-segmento', l.segmento)}
        ${editField('Cidade', 'ed-cidade', l.cidade)}
        ${editField('WhatsApp', 'ed-whatsapp', l.whatsapp)}
        ${editField('E-mail', 'ed-email', l.email)}
        ${editField('Instagram', 'ed-instagram', l.instagram)}
        ${editField('LinkedIn', 'ed-linkedin', l.linkedin)}
        ${editField('Próximo Contato', 'ed-proxcontato', l.proximoContato, 'date')}
      </div>
    </div>

    <div id="edit-comercial" style="display:none">
      <div class="form-grid form-grid-2">
        ${editField('Patrimônio Est. (R$)', 'ed-patrimonio', l.patrimonio, 'number')}
        ${editField('Quem Indicou', 'ed-indicadopor', l.indicadoPor)}
        ${editSelect('Temperatura', 'ed-temp', l.temp, [{v:'cold',l:'❄️ Frio'},{v:'warm',l:'🌤 Morno'},{v:'hot',l:'🔥 Quente'}])}
        ${editSelect('Potencial', 'ed-potencial', l.potencial, [{v:'Baixo',l:'Baixo'},{v:'Médio',l:'Médio'},{v:'Alto',l:'Alto'},{v:'Muito Alto',l:'Muito Alto'}])}
        ${editField('Timing', 'ed-timing', l.timing)}
        ${editField('Interesse Principal', 'ed-interesse', l.interesse)}
        ${editField('Perfil do Cliente', 'ed-perfil', l.perfil)}
        ${editSelect('Responsável', 'ed-resp', l.responsavel, CRM.advisors.map(a=>({v:a.id,l:a.name})))}
      </div>
      <div class="form-group">
        <label class="form-label">Observações</label>
        <textarea class="form-textarea" id="ed-obs">${l.obs}</textarea>
      </div>
    </div>

    <div id="edit-estrategico" style="display:none">
      <div class="form-grid form-grid-2">
        ${editField('Dor Principal', 'ed-dor', l.dorPrincipal)}
        ${editField('Motivador Emocional', 'ed-motivador', l.motivador)}
        ${editField('Objeção Principal', 'ed-objecao', l.objecao)}
        ${editField('Necessidade Percebida', 'ed-necessidade', l.necessidade)}
        ${editField('Nível de Relacionamento', 'ed-nivelrel', l.nivelRelacionamento)}
        ${editField('Chance de Fechamento (%)', 'ed-chance', l.chancePercent, 'number')}
      </div>
    </div>
  `;
  document.getElementById('modal-confirm').textContent = 'Salvar';
  document.getElementById('modal-confirm').onclick = () => saveEditLead(leadId);
  document.getElementById('modal-overlay').classList.add('open');
}

function editField(label, id, value, type='text') {
  return `<div class="form-group">
    <label class="form-label">${label}</label>
    <input class="form-input" id="${id}" type="${type}" value="${value||''}">
  </div>`;
}
function editSelect(label, id, current, options) {
  return `<div class="form-group">
    <label class="form-label">${label}</label>
    <select class="form-select" id="${id}">
      ${options.map(o=>`<option value="${o.v}" ${o.v===current?'selected':''}>${o.l}</option>`).join('')}
    </select>
  </div>`;
}
function switchEditTab(el, show) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['edit-basic','edit-comercial','edit-estrategico'].forEach(id => {
    const div = document.getElementById(id);
    if (div) div.style.display = id === show ? '' : 'none';
  });
}

function saveEditLead(leadId) {
  const l = CRM.getLead(leadId);
  const g = id => { const el = document.getElementById(id); return el ? el.value : ''; };
  
  const updates = {};
  updates.name = g('ed-name') || l.name;
  updates.company = g('ed-company') || l.company;
  updates.cargo = g('ed-cargo'); updates.segmento = g('ed-segmento');
  updates.cidade = g('ed-cidade'); updates.whatsapp = g('ed-whatsapp');
  updates.email = g('ed-email'); updates.instagram = g('ed-instagram');
  updates.linkedin = g('ed-linkedin');
  if (g('ed-proxcontato')) updates.proximoContato = g('ed-proxcontato');
  if (g('ed-patrimonio')) updates.patrimonio = parseInt(g('ed-patrimonio'));
  updates.indicadoPor = g('ed-indicadopor');
  if (g('ed-temp')) updates.temp = g('ed-temp');
  if (g('ed-potencial')) updates.potencial = g('ed-potencial');
  updates.timing = g('ed-timing'); updates.interesse = g('ed-interesse');
  updates.perfil = g('ed-perfil');
  if (g('ed-resp')) updates.responsavel = g('ed-resp');
  if (g('ed-obs') !== undefined) updates.obs = g('ed-obs');
  updates.dorPrincipal = g('ed-dor'); updates.motivador = g('ed-motivador');
  updates.objecao = g('ed-objecao'); updates.necessidade = g('ed-necessidade');
  updates.nivelRelacionamento = g('ed-nivelrel');
  if (g('ed-chance')) updates.chancePercent = parseInt(g('ed-chance'));

  updateDocument('leads', leadId, updates).then(() => {
    closeModal();
    showToast('Lead atualizado com sucesso!', 'success');
  }).catch(e => showToast(`Erro: ${e.message}`, 'error'));
}
