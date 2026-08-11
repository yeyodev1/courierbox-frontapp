<script setup lang="ts">
/**
 * Public self-service purchase form — Module 4 of the proposal.
 *
 * A client pastes Amazon/eBay links, fills in the price, and sees the
 * commission update as they type. No login: this is the front door, and the
 * request lands in the advisors' queue rather than becoming a half-formed sale.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { solicitudesApi, type Cotizacion, type SolicitudCreada } from '@/services/solicitudes.api'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/config/contact'

interface ItemForm {
  id: number
  url: string
  titulo: string
  cantidad: number
  valorProducto: number | null
  valorEnvio: number | null
  notas: string
}

let nextId = 1
const nuevoItem = (): ItemForm => ({
  id: nextId++,
  url: '',
  titulo: '',
  cantidad: 1,
  valorProducto: null,
  valorEnvio: null,
  notas: '',
})

const items = ref<ItemForm[]>([nuevoItem()])
const cliente = ref({
  clienteNombre: '',
  clienteEmail: '',
  clienteTelefono: '',
  clienteCedula: '',
  codigoCasillero: '',
})

const tiendas = ref<string[]>([])
const cotizacion = ref<Cotizacion | null>(null)
const cotizando = ref(false)
const enviando = ref(false)
const error = ref('')
const enviada = ref<SolicitudCreada | null>(null)

const itemsValidos = computed(() =>
  items.value.filter((i) => i.url.trim() && (Number(i.valorProducto) || 0) > 0),
)

const contactoOk = computed(
  () => Boolean(cliente.value.clienteEmail.trim() || cliente.value.clienteTelefono.trim()),
)

const puedeEnviar = computed(
  () => Boolean(cliente.value.clienteNombre.trim()) && contactoOk.value && itemsValidos.value.length > 0,
)

/** Local mirror of the quote so the totals move without a round trip. */
const totalLocal = computed(() =>
  itemsValidos.value.reduce(
    (sum, i) =>
      sum + ((Number(i.valorProducto) || 0) + (Number(i.valorEnvio) || 0)) * Math.max(1, i.cantidad),
    0,
  ),
)

function urlValida(url: string): boolean {
  if (!url.trim()) return true
  try {
    const host = new URL(url.trim()).hostname.replace(/^www\./i, '').toLowerCase()
    return tiendas.value.some((t) => host === t || host.endsWith(`.${t}`))
  } catch {
    return false
  }
}

let timer: number | undefined
watch(
  () => itemsValidos.value.map((i) => `${i.cantidad}:${i.valorProducto}:${i.valorEnvio}`).join('|'),
  () => {
    window.clearTimeout(timer)
    if (!itemsValidos.value.length) {
      cotizacion.value = null
      return
    }
    timer = window.setTimeout(cotizar, 400)
  },
)

async function cotizar() {
  cotizando.value = true
  try {
    cotizacion.value = await solicitudesApi.cotizar(
      itemsValidos.value.map((i) => ({
        url: i.url,
        cantidad: i.cantidad,
        valorProducto: Number(i.valorProducto) || 0,
        valorEnvio: Number(i.valorEnvio) || 0,
      })),
    )
  } catch {
    // A failed quote must not block the form; the server quotes again on submit.
    cotizacion.value = null
  } finally {
    cotizando.value = false
  }
}

function agregar() {
  items.value.push(nuevoItem())
}

function quitar(id: number) {
  items.value = items.value.filter((i) => i.id !== id)
  if (!items.value.length) items.value = [nuevoItem()]
}

async function enviar() {
  error.value = ''
  enviando.value = true
  try {
    enviada.value = await solicitudesApi.crear({
      ...cliente.value,
      items: itemsValidos.value.map((i) => ({
        url: i.url.trim(),
        titulo: i.titulo.trim(),
        cantidad: i.cantidad,
        valorProducto: Number(i.valorProducto) || 0,
        valorEnvio: Number(i.valorEnvio) || 0,
        notas: i.notas.trim(),
      })),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) {
    error.value = e.data?.error || e.message || 'No pudimos enviar tu solicitud. Intenta de nuevo.'
  } finally {
    enviando.value = false
  }
}

function money(n: number) {
  return `$${(Number(n) || 0).toFixed(2)}`
}

const whatsappConfirmar = computed(() =>
  whatsappUrl(
    enviada.value
      ? `Hola Courier Box, soy ${cliente.value.clienteNombre}. Envié la solicitud de compra #${enviada.value.folio} y quiero confirmarla.`
      : 'Hola Courier Box, quiero cotizar una compra.',
  ),
)

function otraSolicitud() {
  enviada.value = null
  items.value = [nuevoItem()]
  cotizacion.value = null
}

onMounted(async () => {
  try {
    tiendas.value = await solicitudesApi.tiendas()
  } catch {
    tiendas.value = []
  }
})
</script>

<template>
  <main class="ps">
    <!-- Confirmación -->
    <section v-if="enviada" class="ps__done container">
      <div class="done-card">
        <div class="done-icon"><i class="fa-solid fa-circle-check" aria-hidden="true" /></div>
        <h1>Solicitud recibida</h1>
        <p class="done-folio">Folio #{{ enviada.folio }}</p>
        <p>
          Un asesor la revisa y te confirma disponibilidad y el total final
          <template v-if="enviada.clienteEmail"> — te enviamos copia a {{ enviada.clienteEmail }}</template>.
        </p>

        <dl class="done-totales">
          <div><dt>Productos + envío EE.UU.</dt><dd>{{ money(enviada.subtotal) }}</dd></div>
          <div><dt>Comisión estimada</dt><dd>{{ money(enviada.comisionEstimada) }}</dd></div>
          <div class="is-total"><dt>Total estimado</dt><dd>{{ money(enviada.totalEstimado) }}</dd></div>
        </dl>

        <div class="done-actions">
          <a class="btn wa" :href="whatsappConfirmar" target="_blank" rel="noopener">
            <i class="fa-brands fa-whatsapp" aria-hidden="true" /> Confirmar por WhatsApp
          </a>
          <button type="button" class="btn ghost" @click="otraSolicitud">Enviar otra solicitud</button>
        </div>
      </div>
    </section>

    <!-- Formulario -->
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

          <article v-for="(item, idx) in items" :key="item.id" class="item-card">
            <header>
              <span>Producto {{ idx + 1 }}</span>
              <button v-if="items.length > 1" type="button" class="link danger" @click="quitar(item.id)">
                Quitar
              </button>
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

          <button type="button" class="btn ghost full" @click="agregar">
            <i class="fa-solid fa-plus" aria-hidden="true" /> Agregar otro producto
          </button>
        </div>

        <div class="ps__col">
          <h2 class="section-title">Tus datos</h2>
          <div class="datos-card">
            <label class="field">
              <span>Nombre completo *</span>
              <input v-model="cliente.clienteNombre" type="text" placeholder="Como aparece en tu cédula" />
            </label>
            <div class="grid-2">
              <label class="field">
                <span>Correo</span>
                <input v-model="cliente.clienteEmail" type="email" placeholder="tu@correo.com" />
              </label>
              <label class="field">
                <span>WhatsApp</span>
                <input v-model="cliente.clienteTelefono" type="tel" placeholder="09..." />
              </label>
            </div>
            <p v-if="!contactoOk" class="hint">Déjanos al menos un correo o un teléfono.</p>
            <div class="grid-2">
              <label class="field">
                <span>Cédula / RUC</span>
                <input v-model="cliente.clienteCedula" type="text" placeholder="Opcional" />
              </label>
              <label class="field">
                <span>Casillero</span>
                <input v-model="cliente.codigoCasillero" type="text" placeholder="Si ya eres cliente" />
              </label>
            </div>
          </div>

          <!-- Cotización en vivo -->
          <aside class="cotizacion" :class="{ 'is-live': cotizando }">
            <h3>Tu estimado</h3>
            <dl>
              <div>
                <dt>Productos + envío EE.UU.</dt>
                <dd>{{ money(cotizacion?.subtotal ?? totalLocal) }}</dd>
              </div>
              <div>
                <dt>
                  Comisión Courier Box
                  <i v-if="cotizando" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                </dt>
                <dd>{{ cotizacion ? money(cotizacion.comisionEstimada) : '—' }}</dd>
              </div>
              <div class="is-total">
                <dt>Total estimado</dt>
                <dd>{{ cotizacion ? money(cotizacion.totalEstimado) : money(totalLocal) }}</dd>
              </div>
            </dl>

            <p v-if="cotizacion?.comisionDetalle" class="detalle">{{ cotizacion.comisionDetalle }}</p>

            <p class="disclaimer">
              No incluye el flete internacional a Ecuador ni impuestos aduaneros: dependen del peso
              y la categoría, y te los confirmamos antes de comprar.
            </p>

            <p v-if="error" class="form-error">{{ error }}</p>

            <button type="button" class="btn primary full" :disabled="!puedeEnviar || enviando" @click="enviar">
              <i v-if="enviando" class="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
              {{ enviando ? 'Enviando…' : 'Enviar solicitud' }}
            </button>

            <p class="alt-contacto">
              ¿Prefieres escribirnos?
              <a :href="whatsappConfirmar" target="_blank" rel="noopener">{{ WHATSAPP_DISPLAY }}</a>
            </p>
          </aside>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;

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

.ps__col { display: flex; flex-direction: column; gap: $space-4; min-width: 0; }

.section-title { font-size: 1.1rem; margin: 0; }

.item-card,
.datos-card {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.2);
  background: $ink-900;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: $ink-400;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  > span { font-size: 0.82rem; color: $ink-300; }

  input {
    min-height: 46px;
    padding: 0 $space-3;
    border-radius: $radius-md;
    border: 1px solid rgba($ink-500, 0.25);
    background: $ink-850;
    color: $fg-dark;
    font: inherit;
    outline: none;
    transition: border-color $dur-fast ease;

    &:focus { border-color: rgba($brand-orange, 0.55); }
    &.invalid { border-color: rgba($signal-red, 0.6); }
  }
}

.field-error { color: #ff8a8f; font-size: 0.75rem; }

.grid-2, .grid-3 { display: grid; gap: $space-3; }
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-3 { grid-template-columns: repeat(3, 1fr); }

@media (max-width: 560px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
}

.hint { margin: 0; color: $signal-amber; font-size: 0.8rem; }

.cotizacion {
  position: sticky;
  top: $space-6;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($brand-orange, 0.35);
  background: rgba($brand-orange, 0.06);

  h3 { margin: 0; font-size: 1rem; }

  dl { margin: 0; display: flex; flex-direction: column; gap: $space-2; }

  dl > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $space-3;
  }

  dt { color: $ink-300; font-size: 0.85rem; display: inline-flex; align-items: center; gap: $space-2; }
  dd { margin: 0; color: $ink-100; font-variant-numeric: tabular-nums; }

  .is-total {
    padding-top: $space-3;
    border-top: 1px solid rgba($brand-orange, 0.25);

    dt { color: $fg-dark; font-weight: 600; }
    dd { color: $brand-orange; font-size: 1.5rem; font-weight: 700; }
  }
}

.detalle { margin: 0; color: $ink-400; font-size: 0.76rem; font-style: italic; }

.disclaimer {
  margin: 0;
  color: $ink-400;
  font-size: 0.76rem;
  line-height: 1.5;
}

.form-error {
  margin: 0;
  padding: $space-3;
  border-radius: $radius-md;
  background: rgba($signal-red, 0.1);
  border: 1px solid rgba($signal-red, 0.3);
  color: #ff8a8f;
  font-size: 0.82rem;
}

.alt-contacto {
  margin: 0;
  text-align: center;
  color: $ink-400;
  font-size: 0.8rem;

  a { color: $brand-orange; }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  min-height: 48px;
  padding: 0 $space-5;
  border-radius: $radius-md;
  border: 1px solid transparent;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.full { width: 100%; }
  &.primary { background: $brand-orange; color: $ink-1000; }
  &.ghost { background: rgba($ink-700, 0.7); border-color: rgba($ink-500, 0.25); color: $ink-200; }
  &.wa { background: #25D366; color: #062514; }
}

.link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  color: $brand-orange;

  &.danger { color: #ff8a8f; }
  &:hover { text-decoration: underline; }
}

/* ── confirmación ── */
.ps__done { display: flex; justify-content: center; }

.done-card {
  max-width: 540px;
  width: 100%;
  text-align: center;
  padding: $space-10 $space-6;
  border-radius: $radius-lg;
  border: 1px solid rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.06);

  h1 { margin: $space-3 0 $space-1; font-size: 1.8rem; }
  p { color: $ink-300; margin: 0 0 $space-2; }
}

.done-icon { font-size: 3rem; color: $signal-green; }
.done-folio { color: $brand-orange !important; font-weight: 700; letter-spacing: 0.05em; }

.done-totales {
  margin: $space-6 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
  text-align: left;

  > div { display: flex; justify-content: space-between; gap: $space-3; }
  dt { color: $ink-300; font-size: 0.88rem; }
  dd { margin: 0; font-variant-numeric: tabular-nums; }

  .is-total {
    padding-top: $space-3;
    border-top: 1px solid rgba($ink-500, 0.25);
    dt { color: $fg-dark; font-weight: 600; }
    dd { color: $brand-orange; font-size: 1.4rem; font-weight: 700; }
  }
}

.done-actions { display: flex; flex-direction: column; gap: $space-3; }
</style>
