<script setup lang="ts">
/**
 * Crear o editar un aliado: cómo reconocer sus cajas en el manifiesto, cómo
 * sale su etiqueta (con vista previa en vivo) y si tiene tarifa propia.
 */
import { computed, reactive, ref, watch } from 'vue'
import AppOverlay from '@/components/ui/AppOverlay.vue'
import EtiquetaPaquete from '@/components/etiquetas/EtiquetaPaquete.vue'
import { formatoDesdeAliado } from '@/components/etiquetas/etiqueta-formatos'
import type { Aliado, AliadoForm } from '@/services/aliados.api'
import type { Warehouse } from '@/services/paquetes.api'

const props = defineProps<{
  open: boolean
  /** null = aliado nuevo. */
  aliado: Aliado | null
  tarifaBase: { fleteLb: number; arancelLb: number }
  guardando: boolean
}>()
const emit = defineEmits<{ close: []; guardar: [datos: AliadoForm, logo: File | null] }>()

const form = reactive({
  nombre: '',
  marca: '',
  coincidencias: '',
  pie1: '',
  pie2: '',
  pie3: '',
  lema: '',
  barrasAbajo: false,
  rotuloTracking: '',
  tarifaFleteLb: '',
  tarifaArancelLb: '',
  activo: true,
})
const logo = ref<File | null>(null)
const logoPreview = ref('')
const quitarLogo = ref(false)
const error = ref('')

watch(
  () => [props.open, props.aliado] as const,
  ([abierto, a]) => {
    if (!abierto) return
    form.nombre = a?.nombre ?? ''
    form.marca = a?.marca ?? ''
    form.coincidencias = (a?.coincidencias ?? []).join(', ')
    form.pie1 = a?.pie[0] ?? ''
    form.pie2 = a?.pie[1] ?? ''
    form.pie3 = a?.pie[2] ?? ''
    form.lema = a?.lema ?? ''
    form.barrasAbajo = a?.barrasAbajo ?? false
    form.rotuloTracking = a?.rotuloTracking ?? ''
    form.tarifaFleteLb = a?.tarifaFleteLb != null ? String(a.tarifaFleteLb) : ''
    form.tarifaArancelLb = a?.tarifaArancelLb != null ? String(a.tarifaArancelLb) : ''
    form.activo = a?.activo ?? true
    logo.value = null
    logoPreview.value = ''
    quitarLogo.value = false
    error.value = ''
  },
  { immediate: true },
)

function elegirLogo(e: Event) {
  const archivo = (e.target as HTMLInputElement).files?.[0] ?? null
  error.value = ''
  if (archivo && archivo.size > 1024 * 1024) {
    error.value = 'El logo pesa más de 1 MB. Usa una imagen más liviana.'
    return
  }
  logo.value = archivo
  quitarLogo.value = false
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = archivo ? URL.createObjectURL(archivo) : ''
}

const esPrincipal = computed(() => Boolean(props.aliado?.principal))
const logoActual = computed(() => (quitarLogo.value ? '' : logoPreview.value || props.aliado?.logoUrl || ''))

/** La etiqueta tal como saldría con lo que hay escrito ahora. */
const formatoPreview = computed(() =>
  formatoDesdeAliado({
    codigo: 'PREVIEW',
    nombre: form.nombre || 'Aliado',
    marca: (form.marca || form.nombre).toUpperCase(),
    logoUrl: logoActual.value,
    pie: [form.pie1, form.pie2, form.pie3].map((s) => s.trim()).filter(Boolean),
    lema: form.lema.trim(),
    barrasAbajo: form.barrasAbajo,
    rotuloTracking: form.rotuloTracking.trim().toUpperCase(),
    principal: esPrincipal.value,
  }),
)

const muestra: Warehouse = {
  _id: 'muestra',
  wr: 'WR889628',
  sh: '',
  mg: 'MG002516',
  trackingOriginal: '9302010623390241017175',
  pesoLb: 2.35,
  contenido: '1 cosmético',
  consigneeNombre: 'MARÍA PÉREZ',
  consigneeLimpio: 'MARÍA PÉREZ',
  fechaIngreso: new Date().toISOString(),
  origen: 'FLORIDA',
  agencia: '',
  ciudad: 'Guayaquil',
  direccion: 'Av. Principal 123',
  valorDeclarado: 0,
  reempaque: null,
  estado: 'importado',
  createdAt: new Date().toISOString(),
  masterClienteId: { _id: 'c', nombreOficial: 'MARÍA PÉREZ', codigoCasillero: 'CB1234' },
}

const precio = (v: string) => {
  const t = v.trim().replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN
}

function guardar() {
  error.value = ''
  if (!form.nombre.trim()) return void (error.value = 'Escribe el nombre del aliado.')
  const flete = precio(form.tarifaFleteLb)
  const arancel = precio(form.tarifaArancelLb)
  if (Number.isNaN(flete) || Number.isNaN(arancel)) {
    return void (error.value = 'Las tarifas van entre 0 y 100, o vacías para usar la base.')
  }
  const datos: AliadoForm = {
    nombre: form.nombre.trim(),
    marca: form.marca.trim(),
    coincidencias: form.coincidencias.split(',').map((s) => s.trim()).filter(Boolean),
    pie: [form.pie1, form.pie2, form.pie3].map((s) => s.trim()).filter(Boolean),
    lema: form.lema.trim(),
    barrasAbajo: form.barrasAbajo,
    rotuloTracking: form.rotuloTracking.trim(),
    tarifaFleteLb: flete,
    tarifaArancelLb: arancel,
    activo: esPrincipal.value ? true : form.activo,
  }
  if (quitarLogo.value) datos.logoUrl = ''
  emit('guardar', datos, logo.value)
}

const money = (n: number) => `$${n.toFixed(2)}`
</script>

<template>
  <AppOverlay :open="open" :label="aliado ? `Editar ${aliado.nombre}` : 'Nuevo aliado'" @close="emit('close')">
    <form class="ed" data-test="aliado-editor" @submit.prevent="guardar">
      <div class="ed__head">
        <div>
          <span class="eyebrow">{{ esPrincipal ? 'Marca principal' : 'Courier aliado' }}</span>
          <h3>{{ aliado ? aliado.nombre : 'Nuevo aliado' }}</h3>
        </div>
        <button type="button" class="close" aria-label="Cerrar" @click="emit('close')"><i class="fa-solid fa-xmark" aria-hidden="true" /></button>
      </div>

      <div class="ed__body">
        <div class="ed__campos">
          <fieldset>
            <legend>Datos</legend>
            <label class="f"><span>Nombre</span><input v-model="form.nombre" required maxlength="60" data-test="aliado-nombre" /></label>
            <label v-if="!esPrincipal" class="f">
              <span>Cómo aparece en la columna AGENCIA del manifiesto</span>
              <input v-model="form.coincidencias" placeholder="GRACIA, GRACIA BOX" data-test="aliado-coincidencias" />
              <small>Separados por coma. No importan mayúsculas, tildes ni espacios.</small>
            </label>
            <p v-else class="nota">Toda caja que no sea de un aliado sale con la etiqueta y la tarifa de Courier Box.</p>
            <label v-if="!esPrincipal" class="check"><input v-model="form.activo" type="checkbox" /> Activo</label>
          </fieldset>

          <fieldset>
            <legend>Tarifa por libra</legend>
            <div class="dos">
              <label class="f">
                <span>Flete (con IVA)</span>
                <input v-model="form.tarifaFleteLb" inputmode="decimal" :placeholder="`Base ${money(tarifaBase.fleteLb)}`" data-test="aliado-flete" />
              </label>
              <label class="f">
                <span>Arancel (sin IVA)</span>
                <input v-model="form.tarifaArancelLb" inputmode="decimal" :placeholder="`Base ${money(tarifaBase.arancelLb)}`" data-test="aliado-arancel" />
              </label>
            </div>
            <small>Vacío = usa la tarifa base. Se aplica a las facturas nuevas.</small>
          </fieldset>

          <fieldset>
            <legend>Etiqueta</legend>
            <div class="logo">
              <img v-if="logoActual" :src="logoActual" alt="" />
              <span v-else class="logo__vacio">{{ esPrincipal ? 'Logo de Courier Box' : 'Sin logo: va el nombre' }}</span>
              <div class="logo__acciones">
                <label class="btn ghost sm">
                  <i class="fa-solid fa-image" aria-hidden="true" /> {{ logoActual ? 'Cambiar logo' : 'Subir logo' }}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden data-test="aliado-logo" @change="elegirLogo" />
                </label>
                <button v-if="logoActual" type="button" class="link" @click="quitarLogo = true; logo = null">Quitar</button>
              </div>
            </div>
            <label class="f"><span>Nombre en el encabezado (sin logo)</span><input v-model="form.marca" maxlength="40" :placeholder="form.nombre.toUpperCase()" /></label>
            <div class="dos">
              <label class="f"><span>Pie, izquierda</span><input v-model="form.pie1" placeholder="Instagram: …" /></label>
              <label class="f"><span>Pie, derecha</span><input v-model="form.pie2" placeholder="WhatsApp: …" /></label>
            </div>
            <label class="f"><span>Lema</span><input v-model="form.lema" maxlength="80" placeholder="Del mundo a tu puerta" /></label>
            <div class="dos">
              <label class="f"><span>Rótulo del tracking</span><input v-model="form.rotuloTracking" maxlength="20" placeholder="TRACKING" /></label>
              <label class="check check--alto"><input v-model="form.barrasAbajo" type="checkbox" /> Segundo código de barras abajo</label>
            </div>
          </fieldset>
        </div>

        <aside class="ed__preview" aria-label="Vista previa de la etiqueta">
          <span class="muted">Así sale la etiqueta</span>
          <div class="escala"><EtiquetaPaquete :paquete="muestra" :formato="formatoPreview.id" :formatos="[formatoPreview]" /></div>
        </aside>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="ed__foot">
        <button type="button" class="btn ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn primary" :disabled="guardando" data-test="aliado-guardar">
          <i class="fa-solid" :class="guardando ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'" aria-hidden="true" /> Guardar
        </button>
      </div>
    </form>
  </AppOverlay>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.ed { background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; width: min(100%, 980px); display: flex; flex-direction: column; overflow: hidden; max-height: 94vh; }
.ed__head { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-4; padding: $space-5; border-bottom: 1px solid rgba($ink-500, 0.15);
  .eyebrow { display: block; color: $brand-orange; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
  h3 { margin: 0; font-size: 1.2rem; }
  .close { width: 34px; height: 34px; flex: 0 0 auto; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.2); background: rgba($ink-800, 0.8); color: $ink-300; cursor: pointer; &:hover { color: $fg-dark; } } }
.ed__body { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: $space-5; padding: $space-5; overflow-y: auto;
  @media (max-width: 820px) { grid-template-columns: 1fr; } }
.ed__campos { display: flex; flex-direction: column; gap: $space-4; min-width: 0; }
.ed__foot { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid rgba($ink-500, 0.15); }

fieldset { margin: 0; padding: $space-4; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-md; background: $ink-850; display: flex; flex-direction: column; gap: $space-3; min-width: 0;
  legend { padding: 0 $space-2; font-weight: 700; font-size: 0.82rem; color: $fg-dark; } }
.f { display: flex; flex-direction: column; gap: 4px; min-width: 0;
  span { color: $ink-300; font-size: 0.78rem; }
  input { min-height: 42px; padding: 0 $space-3; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.25); background: $ink-900; color: $fg-dark; font: inherit; width: 100%;
    &:focus { outline: none; border-color: rgba($brand-orange, 0.6); } } }
small, .nota { color: $ink-400; font-size: 0.76rem; margin: 0; }
.dos { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3; @media (max-width: 520px) { grid-template-columns: 1fr; } }
.check { display: inline-flex; align-items: center; gap: $space-2; color: $fg-dark; font-size: 0.86rem; cursor: pointer; min-height: 42px;
  input { width: 18px; height: 18px; accent-color: $brand-orange; }
  &--alto { align-self: end; } }
.logo { display: flex; align-items: center; gap: $space-4; flex-wrap: wrap;
  img { width: 120px; height: 56px; object-fit: contain; background: #fff; border-radius: $radius-sm; padding: 4px; }
  &__vacio { display: inline-flex; align-items: center; justify-content: center; width: 120px; height: 56px; border-radius: $radius-sm; border: 1px dashed rgba($ink-500, 0.4); color: $ink-400; font-size: 0.72rem; text-align: center; padding: 4px; }
  &__acciones { display: flex; align-items: center; gap: $space-3; .btn { cursor: pointer; } } }
.btn.sm { min-height: 36px; padding: 0 $space-3; font-size: 0.84rem; }

.ed__preview { display: flex; flex-direction: column; gap: $space-2; align-items: center; position: sticky; top: 0; align-self: start;
  .muted { color: $ink-400; font-size: 0.78rem; } }
// La etiqueta mide 102×152 mm; en pantalla se muestra a escala sin cambiar sus medidas.
.escala { width: calc(102mm * 0.62); height: calc(152mm * 0.62); overflow: hidden; border-radius: 4px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
  > :deep(.etq) { transform: scale(0.62); transform-origin: top left; } }
.error { margin: 0 $space-5 $space-3; color: #ff6b6b; font-size: 0.86rem; }
</style>
