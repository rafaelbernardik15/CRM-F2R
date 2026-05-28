// ============================================================
// INTELIGÊNCIA COMERCIAL
// ============================================================
function renderInteligencia() {
  const content = document.getElementById('page-content');
  const leads = CRM.leads.filter(l => l.stage !== 'Perdido');

  // ─── Recalcular scores ─────────────────────────────────────
  leads.forEach(l => {
    let score = 0;
    // Patrimônio (0-25)
    if (l.patrimonio >= 10000000) score += 25;
    else if (l.patrimonio >= 5000000) score += 20;
    else if (l.patrimonio >= 2000000) score += 14;
    else if (l.patrimonio >= 500000) score += 8;
    else score += 3;
    // Temperatura (0-25)
    score += l.temp === 'hot' ? 25 : l.temp === 'warm' ? 15 : 5;
    // Engajamento (0-20)
    const days = CRM.daysSince(l.ultimoContato);
    score += days <= 3 ? 20 : days <= 7 ? 14 : days <= 14 ? 8 : days <= 30 ? 4 : 0;
    // Timing (0-15)
    score += l.timing === 'Curto prazo' ? 15 : l.timing === 'Médio prazo' ? 8 : l.timing === 'Longo prazo' ? 3 : 5;
    // Origem (0-10)
    score += l.origem === 'Indicação' ? 10 : l.origem === 'Evento' ? 7 : 4;
    // Timeline ativa (0-5)
    score += l.timeline.length >= 4 ? 5 : l.timeline.length >= 2 ? 3 : 1;
    l.score = Math.min(100, score);
  });

  const sorted = [...leads].sort((a,b) => b.score - a.score);

  // Heatmap categories
  const heating = leads.filter(l => {
    const recentInteractions = l.timeline.filter(t => CRM.daysSince(t.date) <= 7).length;
    return recentInteractions >= 1 && l.temp !== 'hot';
  });
  const cooling = leads.filter(l => {
    return CRM.daysSince(l.ultimoContato) > 14 && l.temp !== 'cold';
  });
  const forgotten = leads.filter(l => CRM.daysSince(l.ultimoContato) > 21);
  const strategic = leads.filter(l => l.score >= 75);

  // Pátrimônio Total
  const totalPat = leads.reduce((a,l) => a+l.patrimonio, 0);
  const avgScore = Math.round(leads.reduce((a,l)=>a+l.score,0)/leads.length);

  content.innerHTML = `
    <div class="page-hero">
      <h1>Inteligência Comercial</h1>
      <p>Score automático, análise de prioridade e heatmap de relacionamento</p>
    </div>

    <!-- CARDS DE SÍNTESE -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
      ${intelCard('🎯','Score Médio', avgScore+'/100', 'var(--accent)', 'Carteira geral')}
      ${intelCard('💎','Patrimônio Potencial', CRM.formatCurrency(totalPat), 'var(--teal)', leads.length+' leads ativos')}
      ${intelCard('🔥','Leads Estratégicos', strategic.length, 'var(--hot)', 'Score ≥ 75')}
      ${intelCard('⚠️','Atenção Imediata', cooling.length+forgotten.length, 'var(--rose)', 'Esfriando + Esquecidos')}
    </div>

    <!-- HEATMAP -->
    <div class="section-header">
      <div class="section-title"><span class="icon">🌡️</span>Heatmap Comercial</div>
    </div>
    <div class="heatmap-grid mb-4">
      ${heatmapBox('🚀', 'Esquentando', heating.length, '#F59E0B', heating.map(l=>l.name.split(' ')[0]).join(', '))}
      ${heatmapBox('❄️', 'Esfriando', cooling.length, '#F43F5E', cooling.map(l=>l.name.split(' ')[0]).join(', '))}
      ${heatmapBox('😴', 'Esquecidos', forgotten.length, '#6B7280', forgotten.map(l=>l.name.split(' ')[0]).join(', '))}
      ${heatmapBox('⭐', 'Estratégicos', strategic.length, '#0F2C59', strategic.map(l=>l.name.split(' ')[0]).join(', '))}
    </div>

    <!-- RANKING DE LEADS POR SCORE -->
    <div class="section-header">
      <div class="section-title"><span class="icon">🏆</span>Ranking por Score Comercial</div>
    </div>
    <div class="card mb-4">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th><th>Lead</th><th>Score</th><th>Temperatura</th>
            <th>Patrimônio</th><th>Último Contato</th><th>Chance</th><th>Prioridade</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((l, i) => {
            const days = CRM.daysSince(l.ultimoContato);
            const priority = l.score >= 80 ? { label:'Alta', color:'var(--rose)' }
              : l.score >= 60 ? { label:'Média', color:'var(--amber)' }
              : { label:'Baixa', color:'var(--accent)' };
            return `
              <tr onclick="navigate('lead','${l.id}')">
                <td>
                  <div style="font-size:16px;font-weight:800;color:${i<3?'var(--amber)':'var(--text-muted)'}">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div>
                </td>
                <td>
                  <div style="font-weight:600;color:var(--text-primary)">${l.name}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${l.company}</div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress" style="width:70px">
                      <div class="progress-fill" style="width:${l.score}%;background:${CRM.getScoreColor(l.score)}"></div>
                    </div>
                    <span style="font-weight:700;color:${CRM.getScoreColor(l.score)};font-size:13px">${l.score}</span>
                  </div>
                </td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="temp-dot ${CRM.tempClass(l.temp)}"></span>
                    ${CRM.tempLabel(l.temp)}
                  </div>
                </td>
                <td style="color:var(--teal);font-weight:600">${CRM.formatCurrency(l.patrimonio)}</td>
                <td style="color:${days>7?'var(--rose)':days>3?'var(--amber)':'var(--text-secondary)'}">${days}d atrás</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="progress" style="width:50px">
                      <div class="progress-fill" style="width:${l.chancePercent}%;background:var(--accent)"></div>
                    </div>
                    <span style="font-size:12px;font-weight:600;color:var(--accent)">${l.chancePercent}%</span>
                  </div>
                </td>
                <td><span style="font-size:11px;font-weight:700;color:${priority.color}">${priority.label}</span></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- ANÁLISE POR SEGMENTO -->
    <div class="intel-grid">
      <div class="chart-card">
        <div class="chart-title">Score por Segmento</div>
        <div class="chart-subtitle">Média de score por tipo de cliente</div>
        <div class="chart-container" style="height: 220px">
          <canvas id="chart-segment"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Potencial vs Engajamento</div>
        <div class="chart-subtitle">Patrimônio x Frequência de contato</div>
        <div class="chart-container" style="height: 220px">
          <canvas id="chart-potential"></canvas>
        </div>
      </div>
    </div>

    <!-- ALERTAS DE INTELIGÊNCIA -->
    <div class="section-header mt-4">
      <div class="section-title"><span class="icon">🧠</span>Alertas de Inteligência</div>
    </div>
    <div class="alerts-grid">
      ${sorted.slice(0,3).map(l => `
        <div class="alert-item info" onclick="navigate('lead','${l.id}')">
          <div class="alert-dot"></div>
          <div class="alert-content">
            <strong>🏆 ${l.name} — Score ${l.score}</strong>
            <span>${l.company} · Patrimônio: ${CRM.formatCurrency(l.patrimonio)} · Chance: ${l.chancePercent}%</span>
          </div>
        </div>`).join('')}
      ${cooling.slice(0,2).map(l => `
        <div class="alert-item urgent" onclick="navigate('lead','${l.id}')">
          <div class="alert-dot"></div>
          <div class="alert-content">
            <strong>❄️ Esfriando — ${l.name}</strong>
            <span>Sem contato há ${CRM.daysSince(l.ultimoContato)} dias. Era ${CRM.tempLabel(l.temp)}.</span>
          </div>
        </div>`).join('')}
      ${forgotten.slice(0,2).map(l => `
        <div class="alert-item warning" onclick="navigate('lead','${l.id}')">
          <div class="alert-dot"></div>
          <div class="alert-content">
            <strong>😴 Esquecido — ${l.name}</strong>
            <span>${CRM.daysSince(l.ultimoContato)} dias sem interação. ${CRM.formatCurrency(l.patrimonio)} potencial em risco.</span>
          </div>
        </div>`).join('')}
    </div>
  `;

  // ─── GRÁFICOS ─────────────────────────────────────────────
  setTimeout(() => {
    const chartDefaults = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9898B8', font: { family:'Inter', size:11 } } } }
    };

    // Score por segmento
    const segmentos = {};
    leads.forEach(l => {
      const seg = l.segmento || 'Outro';
      if (!segmentos[seg]) segmentos[seg] = [];
      segmentos[seg].push(l.score);
    });
    const segNames = Object.keys(segmentos);
    const segAvg = segNames.map(s => Math.round(segmentos[s].reduce((a,b)=>a+b,0)/segmentos[s].length));
    new Chart(document.getElementById('chart-segment'), {
      type: 'bar',
      data: {
        labels: segNames,
        datasets: [{ label:'Score médio', data: segAvg,
          backgroundColor: ['#0F2C5999','#C5A05999','#F59E0B99','#F43F5E99','#10B98199','#8B5CF699'],
          borderColor: ['#0F2C59','#C5A059','#F59E0B','#F43F5E','#10B981','#8B5CF6'],
          borderWidth:1, borderRadius:6 }]
      },
      options: { ...chartDefaults,
        plugins: { ...chartDefaults.plugins, legend:{ display:false } },
        scales: { x:{ticks:{color:'#9898B8',font:{size:10}},grid:{display:false}},
                  y:{ticks:{color:'#5A5A7A'},grid:{color:'rgba(255,255,255,0.04)'},max:100} }
      }
    });

    // Scatter: Patrimônio x Engajamento
    const scatterData = leads.map(l => ({
      x: Math.min(100, Math.max(0, 100 - CRM.daysSince(l.ultimoContato) * 3)),
      y: l.patrimonio / 1000000,
      label: l.name,
    }));
    new Chart(document.getElementById('chart-potential'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Leads', data: scatterData,
          backgroundColor: leads.map(l => l.temp==='hot'?'#10B98199':l.temp==='warm'?'#F59E0B99':'#F43F5E99'),
          pointRadius: 8, pointHoverRadius: 10,
        }]
      },
      options: { ...chartDefaults,
        scales: {
          x: { title:{ display:true, text:'Engajamento (%)', color:'#5A5A7A' }, ticks:{color:'#5A5A7A'}, grid:{color:'rgba(255,255,255,0.04)'},min:0,max:100 },
          y: { title:{ display:true, text:'Patrimônio (R$ M)', color:'#5A5A7A' }, ticks:{color:'#5A5A7A'}, grid:{color:'rgba(255,255,255,0.04)'} }
        }
      }
    });
  }, 100);
}

function intelCard(icon, label, value, color, sub) {
  return `<div class="card card-pad" style="border-top:3px solid ${color}">
    <div style="font-size:24px;margin-bottom:8px">${icon}</div>
    <div style="font-size:26px;font-weight:800;color:${color};line-height:1">${value}</div>
    <div style="font-size:13px;font-weight:600;margin-top:4px">${label}</div>
    <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${sub}</div>
  </div>`;
}

function heatmapBox(icon, label, count, color, names) {
  return `<div class="heatmap-item" style="border-top:3px solid ${color}">
    <div style="font-size:28px;margin-bottom:6px">${icon}</div>
    <div class="heatmap-count" style="color:${color}">${count}</div>
    <div class="heatmap-label">${label}</div>
    ${names ? `<div style="font-size:10.5px;color:var(--text-disabled);margin-top:6px;line-height:1.5">${names||'—'}</div>` : ''}
  </div>`;
}
