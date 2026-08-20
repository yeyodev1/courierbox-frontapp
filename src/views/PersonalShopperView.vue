<script setup lang="ts">
/**
 * Public self-service purchase form — Module 4 of the proposal.
 * No login: this is the front door, and the request lands in the advisors'
 * queue rather than becoming a half-formed sale.
 */
import { computed, onMounted } from 'vue'
import { whatsappUrl } from '@/config/contact'
import ShopperItemCard from './PersonalShopper/ShopperItemCard.vue'
import ShopperCotizacion from './PersonalShopper/ShopperCotizacion.vue'
import ShopperConfirmacion from './PersonalShopper/ShopperConfirmacion.vue'
import { usePersonalShopper } from './PersonalShopper/usePersonalShopper'

const s = usePersonalShopper()

const whatsappConfirmar = computed(() =>
  whatsappUrl(
    s.enviada.value
      ? `Hola Courier Box, soy ${s.cliente.value.clienteNombre}. Envié la solicitud de compra #${s.enviada.value.folio} y quiero confirmarla.`
      : 'Hola Courier Box, quiero cotizar una compra.',
  ),
)

onMounted(s.loadTiendas)
</script>

<template>
  <main class="ps">
    <ShopperConfirmacion
      v-if="s.enviada.value"
      :solicitud="s.enviada.value"
      :whatsapp-link="whatsappConfirmar"
      @otra="s.otraSolicitud"
    />

    <template v-else>
      <section class="ps__hero container">
        <span class="eyebrow">Personal Shopper</span>
        <h1>Nosotros te lo compramos</h1>
        <p>
          Pega el link de lo que quieres de Amazon, eBay o Walmart. Calculamos la comisión al
          instante y un asesor te confirma el total final.
        </p>
      </section>

      <section class="ps__form container">
        <div class="ps__col">
          <h2 class="section-title">Tus productos</h2>

          <ShopperItemCard
            v-for="(item, index) in s.items.value"
            :key="item.id"
            :item="item"
            :index="index"
            :removable="s.items.value.length > 1"
            :tiendas="s.tiendas.value"
            :url-valida="s.urlValida"
            @remove="s.quitar(item.id)"
          />

          <button type="button" class="btn ghost full" @click="s.agregar">
            <i class="fa-solid fa-plus" aria-hidden="true" /> Agregar otro producto
          </button>
        </div>

        <div class="ps__col">
          <h2 class="section-title">Tus datos</h2>
          <div class="datos-card">
            <label class="field">
              <span>Nombre completo *</span>
              <input v-model="s.cliente.value.clienteNombre" type="text" placeholder="Como aparece en tu cédula" />
            </label>
            <div class="grid-2">
              <label class="field">
                <span>Correo</span>
                <input v-model="s.cliente.value.clienteEmail" type="email" placeholder="tu@correo.com" />
              </label>
              <label class="field">
                <span>WhatsApp</span>
                <input v-model="s.cliente.value.clienteTelefono" type="tel" placeholder="09..." />
              </label>
            </div>
            <p v-if="!s.contactoOk.value" class="hint">Déjanos al menos un correo o un teléfono.</p>
            <div class="grid-2">
              <label class="field">
                <span>Cédula / RUC</span>
                <input v-model="s.cliente.value.clienteCedula" type="text" placeholder="Opcional" />
              </label>
              <label class="field">
                <span>Casillero</span>
                <input v-model="s.cliente.value.codigoCasillero" type="text" placeholder="Si ya eres cliente" />
              </label>
            </div>
          </div>

          <ShopperCotizacion
            :cotizacion="s.cotizacion.value"
            :cotizando="s.cotizando.value"
            :total-local="s.totalLocal.value"
            :error="s.error.value"
            :enviando="s.enviando.value"
            :puede-enviar="s.puedeEnviar.value"
            :whatsapp-link="whatsappConfirmar"
            @submit="s.enviar"
          />
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './PersonalShopper/shopper-ui' as ui;

@include ui.card;
@include ui.fields;
@include ui.buttons;

.ps { padding-block: clamp(3rem, 8vw, 6rem); }

.ps__hero {
  max-width: 720px;
  margin-bottom: $space-10;

  h1 { font-size: clamp(2rem, 5vw, 3rem); margin: $space-3 0; }
  p { color: $ink-300; font-size: 1.05rem; max-width: 56ch; }
}

.ps__form {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: $space-8;
  align-items: start;

  @media (max-width: 900px) { grid-template-columns: 1fr; gap: $space-6; }
}

.ps__col {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  min-width: 0;
}

.section-title { font-size: 1.1rem; margin: 0; }

.hint { margin: 0; color: $signal-amber; font-size: 0.8rem; }
</style>
