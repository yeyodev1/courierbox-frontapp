import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type { Gasto } from '@/services/costos.api'
import CostosTable from '../CostosTable.vue'

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: vi.fn() }),
}))

const AppConfirmModalStub = {
  props: ['open', 'title', 'message', 'confirmLabel', 'cancelLabel', 'confirmLoading'],
  emits: ['cancel', 'confirm'],
  template: `
    <div v-if="open" data-test="confirm">
      <span>{{ confirmLoading ? 'Eliminando...' : confirmLabel }}</span>
      <button type="button" class="cancel" @click="$emit('cancel')">{{ cancelLabel }}</button>
      <button type="button" class="confirm" @click="$emit('confirm')">{{ confirmLoading ? 'Eliminando...' : confirmLabel }}</button>
    </div>
  `,
}

const gasto: Gasto = {
  _id: 'g1',
  tipo: 'operacional',
  categoria: 'GASTOS FIJOS',
  monto: 25,
  descripcion: 'Internet',
  fecha: '2026-07-01T00:00:00.000Z',
  proveedor: 'Proveedor A',
  referencia: 'REF-1',
  comprobanteUrl: '',
  numeroFactura: '',
  libras: 0,
  valorPorLibra: 0,
  valorTotal: 25,
  valorPagado: 0,
  creadoPor: 'u1',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

describe('CostosTable', () => {
  it('muestra carga al confirmar borrado y espera el callback', async () => {
    const wrapper = mount(CostosTable, {
      props: {
        gastos: [gasto],
        loading: false,
        error: '',
        deleting: false,
      },
      global: {
        stubs: {
          AppConfirmModal: AppConfirmModalStub,
        },
      },
    })

    await wrapper.findAll('button.btn-icon.danger')[0]!.trigger('click')
    expect(wrapper.find('[data-test="confirm"]').exists()).toBe(true)

    await wrapper.get('button.confirm').trigger('click')
    const deleteEvent = wrapper.emitted('delete')?.[0]
    expect(deleteEvent?.[0]).toBe('g1')
    expect(typeof deleteEvent?.[1]).toBe('function')

    await nextTick()
    expect(wrapper.get('[data-test="confirm"]').text()).toContain('Eliminando...')

    ;(deleteEvent?.[1] as (success: boolean) => void)(true)
    await flushPromises()
    expect(wrapper.find('[data-test="confirm"]').exists()).toBe(false)
  })

  it('mantiene el modal abierto si el borrado falla', async () => {
    const wrapper = mount(CostosTable, {
      props: {
        gastos: [gasto],
        loading: false,
        error: '',
        deleting: false,
      },
      global: {
        stubs: {
          AppConfirmModal: AppConfirmModalStub,
        },
      },
    })

    await wrapper.findAll('button.btn-icon.danger')[0]!.trigger('click')
    await wrapper.get('button.confirm').trigger('click')
    const deleteEvent = wrapper.emitted('delete')?.[0]
    ;(deleteEvent?.[1] as (success: boolean) => void)(false)
    await nextTick()

    expect(wrapper.find('[data-test="confirm"]').exists()).toBe(true)
  })
})
