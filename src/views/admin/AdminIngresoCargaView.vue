<script setup lang="ts">
/**
 * Ingreso de carga.
 *
 * El manifiesto por vuelo llega en Excel, una fila por caja, con el cliente
 * escrito a mano. Aquí se sube ese archivo y cada caja queda colgada de su
 * cliente: si el nombre ya existe se reutiliza, si no, se crea. Elegir el
 * archivo muestra primero qué va a pasar; nada se escribe hasta confirmar.
 */
import { computed } from 'vue'
import AppFileUpload from '@/components/ui/AppFileUpload.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import IngresoCargaTabla from './IngresoCarga/IngresoCargaTabla.vue'
import { useIngresoCarga } from './IngresoCarga/useIngresoCarga'

const ic = useIngresoCarga()

const cajas = computed(() => {
  const v = ic.vista.value
  return v ? v.paquetesNuevos + v.paquetesActualizados : 0
})
</script>

<template>
  <div class="ingreso">
    <header class="head">
      <div>
        <h1>Ingreso de carga</h1>
        <p>
          Sube el manifiesto del vuelo (.xlsx). Cada caja queda con su cliente: el que ya existe se
          reutiliza y el que no, se crea con casillero. Primero ves qué va a pasar; nada se guarda hasta
          que confirmes.
        </p>
      </div>
      <button v-if="ic.archivo.value" type="button" class="btn ghost" :disabled="ic.aplicando.value" @click="ic.reiniciar">
        <i class="fa-solid fa-rotate-left" aria-hidden="true" /> Otro archivo
      </button>
    </header>

    <section v-if="!ic.aplicado.value" class="panel">
      <AppFileUpload
        v-model="ic.archivo.value"
        label="Manifiesto de ingreso de carga"
        hint="Excel con las columnas BOX ID, CLIENTE, Peso, Descripción… como el archivo INGRESO DE CARGA.xlsx"
        accept=".xlsx,.xls"
        :disabled="ic.cargando.value || ic.aplicando.value"
        :error="ic.errorArchivo.value"
      />
    </section>

    <div v-if="ic.cargando.value" aria-busy="true">
      <AppSkeleton variant="card" height="88px" :count="4" gap="0.75rem" />
    </div>

    <template v-else-if="ic.vista.value">
      <section
        v-if="ic.aplicado.value"
        class="banner"
        :class="{ 'con-pendientes': ic.vista.value.sinCliente > 0 }"
        data-test="banner-aplicado"
      >
        <i class="fa-solid" :class="ic.vista.value.sinCliente > 0 ? 'fa-triangle-exclamation' : 'fa-circle-check'" aria-hidden="true" />
        <div>
          <strong>Carga ingresada.</strong>
          {{ cajas }} cajas registradas y {{ ic.vista.value.clientesCreados }} clientes nuevos.
          <template v-if="ic.vista.value.sinCliente > 0">
            {{ ic.vista.value.sinCliente }} cajas venían sin nombre de cliente y esperan en
            <RouterLink to="/admin/homologacion">Homologación</RouterLink>.
          </template>
        </div>
      </section>

      <section class="stats">
        <article class="stat">
          <span>Cajas en el archivo</span>
          <strong>{{ ic.vista.value.totalFilas }}</strong>
          <small>{{ ic.vista.value.paquetesNuevos }} nuevas · {{ ic.vista.value.paquetesActualizados }} ya registradas</small>
        </article>
        <article class="stat ok">
          <span>Clientes existentes</span>
          <strong>{{ ic.vista.value.clientesExistentes }}</strong>
          <small>Reconocidos por nombre o alias</small>
        </article>
        <article class="stat nuevo" :class="{ 'is-zero': ic.vista.value.clientesCreados === 0 }">
          <span>{{ ic.aplicado.value ? 'Clientes creados' : 'Clientes a crear' }}</span>
          <strong>{{ ic.vista.value.clientesCreados }}</strong>
          <small>Con casillero asignado</small>
        </article>
        <article class="stat aviso" :class="{ 'is-zero': ic.vista.value.aproximados === 0 }">
          <span>Parecidos</span>
          <strong>{{ ic.vista.value.aproximados }}</strong>
          <small>Nombre casi igual a un cliente; revísalos</small>
        </article>
        <article class="stat" :class="{ 'is-zero': ic.vista.value.sinCliente === 0 }">
          <span>Sin cliente</span>
          <strong>{{ ic.vista.value.sinCliente }}</strong>
          <small>Van a Homologación</small>
        </article>
      </section>

      <ul v-if="ic.vista.value.errores.length" class="errores" data-test="errores">
        <li v-for="(e, i) in ic.vista.value.errores" :key="i"><i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ e }}</li>
      </ul>

      <IngresoCargaTabla :filas="ic.vista.value.filas" :aplicado="ic.aplicado.value" />

      <footer v-if="!ic.aplicado.value" class="acciones">
        <p>
          Al confirmar se crean <strong>{{ ic.vista.value.clientesCreados }}</strong> clientes y se registran
          <strong>{{ cajas }}</strong> cajas.
        </p>
        <button
          type="button"
          class="btn primary"
          :disabled="!ic.puedeAplicar.value"
          data-test="confirmar"
          @click="ic.aplicar"
        >
          <i class="fa-solid" :class="ic.aplicando.value ? 'fa-spinner fa-spin' : 'fa-file-import'" aria-hidden="true" />
          {{ ic.aplicando.value ? 'Ingresando…' : 'Confirmar ingreso' }}
        </button>
      </footer>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens/colors' as *;
@use '@/styles/tokens/space' as *;
@use './Homologacion/homologacion-ui' as ui;

@include ui.buttons;

.ingreso {
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

  h1 { margin: 0 0 $space-1; font-size: 1.5rem; }
  p { margin: 0; color: $ink-400; font-size: 0.9rem; max-width: 66ch; }
}

.panel {
  padding: $space-5;
  border-radius: $radius-lg;
  border: 1px solid rgba($ink-500, 0.15);
  background: $ink-900;
}

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

  &.con-pendientes {
    border-color: rgba($signal-amber, 0.4);
    background: rgba($signal-amber, 0.08);
    > i { color: $signal-amber; }
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
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

  span { color: $ink-400; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
  strong { font-size: 1.7rem; color: $fg-dark; font-variant-numeric: tabular-nums; }
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
</style>
