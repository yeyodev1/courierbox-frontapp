import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminCajaView from '../AdminCajaView.vue'
import { buildQuery, formatDate, formatMoney, canDeleteCajaMovimiento, CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '../caja.utils'

const mocks = vi.hoisted(() => ({
  getData: vi.fn(),
  postData: vi.fn(),
  deleteData: vi.fn(),
  buscarContactos: vi.fn(),
  push: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/stores/toast.store', () => ({
  useToastStore: () => ({ showNotification: vi.fn() }),
}))

vi.mock('@/services/admin.api', () => ({
  adminApi: { getData: mocks.getData, postData: mocks.postData, deleteData: mocks.deleteData },
}))

vi.mock('@/services/contactos.api', () => ({
  contactosApi: { list: mocks.buscarContactos },
}))

const AppSelectStub = {
  props: ['modelValue', 'options', 'label'],
  emits: ['update:modelValue'],
  template: `
    <label>
      <span v-if="label">{{ label }}</span>
      <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option v-for="opt in options" :key="typeof opt === 'string' ? opt : opt.value" :value="typeof opt === 'string' ? opt : opt.value">{{ typeof opt === 'string' ? opt : opt.label }}</option>
      </select>
    </label>
  `,
}

const AppDatePickerStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <label>
      <span v-if="label">{{ label }}</span>
      <input type="date" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
    </label>
  `,
}

const AppFileUploadStub = {
  props: ['modelValue', 'label'],
  emits: ['update:modelValue'],
  template: `
    <label>
      <span v-if="label">{{ label }}</span>
      <input type="file" @change="$emit('update:modelValue', $event.target.files?.[0] || null)" />
    </label>
  `,
}

const AppModalStub = {
  props: ['show', 'title'],
  template: `
    <div v-if="show" data-test="modal">
      <h3>{{ title }}</h3>
      <slot />
      <slot name="footer" />
    </div>
  `,
}

const AppConfirmModalStub = {
  props: ['open', 'title', 'message'],
  emits: ['cancel', 'confirm'],
  template: `
    <div v-if="open" data-test="confirm">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button type="button" @click="$emit('cancel')">Cancelar</button>
      <button type="button" @click="$emit('confirm')">Confirmar</button>
    </div>
  `,
}

function makeResponse(data: unknown) {
  return Promise.resolve(data)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getData.mockImplementation((endpoint: string) => {
    if (endpoint.startsWith('v1/caja/resumen')) {
      return makeResponse({
        ingresos: { total: 250, count: 2 },
        egresos: { total: 100, count: 1 },
        saldo: 150,
        acumulado: {
          ingresos: { total: 500, count: 4 },
          egresos: { total: 32, count: 1 },
          saldo: 468,
          hasta: '2026-08-28',
        },
        porTipo: [
          { _id: 'ingreso', total: 250, count: 2 },
          { _id: 'egreso', total: 100, count: 1 },
        ],
        porCategoria: [
          { _id: 'VENTA', total: 200, count: 2 },
          { _id: 'COMBUSTIBLE', total: 100, count: 1 },
        ],
      })
    }

    return makeResponse({
      movimientos: [
        {
          _id: '1',
          tipo: 'ingreso',
          categoria: 'VENTA',
          monto: 200,
          clienteNombre: 'Juan Perez',
          descripcion: 'Pago contado',
          referencia: 'F001',
          comprobanteUrl: 'https://example.com/a.pdf',
          fecha: '2026-07-01T12:00:00.000Z',
          createdAt: '2026-07-01T12:00:00.000Z',
        },
      ],
      total: 1,
    })
  })
  mocks.postData.mockResolvedValue({ movimiento: { _id: 'new-1' } })
  mocks.deleteData.mockResolvedValue({ message: 'Movimiento eliminado' })
  mocks.buscarContactos.mockResolvedValue({ contactos: [{ _id: 'c1', clientName: 'Juan Perez', clientEmail: 'juan@example.com', clientPhone: '0999999999', totalOrders: 2, totalAmount: 120, lastOrderDate: '2026-06-30T12:00:00.000Z', firstOrderDate: '2026-06-01T12:00:00.000Z', asesores: [] }], total: 1 })
})

describe('caja utils', () => {
  it('buildQuery omite vacíos', () => {
    expect(buildQuery({ tipo: 'ingreso', categoria: '', desde: '2026-07-01', hasta: undefined })).toBe('tipo=ingreso&desde=2026-07-01')
  })

  it('formatMoney y formatDate formatean bien', () => {
    expect(formatMoney(150)).toBe('$150.00')
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatDate('2026-07-01T12:00:00.000Z')).toContain('2026')
  })

  it('formatMoney pone el signo antes del símbolo', () => {
    expect(formatMoney(-32)).toBe('-$32.00')
  })

  it('formatDate no retrocede un día en un día de calendario', () => {
    // El gasto del 28 se mostraba como 27 al leer la medianoche UTC en UTC-5.
    expect(formatDate('2026-08-28')).toContain('28')
  })

  it('canDeleteCajaMovimiento respeta la regla de 7 días', () => {
    expect(canDeleteCajaMovimiento({ fecha: new Date(Date.now() - 3 * 86400000).toISOString(), createdAt: new Date().toISOString() })).toBe(true)
    expect(canDeleteCajaMovimiento({ fecha: new Date(Date.now() - 8 * 86400000).toISOString(), createdAt: new Date().toISOString() })).toBe(false)
  })

  it('categorías están separadas por tipo', () => {
    expect(CATEGORIAS_INGRESO).toContain('VENTA')
    expect(CATEGORIAS_EGRESO).toContain('TRANSPORTE')
  })
})

describe('AdminCajaView', () => {
  const mountView = () => mount(AdminCajaView, {
    global: {
      stubs: {
        AppSelect: AppSelectStub,
        AppDatePicker: AppDatePickerStub,
        AppFileUpload: AppFileUploadStub,
        AppModal: AppModalStub,
        AppConfirmModal: AppConfirmModalStub,
      },
    },
  })

  it('renderiza métricas y lista de movimientos', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Ingresos del periodo')
    expect(wrapper.text()).toContain('Egresos del periodo')
    expect(wrapper.text()).toContain('Saldo en caja')
    expect(wrapper.text()).toContain('Juan Perez')
  })

  it('muestra el saldo acumulado, no el neto del rango filtrado', async () => {
    const wrapper = mountView()
    await flushPromises()

    // El filtro arranca el día 1 del mes; el saldo debe seguir siendo el de la
    // caja completa ($468), no el neto del periodo ($150).
    const saldo = wrapper.get('.stat-card.balance')
    expect(saldo.text()).toContain('$468.00')
    expect(saldo.text()).toContain('Todo el histórico hasta')
  })

  it('marca en rojo un neto negativo sin confundirlo con el saldo', async () => {
    mocks.getData.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('v1/caja/resumen')) {
        return makeResponse({
          ingresos: { total: 0, count: 0 },
          egresos: { total: 32, count: 1 },
          saldo: -32,
          acumulado: { ingresos: { total: 500, count: 3 }, egresos: { total: 32, count: 1 }, saldo: 468, hasta: '2026-08-28' },
          porTipo: [],
          porCategoria: [],
        })
      }
      return makeResponse({ movimientos: [], total: 0 })
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('.stat-card.balance').text()).toContain('$468.00')
    const neto = wrapper.get('.stat-card.neto')
    expect(neto.text()).toContain('-$32.00')
    expect(neto.get('strong').classes()).toContain('is-negative')
  })

  it('abre el modal de nuevo movimiento', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button.btn-primary').trigger('click')
    expect(wrapper.text()).toContain('Nuevo movimiento')
    expect(wrapper.find('[data-test="modal"]').exists()).toBe(true)
  })

  it('abre contactos desde el modal cuando no existe el cliente', async () => {
    mocks.buscarContactos.mockResolvedValueOnce({ contactos: [], total: 0 })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button.btn-primary').trigger('click')
    const modal = wrapper.get('[data-test="modal"]')
    const searchInput = modal.get('input[placeholder="Buscar cliente"]')
    await searchInput.setValue('Cliente Inexistente')
    await wrapper.vm.$nextTick()

    expect(modal.text()).toContain('No existe este cliente aún.')
  })

  it('muestra cliente solo en ingreso', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button.btn-primary').trigger('click')
    expect(wrapper.text()).toContain('Cliente')

    const modal = wrapper.get('[data-test="modal"]')
    const selects = modal.findAll('select')
    await selects[0]!.setValue('egreso')
    await wrapper.vm.$nextTick()
    expect(modal.text()).not.toContain('Busca un cliente existente')
  })

  it('busca contactos por correo y teléfono', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button.btn-primary').trigger('click')
    const modal = wrapper.get('[data-test="modal"]')
    const searchInput = modal.get('input[placeholder="Buscar cliente"]')
    await searchInput.setValue('juan@example.com')
    await flushPromises()

    expect(mocks.buscarContactos).toHaveBeenCalled()
    expect(modal.text()).toContain('Juan Perez')
  })

  it('reutiliza un contacto existente sin mostrar el aviso de inexistencia', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button.btn-primary').trigger('click')
    const modal = wrapper.get('[data-test="modal"]')
    await modal.get('input[placeholder="Buscar cliente"]').setValue('juan@example.com')
    await flushPromises()

    await modal.get('button.client-result').trigger('click')
    expect(modal.text()).toContain('Juan Perez')
    expect(modal.text()).not.toContain('No existe este cliente aún.')
  })

  it('guarda y muestra toast', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('button.btn-primary').trigger('click')
    const modal = wrapper.get('[data-test="modal"]')
    const inputs = modal.findAll('input[type="date"], input[type="number"], input[type="text"], textarea')
    await inputs[1]!.setValue('120')
    await inputs[2]!.setValue('Pago cliente')
    const modalButtons = modal.findAll('button')
    await modalButtons.find((btn) => btn.text() === 'Guardar movimiento')!.trigger('click')

    expect(mocks.postData).toHaveBeenCalled()
  })

  it('bloquea borrar si el movimiento supera los 7 días', async () => {
    mocks.getData.mockImplementationOnce((endpoint: string) => {
      if (endpoint.startsWith('v1/caja/resumen')) return makeResponse({ ingresos: { total: 0, count: 0 }, egresos: { total: 0, count: 0 }, saldo: 0, acumulado: { ingresos: { total: 0, count: 0 }, egresos: { total: 0, count: 0 }, saldo: 0, hasta: null }, porTipo: [], porCategoria: [] })
      return makeResponse({
        movimientos: [
          {
            _id: 'old',
            tipo: 'egreso',
            categoria: 'COMBUSTIBLE',
            monto: 50,
            descripcion: 'Viejo',
            referencia: '',
            fecha: new Date(Date.now() - 8 * 86400000).toISOString(),
            createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
          },
        ],
        total: 1,
      })
    })

    const wrapper = mountView()
    await flushPromises()

    const deleteButtons = wrapper.findAll('.desktop-only button.btn-icon.danger')
    expect(deleteButtons.some((btn) => btn.attributes('disabled') !== undefined)).toBe(true)
  })
})
