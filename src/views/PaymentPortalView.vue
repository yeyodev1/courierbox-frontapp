<script setup lang="ts">
import { ref } from 'vue'
import { courierBridgeApi } from '@/services/courierbridge.api'
import { useToastStore } from '@/stores/toast.store'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'

const toastStore = useToastStore()
const casillero = ref('')
const loading = ref(false)
const cliente = ref<any>(null)
const facturas = ref<any[]>([])
const totalDeuda = ref(0)
const searched = ref(false)
const errorMsg = ref('')

const comprobante = ref<File | null>(null)
const referenciaPago = ref('')
const submitting = ref(false)

async function buscarDeudas() {
  if (!casillero.value.trim()) return
  loading.value = true
  errorMsg.value = ''
  searched.value = false
  cliente.value = null
  facturas.value = []
  totalDeuda.value = 0
  try {
    const data = await courierBridgeApi.getFacturasPendientes(casillero.value.trim().toUpperCase())
    if (!data.cliente) {
      errorMsg.value = 'No encontramos un cliente con ese código de casillero'
      return
    }
    cliente.value = data.cliente
    facturas.value = data.facturas || []
    totalDeuda.value = data.totalDeuda || 0
  } catch (err: any) {
    if (err.status === 404) {
      errorMsg.value = 'No encontramos un cliente con ese código de casillero'
    } else {
      errorMsg.value = err.message || 'Error al consultar tus facturas'
    }
  } finally {
    loading.value = false
    searched.value = true
  }
}

async function enviarPago() {
  if (!referenciaPago.value.trim() || !comprobante.value) return
  submitting.value = true
  try {
    const form = new FormData()
    if (comprobante.value) form.append('comprobante', comprobante.value)
    form.append('facturaIds', JSON.stringify(facturas.value.map((f: any) => f._id)))
    form.append('referenciaPago', referenciaPago.value.trim())

    await courierBridgeApi.registrarPago(form)
    toastStore.showNotification('Pago registrado. Estamos verificando tu transferencia.', 'success')
    comprobante.value = null
    referenciaPago.value = ''
    await buscarDeudas()
  } catch (err: any) {
    toastStore.showNotification(err.message || 'Error al registrar pago', 'error')
  } finally {
    submitting.value = false
  }
}

function formatMoney(n: number) {
  return `$${(n || 0).toFixed(2)}`
}
</script>

<template>
  <div class="payment-portal">
    <section class="hero-section">
      <div class="container">
        <h1>Mis Pagos</h1>
        <p class="subtitle">Consulta tus facturas pendientes y registra tus transferencias</p>
      </div>
    </section>

    <section class="content-section container">
      <!-- Login por casillero -->
      <div v-if="!cliente" class="login-card glass-card">
        <div class="card-header">
          <div class="icon-wrapper">
            <i class="fa-solid fa-lock"></i>
          </div>
          <h2>Ingresa con tu Código de Casillero</h2>
        </div>
        <form @submit.prevent="buscarDeudas">
          <div class="form-group">
            <label>Código de Casillero</label>
            <input
              v-model="casillero"
              type="text"
              placeholder="Ej. SH12345"
              required
              class="input-lg"
              @keyup.enter="buscarDeudas"
            />
          </div>
          <div v-if="errorMsg" class="error-message">
            <i class="fa-solid fa-circle-exclamation"></i>
            {{ errorMsg }}
          </div>
          <button type="submit" :disabled="loading || !casillero.trim()" class="submit-btn">
            <span v-if="!loading">Consultar Deuda</span>
            <span v-else class="loader"></span>
          </button>
        </form>
      </div>

      <!-- Deudas -->
      <div v-else class="deudas-section">
        <div class="cliente-info glass-card">
          <div class="card-header">
            <div class="icon-wrapper">
              <i class="fa-solid fa-user"></i>
            </div>
            <div>
              <h2>{{ cliente.nombre }}</h2>
              <p class="casillero-label">Casillero: {{ cliente.casillero }}</p>
            </div>
          </div>

          <div class="deuda-total">
            <span class="label">Total Adeudado</span>
            <span class="amount">{{ formatMoney(totalDeuda) }}</span>
          </div>

          <button class="btn-secondary" @click="cliente = null; casillero = ''">
            <i class="fa-solid fa-arrow-left"></i> Cambiar casillero
          </button>
        </div>

        <div v-if="facturas.length === 0" class="empty-state glass-card">
          <i class="fa-solid fa-check-circle fa-3x" style="color: #22c55e;"></i>
          <p>No tienes facturas pendientes. ¡Todo al día!</p>
        </div>

        <div v-for="factura in facturas" :key="factura._id" class="factura-card glass-card">
          <div class="factura-header">
            <div>
              <h3>{{ factura.numeroFactura }}</h3>
              <span :class="['status-badge', factura.estado]">
                {{ factura.estado === 'pendiente' ? 'Pendiente' : 'En verificación' }}
              </span>
            </div>
            <div class="factura-monto">{{ formatMoney(factura.totalGeneral) }}</div>
          </div>

          <div class="factura-detalle">
            <div class="detalle-row">
              <span>Peso total</span>
              <span>{{ factura.pesoTotalLb.toFixed(2) }} lb</span>
            </div>
            <div class="detalle-row">
              <span>Flete</span>
              <span>{{ formatMoney(factura.totalFlete) }}</span>
            </div>
            <div class="detalle-row">
              <span>Arancel 4x4</span>
              <span>{{ formatMoney(factura.totalArancel) }}</span>
            </div>
            <div class="detalle-row">
              <span>IVA 15%</span>
              <span>{{ formatMoney(factura.iva) }}</span>
            </div>
          </div>

          <div v-if="factura.pdfUrl" class="factura-pdf">
            <a :href="factura.pdfUrl" target="_blank" class="pdf-link">
              <i class="fa-solid fa-file-pdf"></i> Ver factura PDF
            </a>
          </div>
        </div>

        <!-- Formulario de pago -->
        <div v-if="facturas.length > 0" class="pago-form glass-card">
          <div class="card-header">
            <div class="icon-wrapper">
              <i class="fa-solid fa-credit-card"></i>
            </div>
            <h2>Registrar Pago</h2>
          </div>

          <form @submit.prevent="enviarPago">
            <div class="form-group">
              <label>Referencia de Transferencia *</label>
              <input
                v-model="referenciaPago"
                type="text"
                placeholder="Número de referencia o comprobante"
                required
              />
            </div>

            <div class="form-group">
              <AppFileUpload
                v-model="comprobante"
                label="Comprobante de Pago *"
                accept="image/*,.pdf"
                hint="Sube una foto o PDF nítido. Lo almacenamos de forma segura con Cloudinary."
              />
            </div>

            <button type="submit" :disabled="submitting || !referenciaPago.trim() || !comprobante" class="submit-btn">
              <span v-if="!submitting">Enviar Comprobante</span>
              <span v-else class="loader"></span>
            </button>
            <p class="form-footnote">Tu pago será verificado por nuestro equipo y tus paquetes serán despachados.</p>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use "@/styles/tokens/colors" as *;
@use "@/styles/tokens/space" as *;

.payment-portal {
  min-height: 100vh;
  background: $ink-1000;
  color: $fg-dark;
}

.hero-section {
  padding: 160px 0 60px;
  text-align: center;
  background: linear-gradient(135deg, $ink-1000 0%, color.adjust($ink-1000, $lightness: 5%) 100%);

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, $fg-dark, $brand-orange);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: $muted-dark;
    font-size: 1.1rem;
  }
}

.content-section {
  padding-bottom: 100px;
  max-width: 720px;
  margin: 0 auto;
}

.glass-card {
  background: rgba($fg-dark, 0.04);
  border: 1px solid rgba($fg-dark, 0.08);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(12px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba($brand-orange, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: $brand-orange;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 1.25rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: $muted-dark;
  }

  input {
    width: 100%;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba($fg-dark, 0.12);
    background: rgba($fg-dark, 0.06);
    color: $fg-dark;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: $brand-orange;
    }
  }
}

.input-lg {
  font-size: 1.25rem !important;
  text-align: center;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: $brand-orange;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    opacity: 0.9;
  }
}

.btn-secondary {
  padding: 0.6rem 1.25rem;
  background: rgba($fg-dark, 0.08);
  border: 1px solid rgba($fg-dark, 0.12);
  border-radius: 10px;
  color: $muted-dark;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;

  &:hover {
    background: rgba($fg-dark, 0.12);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  background: rgba(#ef4444, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.cliente-info {
  .deuda-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 0;
    border-top: 1px solid rgba($fg-dark, 0.08);
    border-bottom: 1px solid rgba($fg-dark, 0.08);
    margin-bottom: 1rem;

    .label {
      color: $muted-dark;
      font-size: 1rem;
    }

    .amount {
      font-size: 2rem;
      font-weight: 700;
      color: $brand-orange;
    }
  }

  .casillero-label {
    color: $muted-dark;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;

  p {
    color: $muted-dark;
    margin-top: 1rem;
  }
}

.factura-card {
  .factura-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;

    h3 {
      font-size: 1.1rem;
      margin-bottom: 0.35rem;
    }
  }

  .factura-monto {
    font-size: 1.4rem;
    font-weight: 700;
    color: $brand-orange;
  }

  .factura-detalle {
    .detalle-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
      color: $muted-dark;

      &:not(:last-child) {
        border-bottom: 1px solid rgba($fg-dark, 0.05);
      }
    }
  }

  .factura-pdf {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba($fg-dark, 0.08);
  }

  .pdf-link {
    color: #60a5fa;
    text-decoration: none;
    font-size: 0.9rem;

    &:hover {
      text-decoration: underline;
    }
  }
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;

  &.pendiente {
    background: rgba(#f59e0b, 0.15);
    color: #f59e0b;
  }

  &.verificando {
    background: rgba(#3b82f6, 0.15);
    color: #60a5fa;
  }
}

.pago-form {
  .form-footnote {
    text-align: center;
    color: $muted-dark;
    font-size: 0.8rem;
    margin-top: 1rem;
  }
}

.file-input {
  padding: 0.5rem !important;
}

.file-hint {
  color: $muted-dark;
  font-size: 0.85rem;
  margin-top: 0.35rem;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba($fg-dark, 0.3);
  border-top-color: $fg-dark;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
