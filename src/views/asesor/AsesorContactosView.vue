<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { contactosApi, type Contacto } from '@/services/contactos.api'
import { contactosCbAPI } from '@/services/contactos_cb.api'
import { useToastStore } from '@/stores/toast.store'

const toastStore = useToastStore()
const router = useRouter()

const contactos = ref<Contacto[]>([])
const total = ref(0)
const loading = ref(false)
const searchQuery = ref('')
const showCreateModal = ref(false)
const creatingContacto = ref(false)
const createResult = ref<null | { message: string; matchedOn: string[]; created: boolean }>(null)
const createForm = ref({ nombre: '', email: '', telefono: '', cedula: '', notas: '' })

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`
}

function openCreateModal() {
  showCreateModal.value = true
  createResult.value = null
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function submitCreateContacto() {
  if (!createForm.value.nombre.trim()) {
    toastStore.showNotification('El nombre es requerido', 'error')
    return
  }

  creatingContacto.value = true
  try {
    const data = await contactosCbAPI.create({
      nombre: createForm.value.nombre,
      email: createForm.value.email,
      telefono: createForm.value.telefono,
      cedula: createForm.value.cedula,
      notas: createForm.value.notas,
    })

    createResult.value = {
      created: data.created,
      matchedOn: data.matchedOn,
      message: data.created
        ? 'Contacto creado sin duplicados.'
        : `Ya existía; se reutilizó y no se duplicó (${data.matchedOn.join(', ')}).`,
    }

    toastStore.showNotification(createResult.value.message, 'success')
    createForm.value = { nombre: '', email: '', telefono: '', cedula: '', notas: '' }
    await loadContactos()
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al crear contacto', 'error')
  } finally {
    creatingContacto.value = false
  }
}

async function loadContactos() {
  loading.value = true
  try {
    const data = await contactosApi.list({ q: searchQuery.value.trim() || undefined, limit: 200 })
    contactos.value = data.contactos
    total.value = data.total
  } catch (e: any) {
    toastStore.showNotification(e.message || 'Error al cargar contactos', 'error')
  } finally {
    loading.value = false
  }
}

async function openContacto(c: Contacto) {
  router.push({ name: 'AsesorContactoDetail', params: { key: encodeURIComponent(c._id) } })
}

onMounted(loadContactos)
</script>

<template>
  <div class="contactos-page">
    <section class="hero">
      <div>
        <span class="eyebrow">CRM compartido</span>
        <h1>Contactos del asesor</h1>
        <p>Todos los asesores pueden ver y gestionar estos contactos. Solo mostramos trazabilidad y últimas gestiones.</p>
      </div>
      <div class="hero-actions">
        <div class="hero-kpi">
          <strong>{{ total }}</strong>
          <span>contactos</span>
        </div>
        <AppButton variant="primary" @click="openCreateModal">
          <i class="fa-solid fa-user-plus" /> Nuevo contacto
        </AppButton>
      </div>
    </section>

    <div class="search-bar">
      <i class="fa-solid fa-search" />
      <input v-model="searchQuery" class="search-input" placeholder="Buscar por nombre, email o teléfono..." @keyup.enter="loadContactos" />
      <button class="btn-search" @click="loadContactos">Buscar</button>
    </div>

    <div v-if="loading" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" /> Cargando...
    </div>

    <div v-else-if="contactos.length === 0" class="empty">
      <i class="fa-solid fa-address-book" />
      <p>No se encontraron contactos</p>
    </div>

    <div v-else class="contactos-layout">
      <div class="contactos-list">
        <div class="contactos-count">{{ total }} contacto{{ total !== 1 ? 's' : '' }}</div>
        <button
          v-for="c in contactos"
          :key="c._id"
          class="contacto-card"
          @click="openContacto(c)"
        >
          <div class="contacto-avatar">{{ c.clientName.charAt(0).toUpperCase() }}</div>
          <div class="contacto-info">
            <strong>{{ c.clientName }}</strong>
            <span v-if="c.clientEmail" class="contacto-email">{{ c.clientEmail }}</span>
            <span v-if="c.clientPhone" class="contacto-phone">{{ c.clientPhone }}</span>
            <span class="contacto-note">Visible para todo el equipo</span>
          </div>
          <div class="contacto-meta">
            <span class="contacto-orders">{{ c.totalOrders }} órdenes</span>
            <span class="contacto-total">{{ formatMoney(c.totalAmount) }}</span>
            <span class="contacto-owners">{{ c.asesores.length }} asesores</span>
          </div>
        </button>
      </div>

      <aside class="detail-cta">
        <div class="cta-card">
          <span class="eyebrow">Detalle dedicado</span>
          <h3>Haz click en un contacto para abrir su vista completa</h3>
          <p>Ahí verás el historial desde el primer registro, órdenes relacionadas y asesores vinculados en una navegación limpia.</p>
          <div class="cta-points">
            <span>Contacto completo</span>
            <span>Órdenes relacionadas</span>
            <span>Asesores vinculados</span>
          </div>
        </div>
      </aside>
    </div>

    <transition name="fade">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <transition name="modal-pop" appear>
          <div class="modal-card">
            <div class="modal-head">
              <div>
                <span class="eyebrow">Alta rápida</span>
                <h2>Nuevo contacto</h2>
                <p>Se evita duplicar por correo, teléfono o cédula.</p>
              </div>
              <button class="btn-back" @click="closeCreateModal"><i class="fa-solid fa-xmark" /></button>
            </div>

            <div class="modal-grid">
              <AppInput v-model="createForm.nombre" label="Nombre completo *" placeholder="Juan Pérez" />
              <AppInput v-model="createForm.email" label="Correo" type="email" placeholder="correo@dominio.com" />
              <AppInput v-model="createForm.telefono" label="Teléfono" placeholder="0999999999" />
              <AppInput v-model="createForm.cedula" label="Cédula" placeholder="0102030405" />
            </div>

            <label class="modal-textarea">
              <span>Notas</span>
              <textarea v-model="createForm.notas" rows="3" placeholder="Preferencias, observaciones, etc." />
            </label>

            <div v-if="createResult" class="result-banner" :class="{ created: createResult.created }">
              <strong>{{ createResult.message }}</strong>
            </div>

            <div class="modal-actions-row">
              <AppButton variant="outline" @click="closeCreateModal">Cancelar</AppButton>
              <AppButton variant="primary" :disabled="creatingContacto" @click="submitCreateContacto">
                <span v-if="creatingContacto">Guardando...</span>
                <span v-else>Guardar contacto</span>
              </AppButton>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.contactos-page { display: flex; flex-direction: column; gap: $space-5; }
.hero {
  display: flex; justify-content: space-between; gap: $space-4; align-items: flex-end;
  padding: $space-6; border-radius: 20px; border: 1px solid rgba($brand-orange, 0.16);
  background: linear-gradient(135deg, rgba($brand-orange, 0.12), rgba($ink-900, 0.95));
}
.eyebrow { display: inline-flex; margin-bottom: $space-2; color: $brand-orange; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.hero h1 { margin: 0 0 $space-2; font-size: 1.6rem; }
.hero p { margin: 0; color: $ink-300; max-width: 760px; }
.hero-actions { display: flex; align-items: flex-end; gap: $space-3; }
.hero-kpi { display: flex; flex-direction: column; align-items: flex-end; }
.hero-kpi strong { color: $brand-orange; font-size: 2rem; }
.hero-kpi span { color: $ink-400; text-transform: uppercase; font-size: 0.72rem; }
.search-bar { display: flex; align-items: center; gap: $space-2; background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: 12px; padding: $space-2 $space-4; }
.search-bar i { color: $ink-400; }
.search-input { background: transparent; border: none; outline: none; color: $fg-dark; font-family: inherit; font-size: 0.9rem; min-width: 280px; }
.btn-search, .btn-back { border: 1px solid rgba($brand-orange, 0.25); background: transparent; color: $brand-orange; border-radius: 12px; padding: $space-2 $space-4; cursor: pointer; }
.loading, .empty, .detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $space-3; padding: $space-10 0; color: $ink-500; }
.contactos-layout { display: grid; grid-template-columns: minmax(280px, 360px) 1fr; gap: $space-4; }
.contactos-list { display: flex; flex-direction: column; gap: $space-2; }
.contactos-count { color: $ink-400; font-size: 0.82rem; }
.contacto-card {
  display: flex; align-items: center; gap: $space-3; width: 100%; text-align: left; cursor: pointer;
  padding: $space-4; background: $ink-900; border: 1px solid rgba($ink-500, 0.12); border-radius: 14px; transition: all 0.18s;
  &:hover, &.active { border-color: rgba($brand-orange, 0.24); background: rgba($brand-orange, 0.04); }
}
.contacto-avatar { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: rgba($brand-orange, 0.12); color: $brand-orange; font-weight: 800; }
.contacto-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.contacto-email, .contacto-phone, .contacto-note, .contacto-owners { font-size: 0.78rem; color: $ink-400; }
.contacto-note { color: $brand-orange; }
.contacto-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.contacto-orders { color: $fg-dark; font-size: 0.82rem; }
.contacto-total { color: $brand-orange; font-weight: 800; }
.detail-cta { display: flex; }
.cta-card {
  display: flex; flex-direction: column; justify-content: center; gap: $space-3;
  padding: $space-5; border-radius: 18px; border: 1px solid rgba($brand-orange, 0.16);
  background: linear-gradient(180deg, rgba($brand-orange, 0.08), rgba($ink-900, 0.92));
  min-height: 100%;
}
.cta-card h3 { margin: 0; font-size: 1.1rem; }
.cta-card p { margin: 0; color: $ink-300; line-height: 1.5; }
.cta-points { display: flex; flex-direction: column; gap: $space-2; color: $fg-dark; }
.cta-points span { display: inline-flex; align-items: center; gap: $space-2; }
.cta-points span::before { content: '•'; color: $brand-orange; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba($ink-1000, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.modal-card {
  width: min(760px, 100%);
  background: linear-gradient(180deg, rgba($ink-900, 0.98), rgba($ink-1000, 0.98));
  border: 1px solid rgba($brand-orange, 0.18);
  border-radius: 24px;
  padding: $space-6;
  box-shadow: 0 30px 80px rgba(0,0,0,0.45);
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  transform: translateY(18px) scale(0.96);
  opacity: 0;
}

.modal-pop-enter-to,
.modal-pop-leave-from {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  gap: $space-4;
  align-items: flex-start;
  margin-bottom: $space-5;
}

.modal-head h2 { margin: 0 0 $space-1; }
.modal-head p { margin: 0; color: $ink-300; }

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;
}

.modal-textarea {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-top: $space-4;
  color: $ink-300;
  span { font-size: 0.82rem; font-weight: 600; }
  textarea {
    width: 100%;
    border-radius: 14px;
    background: $ink-900;
    border: 1px solid rgba($ink-500, 0.15);
    color: $fg-dark;
    padding: $space-3 $space-4;
    resize: vertical;
    outline: none;
    font-family: inherit;
    &:focus { border-color: $brand-orange; }
  }
}

.result-banner {
  margin-top: $space-4;
  padding: $space-3 $space-4;
  border-radius: 14px;
  background: rgba($brand-orange, 0.08);
  border: 1px solid rgba($brand-orange, 0.18);
  color: $fg-dark;
  &.created { background: rgba(43,187,146,0.08); border-color: rgba(43,187,146,0.2); }
}

.modal-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  margin-top: $space-5;
}

.btn-back { background: transparent; border: 1px solid rgba($brand-orange, 0.25); color: $brand-orange; border-radius: 12px; padding: $space-2 $space-3; cursor: pointer; }
.detail-loading { align-items: stretch; }
.detail-skeleton { display: block; height: 18px; border-radius: 999px; background: $ink-700; animation: pulse 1.4s infinite; }
.detail-skeleton.short { width: 70%; }
.detail-header { display: flex; justify-content: space-between; gap: $space-4; align-items: flex-start; }
.detail-title h2 { margin: 0 0 $space-2; }
.detail-contact, .detail-stats { display: flex; flex-wrap: wrap; gap: $space-3; }
.detail-contact span { color: $ink-400; font-size: 0.85rem; }
.detail-stats .stat { display: flex; flex-direction: column; gap: 2px; padding: $space-2 $space-3; background: $ink-1000; border-radius: 12px; border: 1px solid rgba($ink-500, 0.12); }
.stat-value { font-size: 0.88rem; font-weight: 700; color: $fg-dark; }
.stat-label { font-size: 0.7rem; color: $ink-400; text-transform: uppercase; }
.ownership-card { margin: $space-4 0; padding: $space-4; border-radius: 14px; border: 1px solid rgba($brand-orange, 0.16); background: rgba($brand-orange, 0.05); }
.ownership-label { color: $brand-orange; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
.ownership-card p { margin: $space-1 0 $space-3; color: $ink-300; }
.ownership-tags { display: flex; flex-wrap: wrap; gap: $space-2; }
.advisor-tag { display: inline-flex; padding: 4px 10px; border-radius: 999px; background: $ink-1000; border: 1px solid rgba($ink-500, 0.16); color: $fg-dark; font-size: 0.78rem; }
.advisor-tag.muted { color: $ink-400; }
.detail-orders { display: flex; flex-direction: column; gap: $space-3; }
.order-card { padding: $space-4; border-radius: 14px; background: $ink-1000; border: 1px solid rgba($ink-500, 0.12); }
.order-header { display: flex; align-items: center; gap: $space-3; margin-bottom: $space-3; }
.order-id { color: $brand-orange; font-weight: 800; font-size: 0.78rem; }
.order-status { font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; background: rgba($ink-500, 0.18); color: $ink-300; }
.order-amount { margin-left: auto; color: $brand-orange; font-weight: 800; }
.order-body { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $space-3; }
.order-detail-item { display: flex; flex-direction: column; gap: 2px; }
.label { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (max-width: 980px) { .contactos-layout, .hero, .modal-grid { grid-template-columns: 1fr; display: grid; } .hero { align-items: start; } .hero-actions { align-items: flex-start; } .hero-kpi { align-items: flex-start; } }
</style>
