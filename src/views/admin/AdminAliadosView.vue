<script setup lang="ts">
/**
 * Aliados y tarifas: la tarifa base por libra de Courier Box y el catálogo de
 * couriers aliados, cada uno con su etiqueta 4×6 y, si aplica, precio propio.
 * Todo editable sin despliegues.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import AliadoEditorModal from './Aliados/AliadoEditorModal.vue'
import { aliadosApi, type Aliado, type AliadoForm } from '@/services/aliados.api'
import { facturacionApi } from '@/services/facturacion.api'
import { refrescarFormatosEtiqueta } from '@/components/etiquetas/useFormatosEtiqueta'
import { useToastStore } from '@/stores/toast.store'
import logoMark from '@/assets/logo/courierbox-mark.png'

const toast = useToastStore()
const aliados = ref<Aliado[]>([])
const cargando = ref(true)
const errorCarga = ref('')

const base = reactive({ fleteLb: 6.5, arancelLb: 1.99, ivaPorcentaje: 15 })
const baseForm = reactive({ fleteLb: '', arancelLb: '' })
const guardandoBase = ref(false)

const editor = reactive<{ open: boolean; aliado: Aliado | null }>({ open: false, aliado: null })
const guardando = ref(false)

const errorDe = (e: any, fallback: string) => e?.data?.error || e?.response?.data?.error || e?.message || fallback
const money = (n: number) => `$${n.toFixed(2)}`

async function cargar() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const [lista, conf] = await Promise.all([aliadosApi.listar(), facturacionApi.configuracion()])
    aliados.value = lista
    refrescarFormatosEtiqueta(lista)
    Object.assign(base, { fleteLb: conf.tarifas.fleteLb, arancelLb: conf.tarifas.arancelLb, ivaPorcentaje: conf.ivaPorcentaje })
    baseForm.fleteLb = String(conf.tarifas.fleteLb)
    baseForm.arancelLb = String(conf.tarifas.arancelLb)
  } catch (e) {
    errorCarga.value = errorDe(e, 'No se pudieron cargar los aliados.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const baseCambio = computed(
  () => Number(baseForm.fleteLb.replace(',', '.')) !== base.fleteLb || Number(baseForm.arancelLb.replace(',', '.')) !== base.arancelLb,
)

async function guardarBase() {
  const flete = Number(baseForm.fleteLb.replace(',', '.'))
  const arancel = Number(baseForm.arancelLb.replace(',', '.'))
  if (![flete, arancel].every((n) => Number.isFinite(n) && n >= 0 && n <= 100) || !baseForm.fleteLb.trim() || !baseForm.arancelLb.trim()) {
    toast.showNotification('Las tarifas van entre 0 y 100.', 'error')
    return
  }
  guardandoBase.value = true
  try {
    const r = await facturacionApi.guardarTarifasBase({ fleteLb: flete, arancelLb: arancel })
    Object.assign(base, { fleteLb: r.tarifas.fleteLb, arancelLb: r.tarifas.arancelLb })
    toast.showNotification('Tarifa base actualizada. Aplica a las próximas facturas.', 'success')
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo guardar la tarifa.'), 'error')
  } finally {
    guardandoBase.value = false
  }
}

function abrir(a: Aliado | null) {
  editor.aliado = a
  editor.open = true
}

async function guardar(datos: AliadoForm, logo: File | null) {
  guardando.value = true
  try {
    let a = editor.aliado ? await aliadosApi.actualizar(editor.aliado._id, datos) : await aliadosApi.crear(datos)
    if (logo) {
      try {
        a = await aliadosApi.subirLogo(a._id, logo)
      } catch (e) {
        toast.showNotification(errorDe(e, 'Se guardó el aliado, pero no el logo.'), 'error')
      }
    }
    const i = aliados.value.findIndex((x) => x._id === a._id)
    if (i >= 0) aliados.value.splice(i, 1, a)
    else aliados.value.push(a)
    refrescarFormatosEtiqueta(aliados.value)
    editor.open = false
    toast.showNotification(`${a.nombre} guardado.`, 'success')
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo guardar el aliado.'), 'error')
  } finally {
    guardando.value = false
  }
}

const tarifaTexto = (a: Aliado) => {
  if (a.tarifaFleteLb == null && a.tarifaArancelLb == null) return 'Tarifa base'
  return `${money(a.tarifaFleteLb ?? base.fleteLb)} + ${money(a.tarifaArancelLb ?? base.arancelLb)} /lb`
}
</script>

<template>
  <div class="al">
    <header class="head">
      <div>
        <h1>Aliados y tarifas</h1>
        <p>La tarifa por libra de Courier Box y los couriers aliados: cómo se reconocen en el manifiesto, cómo sale su etiqueta y si tienen precio especial.</p>
      </div>
      <button type="button" class="btn primary" data-test="nuevo-aliado" @click="abrir(null)">
        <i class="fa-solid fa-plus" aria-hidden="true" /> Nuevo aliado
      </button>
    </header>

    <section class="panel base" aria-labelledby="base-titulo">
      <div class="base__txt">
        <h2 id="base-titulo">Tarifa base por libra</h2>
        <p>Para toda caja que no sea de un aliado con precio propio. El IVA ({{ base.ivaPorcentaje }} %) se cambia en Facturación y sólo grava el flete.</p>
      </div>
      <form class="base__form" @submit.prevent="guardarBase">
        <label class="f"><span>Flete</span><div class="money"><i>$</i><input v-model="baseForm.fleteLb" inputmode="decimal" data-test="base-flete" /></div></label>
        <label class="f"><span>Arancel</span><div class="money"><i>$</i><input v-model="baseForm.arancelLb" inputmode="decimal" data-test="base-arancel" /></div></label>
        <button type="submit" class="btn primary" :disabled="!baseCambio || guardandoBase" data-test="base-guardar">
          <i class="fa-solid" :class="guardandoBase ? 'fa-circle-notch fa-spin' : 'fa-floppy-disk'" aria-hidden="true" /> Guardar
        </button>
      </form>
    </section>

    <section class="panel">
      <p v-if="cargando" class="muted">Cargando aliados…</p>
      <p v-else-if="errorCarga" class="error" role="alert">{{ errorCarga }} <button type="button" class="link" @click="cargar">Reintentar</button></p>
      <ul v-else class="lista">
        <li v-for="a in aliados" :key="a._id" :class="{ inactivo: !a.activo }" :data-test="`aliado-${a.codigo}`">
          <div class="lista__logo">
            <img v-if="a.logoUrl" :src="a.logoUrl" :alt="a.nombre" />
            <img v-else-if="a.principal" :src="logoMark" :alt="a.nombre" />
            <span v-else>{{ a.marca }}</span>
          </div>
          <div class="lista__txt">
            <strong>{{ a.nombre }} <em v-if="a.principal" class="pill">Principal</em><em v-else-if="!a.activo" class="pill pill--off">Inactivo</em></strong>
            <span class="muted">{{ a.principal ? 'Toda caja sin aliado' : `Agencia: ${a.coincidencias.join(', ') || '—'}` }}</span>
          </div>
          <span class="lista__tarifa" :class="{ especial: a.tarifaFleteLb != null || a.tarifaArancelLb != null }">{{ tarifaTexto(a) }}</span>
          <button type="button" class="btn ghost sm" :data-test="`editar-${a.codigo}`" @click="abrir(a)">
            <i class="fa-solid fa-pen" aria-hidden="true" /> Editar
          </button>
        </li>
      </ul>
    </section>

    <AliadoEditorModal
      :open="editor.open"
      :aliado="editor.aliado"
      :tarifa-base="base"
      :guardando="guardando"
      @close="editor.open = false"
      @guardar="guardar"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.al { display: flex; flex-direction: column; gap: $space-5; min-width: 0; max-width: 100%; }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: $space-4; flex-wrap: wrap;
  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 64ch; } }
.panel { display: flex; flex-direction: column; gap: $space-4; padding: $space-5; background: $ink-900; border: 1px solid rgba($ink-500, 0.15); border-radius: $radius-lg; min-width: 0;
  @media (max-width: 640px) { padding: $space-4; } }
.muted { color: $ink-400; font-size: 0.84rem; }
.error { color: #ff6b6b; margin: 0; }
.btn.sm { min-height: 36px; padding: 0 $space-3; font-size: 0.84rem; }

.base { flex-direction: row; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
  h2 { margin: 0 0 4px; font-size: 1.05rem; }
  p { margin: 0; color: $ink-400; font-size: 0.84rem; max-width: 52ch; }
  &__form { display: flex; align-items: flex-end; gap: $space-3; flex-wrap: wrap; } }
.f { display: flex; flex-direction: column; gap: 4px;
  > span { color: $ink-300; font-size: 0.78rem; } }
.money { display: flex; align-items: center; gap: 4px; padding: 0 $space-3; min-height: 44px; width: 120px; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.25); background: $ink-850;
  i { font-style: normal; color: $ink-400; }
  input { flex: 1; min-width: 0; border: none; background: transparent; color: $fg-dark; font: inherit; font-variant-numeric: tabular-nums; outline: none; }
  &:focus-within { border-color: rgba($brand-orange, 0.6); } }

.lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: $space-2;
  li { display: flex; align-items: center; gap: $space-4; padding: $space-3 $space-4; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.15); flex-wrap: wrap;
    &.inactivo { opacity: 0.55; } }
  &__logo { width: 88px; height: 40px; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: $radius-sm; padding: 3px; overflow: hidden;
    img { max-width: 100%; max-height: 100%; object-fit: contain; }
    span { color: #111; font-weight: 900; font-size: 0.66rem; text-align: center; line-height: 1.05; } }
  &__txt { flex: 1 1 200px; display: flex; flex-direction: column; gap: 2px; min-width: 0;
    strong { color: $fg-dark; display: flex; align-items: center; gap: $space-2; } }
  &__tarifa { color: $ink-300; font-size: 0.86rem; font-variant-numeric: tabular-nums;
    &.especial { color: $brand-orange; font-weight: 700; } } }
.pill { font-style: normal; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba($brand-orange, 0.14); color: $brand-orange;
  &--off { background: rgba($ink-500, 0.2); color: $ink-300; } }
</style>
