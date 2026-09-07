import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StepComision from '../StepComision.vue'
import { useGestionCompraFormStore } from '@/stores/gestion_compra_form.store'

const mocks = vi.hoisted(() => ({ getComisionPreview: vi.fn() }))

vi.mock('@/services/gestiones_compra.api', () => ({
  gestionesCompraAPI: { getComisionPreview: mocks.getComisionPreview },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ userRole: 'asesor' }),
}))

async function mountStep(valorTotal = 100) {
  setActivePinia(createPinia())
  const store = useGestionCompraFormStore()
  store.formData.valorTotal = valorTotal
  store.formData.valorComision = null

  const wrapper = mount(StepComision)
  await flushPromises()
  return { wrapper, store }
}

const input = (wrapper: any) => wrapper.get('input[type="number"]')

describe('StepComision', () => {
  beforeEach(() => vi.clearAllMocks())

  it('acepta la sugerencia cuando hay una regla configurada', async () => {
    mocks.getComisionPreview.mockResolvedValue({
      valorComision: 12.5,
      feeConfigNombre: 'Regla estándar',
      calculada: true,
    })

    const { wrapper, store } = await mountStep()

    expect(store.formData.valorComision).toBe(12.5)
    expect(wrapper.text()).toContain('Regla estándar')
  })

  /**
   * El reporte del cliente: se guardaban gestiones con la comisión en cero sin
   * que nadie la hubiera escrito. Sin regla no hay sugerencia, así que el campo
   * queda vacío y el paso no deja avanzar hasta que se escriba un valor.
   */
  it('no inventa un cero cuando no hay regla de comisión', async () => {
    mocks.getComisionPreview.mockResolvedValue({
      valorComision: 0,
      feeConfigNombre: 'Sin configurar',
      calculada: false,
      motivo: 'El administrador aún no configura una regla de comisión.',
    })

    const { wrapper, store } = await mountStep()

    expect(store.formData.valorComision).toBeNull()
    expect(wrapper.text()).toContain('El administrador aún no configura una regla de comisión.')
    expect((wrapper.vm as any).isValid()).toBe(false)
  })

  it('tampoco inventa un cero cuando la consulta falla', async () => {
    mocks.getComisionPreview.mockRejectedValue(new Error('500'))

    const { wrapper, store } = await mountStep()

    expect(store.formData.valorComision).toBeNull()
    expect(wrapper.text()).toContain('No se pudo calcular la comisión sugerida.')
    expect(wrapper.text()).toContain('Escribe la comisión a mano para continuar.')
    expect((wrapper.vm as any).isValid()).toBe(false)
  })

  it('vaciar el campo deja la comisión pendiente, no en cero', async () => {
    mocks.getComisionPreview.mockResolvedValue({
      valorComision: 12.5,
      feeConfigNombre: 'Regla estándar',
      calculada: true,
    })

    const { wrapper, store } = await mountStep()
    await input(wrapper).setValue('')

    expect(store.formData.valorComision).toBeNull()
    expect((wrapper.vm as any).isValid()).toBe(false)
  })

  it('un cero escrito a propósito sí es válido', async () => {
    mocks.getComisionPreview.mockRejectedValue(new Error('500'))

    const { wrapper, store } = await mountStep()
    await input(wrapper).setValue('0')

    expect(store.formData.valorComision).toBe(0)
    expect((wrapper.vm as any).isValid()).toBe(true)
  })
})
