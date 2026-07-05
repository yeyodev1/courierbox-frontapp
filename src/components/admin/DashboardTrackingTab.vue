<script setup lang="ts">
import { ref } from 'vue'
import { fetchTracking, type TrackingResult } from '@/services/tracking'

const trackingCode = ref('')
const loadingTracking = ref(false)
const trackingData = ref<TrackingResult | null>(null)
const trackingError = ref('')

async function handleSearchTracking() {
  if (!trackingCode.value.trim()) return
  loadingTracking.value = true
  trackingError.value = ''
  trackingData.value = null
  try {
    trackingData.value = await fetchTracking(trackingCode.value.trim())
  } catch (err: any) {
    trackingError.value = err.response?.data?.message || err.message || 'Error al buscar tracking'
  } finally {
    loadingTracking.value = false
  }
}
</script>

<template>
  <div class="page-content">
    <section class="content-card">
      <div class="card-head">
        <h3><i class="fa-solid fa-magnifying-glass-location" /> Consulta de Tracking Interno</h3>
      </div>
      <form @submit.prevent="handleSearchTracking" class="tracking-form">
        <div class="tracking-search-row">
          <div class="form-group" style="flex:1">
            <label>Código de Tracking o WR</label>
            <input type="text" v-model="trackingCode" required placeholder="Ingrese el código..." />
          </div>
          <button type="submit" :disabled="loadingTracking || !trackingCode.trim()" class="btn-primary" style="margin-top:1.5rem">
            <span v-if="!loadingTracking"><i class="fa-solid fa-search" /> Buscar</span>
            <span v-else class="loader" />
          </button>
        </div>
      </form>
      <p v-if="trackingError" class="form-error" style="margin-top:1rem"><i class="fa-solid fa-circle-exclamation" /> {{ trackingError }}</p>

      <div v-if="trackingData" class="tracking-result">
        <div class="tracking-stats">
          <div class="ts-item">
            <span class="ts-label">Estado</span>
            <span class="ts-value">{{ trackingData.estadoLabel }}</span>
          </div>
          <div class="ts-item">
            <span class="ts-label">WR</span>
            <span class="ts-value">{{ trackingData.wr || 'N/A' }}</span>
          </div>
          <div class="ts-item">
            <span class="ts-label">Peso (Lb)</span>
            <span class="ts-value">{{ trackingData.pesoLb ?? 'N/A' }}</span>
          </div>
          <div class="ts-item">
            <span class="ts-label">Consignatario</span>
            <span class="ts-value">{{ trackingData.consignee || 'N/A' }}</span>
          </div>
        </div>
        <div v-if="trackingData.costo" class="tracking-costs">
          <h4>Costos</h4>
          <div class="cost-grid">
            <div><span>Flete</span><strong>${{ trackingData.costo.flete }}</strong></div>
            <div><span>Arancel</span><strong>${{ trackingData.costo.arancel }}</strong></div>
            <div class="cost-total"><span>Total</span><strong>${{ trackingData.costo.total }}</strong></div>
          </div>
        </div>
        <div v-if="trackingData.eventos?.length" class="tracking-events">
          <h4>Historial</h4>
          <div v-for="(ev, i) in trackingData.eventos" :key="i" class="event-row">
            <div class="event-dot" />
            <div>
              <div class="event-date">{{ ev.fechaTexto }} <span v-if="ev.ubicacion">— {{ ev.ubicacion }}</span></div>
              <div class="event-desc">{{ ev.descripcion }}</div>
              <div v-if="ev.accion" class="event-action">{{ ev.accion }}</div>
            </div>
          </div>
        </div>
        <div v-if="trackingData.imagenes?.length" class="tracking-images">
          <h4>Imágenes ({{ trackingData.imagenes.length }})</h4>
          <div class="img-scroll">
            <a v-for="(img, i) in trackingData.imagenes" :key="i" :href="img" target="_blank">
              <img :src="img" alt="img" />
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;

.page-content {
  width: 100%;
  max-width: 100%;
}

.content-card {
  background: $ink-900;
  border: 1px solid rgba($ink-500, 0.12);
  border-radius: 16px;
  padding: $space-6;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba($ink-400, 0.2);
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-5;
    padding-bottom: $space-4;
    border-bottom: 1px solid rgba($ink-500, 0.08);

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: $space-2;

      i {
        color: $brand-orange;
        font-size: 0.9rem;
      }
    }
  }
}

.tracking-form {
  .form-group {
    display: flex;
    flex-direction: column;

    label {
      font-size: 0.8rem;
      font-weight: 500;
      color: $ink-300;
      margin-bottom: $space-2;
    }

    input {
      background: rgba($ink-1000, 0.5);
      border: 1px solid rgba($ink-500, 0.3);
      color: $fg-dark;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.25s;
      width: 100%;

      &::placeholder { color: $ink-500; }

      &:focus {
        outline: none;
        border-color: $brand-orange;
        box-shadow: 0 0 0 3px rgba($brand-orange, 0.1);
        background: rgba($ink-1000, 0.8);
      }
    }
  }
}

.tracking-search-row {
  display: flex;
  gap: $space-4;
  align-items: flex-end;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.tracking-result {
  margin-top: $space-6;
  padding-top: $space-6;
  border-top: 1px solid rgba($ink-500, 0.12);

  h4 {
    font-size: 0.9rem;
    margin: 0 0 $space-3;
    color: $fg-dark;
  }

  .tracking-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: $space-3;
    margin-bottom: $space-6;

    .ts-item {
      background: rgba($ink-800, 0.3);
      padding: $space-3 $space-4;
      border-radius: 10px;

      .ts-label {
        display: block;
        font-size: 0.7rem;
        color: $ink-400;
        margin-bottom: 4px;
      }

      .ts-value {
        font-weight: 600;
        font-size: 0.95rem;
      }
    }
  }

  .tracking-costs {
    margin-bottom: $space-6;

    .cost-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $space-3;

      > div {
        background: rgba($ink-800, 0.3);
        padding: $space-3 $space-4;
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        span { font-size: 0.75rem; color: $ink-400; }
        strong { font-weight: 600; }
      }

      .cost-total strong { color: $brand-orange; }
    }
  }

  .tracking-events {
    margin-bottom: $space-6;

    .event-row {
      display: flex;
      gap: $space-3;
      padding: $space-3 0;
      border-left: 2px solid rgba($brand-orange, 0.2);
      padding-left: $space-4;
      margin-left: 4px;

      .event-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: $brand-orange;
        margin-left: calc(-1 * (#{$space-4} + 5px));
        margin-top: 4px;
        flex-shrink: 0;
      }

      .event-date { font-size: 0.78rem; color: $ink-400; }
      .event-desc { font-size: 0.9rem; margin-top: 2px; }
      .event-action { font-size: 0.8rem; color: $brand-orange; margin-top: 2px; }
    }
  }

  .tracking-images {
    .img-scroll {
      display: flex;
      gap: $space-3;
      overflow-x: auto;
      padding-bottom: $space-3;
      width: 100%;
      
      // Custom scrollbar
      &::-webkit-scrollbar {
        height: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba($ink-500, 0.5);
        border-radius: 4px;
      }

      a {
        flex-shrink: 0;
        img {
          max-width: 180px;
          height: auto;
          border-radius: 10px;
          border: 1px solid rgba($ink-500, 0.2);
        }
      }
    }
  }
}

.form-error {
  display: flex;
  align-items: center;
  gap: $space-2;
  background: rgba($signal-red, 0.08);
  color: #ff8a8f;
  padding: $space-3 $space-4;
  border-radius: 10px;
  font-size: 0.85rem;
  border: 1px solid rgba($signal-red, 0.15);
  margin: 0;
}

.btn-primary {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;
  background: $brand-orange;
  color: #fff;
  border: none;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  min-height: 46px;

  &:hover:not(:disabled) {
    background: color.adjust($brand-orange, $lightness: 5%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($brand-orange, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(#fff, 0.3);
  border-bottom-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
