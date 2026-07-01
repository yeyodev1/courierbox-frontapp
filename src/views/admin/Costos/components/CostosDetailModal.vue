<script setup lang="ts">
import type { Gasto, GastoAuditUser } from '@/services/costos.api'

import AppModal from '@/components/ui/AppModal.vue'
import AppFilePreview from '@/components/ui/AppFilePreview.vue'

defineProps({
  show: { type: Boolean, required: true },
  gasto: { type: Object as () => Gasto | null, required: false }
})

defineEmits<{
  (e: 'close'): void
  (e: 'edit', gasto: Gasto): void
}>()

const tipoLabel: Record<string, string> = {
  operacional: 'Operacional',
  logistico: 'Logístico',
  envio: 'Envío',
}

function formatCurrency(n: number) {
  return '$' + n.toFixed(2)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isAuditUser(value: unknown): value is GastoAuditUser {
  return !!value && typeof value === 'object' && 'name' in value && 'email' in value
}

function formatPerson(value: Gasto['creadoPor'] | Gasto['updatedBy']) {
  if (!value) return '—'
  if (typeof value === 'string') return value
  if (isAuditUser(value)) return `${value.name} <${value.email}>`
  return '—'
}
</script>

<template>
  <AppModal
    :show="show && !!gasto"
    title="Detalle del gasto"
    icon="fa-solid fa-receipt"
    icon-variant="info"
    max-width="860px"
    @close="$emit('close')"
  >
    <div v-if="gasto" class="detail-grid">
      <section class="detail-panel">
        <h4>Información general</h4>
        <dl>
          <div><dt>Fecha</dt><dd>{{ formatDate(gasto.fecha) }}</dd></div>
          <div><dt>Tipo</dt><dd>{{ tipoLabel[gasto.tipo] || gasto.tipo }}</dd></div>
          <div><dt>Categoría</dt><dd>{{ gasto.categoria }}</dd></div>
          <div><dt>Descripción</dt><dd>{{ gasto.descripcion }}</dd></div>
          <div><dt>Proveedor</dt><dd>{{ gasto.proveedor || '—' }}</dd></div>
          <div><dt>Referencia</dt><dd>{{ gasto.referencia || '—' }}</dd></div>
          <div><dt>Número de factura</dt><dd>{{ gasto.numeroFactura || '—' }}</dd></div>
          <div><dt>Fecha factura</dt><dd>{{ gasto.fechaFactura ? formatDate(gasto.fechaFactura) : '—' }}</dd></div>
        </dl>
      </section>

      <section class="detail-panel">
        <h4>Importes</h4>
        <dl>
          <div><dt>Monto</dt><dd>{{ formatCurrency(gasto.monto) }}</dd></div>
          <div><dt>Valor total</dt><dd>{{ formatCurrency(gasto.valorTotal || gasto.monto) }}</dd></div>
          <div><dt>Valor pagado</dt><dd>{{ formatCurrency(gasto.valorPagado || 0) }}</dd></div>
          <div><dt>Libras</dt><dd>{{ Number(gasto.libras || 0).toFixed(2) }}</dd></div>
          <div><dt>Valor por libra</dt><dd>{{ formatCurrency(gasto.valorPorLibra || 0) }}</dd></div>
          <div><dt>Paquete</dt><dd class="mono">{{ gasto.paqueteId || '—' }}</dd></div>
          <div><dt>Comprobante</dt><dd><a v-if="gasto.comprobanteUrl" :href="gasto.comprobanteUrl" target="_blank" class="file-link">Abrir archivo</a><span v-else>—</span></dd></div>
        </dl>
      </section>

      <section class="detail-panel full">
        <AppFilePreview
          :source="gasto.comprobanteUrl"
          label="Previsualización del archivo"
          :title="gasto.numeroFactura || gasto.referencia || gasto.descripcion || 'Comprobante'"
          :description="gasto.comprobanteUrl ? 'Revisa el comprobante, ábrelo en una pestaña nueva o descárgalo.' : ''"
        />
      </section>

      <section class="detail-panel full">
        <h4>Auditoría</h4>
        <dl>
          <div><dt>Creado por</dt><dd>{{ formatPerson(gasto.creadoPor) }}</dd></div>
          <div><dt>Actualizado por</dt><dd>{{ formatPerson(gasto.updatedBy) }}</dd></div>
          <div><dt>Creado</dt><dd>{{ new Date(gasto.createdAt).toLocaleString('es-EC') }}</dd></div>
          <div><dt>Actualizado</dt><dd>{{ new Date(gasto.updatedAt).toLocaleString('es-EC') }}</dd></div>
        </dl>
      </section>
    </div>

    <template #footer>
      <div v-if="gasto" class="modal-actions">
        <button type="button" class="btn-ghost" @click="$emit('close')">Cerrar</button>
        <button type="button" class="btn-primary" @click="$emit('edit', gasto)">
          <i class="fa-solid fa-pen" /> Editar
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.detail-panel {
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-4;
  background: rgba($ink-800, 0.35);

  &.full {
    grid-column: 1 / -1;
  }

  h4 {
    margin: 0 0 $space-3;
    font-size: 0.95rem;
  }

  dl {
    display: grid;
    gap: $space-3;
    margin: 0;
  }

  dl > div {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: $space-3;
    align-items: start;
  }

  dt {
    color: $ink-400;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  dd {
    margin: 0;
    color: $fg-dark;
    word-break: break-word;
  }

  @media (max-width: 640px) {
    dl > div {
      grid-template-columns: 1fr;
      gap: $space-1;
    }
  }
}

.mono { font-variant-numeric: tabular-nums; }

.file-link {
  color: $brand-orange;
  text-decoration: none;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: 0.6rem 1.25rem;
  background: $brand-orange;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: darken($brand-orange, 8%); }
}

.btn-ghost {
  padding: 0.6rem 1.25rem;
  background: transparent;
  border: 1px solid rgba($ink-500, 0.3);
  border-radius: 10px;
  color: $ink-300;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover { background: rgba($ink-500, 0.15); color: $fg-dark; }
}
</style>
