<script setup lang="ts">
/** Fee rules that drive the asesor's quote calculator. */
import { onMounted, ref } from 'vue'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import FeeConfigList from './FeeConfig/FeeConfigList.vue'
import FeeConfigWizard from './FeeConfig/FeeConfigWizard.vue'
import { useFeeConfig, type WizardForm } from './FeeConfig/useFeeConfig'

const fee = useFeeConfig()

const showWizard = ref(false)
const deleteTargetId = ref('')

async function onSubmit(form: WizardForm) {
  if (await fee.create(form)) showWizard.value = false
}

async function confirmDelete() {
  if (!deleteTargetId.value) return
  await fee.remove(deleteTargetId.value)
  deleteTargetId.value = ''
}

onMounted(fee.load)
</script>

<template>
  <div class="fee-config-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración de tarifas</h1>
        <p class="page-subtitle">Define cómo se calcula el fee de gestión para las órdenes de compra.</p>
      </div>
      <button class="btn-primary" @click="showWizard = true"><i class="fa-solid fa-plus" /> Nueva tarifa</button>
    </div>

    <div v-if="fee.loading.value" class="loading">
      <i class="fa-solid fa-circle-notch fa-spin" /> Cargando...
    </div>

    <div v-else-if="!fee.hasConfig.value" class="onboarding-card">
      <div class="onboarding-icon"><i class="fa-solid fa-wand-magic-sparkles" /></div>
      <h2>Aún no tienes tarifas configuradas</h2>
      <p>
        El asesor no podrá usar la calculadora hasta que crees al menos una tarifa. Configura una
        ahora con el asistente.
      </p>
      <button class="btn-primary" @click="showWizard = true">Configurar primera tarifa</button>
    </div>

    <FeeConfigList
      v-else
      :configs="fee.configs.value"
      @set-default="fee.setDefault"
      @remove="(id) => (deleteTargetId = id)"
    />

    <FeeConfigWizard
      :open="showWizard"
      :saving="fee.saving.value"
      @close="showWizard = false"
      @submit="onSubmit"
    />

    <AppConfirmModal
      :open="!!deleteTargetId"
      title="Eliminar tarifa"
      message="¿Eliminar esta tarifa? Esta acción no se puede deshacer."
      confirm-label="Eliminar"
      variant="danger"
      @cancel="deleteTargetId = ''"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './FeeConfig/fee-ui' as ui;

@include ui.buttons;

.fee-config-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;

  @media (max-width: 640px) { flex-direction: column; align-items: flex-start; }
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 $space-1;
}

.page-subtitle {
  color: $ink-400;
  margin: 0;
  font-size: 0.9rem;
}

.onboarding-card {
  background: linear-gradient(135deg, rgba($brand-orange, 0.08), rgba($brand-orange, 0.02));
  border: 1px dashed rgba($brand-orange, 0.3);
  border-radius: 20px;
  padding: $space-10;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;

  .onboarding-icon {
    width: 72px;
    height: 72px;
    border-radius: 20px;
    background: rgba($brand-orange, 0.1);
    color: $brand-orange;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  h2 { margin: 0; font-size: 1.3rem; }
  p { color: $ink-400; margin: 0; max-width: 480px; }
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-8 0;
  color: $ink-500;
}
</style>
