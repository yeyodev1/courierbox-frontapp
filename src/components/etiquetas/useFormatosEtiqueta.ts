import { ref } from 'vue'
import { aliadosApi } from '@/services/aliados.api'
import { FORMATOS, formatoDesdeAliado, type FormatoEtiqueta } from './etiqueta-formatos'

/**
 * Los formatos de etiqueta del catálogo de Aliados. Arranca con los de siempre
 * y los reemplaza cuando llega el catálogo; se lee una vez por sesión.
 */
const formatos = ref<FormatoEtiqueta[]>(FORMATOS)
let pedido: Promise<void> | null = null

export function useFormatosEtiqueta() {
  if (!pedido) {
    pedido = aliadosApi
      .listar()
      .then((aliados) => {
        if (aliados.length) formatos.value = aliados.map(formatoDesdeAliado)
      })
      .catch(() => {
        // Sin catálogo se imprime con los formatos de siempre; se reintenta la próxima vez.
        pedido = null
      })
  }
  return { formatos, listo: pedido ?? Promise.resolve() }
}

/** Tras editar un aliado, para que las etiquetas tomen el cambio sin recargar. */
export function refrescarFormatosEtiqueta(aliados: Parameters<typeof formatoDesdeAliado>[0][]) {
  formatos.value = aliados.length ? aliados.map(formatoDesdeAliado) : FORMATOS
  pedido = Promise.resolve()
}
