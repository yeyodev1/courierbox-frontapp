<script setup lang="ts">
/**
 * Creation form for a last-mile delivery.
 *
 * A local delivery is our own motorizado dropping a package off in the city, so
 * it only needs the client, the address and what we charge. Provider and cost
 * fields belong to the interprovincial mode alone, and delivery evidence is
 * captured later by the motorizado — never here.
 */
import { computed, ref } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import AppMargenLive from '@/components/ui/AppMargenLive.vue'
import { enviosApi, type Motorizado, type PaqueteSimple } from '@/services/envios.api'
import type { Proveedor } from '@/services/proveedores.api'
import { useToastStore } from '@/stores/toast.store'
import { formatDate } from './useEnvios'

const props = defineProps<{ open: boolean; motorizados: Motorizado[]; proveedores: Proveedor[] }>()
const emit = defineEmits<{ close: []; created: []; 'create-proveedor': [] }>()

const toastStore = useToastStore()

function emptyForm() {
  return {
    modo: 'local' as 'local' | 'interprovincial',
    paqueteId: '',
    paqueteLabel: '',
    clienteNombre: '',
    clienteDireccion: '',
    clienteTelefono: '',
    clienteEmail: '',
    asignadoA: '',
    numeroInvoice: '',
    ciudadDestino: '',
    proveedorUtilizado: '',
    valorCobrado: 0,
    valorPagadoProveedor: 0,
    notas: '',
  }
}

const form = ref(emptyForm())
const guiaArchivo = ref<File | null>(null)
const saving = ref(false)

const searchQuery = ref('')
const searching = ref(false)
const searchResults = ref<PaqueteSimple[]>([])

const clientResults = ref<{ clientName: string; clientEmail?: string; clientPhone?: string; lastOrderDate: string }[]>([])

/** Only an interprovincial delivery pays a provider; a local one costs us nothing up front. */
const costoRuta = computed(() =>
  form.value.modo === 'interprovincial' ? Number(form.value.valorPagadoProveedor) || 0 : 0,
)

const canSubmit = computed(() => !!form.value.clienteNombre && !!form.value.clienteDireccion && !saving.value)

defineExpose({
  reset() {
    form.value = emptyForm()
    guiaArchivo.value = null
    searchResults.value = []
    clientResults.value = []
    searchQuery.value = ''
  },
  preselectProveedor(nombre: string) {
    form.value.proveedorUtilizado = nombre
  },
})

function setGuia(event: Event) {
  guiaArchivo.value = (event.target as HTMLInputElement | null)?.files?.[0] || null
}

async function searchPaquetes() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  try {
    const data = await enviosApi.buscarPaquetes(searchQuery.value.trim())
    searchResults.value = data.paquetes
  } catch {
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function selectPaquete(p: PaqueteSimple) {
  form.value.paqueteId = p._id
  form.value.paqueteLabel = `${p.wr || p.sh || p.trackingOriginal}`
  searchResults.value = []
  searchQuery.value = ''
}

async function searchClient() {
  const q = form.value.clienteNombre.trim()
  if (q.length < 2) {
    clientResults.value = []
    return
  }
  try {
    const data = await enviosApi.buscarClientes(q)
    clientResults.value = data.clientes
  } catch {
    clientResults.value = []
  }
}

function selectClient(c: { clientName: string; clientEmail?: string; clientPhone?: string }) {
  form.value.clienteNombre = c.clientName
  form.value.clienteTelefono = c.clientPhone || form.value.clienteTelefono
  form.value.clienteEmail = c.clientEmail || form.value.clienteEmail
  clientResults.value = []
}

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const created = await enviosApi.create({
      modo: form.value.modo,
      paqueteId: form.value.paqueteId || undefined,
      clienteNombre: form.value.clienteNombre,
      clienteDireccion: form.value.clienteDireccion,
      clienteTelefono: form.value.clienteTelefono || undefined,
      clienteEmail: form.value.clienteEmail || undefined,
      asignadoA: form.value.asignadoA || undefined,
      numeroInvoice: form.value.numeroInvoice || undefined,
      ciudadDestino: form.value.ciudadDestino || undefined,
      proveedorUtilizado: form.value.proveedorUtilizado || undefined,
      valorCobrado: form.value.valorCobrado,
      valorPagadoProveedor: form.value.modo === 'interprovincial' ? form.value.valorPagadoProveedor : 0,
      notas: form.value.notas,
    })

    const envioId = created.envio?._id
    if (envioId && guiaArchivo.value) await enviosApi.uploadArchivo(envioId, 'guia', guiaArchivo.value)
    emit('created')
  } catch (error) {
    toastStore.showNotification((error as Error)?.message || 'Error al crear el envío', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppOverlay :open="props.open" label="Envío a domicilio" @close="emit('close')">
    <div class="modal-card wide">
      <div class="modal-icon-box info"><i class="fa-solid fa-truck" /></div>
      <h3>Nuevo envío</h3>

      <div class="modal-body">
        <section>
          <h4>Tipo de envío</h4>
          <select v-model="form.modo" class="field-input">
            <option value="local">Local — entrega en la ciudad</option>
            <option value="interprovincial">Interprovincial — vía proveedor</option>
          </select>
        </section>

        <section>
          <h4>Paquete <span class="badge badge-gray">opcional</span></h4>
          <div class="paquete-search">
            <input v-model="searchQuery" class="field-input" placeholder="Buscar por WR, SH o tracking..." @keyup.enter="searchPaquetes" />
            <button class="btn-sm" :disabled="searching" @click="searchPaquetes"><i class="fa-solid fa-search" /></button>
          </div>
          <div v-if="searchResults.length" class="search-results">
            <button v-for="p in searchResults" :key="p._id" class="search-item" @click="selectPaquete(p)">
              {{ p.wr || p.sh || p.trackingOriginal }} — {{ p.contenido?.slice(0, 40) }}
            </button>
          </div>
          <div v-if="form.paqueteLabel" class="selected-paquete"><i class="fa-solid fa-box" /> {{ form.paqueteLabel }}</div>
        </section>

        <section>
          <h4>Cliente <span class="badge badge-blue">búsqueda inteligente</span></h4>
          <div class="client-search-wrapper">
            <input
              v-model="form.clienteNombre"
              class="field-input"
              placeholder="Nombre del cliente *"
              @input="searchClient"
              @focus="form.clienteNombre.length >= 2 && searchClient()"
            />
            <div v-if="clientResults.length && form.clienteNombre.length >= 2" class="client-suggestions">
              <button
                v-for="c in clientResults"
                :key="c.clientName + (c.clientEmail || '')"
                class="client-suggestion"
                @click="selectClient(c)"
              >
                <strong>{{ c.clientName }}</strong>
                <span v-if="c.clientEmail || c.clientPhone" class="suggestion-contact">
                  {{ c.clientEmail }} {{ c.clientPhone ? '· ' + c.clientPhone : '' }}
                </span>
                <span class="suggestion-meta">Última orden: {{ formatDate(c.lastOrderDate) }}</span>
              </button>
            </div>
          </div>
          <div class="field-row">
            <input v-model="form.clienteDireccion" class="field-input" placeholder="Dirección *" />
            <input v-model="form.clienteTelefono" class="field-input" placeholder="Teléfono" />
          </div>
          <div class="field-row">
            <input v-model="form.clienteEmail" type="email" class="field-input" placeholder="Email (para la notificación de entrega)" />
          </div>
        </section>

        <section>
          <h4>Cobro del envío</h4>
          <input v-model.number="form.valorCobrado" type="number" min="0" step="0.01" class="field-input cost" placeholder="Valor cobrado al cliente $" />
        </section>

        <section v-if="form.modo === 'interprovincial'">
          <h4>Interprovincial <span class="badge badge-orange">proveedor y costo</span></h4>
          <div class="field-row">
            <input v-model="form.numeroInvoice" class="field-input" placeholder="Número de invoice" />
            <input v-model="form.ciudadDestino" class="field-input" placeholder="Ciudad destino" />
          </div>
          <div class="field-row prov-row">
            <select v-model="form.proveedorUtilizado" class="field-input">
              <option value="">Seleccionar proveedor...</option>
              <option v-for="p in props.proveedores" :key="p._id" :value="p.nombre">
                {{ p.nombre }}{{ p.ciudad ? ` (${p.ciudad})` : '' }}{{ p.tipo ? ` — ${p.tipo}` : '' }}
              </option>
            </select>
            <button class="btn-add-prov" type="button" title="Agregar nuevo proveedor" @click="emit('create-proveedor')">
              <i class="fa-solid fa-plus" />
            </button>
          </div>
          <div class="field-row">
            <input v-model.number="form.valorPagadoProveedor" type="number" min="0" step="0.01" class="field-input cost" placeholder="Costo del proveedor $" />
            <input type="file" class="field-input" @change="setGuia" />
          </div>
        </section>

        <section>
          <h4>Asignar a motorizado <span class="badge badge-gray">opcional</span></h4>
          <select v-model="form.asignadoA" class="field-input">
            <option value="">Sin asignar — queda pendiente</option>
            <option v-for="m in props.motorizados" :key="m._id" :value="m._id">{{ m.name || m.email }}</option>
          </select>
        </section>

        <textarea v-model="form.notas" class="field-input" rows="2" placeholder="Notas adicionales..." />
      </div>

      <AppMargenLive :cobrado="form.valorCobrado" :costo="costoRuta" />

      <div class="modal-actions">
        <button class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn-primary" :disabled="!canSubmit" @click="submit">
          <i class="fa-solid fa-plus" /> {{ saving ? 'Creando...' : 'Crear envío' }}
        </button>
      </div>
    </div>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './envios-ui' as ui;

@include ui.modal-card;
@include ui.fields;
@include ui.badges;
@include ui.buttons;

.client-search-wrapper { position: relative; }

.client-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: $ink-800;
  border: 1px solid rgba($ink-500, 0.2);
  border-radius: 10px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.client-suggestion {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-2 $space-3;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba($ink-500, 0.06);
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba($brand-orange, 0.08); }
  strong { font-size: 0.9rem; }
}

.suggestion-contact { font-size: 0.75rem; color: $ink-400; }
.suggestion-meta { font-size: 0.7rem; color: $ink-500; }

.prov-row { display: flex; gap: $space-2; align-items: center; }

.btn-add-prov {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($brand-orange, 0.1);
  border: 1px solid rgba($brand-orange, 0.2);
  border-radius: 10px;
  color: $brand-orange;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover { background: rgba($brand-orange, 0.2); }
}

.paquete-search { display: flex; gap: $space-2; }

.search-results { display: flex; flex-direction: column; gap: 2px; max-height: 150px; overflow-y: auto; margin-top: $space-2; }

.search-item {
  width: 100%;
  padding: $space-2;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.1);
  border-radius: 8px;
  color: $fg-dark;
  font-family: inherit;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;

  &:hover { background: rgba($brand-orange, 0.08); }
}

.selected-paquete {
  margin-top: $space-2;
  padding: $space-2;
  background: rgba($brand-orange, 0.08);
  border-radius: 8px;
  font-size: 0.85rem;
  color: $brand-orange;

  i { margin-right: $space-1; }
}
</style>
