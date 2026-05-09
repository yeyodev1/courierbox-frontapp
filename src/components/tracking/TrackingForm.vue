<script setup lang="ts">
import { ref, watch } from "vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppButton from "@/components/ui/AppButton.vue";

interface Props {
  modelValue?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), { modelValue: "", loading: false });

const emit = defineEmits<{
  "update:modelValue": [value: string];
  submit: [codigo: string];
}>();

const value = ref(props.modelValue);

watch(() => props.modelValue, (v) => { value.value = v; });
watch(value, (v) => emit("update:modelValue", v));

const onSubmit = () => {
  const c = value.value.trim().toUpperCase();
  if (!c) return;
  emit("submit", c);
};
</script>

<template>
  <form class="tracking-form" @submit.prevent="onSubmit">
    <AppInput
      v-model="value"
      large
      placeholder="Ingresa tu número de guía"
      inputmode="search"
      autocomplete="off"
      aria-label="Número de guía"
    >
      <template #action>
        <AppButton type="submit" variant="primary" size="md" :loading="loading">
          Rastrear
        </AppButton>
      </template>
    </AppInput>
  </form>
</template>

<style scoped lang="scss">
.tracking-form { width: 100%; }
</style>
