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
  template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"></select>',
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

  it('autocalcula el total por libras y bloquea el monto manual en ese modo', async () => {
    const wrapper = mount(CostosFormModal, {
      props: {
        show: true,
        saving: false,
      },
      global: {
        stubs: {
          AppSelect: AppSelectStub,
          AppDatePicker: AppDatePickerStub,
          AppFileUpload: AppFileUploadStub,
          AppModal: AppModalStub,
        },
      },
    })

    await flushPromises()

    const modal = wrapper.get('[data-test="modal"]')
    await modal.get('input[type="checkbox"]').setValue(true)
    await wrapper.vm.$nextTick()

    const inputs = modal.findAll('input[type="number"]')
    await inputs[1]!.setValue('5')
    await inputs[2]!.setValue('6.5')
    await flushPromises()

    expect(inputs[0]!.attributes('disabled')).toBeDefined()
    expect(inputs[3]!.attributes('disabled')).toBeDefined()
    expect((inputs[3]!.element as HTMLInputElement).value).toBe('32.5')
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('32.5')
  })
})
