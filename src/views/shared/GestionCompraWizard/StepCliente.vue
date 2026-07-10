<template>
  <div class="step-cliente">
    <h3 class="step__title">Buscar o crear cliente</h3>

    <!-- Search -->
    <div class="search-box">
      <AppInput
        v-model="query"
        label="Buscar por nombre, email o teléfono"
        placeholder="Ej: Juan Pérez..."
        @input="onSearch"
      />
      <div v-if="loading" class="search-hint">Buscando...</div>
      <div v-else-if="results.length" class="search-results">
        <button
          v-for="c in results"
          :key="c._id"
          class="result-item"
          :class="{ selected: selected?._id === c._id }"
          @click="selectContacto(c)"
        >
          <span class="result-name">{{ c.nombre }}</span>
          <span class="result-meta">{{ c.email ?? '' }}{{ c.telefono ? ` · ${c.telefono}` : '' }}</span>
        </button>
      </div>
      <div v-else-if="query.length >= 2 && !loading" class="search-hint muted">
        No encontrado — puedes crear uno nuevo abajo.
      </div>
    </div>

    <!-- Selected -->
    <div v-if="selected" class="selected-card">
      <span class="selected-label">Cliente seleccionado:</span>
      <strong>{{ selected.nombre }}</strong>
      <span v-if="selected.email" class="muted"> · {{ selected.email }}</span>
      <span v-if="selected.telefono" class="muted"> · {{ selected.telefono }}</span>
      <button class="btn-clear" @click="clearSelected">Cambiar</button>
    </div>

    <div v-if="selected" class="history-card">
      <div class="history-header">
        <div>
          <span class="history-label">Historial del cliente</span>
          <h4>{{ selected.nombre }}</h4>
        </div>
        <div class="history-stats" v-if="selectedDetail">
          <span>{{ selectedDetail.contacto.totalOrders }} ventas</span>
          <span>${{ totalSpent.toFixed(2) }}</span>
        </div>
      </div>

      <div v-if="loadingDetail" class="history-loading">
        <span class="history-skeleton" />
        <span class="history-skeleton short" />
        <span class="history-skeleton short" />
      </div>

      <template v-else-if="selectedDetail">
        <div class="history-meta">
          <span>
            Primera venta: <strong>{{ formatDate(selectedDetail.contacto.firstOrderDate) }}</strong>
          </span>
          <span>
            Última venta: <strong>{{ formatDate(selectedDetail.contacto.lastOrderDate) }}</strong>
          </span>
        </div>

        <div v-if="recentOrders.length" class="history-list">
          <div v-for="order in recentOrders" :key="order._id" class="history-item">
            <div class="history-item-main">
              <strong>{{ order.description }}</strong>
              <span>{{ order.storeName }} · {{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="history-item-side">
              <span class="badge-pill" :class="`state-${order.status}`">{{ statusLabel(order.status) }}</span>
              <strong>${{ order.totalAmount.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <p v-else class="history-empty">No hay ventas previas para este cliente.</p>
      </template>
    </div>

    <!-- Create new -->
    <div v-if="!selected" class="create-section">
      <button class="btn-toggle-create" @click="openCreateModal">
        + Crear nuevo cliente
      </button>
    </div>

    <transition name="fade">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <transition name="modal-pop" appear>
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <span class="history-label">Alta rápida</span>
                <h4>Nuevo cliente</h4>
                <p>Guardamos cédula, email y teléfono sin duplicar registros.</p>
              </div>
              <button class="btn-close" @click="closeCreateModal"><i class="fa-solid fa-xmark" /></button>
            </div>

            <div class="modal-grid">
              <AppInput v-model="newForm.nombre" label="Nombre completo *" placeholder="Juan Pérez" />
              <AppInput v-model="newForm.email" label="Email" placeholder="juan@email.com" type="email" />
              <div class="phone-field">
                <span class="field-label">Teléfono</span>
                <div class="phone-group">
                  <select v-model="newForm.phoneCountry" class="phone-country">
                    <option v-for="country in phoneCountries" :key="country.code" :value="country.code">
                      {{ country.label }} (+{{ country.code }})
                    </option>
                  </select>
                  <div class="phone-input">
                    <span class="phone-prefix">+{{ selectedPhoneCountry?.code }}</span>
                    <input
                      :value="newForm.telefono"
                      class="phone-text"
                      inputmode="numeric"
                      :placeholder="selectedPhoneCountry?.placeholder"
                      @input="onPhoneInput"
                    />
                  </div>
                </div>
                <small class="phone-hint">El número se guarda con el código del país seleccionado.</small>
              </div>
              <AppInput v-model="newForm.cedula" label="Cédula" placeholder="0102030405" />
            </div>

            <AppInput v-model="newForm.notas" label="Notas" placeholder="Información adicional..." />

            <p v-if="createError" class="field-error">{{ createError }}</p>

            <div class="modal-actions-row">
              <AppButton variant="outline" @click="closeCreateModal">Cancelar</AppButton>
              <AppButton variant="primary" :disabled="!newForm.nombre.trim() || creating" @click="createContacto">
                {{ creating ? 'Creando...' : 'Crear cliente' }}
              </AppButton>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { contactosCbAPI } from '@/services/contactos_cb.api'
import { contactosApi } from '@/services/contactos.api'
import type { Contacto } from '@/services/gestiones_compra.api'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const store = useGestionCompraFormStore()

const query = ref('')
const results = ref<Contacto[]>([])
const loading = ref(false)
const selected = ref<Contacto | null>(store.formData.contacto)
const selectedDetail = ref<null | { contacto: { totalOrders: number; firstOrderDate: string; lastOrderDate: string }; orders: any[] }>(null)
const loadingDetail = ref(false)
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')

const phoneCountries = [
  { code: '593', label: 'EC Ecuador', placeholder: '9XXXXXXXX' },
  { code: '1', label: 'US Estados Unidos', placeholder: '5551234567' },
  { code: '57', label: 'CO Colombia', placeholder: '3001234567' },
  { code: '51', label: 'PE Perú', placeholder: '912345678' },
  { code: '52', label: 'MX México', placeholder: '5512345678' },
]

const newForm = ref({ nombre: '', email: '', telefono: '', cedula: '', notas: '', phoneCountry: '593' })

let debounceTimer: ReturnType<typeof setTimeout>

const recentOrders = computed(() => selectedDetail.value?.orders?.slice(0, 3) ?? [])

const totalSpent = computed(() =>
  selectedDetail.value?.orders?.reduce((sum: number, order: any) => sum + (Number(order.totalAmount) || 0), 0) ?? 0
)

function onSearch() {
  clearTimeout(debounceTimer)
  if (query.value.length < 2) { results.value = []; return }
  debounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      results.value = await contactosCbAPI.search(query.value)
    } finally {
      loading.value = false
    }
  }, 300)
}

function selectContacto(c: Contacto) {
  selected.value = c
  store.setContacto(c)
  results.value = []
  query.value = ''
  loadDetail(c)
}

function clearSelected() {
  selected.value = null
  store.formData.contactoId = ''
  store.formData.contacto = null
  selectedDetail.value = null
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusLabel(status: string) {
  return {
    borrador: 'Borrador',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    comprado: 'Comprado',
    en_envio: 'En envío',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }[status] ?? status
}

function openCreateModal() {
  showCreateModal.value = true
  createError.value = ''
}

function closeCreateModal() {
  showCreateModal.value = false
}

function sanitizePhoneLocal(value: string): string {
  let digits = value.replace(/\D+/g, '')
  digits = digits.replace(/^593/, '').replace(/^57/, '').replace(/^51/, '').replace(/^52/, '').replace(/^1/, '').replace(/^0+/, '')
  return digits
}

const selectedPhoneCountry = computed(() => phoneCountries.find((country) => country.code === newForm.value.phoneCountry) ?? phoneCountries[0])

function onPhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  newForm.value.telefono = sanitizePhoneLocal(target.value)
}

function normalizePhoneLocalPayload(local: string): string {
  const digits = sanitizePhoneLocal(local)
  return digits
}

async function loadDetail(c: Contacto) {
  loadingDetail.value = true
  try {
    selectedDetail.value = await contactosApi.getDetail(c.nombre, c.email, c.telefono)
  } catch {
    selectedDetail.value = null
  } finally {
    loadingDetail.value = false
  }
}

watch(
  () => store.formData.contacto,
  (contacto) => {
    selected.value = contacto
    if (contacto) loadDetail(contacto)
  },
  { immediate: true }
)

async function createContacto() {
  if (!newForm.value.nombre.trim()) return
  creating.value = true
  createError.value = ''
  try {
    const c = await contactosCbAPI.create({
      nombre: newForm.value.nombre,
      email: newForm.value.email,
      telefono: normalizePhoneLocalPayload(newForm.value.telefono),
      phoneCountryCode: newForm.value.phoneCountry,
      cedula: newForm.value.cedula,
      notas: newForm.value.notas,
    })
    selectContacto(c.contacto)
    closeCreateModal()
    newForm.value = { nombre: '', email: '', telefono: '', cedula: '', notas: '', phoneCountry: '593' }
  } catch (e: any) {
    createError.value = e?.message ?? 'Error al crear contacto'
  } finally {
    creating.value = false
  }
}

defineExpose({ isValid: () => !!store.formData.contactoId })
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.step-cliente { display: flex; flex-direction: column; gap: $space-4; }
.step__title { color: $fg-dark; font-size: 1.1rem; margin: 0 0 $space-2; }
.search-box { display: flex; flex-direction: column; gap: $space-2; }
.search-results {
  display: flex; flex-direction: column; gap: $space-1;
  border: 1px solid $ink-500; border-radius: 8px; overflow: hidden;
}
.result-item {
  display: flex; flex-direction: column; gap: 2px;
  padding: $space-3 $space-4; background: $ink-900; border: none;
  cursor: pointer; text-align: left; color: $fg-dark;
  transition: background 0.15s;
  &:hover, &.selected { background: $ink-700; }
}
.result-name { font-weight: 600; }
.result-meta { font-size: 0.8rem; color: $ink-300; }
.search-hint { font-size: 0.85rem; color: $ink-400; }
.muted { color: $ink-400; }
.selected-card {
  display: flex; align-items: center; gap: $space-2; flex-wrap: wrap;
  padding: $space-3 $space-4; background: $ink-700; border-radius: 8px;
  border: 1px solid $brand-orange;
}
.selected-label { font-size: 0.8rem; color: $ink-300; }
.btn-clear {
  margin-left: auto; background: none; border: none; color: $brand-orange;
  cursor: pointer; font-size: 0.85rem; text-decoration: underline;
}
.history-card {
  display: flex; flex-direction: column; gap: $space-3;
  border: 1px solid rgba($brand-orange, 0.18);
  background: rgba($brand-orange, 0.05);
  border-radius: 14px;
  padding: $space-4;
}
.history-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: $space-3;
}
.history-label {
  display: inline-flex; margin-bottom: 2px; color: $brand-orange; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
}
.history-header h4 { margin: 0; color: $fg-dark; font-size: 1rem; }
.history-stats {
  display: flex; align-items: center; gap: $space-3; color: $ink-300; font-size: 0.82rem; white-space: nowrap;
}
.history-loading { display: flex; flex-direction: column; gap: $space-2; }
.history-skeleton {
  display: block; height: 14px; border-radius: 999px; background: $ink-700; animation: pulse 1.4s infinite;
  &.short { width: 65%; }
}
.history-meta {
  display: flex; flex-wrap: wrap; gap: $space-3; color: $ink-300; font-size: 0.82rem;
}
.history-list { display: flex; flex-direction: column; gap: $space-2; }
.history-item {
  display: flex; align-items: center; justify-content: space-between; gap: $space-3;
  padding: $space-3 $space-4; background: $ink-900; border: 1px solid rgba($ink-500, 0.18); border-radius: 10px;
}
.history-item-main { display: flex; flex-direction: column; gap: 2px; }
.history-item-main strong { font-size: 0.9rem; }
.history-item-main span { font-size: 0.78rem; color: $ink-400; }
.history-item-side { display: flex; align-items: center; gap: $space-2; }
.badge-pill {
  display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px; font-size: 0.72rem; font-weight: 700;
}
.state-comprado, .state-entregado { background: rgba(43,187,146,0.15); color: $signal-green; }
.state-en_proceso { background: rgba(84,132,255,0.14); color: #7fa3ff; }
.state-pendiente { background: rgba(240,138,31,0.16); color: $brand-orange; }
.state-borrador, .state-cancelado { background: rgba(111,111,122,0.18); color: $ink-300; }
.history-empty { margin: 0; color: $ink-400; font-size: 0.85rem; }
.btn-toggle-create {
  background: none; border: 1px dashed $ink-500; color: $ink-300;
  padding: $space-2 $space-4; border-radius: 8px; cursor: pointer;
  width: 100%; text-align: center; font-size: 0.9rem;
  &:hover { border-color: $brand-orange; color: $brand-orange; }
}
.field-error { color: $signal-red; font-size: 0.82rem; margin: 0; }

.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba($ink-1000, 0.78); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: $space-4;
}
.modal-card {
  width: min(760px, 100%);
  background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.18); border-radius: 24px; padding: $space-6;
  box-shadow: 0 30px 80px rgba(0,0,0,0.45);
}
.modal-pop-enter-active, .modal-pop-leave-active { transition: transform 0.22s ease, opacity 0.22s ease; }
.modal-pop-enter-from, .modal-pop-leave-to { transform: translateY(18px) scale(0.96); opacity: 0; }
.modal-pop-enter-to, .modal-pop-leave-from { transform: translateY(0) scale(1); opacity: 1; }
.modal-head {
  display: flex; justify-content: space-between; align-items: flex-start; gap: $space-4; margin-bottom: $space-5;
}
.modal-head h4 { margin: 0 0 $space-1; color: $fg-dark; }
.modal-head p { margin: 0; color: $ink-300; }
.btn-close { background: transparent; border: 1px solid rgba($brand-orange, 0.25); color: $brand-orange; border-radius: 12px; padding: $space-2 $space-3; cursor: pointer; }
.modal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-4; margin-bottom: $space-4; }
.phone-field { display: flex; flex-direction: column; gap: $space-2; }
.field-label { color: $ink-300; font-size: 0.85rem; font-weight: 600; }
.phone-group { display: flex; flex-direction: column; gap: $space-2; }
.phone-country {
  width: 100%; appearance: none; border: 1px solid rgba($ink-500, 0.18); border-radius: 12px;
  background: $ink-900; color: $fg-dark; padding: $space-3 $space-4; font-family: inherit;
}
.phone-input {
  display: flex; align-items: center; overflow: hidden; border-radius: 12px;
  border: 1px solid rgba($ink-500, 0.18); background: $ink-900;
}
.phone-prefix { padding: $space-3 $space-4; color: $brand-orange; font-weight: 800; border-right: 1px solid rgba($ink-500, 0.18); min-width: 74px; text-align: center; }
.phone-text {
  flex: 1; border: none; outline: none; background: transparent; color: $fg-dark; padding: $space-3 $space-4; font-family: inherit;
}
.phone-hint { color: $ink-400; font-size: 0.75rem; }
.modal-actions-row { display: flex; justify-content: flex-end; gap: $space-3; margin-top: $space-5; }

@media (max-width: 900px) { .modal-grid { grid-template-columns: 1fr; } }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
