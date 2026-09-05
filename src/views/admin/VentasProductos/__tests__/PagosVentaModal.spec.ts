import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PagosVentaModal from '../PagosVentaModal.vue'
import type { Venta } from '../useVentasProductos'

const AppModalStub = {
  props: ['show', 'title', 'icon', 'iconVariant', 'maxWidth', 'disableClose'],
  template: `<div v-if="show"><slot /><slot name="footer" /></div>`,
}
const AppDatePickerStub = {
  props: ['modelValue', 'label'],
  template: `<input class="date" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
}
const AppSelectStub = {
  props: ['modelValue', 'options', 'placeholder'],
  template: `<select class="metodo" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)"></select>`,
}

const global = {
  stubs: {
    AppModal: AppModalStub,
    AppDatePicker: AppDatePickerStub,
    AppSelect: AppSelectStub,
  },
}

function venta(overrides: Partial<Venta> = {}): Venta {
  return {
    _id: 'v1',
    fecha: '2026-08-31T00:00:00.000Z',
    clienteNombre: 'Sergio Buenaventura',
    productoNombre: 'CAMARA TPLINK',
    cantidad: 1,
    metodoPago: 'transferencia',
    total: 35,
    valorPagado: 0,
    saldo: 35,
    estadoPago: 'pendiente',
    esCredito: false,
    abonos: [],
    cuotas: [],
    vendedorNombre: 'Oscar Ugarte',
    ...overrides,
  }
}

describe('PagosVentaModal', () => {
  it('propone saldar el pendiente completo al abrir', () => {
    const wrapper = mount(PagosVentaModal, {
      props: { show: true, venta: venta() },
      global,
    })
    expect((wrapper.find('input[type="number"]').element as HTMLInputElement).value).toBe('35')
  })

  it('rechaza un abono mayor al saldo antes de llamar al servidor', async () => {
    const wrapper = mount(PagosVentaModal, {
      props: { show: true, venta: venta({ valorPagado: 20, saldo: 15 }) },
      global,
    })
    await wrapper.find('input[type="number"]').setValue(40)
    expect(wrapper.text()).toContain('supera el saldo pendiente')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('registrar')).toBeUndefined()
  })

  it('emite el abono con monto, fecha y método', async () => {
    const wrapper = mount(PagosVentaModal, {
      props: { show: true, venta: venta() },
      global,
    })
    await wrapper.find('input[type="number"]').setValue(20)
    await wrapper.find('form').trigger('submit')

    const payload = wrapper.emitted('registrar')?.[0]?.[0] as Record<string, unknown>
    expect(payload).toMatchObject({ monto: 20 })
    expect(payload.fecha).toBeTruthy()
    expect(payload.metodo).toBe('transferencia')
  })

  it('lista los abonos y pide confirmación antes de eliminar uno', async () => {
    const wrapper = mount(PagosVentaModal, {
      props: {
        show: true,
        venta: venta({
          valorPagado: 20,
          saldo: 15,
          abonos: [
            {
              _id: 'a1',
              monto: 20,
              fecha: '2026-08-31T00:00:00.000Z',
              metodo: 'efectivo',
              referencia: 'REF-9',
              notas: '',
              registradoPorNombre: 'Oscar',
              createdAt: '2026-08-31T00:00:00.000Z',
            },
          ],
        }),
      },
      global,
    })

    expect(wrapper.text()).toContain('REF-9')

    await wrapper.find('.btn-icon').trigger('click')
    expect(wrapper.emitted('eliminar')).toBeUndefined()
    expect(wrapper.text()).toContain('¿Eliminar?')

    await wrapper.find('.btn-danger').trigger('click')
    expect(wrapper.emitted('eliminar')?.[0]).toEqual(['a1'])
  })

  it('no ofrece registrar abonos en una venta ya saldada', () => {
    const wrapper = mount(PagosVentaModal, {
      props: { show: true, venta: venta({ valorPagado: 35, saldo: 0, estadoPago: 'pagado' }) },
      global,
    })
    expect(wrapper.text()).toContain('pagada por completo')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
