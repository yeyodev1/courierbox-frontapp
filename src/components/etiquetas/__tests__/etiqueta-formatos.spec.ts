import { describe, expect, it } from 'vitest'
import { datoReal, formatoDesdeAliado, formatoPorAgencia, formatoPorId, FORMATOS } from '../etiqueta-formatos'

describe('formatoPorAgencia', () => {
  it('las marcas propias de Courier Box salen con su etiqueta', () => {
    expect(formatoPorAgencia('COURIER BOX')).toBe('COURIERBOX')
    expect(formatoPorAgencia('CBOX EXPRESS')).toBe('COURIERBOX')
    expect(formatoPorAgencia('FARMASI MP')).toBe('COURIERBOX')
    expect(formatoPorAgencia('')).toBe('COURIERBOX')
    expect(formatoPorAgencia(undefined)).toBe('COURIERBOX')
  })

  it('reconoce a los aliados aunque el manifiesto los escriba distinto', () => {
    expect(formatoPorAgencia('GRACIA BOX')).toBe('GRACIABOX')
    expect(formatoPorAgencia(' graciabox ')).toBe('GRACIABOX')
    expect(formatoPorAgencia('SUNSET EXPRESS')).toBe('SUNSET')
    expect(formatoPorAgencia('AVC Courier')).toBe('AVCCOURIER')
    expect(formatoPorAgencia('Te Lo Traemos')).toBe('TELOTRAEMOS')
    expect(formatoPorAgencia('MI MALETA')).toBe('MIMALETA')
  })

  it('cada formato existe en el catálogo', () => {
    for (const a of ['GRACIA BOX', 'SUNSET', 'AVC', 'QUIK CARGO', 'MIMALETA', 'TELOTRAEMOS', 'SHIP IT', 'EASY COURIER', 'FAST COURIER']) {
      expect(FORMATOS.map((f) => f.id)).toContain(formatoPorAgencia(a))
    }
  })
})

describe('formatoPorId', () => {
  it('cae en Courier Box con un id desconocido', () => {
    expect(formatoPorId('NOEXISTE').id).toBe('COURIERBOX')
    expect(formatoPorId('GRACIABOX').lema).toBe('Del mundo a tu puerta')
  })
})

describe('datoReal', () => {
  it('descarta el relleno del manifiesto', () => {
    expect(datoReal('AUTOMATICO DATOS CLIENTE')).toBe('')
    expect(datoReal('  Samborondón ')).toBe('Samborondón')
    expect(datoReal(null)).toBe('')
  })
})

describe('catálogo de Aliados', () => {
  const catalogo = [
    formatoDesdeAliado({ codigo: 'COURIERBOX', nombre: 'Courier Box', marca: 'COURIER BOX', principal: true, coincidencias: ['COURIER BOX'] }),
    formatoDesdeAliado({ codigo: 'ENVIOSYA', nombre: 'Envíos Ya', marca: 'ENVIOS YA', coincidencias: ['ENVIOS YA', 'EYA'], logoUrl: 'https://x/logo.png' }),
    formatoDesdeAliado({ codigo: 'GRACIABOX', nombre: 'Gracia Box', marca: 'GRACIA', coincidencias: ['GRACIA'], activo: false }),
  ]

  it('un aliado nuevo se reconoce por sus coincidencias', () => {
    expect(formatoPorAgencia('Envíos  Ya', catalogo)).toBe('ENVIOSYA')
    expect(formatoPorAgencia('EYA CARGO', catalogo)).toBe('ENVIOSYA')
  })

  it('un aliado inactivo y lo desconocido caen en el principal', () => {
    expect(formatoPorAgencia('GRACIA BOX', catalogo)).toBe('COURIERBOX')
    expect(formatoPorAgencia('OTRA', catalogo)).toBe('COURIERBOX')
  })

  it('con logo subido no usa el de Courier Box', () => {
    expect(formatoPorId('ENVIOSYA', catalogo)).toMatchObject({ logoUrl: 'https://x/logo.png', logoCourierBox: false })
    expect(formatoPorId('COURIERBOX', catalogo).logoCourierBox).toBe(true)
  })
})
