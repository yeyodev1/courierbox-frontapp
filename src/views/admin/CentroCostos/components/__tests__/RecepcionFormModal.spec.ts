import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import RecepcionFormModal from '../RecepcionFormModal.vue'

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
const AppFileUploadStub = { props: ['modelValue', 'label'], template: '<input type="file" />' }
const AppModalStub = {
  props: ['show', 'title'],
  template: '<div v-if="show" data-test="modal"><slot /><slot name="footer" /></div>',
}

/**
 * A reception records what a pound cost. The rate is the input and the total is
 * derived from it — the reverse would let a typed total contradict the rate it
 * is supposed to come from.
 */
describe('RecepcionFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue({ proveedores: [] })
  })

  function mountForm() {
    return mount(RecepcionFormModal, {
      props: { show: true, saving: false },
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

  /** Package count, pounds, rate, amount paid — in template order. */
  async function fillWeight(wrapper: ReturnType<typeof mountForm>, libras: string, rate: string) {
    const numbers = wrapper.get('[data-test="modal"]').findAll('input[type="number"]')
    await numbers[1]!.setValue(libras)
    await numbers[2]!.setValue(rate)
    await flushPromises()
    return numbers
  }

  it('deriva el total de las libras por el valor por libra', async () => {
    const wrapper = mountForm()
    await flushPromises()

    await fillWeight(wrapper, '126.4', '3')

    expect(wrapper.get('[data-test="modal"]').text()).toContain('$379.20')
  })

  it('no ofrece un campo de total que pueda contradecir a la tarifa', async () => {
    const wrapper = mountForm()
    await flushPromises()
    await fillWeight(wrapper, '10', '2')

    const values = wrapper
      .get('[data-test="modal"]')
      .findAll('input[type="number"]')
      .map((input) => (input.element as HTMLInputElement).value)
    expect(values).not.toContain('20')
  })

  it('envía las libras, la tarifa y los paquetes tal como se escribieron', async () => {
    const wrapper = mountForm()
    await flushPromises()

    const modal = wrapper.get('[data-test="modal"]')
    await modal.get('select').setValue('IMPORTACIONES')
    await modal.findAll('input[type="text"], input:not([type])')[0]!.setValue('Carga recibida de TMA')
    const numbers = await fillWeight(wrapper, '126.4', '3')
    await numbers[0]!.setValue('58')
    await flushPromises()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    const [payload] = wrapper.emitted('save')?.[0] as [Record<string, unknown>]
    expect(payload).toMatchObject({
      tipo: 'recepcion',
      categoria: 'IMPORTACIONES',
      libras: 126.4,
      valorPorLibra: 3,
      numeroPaquetes: 58,
      valorTotal: 379.2,
    })
  })

  it('rechaza una recepción sin tarifa en vez de guardarla como gasto suelto', async () => {
    const wrapper = mountForm()
    await flushPromises()

    const modal = wrapper.get('[data-test="modal"]')
    await modal.get('select').setValue('IMPORTACIONES')
    await modal.findAll('input[type="text"], input:not([type])')[0]!.setValue('Carga sin tarifa')
    await modal.findAll('input[type="number"]')[1]!.setValue('126.4')
    await flushPromises()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.emitted('save')).toBeUndefined()
    expect(mocks.showNotification).toHaveBeenCalledWith(
      expect.stringContaining('valor por libra'),
      'error',
    )
  })
})
