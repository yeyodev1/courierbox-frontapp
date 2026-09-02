import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import CostosFormModal from '../CostosFormModal.vue'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  showNotification: vi.fn(),
}))

vi.mock('@/services/proveedores.api', () => ({
  proveedoresApi: { list: mocks.list, create: mocks.create },
}))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: mocks.showNotification }),
}))

const AppSelectStub = {
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  template: `<select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <option v-for="o in options" :key="o" :value="o">{{ o }}</option>
  </select>`,
}
const AppDatePickerStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: '<input type="date" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const AppFileUploadStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: '<input type="file" />',
}
const AppModalStub = {
  props: ['show', 'title'],
  template: '<div v-if="show" data-test="modal"><slot /><slot name="footer" /></div>',
}

describe('CostosFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue({ proveedores: [] })
  })

  function mountForm(props: Record<string, unknown> = {}) {
    return mount(CostosFormModal, {
      props: { show: true, saving: false, tipo: 'operacional', ...props },
      global: {
        stubs: {
          AppSelect: AppSelectStub,
          AppDatePicker: AppDatePickerStub,
          AppFileUpload: AppFileUploadStub,
          AppModal: AppModalStub,
        },
      },
    })
  }

  it('no ofrece campos de libras: el peso es de una recepción, no de un gasto', async () => {
    const wrapper = mountForm()
    await flushPromises()

    const modal = wrapper.get('[data-test="modal"]')
    expect(modal.findAll('input[type="checkbox"]')).toHaveLength(0)
    expect(modal.text()).not.toContain('Valor por libra')
  })

  it('deja escribir el monto a mano, que es lo único que define un gasto', async () => {
    const wrapper = mountForm()
    await flushPromises()

    const monto = wrapper.get('[data-test="modal"]').findAll('input[type="number"]')[0]!
    expect(monto.attributes('disabled')).toBeUndefined()

    await monto.setValue('42.5')
    await flushPromises()
    expect((monto.element as HTMLInputElement).value).toBe('42.5')
  })

  it('archiva el registro bajo el tipo de su pestaña, no bajo uno elegido a mano', async () => {
    const wrapper = mountForm({ tipo: 'envio' })
    await flushPromises()

    const modal = wrapper.get('[data-test="modal"]')
    await modal.findAll('input[type="number"]')[0]!.setValue('30')
    await modal.findAll('input[type="text"], input:not([type])')[0]!.setValue('Combustible ruta norte')
    await modal.get('select').setValue('COMBUSTIBLE')
    await flushPromises()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [payload] = wrapper.emitted('save')?.[0] as [Record<string, unknown>]
    expect(payload.tipo).toBe('envio')
    expect(payload.libras).toBe(0)
    expect(payload.valorPorLibra).toBe(0)
  })
})
