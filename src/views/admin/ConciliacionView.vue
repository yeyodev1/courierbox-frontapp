<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { adminApi } from '@/services/admin.api'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

interface Factura {
  _id: string
  numeroFactura: string
  totalGeneral: number
  referenciaPago: string
  comprobanteUrl: string
  estado: string
  createdAt: string
  masterClienteId: { nombreOficial: string; codigoCasillero: string }
  paquetes: any[]
}

const activeTab = ref<'verificando' | 'csv'>('verificando')
const loading = ref(false)
const facturasVerificando = ref<Factura[]>([])

const csvFile = ref<File | null>(null)
const uploadingCsv = ref(false)
const csvResultado = ref<any>(null)

const resumen = ref({ pendientes: 0, verificando: 0, pagadas: 0, total: 0 })

onMounted(async () => {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  await Promise.all([cargarVerificando(), cargarResumen()])
})

async function cargarVerificando() {
  loading.value = true
  try {
    const data = await adminApi.getData(`v1/conciliacion/verificando`)
    facturasVerificando.value = data.facturas || []
  } catch (err: any) {
    toastStore.showNotification('Error al cargar pagos pendientes', 'error')
  } finally {
    loading.value = false
  }
}

async function cargarResumen() {
  try {
    const data = await adminApi.getData(`v1/conciliacion/resumen`)
    resumen.value = data.resumen || resumen.value
  } catch {}
}

function onCsvChange(e: Event) {
  const target = e.target as HTMLInputElement
  csvFile.value = target.files?.[0] || null
  csvResultado.value = null
}

async function subirCsv() {
  if (!csvFile.value) return
  uploadingCsv.value = true
  try {
    const form = new FormData()
    form.append('csv', csvFile.value)
    const data = await adminApi.postData('v1/conciliacion/cargar-csv', form)
    csvResultado.value = data
    toastStore.showNotification(`${data.conciliadas} facturas conciliadas`, 'success')
    await Promise.all([cargarVerificando(), cargarResumen()])
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al procesar CSV', 'error')
  } finally {
    uploadingCsv.value = false
  }
}

async function confirmarPago(facturaId: string) {
  try {
    await adminApi.postData(`v1/facturacion/confirmar/${facturaId}`, {})
    toastStore.showNotification('Pago confirmado', 'success')
    await Promise.all([cargarVerificando(), cargarResumen()])
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al confirmar', 'error')
  }
}

function formatMoney(n: number) {
  return `$${(n || 0).toFixed(2)}`
}
</script>

<template>
  <div class="conciliacion-view">
    <header class="page-header">
      <div class="container">
        <h1>Conciliación Bancaria</h1>
        <p class="subtitle">Cruza pagos de clientes con transacciones bancarias reales</p>
      </div>
    </header>

    <div class="container content">
      <!-- Resumen -->
      <div class="resumen-grid">
        <div class="stat-card">
          <span class="stat-value">{{ resumen.pendientes }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
        <div class="stat-card accent">
          <span class="stat-value">{{ resumen.verificando }}</span>
          <span class="stat-label">En Verificación</span>
        </div>
        <div class="stat-card success">
          <span class="stat-value">{{ resumen.pagadas }}</span>
          <span class="stat-label">Pagadas</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'verificando' }]" @click="activeTab = 'verificando'">
          <i class="fa-solid fa-clock"></i> Pagos a Verificar ({{ facturasVerificando.length }})
        </button>
        <button :class="['tab-btn', { active: activeTab === 'csv' }]" @click="activeTab = 'csv'">
          <i class="fa-solid fa-file-csv"></i> Cargar CSV Bancario
        </button>
      </div>

      <!-- Pagos a verificar -->
      <div v-if="activeTab === 'verificando'" class="tab-content">
        <div v-if="loading" class="loading-state" aria-busy="true" aria-live="polite">
          <AppSkeleton variant="card" height="96px" :count="4" gap="0.75rem" />
        </div>

        <div v-else-if="facturasVerificando.length === 0" class="empty-state">
          <i class="fa-solid fa-check-circle fa-3x" style="color: #22c55e;"></i>
          <p>No hay pagos pendientes de verificación</p>
        </div>

        <div v-for="f in facturasVerificando" :key="f._id" class="factura-card">
          <div class="card-header">
            <div>
              <strong>{{ f.numeroFactura }}</strong>
              <p class="cliente-name">{{ f.masterClienteId?.nombreOficial || 'Sin cliente' }} ({{ f.masterClienteId?.codigoCasillero || 'N/A' }})</p>
            </div>
            <div class="monto">{{ formatMoney(f.totalGeneral) }}</div>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span>Referencia:</span>
              <span class="ref-value">{{ f.referenciaPago || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span>Fecha:</span>
              <span>{{ new Date(f.createdAt).toLocaleDateString() }}</span>
            </div>
            <div class="info-row" v-if="f.comprobanteUrl">
              <span>Comprobante:</span>
              <a :href="f.comprobanteUrl" target="_blank" class="comprobante-link">
                <i class="fa-solid fa-file"></i> Ver archivo
              </a>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-approve" @click="confirmarPago(f._id)">
              <i class="fa-solid fa-check"></i> Confirmar Pago
            </button>
          </div>
        </div>
      </div>

      <!-- CSV Upload -->
      <div v-if="activeTab === 'csv'" class="tab-content">
        <div class="csv-card">
          <div class="card-header">
            <div class="icon-wrapper">
              <i class="fa-solid fa-upload"></i>
            </div>
            <h2>Cargar Reporte Bancario</h2>
          </div>
          <p class="csv-desc">Sube el archivo CSV de transacciones de tu banco para cruzar automáticamente las referencias.</p>

          <div class="csv-upload-area">
            <input type="file" accept=".csv" @change="onCsvChange" />
            <p v-if="csvFile" class="file-name">{{ csvFile.name }}</p>
          </div>

          <button class="submit-btn" :disabled="!csvFile || uploadingCsv" @click="subirCsv">
            <span v-if="!uploadingCsv"><i class="fa-solid fa-arrows-rotate"></i> Procesar CSV y Conciliar</span>
            <span v-else class="loader"></span>
          </button>

          <div v-if="csvResultado" class="csv-resultado">
            <p><strong>{{ csvResultado.totalReferencias }}</strong> referencias bancarias encontradas</p>
            <p><strong>{{ csvResultado.facturasVerificando }}</strong> facturas en verificación</p>
            <p class="match-success"><strong>{{ csvResultado.conciliadas }}</strong> facturas conciliadas automáticamente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;

.conciliacion-view {
  color: $fg-dark;
}

.page-header {
  padding: 40px 0;
  text-align: center;

  h1 {
    font-size: 2rem;
    background: linear-gradient(135deg, $fg-dark, $brand-orange);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: $muted-dark;
    margin-top: 0.5rem;
  }
}

.content {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 80px;
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;

  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: $fg-dark;
  }

  .stat-label {
    font-size: 0.85rem;
    color: $muted-dark;
  }

  &.accent .stat-value { color: $brand-orange; }
  &.success .stat-value { color: #22c55e; }
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba($fg-dark, 0.08);
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  color: $muted-dark;
  cursor: pointer;
  font-size: 0.95rem;
  border-radius: 8px 8px 0 0;
  transition: all 0.2s;

  &.active {
    color: $fg-dark;
    background: rgba($brand-orange, 0.1);
    border-bottom: 2px solid $brand-orange;
  }

  &:hover { color: rgba($fg-dark, 0.8); }
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: $muted-dark;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: $muted-dark;
}

.factura-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;

  .cliente-name {
    color: $muted-dark;
    font-size: 0.85rem;
    margin-top: 0.2rem;
  }
}

.monto {
  font-size: 1.3rem;
  font-weight: 700;
  color: $brand-orange;
}

.card-body {
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem 0;
    font-size: 0.9rem;
    color: $muted-dark;

    .ref-value {
      font-family: monospace;
      color: rgba($fg-dark, 0.8);
    }
  }
}

.comprobante-link {
  color: #60a5fa;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.card-actions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba($fg-dark, 0.06);
}

.btn-approve {
  padding: 0.6rem 1.5rem;
  background: #22c55e;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;

  &:hover { opacity: 0.85; }
}

.csv-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 12px;
  padding: 2rem;

  .icon-wrapper {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: rgba($brand-orange, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    color: $brand-orange;
  }

  .csv-desc {
    color: $muted-dark;
    margin-bottom: 1.5rem;
  }
}

.csv-upload-area {
  padding: 2rem;
  border: 2px dashed rgba($fg-dark, 0.15);
  border-radius: 12px;
  text-align: center;
  margin-bottom: 1.5rem;

  .file-name {
    margin-top: 0.5rem;
    color: $brand-orange;
  }
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: $brand-orange;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.csv-resultado {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: rgba($fg-dark, 0.04);
  border-radius: 10px;

  p {
    margin-bottom: 0.35rem;
    color: $muted-dark;
    font-size: 0.95rem;
  }

  .match-success {
    color: #22c55e;
    font-size: 1.1rem;
    margin-top: 0.5rem;
  }
}

.loader {
  display: inline-block;
  width: 20px; height: 20px;
  border: 2px solid rgba($fg-dark, 0.3);
  border-top-color: $fg-dark;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
