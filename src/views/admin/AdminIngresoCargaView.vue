<script setup lang="ts">
/**
 * Ingreso de carga.
 *
 * El manifiesto por vuelo llega en Excel, una fila por caja, con el cliente
 * escrito a mano. Aquí se sube ese archivo y cada caja queda colgada de su
 * cliente: si el nombre ya existe se reutiliza, si no, se crea. Elegir el
 * archivo muestra primero qué va a pasar; donde el nombre no cuadró solo, el
 * operador lo vincula a mano; nada se escribe hasta confirmar.
 */
import { useRouter } from 'vue-router'
import AppConfirmModal from '@/components/ui/AppConfirmModal.vue'
import type { FilaIngreso } from '@/services/ingreso_carga.api'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import CajaManualModal from './IngresoCarga/CajaManualModal.vue'
import IngresoCargaTabla from './IngresoCarga/IngresoCargaTabla.vue'
import VincularClienteModal from './IngresoCarga/VincularClienteModal.vue'
import { useIngresoCarga } from './IngresoCarga/useIngresoCarga'

const ic = useIngresoCarga()
const router = useRouter()

/** A Facturación con el cliente ya buscado y esa caja marcada. */
function facturar(fila: FilaIngreso) {
  router.push({ path: '/admin/facturacion', query: { q: fila.casillero, sel: fila.wr } })
}

function irAFacturacion() {
  router.push({ path: '/admin/facturacion' })
}

function mensajeConfirmacion() {
  const r = ic.resumen.value
  const partes = [
    r.paquetesActualizados
      ? `Se registran ${r.paquetesNuevos} cajas nuevas y se actualizan ${r.paquetesActualizados} que ya existían (no se duplican)`
      : `Se registran ${r.cajas} cajas`,
    r.clientesCreados ? `se crean ${r.clientesCreados} clientes nuevos` : '',
    r.vinculados ? `${r.vinculados} quedan vinculadas a mano` : '',
    r.sinCliente ? `${r.sinCliente} van a Homologación` : '',
  ].filter(Boolean)
  return `${partes.join(', ')}. Esta acción escribe en la base de clientes y paquetes.`
}
</script>

<template>
  <div class="ingreso">
    <header class="head">
      <div>
        <h1>Ingreso de carga</h1>
        <p>
          Sube el manifiesto del vuelo (.xlsx). Cada caja queda con su cliente: el que ya existe se
          reutiliza y el que no, se crea con casillero. Primero ves qué va a pasar y puedes vincular a
          mano lo que no cuadre; nada se guarda hasta que confirmes.
        </p>
      </div>
      <div class="head__acciones">
        <button v-if="!ic.aplicado.value" type="button" class="btn primary" data-test="abrir-manual" @click="ic.cajaModalAbierta.value = true">
          <i class="fa-solid fa-plus" aria-hidden="true" /> Ingresar caja una a una
        </button>
        <Transition name="fade-up">
          <button v-if="ic.archivo.value || ic.cajasManuales.value.length || ic.aplicado.value" type="button" class="btn ghost" :disabled="ic.aplicando.value" @click="ic.reiniciar">
            <i class="fa-solid fa-rotate-left" aria-hidden="true" /> {{ ic.aplicado.value ? 'Nuevo ingreso' : 'Empezar de nuevo' }}
          </button>
        </Transition>
      </div>
    </header>

    <Transition name="fade-up" mode="out-in">
      <section v-if="!ic.aplicado.value && ic.modo.value === 'archivo'" class="panel" key="upload">
        <AppFileUpload
          v-model="ic.archivo.value"
          label="Manifiesto de ingreso de carga"
          hint="Excel con las columnas BOX ID, CLIENTE, Peso, Descripción… como el archivo INGRESO DE CARGA.xlsx"
          accept=".xlsx,.xls"
          :disabled="ic.cargando.value || ic.aplicando.value"
          :error="ic.errorArchivo.value"
        />
      </section>
    </Transition>

    <Transition name="fade-up">
      <section v-if="ic.modo.value === 'manual' && !ic.aplicado.value && ic.cajasManuales.value.length" class="banner manual" data-test="manual-resumen">
        <i class="fa-solid fa-pen-to-square" aria-hidden="true" />
        <div>
          <strong>{{ ic.cajasManuales.value.length }} caja(s) ingresadas a mano.</strong>
          Revísalas abajo igual que un Excel; puedes agregar más o vincular clientes antes de confirmar.
          <span class="banner__acciones"><button type="button" class="btn ghost sm" @click="ic.cajaModalAbierta.value = true"><i class="fa-solid fa-plus" aria-hidden="true" /> Agregar otra caja</button></span>
        </div>
      </section>
    </Transition>

    <div v-if="ic.cargando.value" aria-busy="true">
      <AppSkeleton variant="card" height="88px" :count="4" gap="0.75rem" />
    </div>

    <Transition name="fade-up" appear>
      <div v-if="!ic.cargando.value && ic.vista.value" class="resultado">
        <Transition name="fade-up">
          <section
            v-if="ic.aplicado.value"
            class="banner"
            :class="{ 'con-pendientes': ic.resumen.value.sinCliente > 0 }"
            data-test="banner-aplicado"
          >
            <i class="fa-solid" :class="ic.resumen.value.sinCliente > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'" aria-hidden="true" />
            <div>
              <strong>Carga ingresada.</strong>
              {{ ic.resumen.value.cajas }} cajas registradas y {{ ic.resumen.value.clientesCreados }} clientes nuevos<template v-if="ic.resumen.value.vinculados">, {{ ic.resumen.value.vinculados }} vinculadas a mano</template>.
              <template v-if="ic.resumen.value.sinCliente > 0">
                {{ ic.resumen.value.sinCliente }} cajas venían sin nombre de cliente y esperan en
                <RouterLink to="/admin/homologacion">Homologación</RouterLink>.
              </template>
              <span class="banner__acciones">
                <button type="button" class="btn primary sm" data-test="ir-facturacion" @click="irAFacturacion">
                  <i class="fa-solid fa-file-invoice-dollar" aria-hidden="true" /> Ir a Facturación
                </button>
                <small>O pulsa «Facturar» en la caja que quieras: te lleva con el cliente ya buscado.</small>
              </span>
            </div>
          </section>
        </Transition>

        <Transition name="fade-up">
          <section v-if="!ic.aplicado.value && ic.resumen.value.paquetesActualizados > 0" class="banner con-pendientes" data-test="aviso-duplicados">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <div>
              <strong>{{ ic.resumen.value.paquetesActualizados }} de {{ ic.resumen.value.totalFilas }} cajas ya estaban registradas.</strong>
              <template v-if="ic.resumen.value.paquetesNuevos === 0">Este archivo ya se cargó antes.</template>
              <template v-else>Parte de este archivo ya se cargó antes.</template>
              Están marcadas como <em>Ya registrada</em>: al confirmar se actualizan con lo que trae el Excel, <strong>no se duplican</strong>. Si ya tienen factura, no se tocan.
            </div>
          </section>
        </Transition>

        <section class="stats">
          <article class="stat">
            <span>Cajas en el archivo</span>
            <strong>{{ ic.resumen.value.totalFilas }}</strong>
            <small>{{ ic.resumen.value.paquetesNuevos }} nuevas · {{ ic.resumen.value.paquetesActualizados }} ya registradas</small>
          </article>
          <article class="stat ok">
            <span>Clientes existentes</span>
            <Transition name="num" mode="out-in"><strong :key="ic.resumen.value.clientesExistentes">{{ ic.resumen.value.clientesExistentes }}</strong></Transition>
            <small>Reconocidos por nombre o alias</small>
          </article>
          <article class="stat nuevo" :class="{ 'is-zero': ic.resumen.value.clientesCreados === 0 }">
            <span>{{ ic.aplicado.value ? 'Clientes creados' : 'Clientes a crear' }}</span>
            <Transition name="num" mode="out-in"><strong :key="ic.resumen.value.clientesCreados" data-test="stat-crear">{{ ic.resumen.value.clientesCreados }}</strong></Transition>
            <small>Con casillero asignado</small>
          </article>
          <article class="stat aviso" :class="{ 'is-zero': ic.resumen.value.aproximados === 0 }">
            <span>Parecidos</span>
            <Transition name="num" mode="out-in"><strong :key="ic.resumen.value.aproximados">{{ ic.resumen.value.aproximados }}</strong></Transition>
            <small>Nombre casi igual a un cliente; revísalos</small>
          </article>
          <article class="stat ok" :class="{ 'is-zero': ic.resumen.value.vinculados === 0 }">
            <span>Vinculados a mano</span>
            <Transition name="num" mode="out-in"><strong :key="ic.resumen.value.vinculados" data-test="stat-vinculados">{{ ic.resumen.value.vinculados }}</strong></Transition>
            <small>Decididos en esta pantalla</small>
          </article>
          <article class="stat" :class="{ 'is-zero': ic.resumen.value.sinCliente === 0 }">
            <span>Sin cliente</span>
            <Transition name="num" mode="out-in"><strong :key="ic.resumen.value.sinCliente">{{ ic.resumen.value.sinCliente }}</strong></Transition>
            <small>Van a Homologación</small>
          </article>
        </section>

        <ul v-if="ic.resumen.value.errores.length" class="errores" data-test="errores">
          <li v-for="(e, i) in ic.resumen.value.errores" :key="i"><i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ e }}</li>
        </ul>

        <IngresoCargaTabla
          :filas="ic.vista.value.filas"
          :aplicado="ic.aplicado.value"
          :resaltada="ic.recienCambiada.value"
          @vincular="ic.abrirVincular"
          @facturar="facturar"
        />

        <Transition name="fade-up">
          <footer v-if="!ic.aplicado.value" class="acciones">
            <p>
              Al confirmar se crean <strong>{{ ic.resumen.value.clientesCreados }}</strong> clientes y se registran
              <strong>{{ ic.resumen.value.cajas }}</strong> cajas<template v-if="ic.resumen.value.vinculados">, {{ ic.resumen.value.vinculados }} vinculadas a mano</template>.
            </p>
            <button
              type="button"
              class="btn primary"
              :disabled="!ic.puedeAplicar.value"
              data-test="confirmar"
              @click="ic.confirmando.value = true"
            >
              <i class="fa-solid fa-file-import" aria-hidden="true" />
              Confirmar ingreso
            </button>
          </footer>
        </Transition>
      </div>
    </Transition>


    <CajaManualModal
      :open="ic.cajaModalAbierta.value"
      :cajas="ic.cajasManuales.value"
      @close="ic.cajaModalAbierta.value = false"
      @agregar="ic.agregarCajaManual"
      @quitar="(i) => { ic.quitarCajaManual(i); if (ic.modo.value === 'manual') ic.previsualizarManual() }"
      @ver="() => { ic.cajaModalAbierta.value = false; ic.previsualizarManual() }"
    />

    <VincularClienteModal
      :fila="ic.filaEnEdicion.value"
      @close="ic.cerrarVincular"
      @vincular="(c) => ic.filaEnEdicion.value && ic.vincular(ic.filaEnEdicion.value, c)"
      @crear="() => ic.filaEnEdicion.value && ic.marcarComoNuevo(ic.filaEnEdicion.value)"
    />

    <AppConfirmModal
      :open="ic.confirmando.value"
      title="¿Ingresar esta carga?"
      :message="mensajeConfirmacion()"
      confirm-label="Sí, ingresar"
      loading-label="Ingresando…"
      variant="info"
      :confirm-loading="ic.aplicando.value"
      @cancel="ic.confirmando.value = false"
      @confirm="ic.aplicar"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use '@/styles/tokens/motion' as *;
@use './Homologacion/homologacion-ui' as ui;

@include ui.buttons;

.ingreso {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.resultado {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;

  &__acciones { display: flex; gap: $space-3; flex-wrap: wrap; }

  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 66ch; }
}

.panel {
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;
}

.banner.manual { border-color: rgba($brand-orange, 0.35); background: rgba($brand-orange, 0.06); > i { color: $brand-orange; } }

.banner {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-radius: $radius-md;
  border: 1px solid rgba($signal-green, 0.35);
  background: rgba($signal-green, 0.08);
  color: $ink-200;
  font-size: 0.92rem;

  > i { color: $signal-green; margin-top: 3px; }
  strong { color: $fg-dark; }
  a { color: $brand-orange; }
  > div { display: flex; flex-direction: column; gap: $space-2; }
  &__acciones { display: flex; align-items: center; gap: $space-3; flex-wrap: wrap; margin-top: $space-1; small { color: $ink-400; } }

  &.con-pendientes {
    border-color: rgba($signal-amber, 0.4);
    background: rgba($signal-amber, 0.08);
    > i { color: $signal-amber; }
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: $space-3;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $space-4;
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;
  transition: border-color $dur-base ease;

  span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { font-size: 1.7rem; color: $fg-dark; font-variant-numeric: tabular-nums; display: block; }
  small { color: $ink-500; font-size: 0.76rem; }

  &.ok strong { color: $signal-green; }
  &.nuevo strong { color: $brand-orange; }
  &.aviso strong { color: $signal-amber; }
  &.is-zero strong { color: $ink-400; }
}

.errores {
  list-style: none;
  margin: 0;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  border: 1px solid rgba($signal-amber, 0.35);
  background: rgba($signal-amber, 0.08);
  color: $ink-200;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: $space-1;

  i { color: $signal-amber; margin-right: $space-2; }
}

.acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  flex-wrap: wrap;
  padding: $space-4 $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($brand-orange, 0.3);
  background: rgba($brand-orange, 0.06);

  p { margin: 0; color: $ink-300; font-size: 0.9rem; }
  strong { color: $fg-dark; }
}

// Las secciones suben al aparecer; los números se cruzan al cambiar.
.fade-up-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.fade-up-leave-active { transition: opacity $dur-fast ease, transform $dur-fast ease; }
.fade-up-enter-from { opacity: 0; transform: translateY(10px); }
.fade-up-leave-to { opacity: 0; transform: translateY(-6px); }

.num-enter-active { transition: opacity $dur-base ease, transform $dur-base $ease-spring; }
.num-leave-active { transition: opacity $dur-fast ease, transform $dur-fast ease; }
.num-enter-from { opacity: 0; transform: translateY(8px); }
.num-leave-to { opacity: 0; transform: translateY(-8px); }

@media (prefers-reduced-motion: reduce) {
  .fade-up-enter-active, .fade-up-leave-active, .num-enter-active, .num-leave-active, .stat { transition: none; }
}
</style>
