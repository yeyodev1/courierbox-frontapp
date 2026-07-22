<template>
  <div class="entregas">
    <div class="tabs">
      <button :class="{ active: tab === 'pendientes' }" @click="tab = 'pendientes'">
        Por entregar <span class="count">{{ pendientes.length }}</span>
      </button>
      <button :class="{ active: tab === 'entregadas' }" @click="tab = 'entregadas'">
        Entregadas <span class="count">{{ entregadas.length }}</span>
      </button>
    </div>

    <div v-if="loading" class="skeletons">
      <div v-for="i in 3" :key="i" class="sk-card" />
    </div>

    <template v-else>
      <p v-if="!visibles.length" class="empty">
        <i class="fa-regular fa-face-smile" aria-hidden="true" />
        {{ tab === 'pendientes' ? 'No tienes entregas pendientes.' : 'Aún no has entregado nada hoy.' }}
      </p>

      <div class="list">
        <article
          v-for="e in visibles"
          :key="e._id"
          class="card"
          :class="`estado-${e.estado}`"
          @click="abrir(e._id)"
        >
          <div class="card-head">
            <strong>{{ e.clienteNombre }}</strong>
            <span class="badge" :class="`estado-${e.estado}`">{{ estadoLabel(e.estado) }}</span>
          </div>
          <p class="dir"><i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ e.clienteDireccion }}</p>
          <div class="card-foot">
            <span v-if="e.clienteTelefono"><i class="fa-solid fa-phone" aria-hidden="true" /> {{ e.clienteTelefono }}</span>
            <span class="valor">${{ (e.valorCobrado || 0).toFixed(2) }}</span>
          </div>
        </article>
      </div>
    </template>

    <button class="refresh" @click="load" :disabled="loading">
      <i class="fa-solid fa-rotate" :class="{ 'fa-spin': loading }" aria-hidden="true" /> Actualizar
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { enviosApi, type EnvioDomicilio } from '@/services/envios.api'

const router = useRouter()
const loading = ref(true)
const envios = ref<EnvioDomicilio[]>([])
const tab = ref<'pendientes' | 'entregadas'>('pendientes')

const pendientes = computed(() => envios.value.filter((e) => e.estado !== 'entregado'))
const entregadas = computed(() => envios.value.filter((e) => e.estado === 'entregado'))
const visibles = computed(() => (tab.value === 'pendientes' ? pendientes.value : entregadas.value))

function estadoLabel(estado: string) {
  return {
    pendiente: 'Pendiente',
    asignado: 'Asignado',
    en_ruta: 'En ruta',
    entregado: 'Entregado',
    fallido: 'Fallido',
  }[estado] ?? estado
}

function abrir(id: string) {
  router.push(`/motorizado/entregas/${id}`)
}

async function load() {
  loading.value = true
  try {
    const res = await enviosApi.list({ limit: 200 })
    envios.value = res.envios
  } catch {
    envios.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.entregas { display: flex; flex-direction: column; gap: $space-4; }
.tabs { display: flex; gap: $space-2; }
.tabs button {
  flex: 1; padding: $space-3; border-radius: 12px; cursor: pointer;
  background: $ink-900; border: 1px solid $ink-700; color: $ink-300; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: $space-2;
  &.active { border-color: $brand-orange; color: $brand-orange; background: rgba($brand-orange, 0.08); }
}
.count {
  min-width: 22px; padding: 0 6px; border-radius: 999px; background: $ink-700;
  color: $fg-dark; font-size: 0.72rem; line-height: 20px;
}
.list { display: flex; flex-direction: column; gap: $space-3; }
.card {
  background: $ink-900; border: 1px solid $ink-700; border-left: 4px solid $ink-500;
  border-radius: 14px; padding: $space-4; cursor: pointer; transition: transform 0.12s, border-color 0.12s;
  &:active { transform: scale(0.99); }
  &.estado-entregado { border-left-color: $signal-green; opacity: 0.85; }
  &.estado-en_ruta { border-left-color: $brand-orange; }
  &.estado-asignado { border-left-color: #7fa3ff; }
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: $space-2; margin-bottom: $space-2; }
.card-head strong { color: $fg-dark; font-size: 1rem; }
.dir { margin: 0 0 $space-3; color: $ink-300; font-size: 0.88rem; line-height: 1.4; }
.card-foot { display: flex; align-items: center; justify-content: space-between; color: $ink-400; font-size: 0.82rem; }
.valor { color: $brand-orange; font-weight: 800; font-size: 0.95rem; }
.badge { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: $ink-700; color: $ink-300; }
.badge.estado-entregado { background: rgba(43,187,146,0.15); color: $signal-green; }
.badge.estado-en_ruta { background: rgba(240,138,31,0.16); color: $brand-orange; }
.badge.estado-asignado { background: rgba(84,132,255,0.16); color: #7fa3ff; }
.empty { text-align: center; color: $ink-400; padding: $space-6 0; display: flex; flex-direction: column; gap: $space-2; align-items: center; }
.empty i { font-size: 1.6rem; color: $ink-500; }
.skeletons { display: flex; flex-direction: column; gap: $space-3; }
.sk-card { height: 96px; border-radius: 14px; background: $ink-800; animation: pulse 1.4s infinite; }
.refresh {
  align-self: center; margin-top: $space-2;
  background: transparent; border: 1px solid $ink-700; color: $ink-300;
  border-radius: 10px; padding: $space-2 $space-4; cursor: pointer;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
</style>
