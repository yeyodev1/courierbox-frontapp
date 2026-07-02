import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import CostosFormModal from '../CostosFormModal.vue'

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: vi.fn() }),
}))

const AppSelectStub = { template: '<div />' }
const AppDatePickerStub = { template: '<div />' }
const AppFileUploadStub = { template: '<div />' }
const AppModalStub = {
  props: ['show', 'title'],
  template: '<div v-if="show"><slot /><slot name="footer" /></div>',
}

describe('CostosFormModal', () => {
  it('bloquea guardar mientras se está enviando', () => {
    const wrapper = mount(CostosFormModal, {
      props: {
        show: true,
        saving: true,
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

    const saveButton = wrapper.get('button.btn-primary')
    const cancelButton = wrapper.get('button.btn-ghost')

    expect(saveButton.attributes('disabled')).toBeDefined()
    expect(saveButton.text()).toContain('Guardando...')
    expect(cancelButton.attributes('disabled')).toBeDefined()
  })
})
