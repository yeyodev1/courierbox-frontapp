<script setup lang="ts">
/** One product the client wants bought, with its store-link validation. */
import type { ItemForm } from './usePersonalShopper'

defineProps<{ item: ItemForm; index: number; removable: boolean; tiendas: string[]; urlValida: (url: string) => boolean }>()
const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <article class="item-card">
    <header>
      <span>Producto {{ index + 1 }}</span>
      <button v-if="removable" type="button" class="link danger" @click="emit('remove')">Quitar</button>
    </header>

    <label class="field">
      <span>Link del producto *</span>
      <input
        v-model="item.url"
        type="url"
        inputmode="url"
        placeholder="https://www.amazon.com/..."
        :class="{ invalid: item.url && !urlValida(item.url) }"
      />
      <small v-if="item.url && !urlValida(item.url)" class="field-error">
        Solo compramos en: {{ tiendas.join(', ') }}
      </small>
    </label>

    <div class="grid-3">
      <label class="field">
        <span>Precio (USD) *</span>
        <input v-model.number="item.valorProducto" type="number" min="0" step="0.01" placeholder="0.00" />
      </label>
      <label class="field">
        <span>Envío en EE.UU.</span>
        <input v-model.number="item.valorEnvio" type="number" min="0" step="0.01" placeholder="0.00" />
      </label>
      <label class="field">
        <span>Cantidad</span>
        <input v-model.number="item.cantidad" type="number" min="1" step="1" />
      </label>
    </div>

    <label class="field">
      <span>Detalles (talla, color, modelo)</span>
      <input v-model="item.notas" type="text" placeholder="Opcional" />
    </label>
  </article>
</template>

<style scoped lang="scss">
@use './shopper-ui' as ui;

@include ui.card;
@include ui.fields;
@include ui.buttons;
</style>
