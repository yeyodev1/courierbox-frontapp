<template>
  <div class="motos">
    <header class="head">
      <div>
        <h1>Motorizados</h1>
        <p>Agrega o quita repartidores. Cada uno entra con su usuario y ve solo sus entregas.</p>
      </div>
      <button class="btn primary" @click="openCreate"><i class="fa-solid fa-plus" aria-hidden="true" /> Nuevo motorizado</button>
    </header>

    <div v-if="loading" class="skeletons"><div v-for="i in 3" :key="i" class="sk" /></div>

    <template v-else>
      <p v-if="!motorizados.length" class="empty">Aún no hay motorizados. Crea el primero.</p>
      <div v-else class="grid">
        <article v-for="m in motorizados" :key="m._id" class="card">
          <div class="card-main">
            <span class="avatar">{{ initials(m.name) }}</span>
            <div>
              <strong>{{ m.name }}</strong>
              <span>{{ m.email }}</span>
            </div>
          </div>
          <button class="btn danger ghost" @click="askDelete(m)"><i class="fa-solid fa-trash-can" aria-hidden="true" /></button>
        </article>
      </div>
    </template>

    <!-- Create modal -->
    <transition name="modal">
      <div v-if="showCreate" class="overlay" @click.self="showCreate = false">
        <div class="card-modal">
          <div class="cm-head">
            <h3>Nuevo motorizado</h3>
            <button class="close" @click="showCreate = false"><i class="fa-solid fa-xmark" /></button>
          </div>
          <div class="form">
            <div class="row">
              <div class="fg">
                <label>Nombre</label>
                <input v-model="form.nombre" placeholder="Ej. Luis" />
              </div>
              <div class="fg">
                <label>Apellido</label>
                <input v-model="form.apellido" placeholder="Ej. Pérez" />
              </div>
            </div>
            <div class="fg">
              <label>Correo</label>
              <input v-model="form.email" type="email" placeholder="motorizado@correo.com" />
            </div>
            <div class="fg">
              <label>Contraseña <span class="opt">(opcional)</span></label>
              <input v-model="form.password" placeholder="Vacío = se genera automática" />
            </div>
            <label class="check">
              <input type="checkbox" v-model="form.sendEmail" />
              <span>Enviar credenciales por correo</span>
            </label>
            <p v-if="error" class="err">{{ error }}</p>
            <p v-if="generatedPassword" class="ok">Contraseña generada: <strong>{{ generatedPassword }}</strong> (cópiala, no se vuelve a mostrar)</p>
          </div>
          <div class="cm-foot">
            <button class="btn ghost" @click="showCreate = false">Cancelar</button>
            <button class="btn primary" :disabled="saving" @click="create">{{ saving ? 'Creando...' : 'Crear' }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Delete modal -->
    <transition name="modal">
      <div v-if="toDelete" class="overlay" @click.self="toDelete = null">
        <div class="card-modal small">
          <div class="del-icon"><i class="fa-solid fa-triangle-exclamation" /></div>
          <h3>¿Eliminar motorizado?</h3>
          <p>Se quitará <strong>{{ toDelete.name }}</strong>. Sus entregas ya realizadas se conservan.</p>
          <div class="cm-foot center">
            <button class="btn ghost" @click="toDelete = null">Cancelar</button>
            <button class="btn danger" :disabled="saving" @click="confirmDelete">{{ saving ? 'Eliminando...' : 'Eliminar' }}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { enviosApi, type Motorizado } from '@/services/envios.api'
import { useToastStore } from '@/stores/toast.store'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const motorizados = ref<Motorizado[]>([])
const showCreate = ref(false)
const toDelete = ref<Motorizado | null>(null)
const error = ref('')
const generatedPassword = ref('')
const form = ref({ nombre: '', apellido: '', email: '', password: '', sendEmail: true })

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function openCreate() {
  form.value = { nombre: '', apellido: '', email: '', password: '', sendEmail: true }
  error.value = ''
  generatedPassword.value = ''
  showCreate.value = true
}

async function load() {
  loading.value = true
  try {
    const res = await enviosApi.listMotorizados()
    motorizados.value = res.motorizados
  } finally {
    loading.value = false
  }
}

async function create() {
  const name = `${form.value.nombre.trim()} ${form.value.apellido.trim()}`.trim()
  if (!name || !form.value.email.trim()) {
    error.value = 'Nombre y correo son obligatorios'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const res = await enviosApi.createMotorizado({
      name,
      email: form.value.email.trim(),
      password: form.value.password || undefined,
      sendEmail: form.value.sendEmail,
      loginUrl: `${window.location.origin}/login`,
    })
    toast.showNotification('Motorizado creado', 'success')
    if (res.password) generatedPassword.value = res.password
    await load()
    if (!res.password) showCreate.value = false
  } catch (e: any) {
    error.value = e?.message ?? 'No se pudo crear'
  } finally {
    saving.value = false
  }
}

function askDelete(m: Motorizado) {
  toDelete.value = m
}

async function confirmDelete() {
  if (!toDelete.value) return
  saving.value = true
  try {
    await enviosApi.deleteMotorizado(toDelete.value._id)
    toast.showNotification('Motorizado eliminado', 'success')
    toDelete.value = null
    await load()
  } catch (e: any) {
    toast.showNotification(e?.message ?? 'No se pudo eliminar', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.motos { display: flex; flex-direction: column; gap: $space-5; }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: $space-4; flex-wrap: wrap; }
.head h1 { margin: 0 0 4px; color: $fg-dark; font-size: 1.5rem; }
.head p { margin: 0; color: $ink-300; }
.grid { display: flex; flex-direction: column; gap: $space-3; }
.card {
  display: flex; align-items: center; justify-content: space-between; gap: $space-3;
  background: $ink-900; border: 1px solid $ink-700; border-radius: 14px; padding: $space-4;
}
.card-main { display: flex; align-items: center; gap: $space-3; }
.avatar {
  width: 42px; height: 42px; border-radius: 50%; background: $brand-orange; color: $ink-1000;
  display: flex; align-items: center; justify-content: center; font-weight: 800;
}
.card-main strong { display: block; color: $fg-dark; }
.card-main span { color: $ink-400; font-size: 0.82rem; }
.empty { color: $ink-400; text-align: center; padding: $space-6 0; }
.skeletons { display: flex; flex-direction: column; gap: $space-3; }
.sk { height: 74px; border-radius: 14px; background: $ink-800; animation: pulse 1.4s infinite; }

.btn { display: inline-flex; align-items: center; gap: $space-2; border-radius: 12px; padding: $space-3 $space-4; font-weight: 700; cursor: pointer; border: 1px solid transparent; }
.btn.primary { background: $brand-orange; color: $ink-1000; &:disabled { opacity: 0.5; cursor: not-allowed; } }
.btn.ghost { background: transparent; border-color: rgba($ink-500, 0.5); color: $ink-300; }
.btn.danger { background: rgba($signal-red, 0.14); color: $signal-red; border-color: rgba($signal-red, 0.4); }
.btn.danger.ghost { background: transparent; }

.overlay { position: fixed; inset: 0; z-index: 120; background: rgba($ink-1000, 0.82); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: $space-4; }
.card-modal { width: min(520px, 100%); background: $ink-900; border: 1px solid $ink-700; border-radius: 20px; padding: $space-5; display: flex; flex-direction: column; gap: $space-4; }
.card-modal.small { max-width: 420px; text-align: center; align-items: center; }
.cm-head { display: flex; align-items: center; justify-content: space-between; }
.cm-head h3 { margin: 0; color: $fg-dark; }
.close { background: transparent; border: 1px solid $ink-600; color: $ink-300; border-radius: 10px; width: 34px; height: 34px; cursor: pointer; }
.form { display: flex; flex-direction: column; gap: $space-3; }
.row { display: flex; gap: $space-3; }
.fg { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.fg label { color: $ink-300; font-size: 0.82rem; font-weight: 600; }
.fg .opt { color: $ink-500; font-weight: 400; }
.fg input {
  background: $ink-1000; border: 1px solid $ink-500; border-radius: 10px; color: $fg-dark;
  padding: $space-3; font-family: inherit; outline: none;
  &:focus { border-color: $brand-orange; }
}
.check { display: flex; align-items: center; gap: $space-2; color: $ink-300; font-size: 0.88rem; }
.err { color: $signal-red; font-size: 0.85rem; margin: 0; }
.ok { color: $signal-green; font-size: 0.85rem; margin: 0; strong { color: $fg-dark; } }
.cm-foot { display: flex; justify-content: flex-end; gap: $space-3; }
.cm-foot.center { justify-content: center; }
.del-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba($signal-red, 0.14); color: $signal-red; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.card-modal.small h3 { margin: 0; color: $fg-dark; }
.card-modal.small p { margin: 0; color: $ink-300; strong { color: $fg-dark; } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .card-modal, .modal-leave-active .card-modal { transition: transform 0.24s ease; }
.modal-enter-from .card-modal, .modal-leave-to .card-modal { transform: translateY(18px) scale(0.96); }

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (max-width: 640px) { .row { flex-direction: column; } }
</style>
