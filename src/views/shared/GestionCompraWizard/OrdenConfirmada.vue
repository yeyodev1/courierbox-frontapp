<script setup lang="ts">
/** Success state of the wizard: the reservation slip the client is handed. */
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { shortIdOf, type ReservaData } from './reserva-print'

const props = defineProps<{ reserva: ReservaData; esCourier: boolean }>()
const emit = defineEmits<{ descargar: []; 'ver-detalle': []; nueva: [] }>()

const shortId = computed(() => shortIdOf(props.reserva.id))
const saldo = computed(() => (props.reserva.valorTotal - props.reserva.valorReserva).toFixed(2))
</script>

<template>
  <div class="order-confirmed anim-pop">
    <div class="confirmed-badge"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
    <span class="confirmed-eyebrow">Orden confirmada</span>
    <h2 class="confirmed-title">La venta quedó registrada</h2>
    <p class="confirmed-sub">
      Se envió la confirmación al cliente por correo con la imagen de la orden y los términos.
      Descarga la reserva como respaldo.
    </p>

    <div class="confirmed-card">
      <div class="confirmed-card__head">
        <div>
          <strong>Courier Box Logistics</strong>
          <span>Comprobante de reserva</span>
        </div>
        <span class="confirmed-code">#{{ shortId }}</span>
      </div>

      <div class="confirmed-row"><span>Asesor</span><strong>{{ reserva.asesorNombre || '—' }}</strong></div>
      <div class="confirmed-row"><span>Cliente</span><strong>{{ reserva.clienteNombre || '—' }}</strong></div>
      <div class="confirmed-row highlight">
        <span>{{ esCourier ? 'Valor del servicio' : 'Precio final' }}</span>
        <strong>${{ reserva.valorTotal.toFixed(2) }}</strong>
      </div>
      <div class="confirmed-row">
        <span>{{ esCourier ? 'Abono del servicio' : 'Reserva (abono)' }}</span>
        <strong>${{ reserva.valorReserva.toFixed(2) }}</strong>
      </div>
      <div class="confirmed-row"><span>Saldo pendiente</span><strong>${{ saldo }}</strong></div>
      <div v-if="reserva.paginaCompra" class="confirmed-row">
        <span>Tienda</span><strong>{{ reserva.paginaCompra }}</strong>
      </div>
      <div v-if="reserva.fecha" class="confirmed-row">
        <span>Entrega tentativa</span><strong>{{ reserva.fecha }}</strong>
      </div>
      <div v-if="reserva.imagenCompraUrl" class="confirmed-row image-row">
        <span>Imagen de la orden</span>
        <img :src="reserva.imagenCompraUrl" alt="Orden" />
      </div>
    </div>

    <div class="confirmed-actions">
      <AppButton variant="primary" @click="emit('descargar')">
        <i class="fa-solid fa-download" aria-hidden="true" /> Descargar reserva
      </AppButton>
      <AppButton variant="outline" @click="emit('ver-detalle')">
        <i class="fa-solid fa-eye" aria-hidden="true" /> Ver seguimiento
      </AppButton>
      <AppButton variant="ghost" @click="emit('nueva')">
        <i class="fa-solid fa-plus" aria-hidden="true" /> Nueva venta
      </AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.order-confirmed {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  background: $ink-900;
  border: 1px solid rgba($brand-orange, 0.2);
  border-radius: 20px;
  padding: $space-6;
  text-align: center;
}

.anim-pop { animation: popIn 0.28s cubic-bezier(0.22, 1, 0.36, 1); }

@keyframes popIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.confirmed-badge {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba($signal-green, 0.14);
  color: $signal-green;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.confirmed-eyebrow {
  color: $brand-orange;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.confirmed-title { margin: 0; color: $fg-dark; font-size: 1.5rem; }
.confirmed-sub { margin: 0; color: $ink-300; max-width: 460px; line-height: 1.55; }

.confirmed-card {
  width: 100%;
  text-align: left;
  margin-top: $space-3;
  background: $ink-1000;
  border: 1px solid $ink-700;
  border-radius: 14px;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-4;
    background: rgba($brand-orange, 0.08);
    border-bottom: 1px solid $ink-700;

    strong { display: block; color: $fg-dark; }
    span { color: $ink-400; font-size: 0.78rem; }
  }
}

.confirmed-code { color: $brand-orange; font-weight: 800; }

.confirmed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $ink-700;

  &:last-child { border-bottom: none; }

  span { color: $ink-300; font-size: 0.85rem; }
  strong { color: $fg-dark; font-size: 0.9rem; }

  &.highlight strong { color: $brand-orange; font-size: 1.05rem; }
  &.image-row { flex-direction: column; align-items: flex-start; }

  &.image-row img {
    max-width: 160px;
    max-height: 120px;
    border-radius: 8px;
    margin-top: $space-2;
    object-fit: contain;
  }
}

.confirmed-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-3;
  margin-top: $space-4;
}

@media (prefers-reduced-motion: reduce) {
  .anim-pop { animation: none; }
}
</style>
