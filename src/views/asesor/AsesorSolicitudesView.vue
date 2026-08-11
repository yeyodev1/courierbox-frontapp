<script setup lang="ts">
/**
 * Queue of self-service purchase requests submitted from the public site.
 * An advisor triages them here and converts the good ones into a real gestión.
 */
import { computed, onMounted, ref } from 'vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { solicitudesApi, type Solicitud } from '@/services/solicitudes.api'
import { useToastStore } from '@/stores/toast.store'
import { whatsappUrl } from '@/config/contact'

const toast = useToastStore()

const solicitudes = ref<Solicitud[]>([])
const loading = ref(true)
const filtro = ref<'' | Solicitud['estado']>('nueva')
const actualizando = ref<string | null>(null)
const expandida = ref<string | null>(null)

const filtros: Array<{ value: '' | Solicitud['estado']; label: string }> = [
  { value: 'nueva', label: 'Nuevas' },
  { value: 'contactada', label: 'Contactadas' },
  { value: 'convertida', label: 'Convertidas' },
  { value: 'descartada', label: 'Descartadas' },
  { value: '', label: 'Todas' },
]

const estadoLabels: Record<Solicitud['estado'], string> = {
  nueva: 'Nueva',
  contactada: 'Contactada',
  convertida: 'Convertida',
  descartada: 'Descartada',
}

const totalEstimado = computed(() =>
  solicitudes.value.reduce((sum, s) => sum + (Number(s.totalEstimado) || 0), 0),
)

async function cargar() {
  loading.value = true
  try {
    solicitudes.value = await solicitudesApi.listar(filtro.value || undefined)
  } catch (e: any) {
    toast.showNotification(e.message || 'No se pudieron cargar las solicitudes', 'error')
  } finally {
    loading.value = false
  }
}

async function seleccionar(value: '' | Solicitud['estado']) {
  if (value === filtro.value) return
  filtro.value = value
  await cargar()
}

async function cambiar(s: Solicitud, estado: Solicitud['estado']) {
  actualizando.value = s._id
  try {
    const actualizada = await solicitudesApi.cambiarEstado(s._id, estado)
    const i = solicitudes.value.findIndex((x) => x._id === s._id)
    // Drop it from the list when it no longer matches the active filter.
    if (filtro.value && actualizada.estado !== filtro.value) {
      if (i >= 0) solicitudes.value.splice(i, 1)
    } else if (i >= 0) {
      solicitudes.value.splice(i, 1, actualizada)
    }
    toast.showNotification(`Solicitud marcada como ${estadoLabels[estado].toLowerCase()}.`, 'success')
  } catch (e: any) {
    toast.showNotification(e.data?.error || e.message || 'No se pudo actualizar', 'error')
  } finally {
    actualizando.value = null
  }
}

function money(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`
}

function folio(id: string) {
  return id.slice(-8).toUpperCase()
}

function fecha(iso: string) {
  return new Date(iso).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
}

function contactar(s: Solicitud) {
  return whatsappUrl(
    `Hola ${s.clienteNombre}, soy de Courier Box. Recibimos tu solicitud #${folio(s._id)} por ${money(s.totalEstimado)}. Te confirmo disponibilidad.`,
  )
}

onMounted(cargar)
</script>

<template>
  <div class="sol">
    <header class="head">
      <div>
        <h1>Solicitudes de compra</h1>
        <p>Pedidos que los clientes enviaron desde la web. Contáctalos y conviértelos en gestión.</p>
      </div>
      <button type="button" class="btn ghost" :disabled="loading" @click="cargar">
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': loading }" aria-hidden="true" /> Actualizar
      </button>
    </header>

    <div class="toolbar">
      <div class="filtros">
        <button
          v-for="f in filtros"
          :key="f.value || 'todas'"
          type="button"
          :class="{ active: filtro === f.value }"
          :disabled="loading"
          @click="seleccionar(f.value)"
        >
          {{ f.label }}
        </button>
      </div>
      <span class="total">{{ solicitudes.length }} solicitud(es) · {{ money(totalEstimado) }} estimado</span>
    </div>

    <div v-if="loading" aria-busy="true">
      <AppSkeleton variant="card" height="96px" :count="4" gap="0.75rem" />
    </div>

    <p v-else-if="!solicitudes.length" class="empty">
      <i class="fa-solid fa-inbox" aria-hidden="true" />
      No hay solicitudes en este estado.
    </p>

    <ul v-else class="lista">
      <li v-for="s in solicitudes" :key="s._id" class="card">
        <div class="card__main">
          <div class="card__id">
            <strong>{{ s.clienteNombre }}</strong>
            <span class="muted">#{{ folio(s._id) }} · {{ fecha(s.createdAt) }}</span>
            <span class="muted">
              <template v-if="s.clienteEmail">{{ s.clienteEmail }}</template>
              <template v-if="s.clienteEmail && s.clienteTelefono"> · </template>
              <template v-if="s.clienteTelefono">{{ s.clienteTelefono }}</template>
            </span>
          </div>

          <div class="card__nums">
            <span class="muted">{{ s.items.length }} producto(s)</span>
            <strong>{{ money(s.totalEstimado) }}</strong>
            <span class="muted">comisión {{ money(s.comisionEstimada) }}</span>
          </div>

          <div class="card__actions">
            <span class="tag" :class="`is-${s.estado}`">{{ estadoLabels[s.estado] }}</span>
            <button type="button" class="link" @click="expandida = expandida === s._id ? null : s._id">
              {{ expandida === s._id ? 'Ocultar' : 'Ver links' }}
            </button>
            <a class="btn wa sm" :href="contactar(s)" target="_blank" rel="noopener">
              <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Contactar
            </a>
          </div>
        </div>

        <div v-if="expandida === s._id" class="card__detalle">
          <ul class="items">
            <li v-for="(it, i) in s.items" :key="i">
              <a :href="it.url" target="_blank" rel="noopener noreferrer">{{ it.titulo || it.url }}</a>
              <span class="muted">
                x{{ it.cantidad }} · {{ money(it.valorProducto) }}
                <template v-if="it.valorEnvio"> + {{ money(it.valorEnvio) }} envío</template>
              </span>
              <span v-if="it.notas" class="muted">{{ it.notas }}</span>
            </li>
          </ul>
          <p v-if="s.comisionDetalle" class="muted detalle">{{ s.comisionDetalle }}</p>

          <div class="estados">
            <button
              v-for="e in (['contactada', 'convertida', 'descartada'] as const)"
              :key="e"
              type="button"
              class="btn ghost sm"
              :disabled="actualizando === s._id || s.estado === e"
              @click="cambiar(s, e)"
            >
              Marcar {{ estadoLabels[e].toLowerCase() }}
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.sol { display: flex; flex-direction: column; gap: $space-5; }

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;

  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;
}

.filtros {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;

  button {
    min-height: 34px;
    padding: 0 $space-4;
    border-radius: $radius-pill;
    border: 1px solid rgba($ink-500, 0.25);
    background: transparent;
    color: $ink-300;
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;

    &.active { border-color: $brand-orange; background: rgba($brand-orange, 0.12); color: $brand-orange; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.total { color: $ink-400; font-size: 0.85rem; }

.lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2; }

.card {
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.18);
  background: $ink-900;
  overflow: hidden;
}

.card__main {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  flex-wrap: wrap;
}

.card__id { flex: 1 1 220px; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.card__nums { flex: 0 0 auto; display: flex; flex-direction: column; gap: 2px; text-align: right; }
.card__nums strong { color: $brand-orange; font-size: 1.1rem; font-variant-numeric: tabular-nums; }
.card__actions { flex: 0 0 auto; display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; }

.muted {
  color: $ink-400;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__detalle {
  border-top: 1px solid rgba($ink-500, 0.15);
  background: $ink-850;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;

  li { display: flex; flex-direction: column; gap: 1px; }
  a { color: $brand-orange; font-size: 0.85rem; word-break: break-all; }
}

.detalle { font-style: italic; }

.estados { display: flex; gap: $space-2; flex-wrap: wrap; }

.tag {
  padding: 3px $space-3;
  border-radius: $radius-pill;
  font-size: 0.72rem;
  font-weight: 700;

  &.is-nueva { background: rgba($brand-orange, 0.15); color: $brand-orange; }
  &.is-contactada { background: rgba($signal-blue, 0.15); color: $signal-blue; }
  &.is-convertida { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.is-descartada { background: rgba($ink-500, 0.25); color: $ink-400; }
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-10;
  margin: 0;
  color: $ink-500;
}

.link {
  background: none;
  border: none;
  padding: 0;
  color: $brand-orange;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  min-height: 40px;
  padding: 0 $space-4;
  border-radius: $radius-md;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.sm { min-height: 34px; font-size: 0.8rem; }
  &.ghost { background: rgba($ink-700, 0.8); border-color: rgba($ink-500, 0.25); color: $ink-200; }
  &.wa { background: rgba(37, 211, 102, 0.14); border-color: rgba(37, 211, 102, 0.4); color: #4ce08a; }
}
</style>
