// ============================================================
// CRM PREMIUM — DADOS MOCK & ESTADO GLOBAL
// ============================================================

const CRM = {
  currentPage: 'dashboard',
  currentLead: null,
  dragData: null,
  isDragging: false,
  pendingRender: false,

  // ─── DADOS MOCK ───────────────────────────────────────────
  advisors: [
    { id: 'a1', name: 'Rafael Bernardi', initials: 'RB', color: '#0F2C59' },
    { id: 'a2', name: 'Fabricio', initials: 'F', color: '#C5A059' },
    
  ],

  leads: [],
  meetings: [],
  tasks: [],
  followups: [],
  events: [],

  // ─── HELPERS ──────────────────────────────────────────────
  getAdvisor(id) { return this.advisors.find(a => a.id === id) || this.advisors[0]; },
  getLead(id) { return this.leads.find(l => l.id === id); },
  getMeeting(id) { return this.meetings.find(m => m.id === id); },

  updateUI() {
    // Atualiza indicadores visuais e notificações
    const todayStr = new Date().toISOString().split('T')[0];
    const hotLeads = this.leads.filter(l => l.temp === 'hot' && l.stage !== 'Fechado' && l.stage !== 'Perdido').length;
    const patTotal = this.leads.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido').reduce((a, l) => a + (l.patrimonio || 0), 0);
    const overdueTasks = this.tasks.filter(t => t.status === 'atrasado').length;
    const pendingFollowups = this.followups.filter(f => f.prioridade === 'urgent' || f.prioridade === 'important').length;
    const meetingsToday = this.meetings.filter(m => m.date === todayStr).length;

    const hotEl = document.getElementById('tb-hot');
    const patEl = document.getElementById('tb-pat');
    const overdueEl = document.getElementById('tb-overdue');
    const pipelineBadge = document.getElementById('badge-pipeline');
    const followupBadge = document.getElementById('badge-followup');
    const taskBadge = document.getElementById('badge-tasks');

    if (hotEl) hotEl.textContent = hotLeads;
    if (patEl) patEl.textContent = this.formatCurrency(patTotal);
    if (overdueEl) overdueEl.textContent = overdueTasks;

    if (pipelineBadge) pipelineBadge.textContent = this.leads.filter(l => l.stage !== 'Fechado' && l.stage !== 'Perdido').length;
    if (followupBadge) followupBadge.textContent = pendingFollowups;
    if (taskBadge) taskBadge.textContent = overdueTasks;

    // Atualiza sino de notificações
    const badge = document.getElementById('bell-badge');
    if (badge) {
      const totalNotif = overdueTasks + pendingFollowups + meetingsToday;
      if (totalNotif > 0) {
        badge.style.display = 'flex';
        badge.textContent = totalNotif;
      } else {
        badge.style.display = 'none';
      }
    }

    // Prepara mensagens do sino
    window._notifMsg = [];
    if (pendingFollowups) window._notifMsg.push(`${pendingFollowups} follow-ups pendentes`);
    if (meetingsToday) window._notifMsg.push(`${meetingsToday} reuniões agendadas para hoje`);
    if (overdueTasks) window._notifMsg.push(`${overdueTasks} tarefas atrasadas`);
  },

  unsubscribeLeads: null,
  unsubscribeMeetings: null,
  unsubscribeTasks: null,
  unsubscribeFollowups: null,

  loadDataFromFirestore() {
    // Evitar múltiplos listeners ao recarregar a função
    if (this.unsubscribeLeads) return;

    // Listener de leads
    this.unsubscribeLeads = listenCollection('leads', (data) => {
      this.leads = data;
      
      // Auto-gerar follow-ups baseados no proximoContato dos leads
      this.followups = this.leads
        .filter(l => l.proximoContato && l.stage !== 'Fechado' && l.stage !== 'Perdido')
        .map(l => {
          const hoje = new Date();
          hoje.setHours(0,0,0,0);
          const venc = new Date(l.proximoContato + 'T00:00:00');
          const diffDays = Math.round((venc - hoje) / 86400000);
          
          let prio = 'normal';
          if (diffDays < 0) prio = 'urgent'; // Vencido
          else if (diffDays <= 1) prio = 'important'; // Hoje ou amanhã

          return {
            id: 'f_' + l.id,
            leadId: l.id,
            responsavel: l.responsavel,
            vencimento: l.proximoContato,
            prioridade: prio,
            tipo: 'Contato agendado',
            desc: l.obs ? 'Obs: ' + (l.obs.length > 50 ? l.obs.substring(0, 50) + '...' : l.obs) : 'Acompanhamento programado'
          };
        })
        .sort((a,b) => new Date(a.vencimento) - new Date(b.vencimento));

      this.updateUI();
      // Não re-renderiza o pipeline se estiver em modo drag para não quebrar o DnD
      if (this.currentPage === 'pipeline' && this.isDragging) {
        this.pendingRender = true;
        return;
      }
      if (routes[this.currentPage]) routes[this.currentPage]();
    });

    // Listener de meetings
    this.unsubscribeMeetings = listenCollection('meetings', (data) => {
      this.meetings = data;
      this.updateUI();
      if (this.currentPage === 'reunioes') routes.reunioes();
      if (this.currentPage === 'dashboard') routes.dashboard();
    });

    // Listener de tasks
    this.unsubscribeTasks = listenCollection('tasks', (data) => {
      this.tasks = data;
      this.updateUI();
      if (this.currentPage === 'tarefas') routes.tarefas();
    });


  },

  formatCurrency(val) {
    if (val >= 1000000) return `R$ ${(val/1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val/1000).toFixed(0)}k`;
    return `R$ ${val}`;
  },
  formatDate(str) {
    if (!str) return '—';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  },
  daysSince(str) {
    if (!str) return 999;
    const d = new Date(str + 'T00:00:00');
    return Math.floor((Date.now() - d) / 86400000);
  },
  tempLabel(t) { return { hot: 'Quente', warm: 'Morno', cold: 'Frio' }[t] || t; },
  tempClass(t) { return { hot: 'hot', warm: 'warm', cold: 'cold' }[t] || ''; },
  getScoreColor(s) {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    if (s >= 40) return '#0F2C59';
    return '#F43F5E';
  },
  getInitials(name) {
    return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  },

  stageOrder: [
    'Novo lead','Tentativa de contato','Conversa iniciada','Diagnóstico',
    'Reunião marcada','Reunião realizada','Proposta enviada','Negociação',
    'Fechado','Perdido','Nutrição futura'
  ],
  stageColor: {
    'Novo lead': '#0F2C59',
    'Tentativa de contato': '#8B5CF6',
    'Conversa iniciada': '#3B82F6',
    'Diagnóstico': '#06B6D4',
    'Reunião marcada': '#F59E0B',
    'Reunião realizada': '#10B981',
    'Proposta enviada': '#F97316',
    'Negociação': '#EF4444',
    'Fechado': '#10B981',
    'Perdido': '#6B7280',
    'Nutrição futura': '#8B5CF6',
  },
};

// Os dados serão inicializados assim que o usuário fizer o login (via auth.js)
// CRM.loadDataFromFirestore();

// ─── TOAST ──────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: '💡' };
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.style.animation = 'none', 3000);
  setTimeout(() => t.remove(), 3500);
}

// ─── ROUTER ─────────────────────────────────────────────────
const routes = {
  dashboard:     () => renderDashboard(),
  pipeline:      () => renderPipeline(),
  followup:      () => renderFollowup(),
  reunioes:      () => renderReunioes(),
  tarefas:       () => renderTarefas(),
  relacionamento:() => renderRelacionamento(),
  inteligencia:  () => renderInteligencia(),
  lead:          () => renderLeadPage(CRM.currentLead),
};

function navigate(page, extra = null) {
  if (extra) CRM.currentLead = extra;
  CRM.currentPage = page;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  const topbarTitle = document.getElementById('topbar-title');
  const titles = {
    dashboard: 'Dashboard Comercial',
    pipeline: 'Pipeline Comercial',
    followup: 'Follow-up Inteligente',
    reunioes: 'Reuniões',
    tarefas: 'Tarefas',
    relacionamento: 'Relacionamento',
    inteligencia: 'Inteligência Comercial',
    lead: CRM.currentLead ? CRM.getLead(CRM.currentLead)?.name : 'Lead',
  };
  if (topbarTitle) topbarTitle.textContent = titles[page] || page;

  const content = document.getElementById('page-content');
  content.className = 'page-content page-enter';
  if (routes[page]) routes[page]();
  CRM.updateUI();
  
  // Fecha sidebar no mobile ao navegar
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');

  setTimeout(() => content.classList.remove('page-enter'), 300);
}

window.showNotifications = function() {
  if (window._notifMsg && window._notifMsg.length > 0) {
    window._notifMsg.forEach((msg, i) => setTimeout(() => showToast(msg, 'info'), i * 300));
  } else {
    showToast('Nenhuma notificação pendente!', 'success');
  }
};

window.toggleMobileMenu = function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
};

// ─── IMPORT / EXPORT ─────────────────────────────────────────
window.exportData = function() {
  const data = {
    leads: CRM.leads,
    meetings: CRM.meetings,
    tasks: CRM.tasks
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `InvestCRM_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup exportado com sucesso!', 'success');
};

window.importData = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!confirm('⚠️ ATENÇÃO: A importação irá sobrescrever dados e atualizar as informações no banco de dados. Deseja continuar?')) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.leads || !data.meetings || !data.tasks) {
        throw new Error("Formato de arquivo inválido.");
      }
      
      showToast('Importando dados, não feche a página...', 'info');
      
      const collections = ['leads', 'meetings', 'tasks'];
      for (const col of collections) {
        for (const item of data[col]) {
          const id = item.id;
          const itemData = { ...item };
          delete itemData.id; // não salvamos o ID dentro do documento em si
          await db.collection(col).doc(id).set(itemData);
        }
      }
      showToast('Backup importado com sucesso! Recarregando...', 'success');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error(err);
      showToast('Erro ao importar: ' + err.message, 'error');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
};

