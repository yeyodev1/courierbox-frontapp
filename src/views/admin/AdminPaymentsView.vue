<script setup lang="ts">
/** Payment links: generate one for a client and track what has been settled. */
import { onMounted, ref } from 'vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import GenerarLinkForm from './Payments/GenerarLinkForm.vue'
import PaymentsTable from './Payments/PaymentsTable.vue'
import { usePayments, type PaymentForm, type PaymentLink } from './Payments/usePayments'

const p = usePayments()
const deleteTarget = ref<PaymentLink | null>(null)

async function onSubmit(form: PaymentForm, total: number) {
  await p.generate(form, total)
}

function requestDelete(payment: PaymentLink) {
  const blocked = p.deletionBlockedReason(payment)
  if (blocked) {
    p.warn(blocked)
    return
  }
  deleteTarget.value = payment
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  if (await p.remove(deleteTarget.value)) deleteTarget.value = null
}

onMounted(p.load)
</script>

<template>
  <div class="page-content">
    <div class="content-grid">
      <GenerarLinkForm :creating="p.creating.value" @submit="onSubmit" />
      <PaymentsTable
        :payments="p.payments.value"
        :loading="p.loading.value"
        @copy="p.copyLink"
        @remove="requestDelete"
      />
    </div>

    <AppConfirmModal
      :open="!!deleteTarget"
      title="Eliminar Link de Pago"
      :message="`¿Eliminar el link ${deleteTarget?.reference ?? ''}? No se puede deshacer.`"
      confirm-label="Sí, eliminar"
      variant="danger"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/space' as *;

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: $space-6;
  align-items: start;

  @media (max-width: 900px) { grid-template-columns: 1fr; }
}
</style>
