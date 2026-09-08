import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppSelect from '../AppSelect.vue'

const PRODUCTOS = [
  { value: 'p1', label: 'AUDIFONOS SOUNDCORE P20I', hint: '$40.00' },
  { value: 'p2', label: 'CAMARA TPLINK', hint: '$35.00' },
  { value: 'p3', label: 'IPHONE 17 PRO MAX 256GB', hint: '$1550.00' },
  { value: 'p4', label: 'TERMO BRUMATE', hint: '$38.00' },
  { value: 'p5', label: 'TERMO OWALA', hint: '$50.00' },
  { value: 'p6', label: 'TYLENOL', hint: '$15.00' },
  { value: 'p7', label: 'USB-C A USB-C 60W', hint: '$25.00' },
]

function mountSelect(props: Record<string, unknown> = {}) {
  return mount(AppSelect, {
    props: { modelValue: '', options: PRODUCTOS, placeholder: 'Selecciona…', 'onUpdate:modelValue': () => {}, ...props },
    attachTo: document.body,
    global: { stubs: { teleport: true, transition: false } },
  })
}

const abrir = async (w: ReturnType<typeof mountSelect>) => {
  await w.get('button.app-select__trigger').trigger('click')
  await flushPromises()
}

describe('AppSelect', () => {
  it('con más de 6 opciones muestra el buscador y filtra por texto (sin tildes ni mayúsculas)', async () => {
    const w = mountSelect()
    await abrir(w)

    const search = w.get('[data-test="app-select-search"]')
    await search.setValue('termo')
    const labels = w.findAll('.app-select__option').map((o) => o.text())
    expect(labels).toHaveLength(2)
    expect(labels[0]).toContain('TERMO BRUMATE')
    expect(labels[0]).toContain('$38.00')
    w.unmount()
  })

  it('elegir una opción emite el valor y cierra', async () => {
    const w = mountSelect()
    await abrir(w)
    await w.findAll('.app-select__option')[2]!.trigger('click')

    expect(w.emitted('update:modelValue')?.[0]).toEqual(['p3'])
    expect(w.find('.app-select__dropdown').exists()).toBe(false)
    w.unmount()
  })

  it('se maneja con teclado: flechas y Enter', async () => {
    const w = mountSelect()
    const trigger = w.get('button.app-select__trigger')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    await w.get('.app-select').trigger('keydown', { key: 'ArrowDown' })
    await w.get('.app-select').trigger('keydown', { key: 'Enter' })

    expect(w.emitted('update:modelValue')?.[0]).toEqual(['p2'])
    w.unmount()
  })

  it('la acción al pie manda lo que se buscó, para crear lo que no existe', async () => {
    const w = mountSelect({ actionLabel: 'Crear producto nuevo' })
    await abrir(w)
    await w.get('[data-test="app-select-search"]').setValue('Cargador 100W')
    expect(w.text()).toContain('Sin resultados')
    await w.get('[data-test="app-select-action"]').trigger('click')

    expect(w.emitted('action')?.[0]).toEqual(['Cargador 100W'])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('con pocas opciones no muestra buscador y respeta allowEmpty', async () => {
    const w = mountSelect({ options: ['Efectivo', 'Transferencia'], modelValue: '' })
    await abrir(w)
    expect(w.find('[data-test="app-select-search"]').exists()).toBe(false)
    expect(w.findAll('.app-select__option')).toHaveLength(2)
    // allowEmpty por defecto: un valor vacío se queda vacío, no elige el primero solo.
    expect(w.emitted('update:modelValue')).toBeUndefined()
    w.unmount()
  })

  it('con allowEmpty=false elige la primera opción cuando el valor no existe', async () => {
    const w = mountSelect({ options: ['local', 'interprovincial'], modelValue: '', allowEmpty: false })
    await flushPromises()
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['local'])
    w.unmount()
  })
})
