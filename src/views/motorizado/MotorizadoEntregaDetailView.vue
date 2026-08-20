<script setup lang="ts">
/** One delivery on the motorizado's phone: address, then evidence capture. */
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import EntregaCaptura from './Entrega/EntregaCaptura.vue'
import { estadoLabel, formatDate, useEntregaDetalle } from './Entrega/useEntregaDetalle'

const route = useRoute()
const e = useEntregaDetalle(String(route.params.id))

onMounted(e.load)
</script>

<template>
  <div class="detail">
    <button class="back" @click="$router.push('/motorizado')">
      <i class="fa-solid fa-arrow-left" aria-hidden="true" /> Mis entregas
    </button>

    <div v-if="e.loading.value" class="loading" aria-busy="true" aria-live="polite">
      <AppSkeleton variant="title" />
      <AppSkeleton variant="card" height="150px" />
      <AppSkeleton variant="card" height="220px" />
    </div>

    <template v-else-if="e.envio.value">
      <section class="info-card">
        <div class="info-head">
          <h2>{{ e.envio.value.clienteNombre }}</h2>
          <span class="badge" :class="`estado-${e.envio.value.estado}`">
            {{ estadoLabel(e.envio.value.estado) }}
          </span>
        </div>

        <a v-if="e.mapsUrl.value" class="dir-link" :href="e.mapsUrl.value" target="_blank" rel="noopener">
          <i class="fa-solid fa-location-dot" aria-hidden="true" />
          <span>{{ e.envio.value.clienteDireccion }}</span>
          <i class="fa-solid fa-arrow-up-right-from-square ext" aria-hidden="true" />
        </a>
        <p v-else class="dir-plain">
          <i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ e.envio.value.clienteDireccion }}
        </p>

        <div v-if="e.envio.value.clienteTelefono" class="quick-actions">
          <a class="qa call" :href="`tel:${e.envio.value.clienteTelefono}`">
            <i class="fa-solid fa-phone" aria-hidden="true" /> Llamar
          </a>
        </div>

        <div class="meta-grid">
          <div>
            <span>Valor cobrado</span>
            <strong>${{ (e.envio.value.valorCobrado || 0).toFixed(2) }}</strong>
          </div>
          <div>
            <span>Modo</span>
            <strong>{{ e.envio.value.modo === 'interprovincial' ? 'Interprovincial' : 'Local' }}</strong>
          </div>
          <div v-if="e.envio.value.ciudadDestino">
            <span>Ciudad</span><strong>{{ e.envio.value.ciudadDestino }}</strong>
          </div>
        </div>

        <div v-if="e.envio.value.notas" class="notas">
          <span>Instrucciones</span>
          <p>{{ e.envio.value.notas }}</p>
        </div>
      </section>

      <section v-if="e.envio.value.estado === 'entregado'" class="evidence-card">
        <h3><i class="fa-solid fa-circle-check" aria-hidden="true" /> Entrega registrada</h3>
        <p v-if="e.envio.value.entregadoEn" class="muted">{{ formatDate(e.envio.value.entregadoEn) }}</p>
        <img v-if="e.envio.value.fotoEntregaUrl" :src="e.envio.value.fotoEntregaUrl" alt="Foto entrega" class="ev-img" />
        <p v-if="e.recibidoPorTexto.value" class="novedad-view">
          <strong>Recibido por:</strong> {{ e.recibidoPorTexto.value }}
        </p>
        <img v-if="e.envio.value.firmaUrl" :src="e.envio.value.firmaUrl" alt="Firma" class="ev-firma" />
        <p v-if="e.envio.value.novedad" class="novedad-view"><strong>Novedad:</strong> {{ e.envio.value.novedad }}</p>
      </section>

      <EntregaCaptura
        v-else
        v-model:recibe="e.recibe.value"
        v-model:novedad="e.novedad.value"
        v-model:motivo-fallido="e.motivoFallido.value"
        :estado="e.envio.value.estado"
        :saving="e.saving.value"
        :uploading-foto="e.uploadingFoto.value"
        :foto-preview="e.fotoPreview.value"
        :error="e.error.value"
        :puede-entregar="e.puedeEntregar.value"
        @foto="e.subirFoto"
        @firma="(dataUrl) => (e.firmaDataUrl.value = dataUrl)"
        @iniciar-ruta="e.iniciarRuta"
        @entregar="e.entregar"
        @fallido="e.marcarFallido"
      />
    </template>

    <p v-else class="loading">No se encontró la entrega.</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.detail {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.back {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: $brand-orange;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  font-family: inherit;
  font-size: 0.9rem;
}

.loading {
  color: $ink-400;
  text-align: center;
  padding: $space-6 0;
}

.info-card,
.evidence-card {
  background: $ink-900;
  border: 1px solid $ink-700;
  border-radius: 16px;
  padding: $space-5;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;

  h2 { margin: 0; color: $fg-dark; font-size: 1.25rem; }
}

.badge {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: $ink-700;
  color: $ink-300;

  &.estado-entregado { background: rgba($signal-green, 0.15); color: $signal-green; }
  &.estado-en_ruta { background: rgba($brand-orange, 0.16); color: $brand-orange; }
  &.estado-asignado { background: rgba($signal-blue, 0.16); color: #7fa3ff; }
}

.dir-link,
.dir-plain {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  color: $fg-dark;
  text-decoration: none;
  background: $ink-1000;
  border: 1px solid $ink-700;
  border-radius: 12px;
  padding: $space-3 $space-4;
  line-height: 1.4;
}

.dir-link {
  border-color: rgba($brand-orange, 0.3);

  .ext { margin-left: auto; color: $brand-orange; }
}

.quick-actions { display: flex; gap: $space-3; }

.qa {
  flex: 1;
  text-align: center;
  padding: $space-3;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;

  &.call { background: $ink-700; color: $fg-dark; }
}

.meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;

  > div { flex: 1 1 100px; display: flex; flex-direction: column; gap: 2px; }

  span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
  strong { color: $fg-dark; }
}

.notas {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
  p { margin: 0; color: $ink-300; line-height: 1.5; }
}

.evidence-card h3 {
  margin: 0;
  color: $fg-dark;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: $space-2;
}

.ev-img {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid $ink-700;
}

.ev-firma {
  width: 200px;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
}

.muted { color: $ink-400; font-size: 0.85rem; margin: 0; }

.novedad-view {
  color: $ink-300;
  margin: 0;

  strong { color: $fg-dark; }
}
</style>
