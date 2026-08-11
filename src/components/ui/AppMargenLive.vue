<script setup lang="ts">
/**
 * Live route profitability, shown while the dispatch form is being filled in.
 *
 * The proposal asks for the cost-vs-charged comparison *before* the shipment
 * goes out; the profitability report only ever answered it afterwards. A
 * negative margin has to be visible at the moment someone can still change the
 * price, not in next month's numbers.
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** What the client is charged. */
    cobrado: number | string
    /** What the route costs us — provider, courier, or both legs summed. */
    costo: number | string
    /** Margin below this percentage is flagged as thin. */
    umbralAlerta?: number
    compacto?: boolean
  }>(),
  { umbralAlerta: 15, compacto: false }
)

const num = (v: number | string) => Number(v) || 0

const cobradoN = computed(() => num(props.cobrado))
const costoN = computed(() => num(props.costo))
const utilidad = computed(() => Number((cobradoN.value - costoN.value).toFixed(2)))
const porcentaje = computed(() =>
  cobradoN.value > 0 ? Number(((utilidad.value / cobradoN.value) * 100).toFixed(1)) : 0
)

/** `vacio` keeps the component quiet until there is something to judge. */
const estado = computed<'vacio' | 'perdida' | 'ajustado' | 'sano'>(() => {
  if (cobradoN.value === 0 && costoN.value === 0) return 'vacio'
  if (utilidad.value < 0) return 'perdida'
  if (porcentaje.value < props.umbralAlerta) return 'ajustado'
  return 'sano'
})

const mensaje = computed(() => {
  switch (estado.value) {
    case 'perdida':
      return 'Estás despachando con pérdida. Revisa el valor cobrado antes de continuar.'
    case 'ajustado':
      return `Margen por debajo del ${props.umbralAlerta}%. Confirma que el precio es correcto.`
    case 'sano':
      return 'Margen saludable.'
    default:
      return 'Ingresa el valor cobrado y el costo para ver la rentabilidad.'
  }
})

const money = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toFixed(2)}`
</script>

<template>
  <div class="margen" :class="[`is-${estado}`, { 'is-compact': compacto }]" role="status" aria-live="polite">
    <div class="margen__head">
      <i
        :class="estado === 'perdida'
          ? 'fa-solid fa-triangle-exclamation'
          : estado === 'ajustado'
            ? 'fa-solid fa-circle-exclamation'
            : 'fa-solid fa-chart-line'"
        aria-hidden="true"
      />
      <span>Rentabilidad de la ruta</span>
    </div>

    <dl class="margen__grid">
      <div>
        <dt>Cobrado</dt>
        <dd>{{ money(cobradoN) }}</dd>
      </div>
      <div>
        <dt>Costo</dt>
        <dd>{{ money(costoN) }}</dd>
      </div>
      <div class="is-result">
        <dt>Utilidad</dt>
        <dd>
          {{ money(utilidad) }}
          <small v-if="cobradoN > 0">{{ porcentaje }}%</small>
        </dd>
      </div>
    </dl>

    <p class="margen__msg">{{ mensaje }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

.margen {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($ink-500, 0.25);
  background: rgba($ink-850, 0.9);
  transition: border-color $dur-fast ease, background $dur-fast ease;

  &.is-compact { padding: $space-2 $space-3; }

  &.is-sano {
    border-color: rgba($signal-green, 0.4);
    background: rgba($signal-green, 0.07);
    .margen__head i { color: $signal-green; }
    .is-result dd { color: $signal-green; }
  }

  &.is-ajustado {
    border-color: rgba($signal-amber, 0.45);
    background: rgba($signal-amber, 0.07);
    .margen__head i { color: $signal-amber; }
    .is-result dd { color: $signal-amber; }
  }

  &.is-perdida {
    border-color: rgba($signal-red, 0.5);
    background: rgba($signal-red, 0.09);
    .margen__head i { color: #ff8a8f; }
    .is-result dd { color: #ff8a8f; }
  }
}

.margen__head {
  display: flex;
  align-items: center;
  gap: $space-2;
  color: $ink-300;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.margen__grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-5;
  margin: 0;

  div { display: flex; flex-direction: column; gap: 1px; }

  dt {
    color: $ink-400;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  dd {
    margin: 0;
    color: $ink-100;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
  }

  .is-result dd {
    font-size: 1.2rem;
    font-weight: 700;
    display: flex;
    align-items: baseline;
    gap: $space-2;

    small { font-size: 0.78rem; font-weight: 600; opacity: 0.85; }
  }
}

.margen__msg {
  margin: 0;
  color: $ink-300;
  font-size: 0.78rem;
}
</style>
