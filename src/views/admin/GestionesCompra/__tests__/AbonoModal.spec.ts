import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AbonoModal from '../AbonoModal.vue'

const AppModalStub = {
  props: ['show', 'title'],
  template: '<div v-if="show" data-test="modal"><slot /><slot name="footer" /></div>',
}
const AppDatePickerStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: '<input type="date" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const AppSelectStub = {
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  template: `<select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
  </select>`,
}

function mountModal(saldoPendiente = 300) {
  return mount(AbonoModal, {
    props: { show: true, saldoPendiente, saving: false },
    global: { stubs: { AppModal: AppModalStub, AppDatePicker: AppDatePickerStub, AppSelect: AppSelectStub } },
  })
}

const montoInput = (wrapper: ReturnType<typeof mountModal>) =>
  wrapper.get('[data-test="modal"]').get('input[type="number"]')

describe('AbonoModal', () => {
  it('propone saldar el total pendiente, que es el caso común', async () => {
    const wrapper = mountModal(300)
    await flushPromises()

    expect((montoInput(wrapper).element as HTMLInputElement).value).toBe('300')
  })

  it('dice cuánto quedaría por cobrar con un abono parcial', async () => {
    const wrapper = mountModal(300)
    await flushPromises()
    await montoInput(wrapper).setValue('120')

    expect(wrapper.text()).toContain('$180.00')
  })

  it('avisa que queda saldada cuando el abono cubre todo', async () => {
    const wrapper = mountModal(300)
    await flushPromises()

    expect(wrapper.text()).toContain('queda saldada')
  })

  it('rechaza un abono mayor al saldo antes de llegar al servidor', async () => {
    const wrapper = mountModal(300)
    await flushPromises()
    await montoInput(wrapper).setValue('400')

    expect(wrapper.text()).toContain('supera el saldo pendiente')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('rechaza un abono en cero', async () => {
    const wrapper = mountModal(300)
    await flushPromises()
    await montoInput(wrapper).setValue('0')

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('emite monto, fecha y método tal como se escribieron', async () => {
    const wrapper = mountModal(300)
    await flushPromises()

    await montoInput(wrapper).setValue('120')
    await wrapper.get('input[type="date"]').setValue('2026-08-14')
    await wrapper.get('select').setValue('efectivo')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({
      monto: 120,
      fecha: '2026-08-14',
      metodo: 'efectivo',
    })
  })

  it('reinicia el formulario cada vez que se abre, sin arrastrar el abono anterior', async () => {
    const wrapper = mountModal(300)
    await flushPromises()
    await montoInput(wrapper).setValue('50')

    await wrapper.setProps({ show: false })
    await wrapper.setProps({ show: true, saldoPendiente: 180 })
    await flushPromises()

    expect((montoInput(wrapper).element as HTMLInputElement).value).toBe('180')
  })

  it('no deja registrar dos veces mientras el guardado está en vuelo', async () => {
    const wrapper = mountModal(300)
    await flushPromises()
    await wrapper.setProps({ saving: true })

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
