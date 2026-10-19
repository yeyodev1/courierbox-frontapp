<script setup lang="ts">
/** Registrar un abono (o el pago completo) y ver/quitar los abonos anteriores. */
import { computed, reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { AbonoCuentaCobrar, CuentaCobrar } from '@/services/cuentas_cobrar.api'
import { dinero, errorDe, hoyEcuador, leerMonto } from './useCuentasCobrar'
import { useToastStore } from '@/stores/toast.store'

const props = defineProps<{
  cuenta: CuentaCobrar | null
  abonar: (datos: { monto: number; fecha: string; nota: string }) => Promise<unknown>
  quitarAbono: (abonoId: string) => Promise<unknown>
}>()
const emit = defineEmits<{ close: [] }>()

const toast = useToastStore()
const form = reactive({ monto: '', fecha: hoyEcuador(), nota: '' })
const enviando = ref(false)
const porQuitar = ref<AbonoCuentaCobrar | null>(null)
const quitando = ref(false)

watch(
  () => props.cuenta?._id,
  () => Object.assign(form, { monto: '', fecha: hoyEcuador(), nota: '' }),
)

const monto = computed(() => leerMonto(form.monto))
const montoOk = computed(() => Number.isFinite(monto.value) && monto.value > 0)
const saldoDespues = computed(() => (props.cuenta && montoOk.value ? Math.max(0, props.cuenta.saldo - monto.value) : 0))

function pagoTotal() {
  if (props.cuenta) form.monto = props.cuenta.saldo.toFixed(2)
}

async function enviar() {
  const c = props.cuenta
  if (!c) return
  if (!montoOk.value) return toast.showNotification('Escribe un monto mayor a 0.', 'error')
  if (monto.value > c.saldo + 0.001) return toast.showNotification(`El abono no puede pasar el saldo (${dinero(c.saldo)}).`, 'error')
  if (!form.fecha) return toast.showNotification('Pon la fecha del abono.', 'error')
  enviando.value = true
  try {
    await props.abonar({ monto: Math.round(monto.value * 100) / 100, fecha: form.fecha, nota: form.nota.trim() })
    form.monto = ''
    form.nota = ''
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo registrar el abono.'), 'error')
  } finally {
    enviando.value = false
  }
}

async function confirmarQuitar() {
  if (!porQuitar.value) return
  quitando.value = true
  try {
    await props.quitarAbono(porQuitar.value._id)
    porQuitar.value = null
  } catch (e) {
    toast.showNotification(errorDe(e, 'No se pudo quitar el abono.'), 'error')
  } finally {
    quitando.value = false
  }
}

const fechaCorta = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '—')
const abonosOrdenados = computed(() => [...(props.cuenta?.abonos ?? [])].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)))
</script>

<template>
  <AppModal
    :show="!!cuenta"
    :title="cuenta ? `Abonos · ${cuenta.cliente}` : ''"
    icon="fa-solid fa-hand-holding-dollar"
    icon-variant="success"
    max-width="560px"
    fit-content
    :disable-close="enviando"
    @close="emit('close')"
  >
    <div v-if="cuenta" class="ab">
      <div class="ab__resumen">
        <div><span>Monto</span><strong>{{ dinero(cuenta.monto) }}</strong></div>
        <div><span>Abonado</span><strong class="ok">{{ dinero(cuenta.abonado) }}</strong></div>
        <div><span>Saldo</span><strong :class="{ mal: cuenta.estado === 'atrasado' }">{{ dinero(cuenta.saldo) }}</strong></div>
      </div>

      <Transition name="ab-fade" mode="out-in">
        <div v-if="cuenta.saldo <= 0" key="pagado" class="ab__pagado">
          <i class="fa-solid fa-circle-check" aria-hidden="true" /> Esta cuenta ya está pagada.
        </div>
        <form v-else key="form" class="ab__form" @submit.prevent="enviar">
          <label class="f">
            <span>Monto del abono</span>
            <div class="money">
              <i>$</i>
              <input v-model="form.monto" inputmode="decimal" placeholder="0.00" autofocus data-test="abono-monto" />
            </div>
          </label>
          <label class="f">
            <span>Fecha</span>
            <input v-model="form.fecha" type="date" class="input" />
          </label>
          <button type="button" class="link ab__total" @click="pagoTotal">Pagó todo ({{ dinero(cuenta.saldo) }})</button>
          <label class="f ab__nota">
            <span>Nota (opcional)</span>
            <input v-model="form.nota" class="input" placeholder="Transferencia Pichincha, efectivo…" maxlength="300" />
          </label>
          <p v-if="form.monto && montoOk" class="ab__despues">
            Saldo después del abono: <strong>{{ dinero(saldoDespues) }}</strong>
            <em v-if="saldoDespues <= 0">· queda pagada</em>
          </p>
          <button type="submit" class="btn primary ab__enviar" :disabled="enviando || !form.monto" data-test="abono-guardar">
            <i class="fa-solid" :class="enviando ? 'fa-circle-notch fa-spin' : 'fa-check'" aria-hidden="true" />
            {{ enviando ? 'Registrando…' : 'Registrar abono' }}
          </button>
        </form>
      </Transition>

      <section class="ab__historial">
        <h3>Historial</h3>
        <p v-if="!abonosOrdenados.length" class="muted">Todavía no hay abonos.</p>
        <TransitionGroup v-else tag="ul" name="ab-fila">
          <li v-for="a in abonosOrdenados" :key="a._id">
            <span class="fecha">{{ fechaCorta(a.fecha) }}</span>
            <span class="nota">{{ a.nota || '—' }}<small v-if="a.registradoPor"> · {{ a.registradoPor }}</small></span>
            <strong>{{ dinero(a.monto) }}</strong>
            <button type="button" class="quitar" :aria-label="`Quitar abono de ${dinero(a.monto)}`" @click="porQuitar = a">
              <i class="fa-solid fa-trash-can" aria-hidden="true" />
            </button>
          </li>
        </TransitionGroup>
      </section>
    </div>
  </AppModal>

  <AppConfirmModal
    :open="!!porQuitar"
    title="¿Quitar este abono?"
    :message="porQuitar ? `Se quita el abono de ${dinero(porQuitar.monto)} del ${fechaCorta(porQuitar.fecha)} y el saldo vuelve a subir. No se puede deshacer.` : ''"
    confirm-label="Sí, quitar abono"
    loading-label="Quitando…"
    :confirm-loading="quitando"
    @cancel="porQuitar = null"
    @confirm="confirmarQuitar"
  />
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/views/admin/Homologacion/homologacion-ui' as ui;
@include ui.buttons;

.ab { display: flex; flex-direction: column; gap: $space-5; }
.ab__resumen { display: grid; grid-template-columns: repeat(3, 1fr); gap: $space-2;
  div { display: flex; flex-direction: column; gap: 2px; padding: $space-3; border-radius: $radius-md; background: $ink-850; border: 1px solid rgba($ink-500, 0.15); }
  span { font-size: 0.72rem; color: $ink-400; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { font-size: 1.05rem; color: $fg-dark; font-variant-numeric: tabular-nums;
    &.ok { color: $signal-green; } &.mal { color: $signal-red; } } }
.ab__pagado { display: flex; align-items: center; gap: $space-2; padding: $space-4; border-radius: $radius-md; background: rgba($signal-green, 0.12); color: $signal-green; font-weight: 600; }
.ab__form { display: grid; grid-template-columns: 1fr 1fr; gap: $space-3 $space-4; align-items: end;
  @media (max-width: 520px) { grid-template-columns: 1fr; } }
.ab__total { justify-self: start; grid-column: 1 / -1; margin-top: -$space-2; }
.ab__nota, .ab__despues, .ab__enviar { grid-column: 1 / -1; }
.ab__despues { margin: 0; color: $ink-300; font-size: 0.86rem;
  strong { color: $fg-dark; font-variant-numeric: tabular-nums; } em { color: $signal-green; font-style: normal; font-weight: 600; } }
.ab__enviar { justify-content: center; }
.f { display: flex; flex-direction: column; gap: 4px; min-width: 0;
  > span { color: $ink-300; font-size: 0.78rem; } }
.input { min-height: 44px; padding: 0 $space-3; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.25); background: $ink-850; color: $fg-dark; font: inherit; outline: none; color-scheme: dark;
  &:focus { border-color: rgba($brand-orange, 0.6); } }
.money { display: flex; align-items: center; gap: 4px; padding: 0 $space-3; min-height: 44px; border-radius: $radius-sm; border: 1px solid rgba($ink-500, 0.25); background: $ink-850;
  i { font-style: normal; color: $ink-400; }
  input { flex: 1; min-width: 0; border: none; background: transparent; color: $fg-dark; font: inherit; font-size: 1.05rem; font-variant-numeric: tabular-nums; outline: none; }
  &:focus-within { border-color: rgba($brand-orange, 0.6); } }
.ab__historial { display: flex; flex-direction: column; gap: $space-2;
  h3 { margin: 0; font-size: 0.82rem; color: $ink-300; text-transform: uppercase; letter-spacing: 0.06em; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  li { display: grid; grid-template-columns: 5.5rem 1fr auto auto; align-items: center; gap: $space-3; padding: $space-2 $space-3; border-radius: $radius-sm; background: $ink-850; font-size: 0.86rem; }
  .fecha { color: $ink-400; font-variant-numeric: tabular-nums; }
  .nota { color: $ink-200; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; small { color: $ink-400; } }
  strong { color: $signal-green; font-variant-numeric: tabular-nums; }
  .quitar { width: 32px; height: 32px; border-radius: $radius-sm; border: none; background: transparent; color: $ink-400; cursor: pointer; transition: color 0.15s, background 0.15s;
    &:hover { color: $signal-red; background: rgba($signal-red, 0.1); } } }
.muted { margin: 0; color: $ink-400; font-size: 0.84rem; }

.ab-fade-enter-active, .ab-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.ab-fade-enter-from, .ab-fade-leave-to { opacity: 0; transform: translateY(4px); }
.ab-fila-enter-active, .ab-fila-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.ab-fila-enter-from { opacity: 0; transform: translateY(-6px); }
.ab-fila-leave-to { opacity: 0; transform: translateX(12px); }
</style>
