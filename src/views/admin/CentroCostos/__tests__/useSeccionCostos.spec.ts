import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  resumen: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  uploadFactura: vi.fn(),
  showNotification: vi.fn(),
}))

vi.mock('@/services/costos.api', async () => {
  const actual = await vi.importActual<any>('@/services/costos.api')
  return {
    ...actual,
    costosApi: {
      list: mocks.list,
      resumen: mocks.resumen,
      create: mocks.create,
      update: mocks.update,
      uploadFactura: mocks.uploadFactura,
      remove: vi.fn(),
    },
  }
})

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: mocks.showNotification }),
}))

import { useSeccionCostos, type SeccionConfig } from '../useSeccionCostos'

/** `onMounted` only runs inside a component, so the composable is driven through one. */
function run(config: SeccionConfig) {
  let api!: ReturnType<typeof useSeccionCostos>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useSeccionCostos(config)
        return () => h('div')
      },
    }),
  )
  return { api: () => api, wrapper }
}

const GENERALES: SeccionConfig = { seccion: 'generales', tipoPorDefecto: 'operacional' }
const RECEPCIONES: SeccionConfig = { seccion: 'recepciones', tipoPorDefecto: 'recepcion' }

describe('useSeccionCostos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue({ gastos: [], total: 0 })
    mocks.resumen.mockResolvedValue({ resumen: { total: { total: 0, facturas: 0, libras: 0, paquetes: 0, costoPorLibra: 0 } } })
  })

  it('pide al servidor solo la sección de la pestaña, en la lista y en los totales', async () => {
    run(RECEPCIONES)
    await flushPromises()

    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ seccion: 'recepciones' }))
    expect(mocks.resumen).toHaveBeenCalledWith(expect.objectContaining({ seccion: 'recepciones' }))
  })

  it('archiva lo nuevo bajo el tipo de su sección, para que no caiga en otra pestaña', async () => {
    const { api } = run(RECEPCIONES)
    await flushPromises()
    mocks.create.mockResolvedValue({ gasto: { _id: 'g1' } })

    await api().handleSave({ categoria: 'IMPORTACIONES', monto: 300 }, null)

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'recepcion' }))
  })

  it('respeta el tipo que ya trae un registro que se está editando', async () => {
    const { api } = run(GENERALES)
    await flushPromises()
    mocks.create.mockResolvedValue({ gasto: { _id: 'g1' } })

    await api().handleSave({ categoria: 'TRANSPORTE', monto: 20, tipo: 'envio' }, null)

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'envio' }))
  })

  it('actualiza en vez de crear cuando se abrió un registro para editar', async () => {
    const { api } = run(GENERALES)
    await flushPromises()
    mocks.update.mockResolvedValue({ gasto: { _id: 'g1' } })

    api().openEdit({ _id: 'g1' } as any)
    await api().handleSave({ categoria: 'Renta', monto: 500 }, null)

    expect(mocks.update).toHaveBeenCalledWith('g1', expect.objectContaining({ tipo: 'operacional' }))
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('sube el comprobante contra el registro recién guardado', async () => {
    const { api } = run(GENERALES)
    await flushPromises()
    mocks.create.mockResolvedValue({ gasto: { _id: 'nuevo' } })
    const file = new File(['x'], 'factura.pdf')

    await api().handleSave({ categoria: 'Renta', monto: 500 }, file)

    expect(mocks.uploadFactura).toHaveBeenCalledWith('nuevo', file)
  })

  it('muestra una lista vacía en vez de romperse si el payload viene mal formado', async () => {
    mocks.list.mockResolvedValue({} as any)
    mocks.resumen.mockResolvedValue({} as any)
    const { api } = run(GENERALES)
    await flushPromises()

    expect(api().gastos.value).toEqual([])
    expect(api().resumenSeguro.value).toBeNull()
  })

  it('avisa del error y deja la lista utilizable cuando la carga falla', async () => {
    mocks.list.mockRejectedValue(new Error('Servidor caído'))
    const { api } = run(GENERALES)
    await flushPromises()

    expect(api().gastos.value).toEqual([])
    expect(api().loading.value).toBe(false)
    expect(mocks.showNotification).toHaveBeenCalledWith('Servidor caído', 'error')
  })

  it('recarga cuando cambia el rango de fechas', async () => {
    const { api } = run(GENERALES)
    await flushPromises()
    expect(mocks.list).toHaveBeenCalledTimes(1)

    api().filtroDesde.value = '2026-08-01'
    await flushPromises()

    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(mocks.list).toHaveBeenLastCalledWith(expect.objectContaining({ desde: '2026-08-01' }))
  })
})
