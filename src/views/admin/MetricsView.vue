<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '@/services/admin.api';
import DateFilter from '@/components/admin/DateFilter.vue';
import LineChart from '@/components/admin/Charts/LineChart.vue';

const router = useRouter();
const LOCATION_ID = 'x8O0cXtMCFzNoQ6iYPC6';

// Setup default dates (last 7 days)
const defaultEnd = new Date();
const defaultStart = new Date();
defaultStart.setDate(defaultStart.getDate() - 30);

const dateRange = ref({
  start: defaultStart.toISOString().split('T')[0] as string,
  end: defaultEnd.toISOString().split('T')[0] as string
});

const loadingGeneral = ref(true);
const loadingAgents = ref(true);
const loadingConversations = ref(true);

const errorGeneral = ref('');
const errorAgents = ref('');
const errorConversations = ref('');

const generalMetrics = ref({
  totalUsers: 0,
  activeConversations: 0,
  todayConversations: 0,
  overallAvgResponseTimeMs: null as number | null,
  todayAvgResponseTimeMs: null as number | null,
  dailyStats: [] as { date: string, count: number }[],
});

const agentsData = ref<any[]>([]);
const recentConversationsData = ref<any[]>([]);
const selectedChat = ref<any>(null);

const top10Conversations = computed(() => recentConversationsData.value.slice(0, 10));

const openChat = (conv: any) => {
  selectedChat.value = conv;
};

const closeChat = () => {
  selectedChat.value = null;
};

const openInCrm = (convId: string) => {
  window.open(`https://crm.bakano.ec/v2/location/${LOCATION_ID}/conversations/conversations/${convId}`, '_blank');
};

const formatTime = (ms: number | null) => {
  if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ${minutes % 60} min`;
};

const fetchGeneralMetrics = async () => {
  loadingGeneral.value = true;
  errorGeneral.value = '';
  try {
    const res = await adminApi.getGeneralMetrics(LOCATION_ID, dateRange.value.start, dateRange.value.end);
    generalMetrics.value = {
      totalUsers: res.data.totalUsers || 0,
      activeConversations: res.data.activeConversations || 0,
      todayConversations: res.data.todayConversations || 0,
      overallAvgResponseTimeMs: res.data.overallAvgResponseTimeMs,
      todayAvgResponseTimeMs: res.data.todayAvgResponseTimeMs,
      dailyStats: res.data.dailyStats || [],
    };
  } catch (err: any) {
    errorGeneral.value = err.message || 'Error al cargar métricas generales';
  } finally {
    loadingGeneral.value = false;
  }
};

const fetchAgents = async () => {
  loadingAgents.value = true;
  errorAgents.value = '';
  try {
    const res = await adminApi.getActiveAgents(LOCATION_ID, dateRange.value.start, dateRange.value.end);
    agentsData.value = res.data || [];
  } catch (err: any) {
    errorAgents.value = err.message || 'Error al cargar agentes';
  } finally {
    loadingAgents.value = false;
  }
};

const fetchRecentConversations = async () => {
  loadingConversations.value = true;
  errorConversations.value = '';
  try {
    const res = await adminApi.getRecentConversations(LOCATION_ID, dateRange.value.start, dateRange.value.end);
    recentConversationsData.value = res.data || [];
  } catch (err: any) {
    errorConversations.value = err.message || 'Error al cargar conversaciones recientes';
  } finally {
    loadingConversations.value = false;
  }
};

const fetchAll = () => {
  fetchGeneralMetrics();
  fetchAgents();
  fetchRecentConversations();
};

onMounted(() => {
  fetchAll();
});

const goBack = () => {
  router.push({ name: 'AdminDashboard' });
};
const handleFilterChange = () => {
  fetchAll();
};
</script>

<template>
  <div class="dashboard-layout">
    <!-- Background Decorators -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="dashboard-content">
      <header class="dashboard-header glass-panel">
        <div class="brand">
          <button @click="goBack" class="back-btn" title="Volver al Panel">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1>Métricas GHL</h1>
            <p class="subtitle">Desempeño de Agentes y Conversaciones</p>
          </div>
        </div>
      </header>

      <main class="dashboard-main">
        <DateFilter v-model="dateRange" @change="handleFilterChange" />

        <!-- Info Banner for Clarity -->
        <div class="data-notice">
          <div class="notice-icon"><i class="fa-solid fa-circle-info"></i></div>
          <div class="notice-text">
            <strong>Alcance de los datos:</strong> Estas métricas analizan en tiempo real las últimas 500 conversaciones del CRM para garantizar la máxima velocidad. Si filtras por un rango muy antiguo, es posible que no haya datos si las 500 recientes son más nuevas.
          </div>
        </div>

        <div class="grid-layout">
          <!-- Resumen de Hoy -->
          <section class="glass-card full-width today-card">
            <div class="card-header today-header">
              <div class="icon-wrapper today-icon">
                <i class="fa-solid fa-bolt"></i>
              </div>
              <div>
                <h2>Rendimiento de Hoy</h2>
                <p class="section-subtitle">Datos en tiempo real para el día de hoy</p>
              </div>
            </div>
            
            <div v-if="loadingGeneral" class="loading-state">
              <span class="loader"></span>
              <p>Sincronizando con GHL...</p>
            </div>
            <div v-else-if="errorGeneral" class="error-message">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ errorGeneral }}
            </div>
            <div v-else class="metrics-grid today-grid">
              <div class="metric-box highlight premium-glow">
                <div class="metric-value">{{ generalMetrics.todayConversations }}</div>
                <div class="metric-label">Conversaciones de Hoy</div>
              </div>
              <div class="metric-box highlight premium-glow">
                <div class="metric-value">{{ formatTime(generalMetrics.todayAvgResponseTimeMs) }}</div>
                <div class="metric-label">Prom. Respuesta de Hoy</div>
              </div>
            </div>
          </section>

          <!-- Resumen del Período -->
          <section class="glass-card full-width">
            <div class="card-header">
              <div class="icon-wrapper">
                <i class="fa-regular fa-calendar-days"></i>
              </div>
              <div>
                <h2>Métricas del Período Seleccionado</h2>
                <p class="section-subtitle">Muestra los totales dentro de las fechas elegidas en el calendario</p>
              </div>
            </div>
            
            <div v-if="loadingGeneral" class="loading-state">
              <span class="loader"></span>
            </div>
            <div v-else-if="!errorGeneral" class="metrics-grid">
              <div class="metric-box">
                <div class="metric-value">{{ generalMetrics.totalUsers }}</div>
                <div class="metric-label">Agentes Registrados</div>
              </div>
              <div class="metric-box">
                <div class="metric-value">{{ generalMetrics.activeConversations }}</div>
                <div class="metric-label">Conv. del Período</div>
              </div>
              <div class="metric-box">
                <div class="metric-value">{{ formatTime(generalMetrics.overallAvgResponseTimeMs) }}</div>
                <div class="metric-label">Prom. Respuesta del Período</div>
              </div>
            </div>
          </section>

          <!-- Gráfico de Tendencia -->
          <section class="glass-card full-width">
            <div class="card-header">
              <div class="icon-wrapper">
                <i class="fa-solid fa-chart-area"></i>
              </div>
              <h2>Contactos / Conversaciones por Día</h2>
            </div>
            <div v-if="loadingGeneral" class="loading-state">
              <span class="loader"></span>
            </div>
            <div v-else-if="generalMetrics.dailyStats.length > 0">
              <LineChart :data="generalMetrics.dailyStats" />
            </div>
            <div v-else class="empty-state">
              <p>No hay datos en este rango de fechas.</p>
            </div>
          </section>

          <!-- Lista de Agentes -->
          <section class="glass-card">
            <div class="card-header">
              <div class="icon-wrapper">
                <i class="fa-solid fa-headset"></i>
              </div>
              <h2>Agentes Activos</h2>
            </div>
            <div v-if="loadingAgents" class="loading-state">
              <span class="loader"></span>
              <p>Cargando agentes...</p>
            </div>
            <div v-else-if="errorAgents" class="error-message">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ errorAgents }}
            </div>
            <div v-else class="table-container" style="overflow-x: auto; width: 100%;">
              <div v-if="agentsData.length === 0" class="empty-state">
                <p>No se encontraron agentes en GHL.</p>
              </div>
              <table v-else class="premium-table">
                <thead>
                  <tr>
                    <th>Agente</th>
                    <th class="text-center">Rol</th>
                    <th class="text-center">Total Conv.</th>
                    <th class="text-center">Abiertas</th>
                    <th class="text-center">Cerradas / Otras</th>
                    <th class="text-center">Prom. Respuesta</th>
                    <th class="text-center">Alertas CRM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in agentsData" :key="user.id">
                    <td>
                      <div class="user-info">
                        <div class="avatar">{{ user.name?.charAt(0).toUpperCase() || '?' }}</div>
                        <div>
                          <div class="cell-title">{{ user.name || 'Sin Nombre' }}</div>
                          <div class="cell-subtitle">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="text-center">
                      <span :class="['role-badge', user.role]">{{ user.role === 'admin' ? 'Admin' : (user.role || 'User') }}</span>
                    </td>
                    <td class="text-center">
                      <span class="stat-pill total">{{ user.total }}</span>
                    </td>
                    <td class="text-center">
                      <span class="stat-pill open">{{ user.open }}</span>
                    </td>
                    <td class="text-center">
                      <span class="stat-pill closed">{{ user.closed }}</span>
                    </td>
                    <td class="text-center">
                      <span class="stat-pill time">
                        {{ formatTime(user.avgResponseTimeMs) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <span v-if="user.untrackable > 0" class="stat-pill untrackable" title="Respondidos fuera del CRM">
                        <i class="fa-solid fa-triangle-exclamation"></i> {{ user.untrackable }} No Trackeable
                      </span>
                      <span v-else class="stat-pill ok">
                        <i class="fa-solid fa-check"></i> Todo OK
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Conversaciones Recientes -->
          <section class="glass-card">
            <div class="card-header">
              <div class="icon-wrapper">
                <i class="fa-regular fa-comments"></i>
              </div>
              <h2>Últimas Conversaciones</h2>
            </div>
            <div v-if="loadingConversations" class="loading-state">
              <span class="loader"></span>
              <p>Cargando conversaciones...</p>
            </div>
            <div v-else-if="errorConversations" class="error-message">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ errorConversations }}
            </div>
            <div v-else class="table-container" style="overflow-x: auto; width: 100%;">
              <div v-if="recentConversationsData.length === 0" class="empty-state">
                <p>No hay conversaciones recientes registradas.</p>
              </div>
              <table v-else class="premium-table">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="conv in top10Conversations" :key="conv.id">
                    <td>
                      <div class="cell-title">{{ conv.contactName || conv.contactId || 'Desconocido' }}</div>
                      <div class="cell-subtitle">{{ new Date(conv.dateUpdated).toLocaleDateString() }}</div>
                      <div v-if="conv.answeredOutsideCrm" class="conv-alert mt-1">
                        <i class="fa-solid fa-triangle-exclamation"></i> Fuera de CRM (No trackeable)
                      </div>
                      <div v-else-if="conv.avgResponseTimeMs !== null" class="conv-alert ok mt-1">
                        <i class="fa-regular fa-clock"></i> Resp. Prom: {{ formatTime(conv.avgResponseTimeMs) }}
                      </div>
                    </td>
                    <td>
                      <span :class="['status-badge', conv.status === 'open' ? 'pending' : 'paid']">
                        {{ conv.status }}
                      </span>
                    </td>
                    <td class="text-center actions-cell">
                      <button class="action-btn chat-btn" @click="openChat(conv)" title="Ver Historial">
                        <i class="fa-regular fa-message"></i> Ver Chat
                      </button>
                      <button class="action-btn crm-btn" @click="openInCrm(conv.id)" title="Abrir en CRM">
                        <i class="fa-solid fa-external-link-alt"></i> CRM
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- Chat Modal Overlay -->
    <div v-if="selectedChat" class="chat-modal-overlay" @click.self="closeChat">
      <div class="chat-modal glass-card">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-avatar">
              <i class="fa-solid fa-user"></i>
            </div>
            <div class="chat-title-wrap">
              <h3>{{ selectedChat.contactName || 'Desconocido' }}</h3>
              <span class="chat-status"><span class="status-dot"></span> {{ selectedChat.status === 'open' ? 'Activo' : 'Cerrado' }}</span>
            </div>
          </div>
          <button class="close-modal-btn" @click="closeChat">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div class="chat-body" ref="chatBody">
          <div v-if="!selectedChat.messages || selectedChat.messages.length === 0" class="empty-chat">
            <div class="empty-icon-wrapper">
              <i class="fa-solid fa-lock"></i>
            </div>
            <h4>Sin acceso a los mensajes</h4>
            <p>GoHighLevel no entregó el historial (Error 401). El token actual permite ver la conversación pero no su contenido. Para leer los mensajes, abre el CRM.</p>
          </div>
          <div v-else class="messages-list">
            <div class="chat-date-divider">
              <span>Última actualización: {{ new Date(selectedChat.dateUpdated).toLocaleDateString() }}</span>
            </div>
            <div 
              v-for="(msg, index) in selectedChat.messages" 
              :key="msg.id || index" 
              class="message-bubble" 
              :class="msg.direction"
            >
              <div v-if="msg.direction === 'outbound'" class="msg-author">Agente Bakano</div>
              <div v-else class="msg-author">{{ selectedChat.contactName || 'Cliente' }}</div>
              
              <div class="msg-content" v-html="msg.body"></div>
              
              <div class="msg-meta">
                <span>{{ new Date(msg.dateAdded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
                <span v-if="msg.direction === 'outbound'" class="msg-status"><i class="fa-solid fa-check-double"></i></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <button class="btn-primary full-width" @click="openInCrm(selectedChat.id)">
            Abrir y Responder en CRM <i class="fa-solid fa-external-link-alt"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;

/* Data Notice Banner */
.data-notice {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba($brand-orange, 0.1);
  border: 1px solid rgba($brand-orange, 0.3);
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: #FFB067;
  font-size: 0.85rem;
  line-height: 1.5;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.notice-icon i {
  font-size: 1.25rem;
  color: $brand-orange;
  margin-top: 0.1rem;
}
.notice-text strong {
  color: #fff;
  font-weight: 600;
}

.dashboard-layout {
  position: relative;
  min-height: 100vh;
  background-color: $ink-1000;
  color: $fg-dark;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.bg-shape {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.4;
  pointer-events: none;
}
.shape-1 {
  width: 500px; height: 500px;
  background: $brand-orange-glow;
  top: -150px; right: -150px;
}
.shape-2 {
  width: 600px; height: 600px;
  background: rgba(#16223D, 0.6);
  bottom: -200px; left: -200px;
}
.shape-3 {
  width: 300px; height: 300px;
  background: rgba($brand-orange, 0.1);
  top: 40%; left: 30%;
}

.glass-panel {
  background: rgba($ink-900, 0.5);
  backdrop-filter: blur(20px);
  border: 1px solid rgba($ink-400, 0.2);
}

.dashboard-header {
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  border-radius: 0 0 24px 24px;
  border-top: none;
  margin-bottom: 2rem;

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;

    .back-btn {
      background: rgba($ink-700, 0.5);
      border: 1px solid rgba($ink-400, 0.3);
      color: $fg-dark;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba($brand-orange, 0.2);
        color: $brand-orange;
        transform: translateX(-2px);
      }
    }

    h1 {
      font-size: 1.15rem;
      color: $fg-dark;
      margin: 0;
      font-weight: 700;
    }

    .subtitle {
      font-size: 0.8rem;
      color: $muted-dark;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.dashboard-main {
  flex: 1;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
}

.grid-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
}

.glass-card {
  background: rgba($ink-900, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  .icon-wrapper {
    width: 40px; height: 40px;
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }
  h2 { font-size: 1.2rem; margin: 0; }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-box {
  background: rgba($ink-800, 0.4);
  border: 1px solid rgba($ink-400, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.2s ease;

  &.highlight {
    background: rgba($brand-orange, 0.05);
    border: 1px solid rgba($brand-orange, 0.3);
  }

  &:hover {
    transform: translateY(-5px);
    border-color: rgba($brand-orange, 0.5);
  }

  .metric-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: $brand-orange;
    margin-bottom: 0.5rem;
  }

  .metric-label {
    font-size: 0.85rem;
    color: $muted-dark;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
}

.full-width { grid-column: 1 / -1; }
.status-badge { text-transform: capitalize; }
.loading-state, .empty-state, .error-message { text-align: center; padding: 2rem; }
.premium-table { width: 100%; border-collapse: collapse; text-align: left; }
.premium-table th { padding: 1rem; color: $muted-dark; border-bottom: 1px solid rgba($ink-400, 0.3); }
.premium-table td { padding: 1rem; border-bottom: 1px solid rgba($ink-400, 0.1); }
.user-info { display: flex; align-items: center; gap: 1rem; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: $brand-orange; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.cell-title { font-weight: 600; }
.cell-subtitle { font-size: 0.85rem; color: $muted-dark; }
.text-center { text-align: center; }

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }
  .dashboard-main {
    padding: 0 1rem 2rem;
    width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .glass-card {
    padding: 1.25rem;
    width: 100%;
    box-sizing: border-box;
  }
  .grid-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }
  .metrics-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
  .card-header h2 {
    font-size: 1.1rem;
    word-break: break-word;
  }
  .metric-box {
    padding: 1.25rem 1rem;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .metric-box .metric-value {
    font-size: 2rem !important;
    word-break: break-word;
    text-align: center;
    max-width: 100%;
  }
  .metric-box .metric-label {
    font-size: 0.75rem;
    text-align: center;
    white-space: normal;
    word-break: break-word;
  }
  
  /* Make table scrollable vertically or stack on mobile */
  .table-container {
    padding: 0;
    width: 100%;
    box-sizing: border-box;
  }
  
  .premium-table {
    display: block;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
    
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.85rem;
    }
  }

  .actions-cell {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

.stat-pill {
  display: inline-block;
  padding: 0.25rem 0.8rem;
  background: rgba($ink-400, 0.2);
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  color: $fg-dark;
  
  &.open {
    background: rgba(#10B981, 0.2);
    color: #34D399;
  }
  
  &.closed {
    background: rgba(#EF4444, 0.2);
    color: #F87171;
  }

  &.time {
    background: rgba($brand-orange, 0.15);
    color: $brand-orange;
  }

  &.untrackable {
    background: rgba(#9CA3AF, 0.2);
    color: #D1D5DB;
    border: 1px dashed rgba(#9CA3AF, 0.5);
  }

  &.ok {
    background: transparent;
    color: #6B7280;
    font-weight: 500;
  }
}

.conv-alert {
  font-size: 0.75rem;
  color: #F87171;
  font-weight: 600;

  &.ok {
    color: $brand-orange;
  }
}

.mt-1 { margin-top: 0.25rem; }

/* Today Card Specific Styles */
.today-card {
  background: linear-gradient(135deg, rgba($ink-900, 0.8), rgba($brand-orange, 0.05));
  border: 1px solid rgba($brand-orange, 0.2);
  box-shadow: 0 8px 32px rgba($brand-orange, 0.05);
}

.today-header h2 {
  color: $brand-orange;
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.today-icon {
  background: linear-gradient(135deg, rgba($brand-orange, 0.2), rgba(#FFB067, 0.2));
  color: #FFB067;
  box-shadow: 0 0 15px rgba($brand-orange, 0.2);
}

.premium-glow {
  background: rgba($brand-orange, 0.08) !important;
  border: 1px solid rgba($brand-orange, 0.3) !important;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: radial-gradient(circle, rgba($brand-orange, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover::before {
    opacity: 1;
  }

  .metric-value {
    color: #FFB067 !important;
    text-shadow: 0 0 20px rgba($brand-orange, 0.4);
    font-size: 3.5rem !important;
    
    @media (max-width: 480px) {
      font-size: 2.2rem !important;
      word-break: break-word;
    }
  }
}

.section-subtitle {
  font-size: 0.85rem;
  color: $muted-dark;
  margin: 0.2rem 0 0 0;
}

/* Actions in Table */
.actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  &.chat-btn {
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    border: 1px solid rgba($brand-orange, 0.2);
    &:hover { background: rgba($brand-orange, 0.2); }
  }

  &.crm-btn {
    background: rgba(#10B981, 0.1);
    color: #34D399;
    border: 1px solid rgba(#10B981, 0.2);
    &:hover { background: rgba(#10B981, 0.2); }
  }
}

/* Chat Modal - Increible Vista */
.chat-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(10, 10, 12, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.chat-modal {
  width: 100%;
  max-width: 550px;
  height: 85vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba($brand-orange, 0.1);
  animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(30px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.chat-header {
  padding: 1rem 1.5rem;
  background: rgba($ink-900, 0.9);
  border-bottom: 1px solid rgba($ink-400, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-avatar {
  width: 45px; height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, $brand-orange, darken($brand-orange, 20%));
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba($brand-orange, 0.3);
}

.chat-title-wrap h3 {
  margin: 0 0 0.2rem 0; color: #fff; font-size: 1.1rem; font-weight: 700;
}

.chat-status {
  font-size: 0.75rem; color: #9CA3AF; display: flex; align-items: center; gap: 0.3rem;
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #10B981;
  box-shadow: 0 0 8px rgba(#10B981, 0.6);
}

.close-modal-btn {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: #9CA3AF; width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: rgba(248, 113, 113, 0.1); color: #F87171; border-color: rgba(248, 113, 113, 0.3); transform: rotate(90deg); }
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: linear-gradient(180deg, rgba($ink-1000, 0.6) 0%, rgba($ink-900, 0.8) 100%);
  display: flex;
  flex-direction: column;
  position: relative;
}

.chat-body::-webkit-scrollbar { width: 6px; }
.chat-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

.empty-chat {
  margin: auto; text-align: center; color: #9CA3AF; max-width: 80%;
  .empty-icon-wrapper {
    width: 80px; height: 80px; border-radius: 50%; background: rgba(248, 113, 113, 0.1);
    color: #F87171; font-size: 2.5rem; display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem; box-shadow: 0 0 30px rgba(248, 113, 113, 0.1);
  }
  h4 { color: #fff; margin: 0 0 0.5rem; font-size: 1.2rem; }
  p { line-height: 1.5; font-size: 0.9rem; }
}

.chat-date-divider {
  text-align: center; margin: 1rem 0 2rem; position: relative;
  span {
    background: rgba(255,255,255,0.05); padding: 0.4rem 1rem; border-radius: 20px;
    font-size: 0.75rem; color: #9CA3AF; border: 1px solid rgba(255,255,255,0.05);
  }
}

.messages-list {
  display: flex; flex-direction: column; gap: 1.2rem;
}

.message-bubble {
  max-width: 85%;
  position: relative;
  animation: bubbleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0; transform: translateY(10px);
  
  /* Staggered animation */
  @for $i from 1 through 20 {
    &:nth-child(#{$i}) { animation-delay: #{$i * 0.05}s; }
  }
  
  .msg-author {
    font-size: 0.7rem; margin-bottom: 0.3rem; color: #9CA3AF; font-weight: 600;
  }
  
  .msg-content {
    padding: 0.9rem 1.1rem; font-size: 0.95rem; line-height: 1.5;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    word-break: break-word;
  }

  &.inbound {
    align-self: flex-start;
    .msg-author { margin-left: 0.5rem; }
    .msg-content {
      background: #1F2937; color: #F3F4F6;
      border-radius: 18px 18px 18px 4px;
      border: 1px solid rgba(255,255,255,0.05);
    }
  }
  
  &.outbound {
    align-self: flex-end;
    .msg-author { text-align: right; margin-right: 0.5rem; color: $brand-orange; }
    .msg-content {
      background: linear-gradient(135deg, $brand-orange, darken($brand-orange, 10%));
      color: #fff;
      border-radius: 18px 18px 4px 18px;
    }
  }

  .msg-meta {
    display: flex; justify-content: flex-end; align-items: center; gap: 0.4rem;
    font-size: 0.65rem; margin-top: 0.3rem; opacity: 0.7;
    .msg-status { color: #60A5FA; }
  }
}

@keyframes bubbleIn {
  to { opacity: 1; transform: translateY(0); }
}

.chat-footer {
  padding: 1.25rem 1.5rem;
  background: rgba($ink-900, 0.9);
  border-top: 1px solid rgba($ink-400, 0.2);
  backdrop-filter: blur(10px);

  .btn-primary {
    background: linear-gradient(135deg, #10B981, #059669);
    color: #fff; border: none; padding: 1rem; border-radius: 12px;
    font-weight: 600; font-size: 1rem; cursor: pointer;
    display: flex; justify-content: center; align-items: center; gap: 0.5rem;
    transition: all 0.2s; box-shadow: 0 4px 15px rgba(#10B981, 0.2);
    &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(#10B981, 0.4); }
  }
}
</style>
