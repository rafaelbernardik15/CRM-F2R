// ============================================================
// DASHBOARD COMERCIAL
// ============================================================
function renderDashboard() {
  const content = document.getElementById('page-content');
  const leads = CRM.leads;
  const today = new Date();

  // Cálculos dos widgets
  const newLeads = leads.filter(l => l.stage === 'Novo lead').length;
  const hotLeads = leads.filter(l => l.temp === 'hot' && l.stage !== 'Fechado' && l.stage !== 'Perdido').length;
  const weekMeetings = CRM.meetings.filter(m => {
    const d = new Date(m.date + 'T00:00:00');
    const diff = (d - today) / 86400000;
    return diff >= -1 && diff <= 7;
  }).length;
  const pendingFollowups = CRM.followups.filter(f => f.prioridade === 'urgent' || f.prioridade === 'important').length;
  const closedMonth = leads.filter(l => l.stage === 'Fechado').length;
  const totalPotencial = leads.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido').reduce((a, l) => a + l.patrimonio, 0);
  const staleLeads = leads.filter(l => CRM.daysSince(l.ultimoContato) > 7 && l.stage !== 'Fechado' && l.stage !== 'Perdido').length;
  const vipNoContact = leads.filter(l => l.tags.includes('VIP') && CRM.daysSince(l.ultimoContato) > 14 && l.stage !== 'Fechado' && l.stage !== 'Perdido').length;
  const overdueTasks = CRM.tasks.filter(t => t.status === 'atrasado').length;

  // Conversão
  const total = leads.length;
  const conv = ((closedMonth / total) * 100).toFixed(0);

  content.innerHTML = `
    <div class="page-hero">
      <h1>Bom dia, Rafael 👋</h1>
      <p>Aqui está o resumo comercial de hoje — ${today.toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
    </div>

    <!-- WIDGETS -->
    <div class="widget-grid">
      ${widget('🌱', 'Leads Novos', newLeads, 'accent', '+2 esta semana', 'up')}
      ${widget('🔥', 'Leads Quentes', hotLeads, 'hot', 'Alta prioridade', 'neutral')}
      ${widget('📅', 'Reuniões na Semana', weekMeetings, 'teal', 'Próximos 7 dias', 'neutral')}
      ${widget('⏰', 'Follow-ups Pendentes', pendingFollowups, 'amber', 'Urgentes + Importantes', 'down')}
      ${widget('🎯', 'Conversão do Mês', conv + '%', 'accent', `${closedMonth} fechamentos`, 'up')}
      ${widget('💎', 'Patrimônio Potencial', CRM.formatCurrency(totalPotencial), 'teal', 'Total em prospecção', 'up')}
      ${widget('📴', 'Sem Contato +7 dias', staleLeads, 'rose', 'Atenção necessária', 'down')}
      ${widget('⭐', 'Clientes VIP s/ Interação', vipNoContact, 'amber', '+14 dias sem contato', 'down')}
      ${widget('⚡', 'Tarefas Atrasadas', overdueTasks, 'rose', 'Requerem ação', 'down')}
    </div>

    <!-- GRÁFICOS -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Leads por Etapa do Funil</div>
        <div class="chart-subtitle">Distribuição atual no pipeline</div>
        <div class="chart-container">
          <canvas id="chart-funnel"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Conversão por Origem</div>
        <div class="chart-subtitle">Qualidade dos canais de aquisição</div>
        <div class="chart-container">
          <canvas id="chart-origem"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Evolução de Reuniões — 2026</div>
        <div class="chart-subtitle">Reuniões realizadas por mês</div>
        <div class="chart-container">
          <canvas id="chart-meetings"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Performance por Consultor</div>
        <div class="chart-subtitle">Leads ativos e fechamentos</div>
        <div class="chart-container">
          <canvas id="chart-advisor"></canvas>
        </div>
      </div>
    </div>

    <!-- PONTOS DE ATENÇÃO -->
    <div class="section-header">
      <div class="section-title">
        <span class="icon">🚨</span>
        Pontos de Atenção
        <span class="badge badge-rose">${CRM.followups.filter(f=>f.prioridade==='urgent').length} urgentes</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="navigate('followup')">Ver todos</button>
    </div>
    <div class="alerts-grid">
      ${CRM.followups.slice(0, 6).map(f => {
        const lead = CRM.getLead(f.leadId);
        if (!lead) return '';
        const icon = f.prioridade === 'urgent' ? '🔴' : f.prioridade === 'important' ? '🟡' : '🔵';
        const typeClass = f.prioridade === 'urgent' ? 'urgent' : f.prioridade === 'important' ? 'warning' : 'info';
        return alertItem(typeClass, icon, f.tipo, lead.name + ' — ' + f.desc, f.leadId);
      }).join('')}
      ${CRM.followups.length === 0 ? '<div style="color:var(--text-muted);font-size:13px;grid-column:1/-1;padding:12px">✅ Tudo sob controle! Nenhum alerta pendente.</div>' : ''}
    </div>

    <!-- LEADS RECENTES -->
    <div class="section-header mt-4">
      <div class="section-title"><span class="icon">👥</span>Leads Recentes</div>
      <button class="btn btn-ghost btn-sm" onclick="navigate('pipeline')">Ver pipeline →</button>
    </div>
    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Lead</th><th>Empresa</th><th>Etapa</th><th>Temperatura</th>
            <th>Patrimônio Est.</th><th>Responsável</th><th>Último Contato</th>
          </tr>
        </thead>
        <tbody>
          ${leads.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido').slice(0,6).map(l => {
            const adv = CRM.getAdvisor(l.responsavel);
            return `<tr onclick="navigate('lead','${l.id}')">
              <td><div style="font-weight:600;color:var(--text-primary)">${l.name}</div></td>
              <td>${l.company}</td>
              <td><span class="badge badge-accent">${l.stage}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="temp-dot ${CRM.tempClass(l.temp)}"></span>
                  ${CRM.tempLabel(l.temp)}
                </div>
              </td>
              <td style="font-weight:600;color:var(--teal)">${CRM.formatCurrency(l.patrimonio)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  <div class="avatar sm" style="background:linear-gradient(135deg,${adv.color},${adv.color}88)">${adv.initials}</div>
                  ${adv.name.split(' ')[0]}
                </div>
              </td>
              <td>${CRM.formatDate(l.ultimoContato)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // ─── GRÁFICOS ─────────────────────────────────────────────
  setTimeout(() => {
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9898B8', font: { family: 'Inter', size: 11 } } } },
    };

    // Funil
    const stageCounts = CRM.stageOrder.map(s => leads.filter(l => l.stage === s).length);
    new Chart(document.getElementById('chart-funnel'), {
      type: 'bar',
      data: {
        labels: CRM.stageOrder.map(s => s.length > 14 ? s.substring(0,14)+'…' : s),
        datasets: [{
          data: stageCounts,
          backgroundColor: CRM.stageOrder.map(s => CRM.stageColor[s] + '99'),
          borderColor: CRM.stageOrder.map(s => CRM.stageColor[s]),
          borderWidth: 1, borderRadius: 6,
        }]
      },
      options: { ...chartDefaults, indexAxis: 'y',
        plugins: { ...chartDefaults.plugins, legend: { display: false } },
        scales: { x: { ticks: { color: '#5A5A7A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  y: { ticks: { color: '#9898B8', font: { size: 10 } }, grid: { display: false } } }
      }
    });

    // Origem
    const origens = {};
    leads.forEach(l => { origens[l.origem] = (origens[l.origem] || 0) + 1; });
    new Chart(document.getElementById('chart-origem'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(origens),
        datasets: [{ data: Object.values(origens),
          backgroundColor: ['#0F2C59','#C5A059','#F59E0B','#F43F5E','#10B981'],
          borderColor: '#141420', borderWidth: 2, hoverOffset: 6 }]
      },
      options: { ...chartDefaults, cutout: '65%',
        plugins: { ...chartDefaults.plugins, legend: { position: 'right', labels: { color: '#9898B8', boxWidth: 12, padding: 12, font: { size: 11 } } } }
      }
    });

    // Reuniões por mês
    new Chart(document.getElementById('chart-meetings'), {
      type: 'line',
      data: {
        labels: ['Jan','Fev','Mar','Abr','Mai','Jun'],
        datasets: [{
          label: 'Reuniões', data: [3, 5, 7, 6, 9, 4],
          borderColor: '#0F2C59', backgroundColor: 'rgba(15,44,89,0.1)',
          fill: true, tension: 0.4, pointBackgroundColor: '#0F2C59',
          pointBorderColor: '#141420', pointBorderWidth: 2, pointRadius: 5,
        }]
      },
      options: { ...chartDefaults,
        scales: { x: { ticks: { color: '#5A5A7A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                  y: { ticks: { color: '#5A5A7A' }, grid: { color: 'rgba(255,255,255,0.04)' } } }
      }
    });

    // Performance por Consultor
    const advNames = CRM.advisors.map(a => a.name.split(' ')[0]);
    const advLeads = CRM.advisors.map(a => leads.filter(l => l.responsavel === a.id).length);
    const advClosed = CRM.advisors.map(a => leads.filter(l => l.responsavel === a.id && l.stage === 'Fechado').length);
    new Chart(document.getElementById('chart-advisor'), {
      type: 'bar',
      data: {
        labels: advNames,
        datasets: [
          { label: 'Leads ativos', data: advLeads, backgroundColor: '#0F2C5999', borderColor: '#0F2C59', borderWidth: 1, borderRadius: 6 },
          { label: 'Fechamentos', data: advClosed, backgroundColor: '#10B98199', borderColor: '#10B981', borderWidth: 1, borderRadius: 6 },
        ]
      },
      options: { ...chartDefaults,
        scales: { x: { ticks: { color: '#9898B8' }, grid: { display: false } },
                  y: { ticks: { color: '#5A5A7A' }, grid: { color: 'rgba(255,255,255,0.04)' } } }
      }
    });
  }, 100);
}

function widget(icon, label, value, color, change, dir) {
  const colors = {
    accent: { bg: 'var(--accent-light)', text: 'var(--accent)' },
    hot:    { bg: 'var(--hot-light)',    text: 'var(--hot)' },
    teal:   { bg: 'var(--teal-light)',   text: 'var(--teal)' },
    amber:  { bg: 'var(--amber-light)',  text: 'var(--amber)' },
    rose:   { bg: 'var(--rose-light)',   text: 'var(--rose)' },
  };
  const c = colors[color] || colors.accent;
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '';
  return `
    <div class="widget">
      <div class="widget-icon" style="background:${c.bg};color:${c.text}">${icon}</div>
      <div class="widget-value" style="color:${c.text}">${value}</div>
      <div class="widget-label">${label}</div>
      <div class="widget-change ${dir}">${arrow} ${change}</div>
    </div>`;
}

function alertItem(type, emoji, title, desc, leadId) {
  return `
    <div class="alert-item ${type}" onclick="navigate('lead','${leadId}')">
      <div class="alert-dot"></div>
      <div class="alert-content">
        <strong>${emoji} ${title}</strong>
        <span>${desc}</span>
      </div>
    </div>`;
}
