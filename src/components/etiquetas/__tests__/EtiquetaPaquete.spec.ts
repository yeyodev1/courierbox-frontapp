import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EtiquetaPaquete from '../EtiquetaPaquete.vue'
import type { Warehouse } from '@/services/paquetes.api'

const base: Warehouse = {
  _id: 'p1',
  wr: 'WR889628',
  sh: '',
  mg: 'MG002516',
  trackingOriginal: '_9302010623390241017175_',
  pesoLb: 0.75,
  contenido: '1 cosmetico',
  consigneeNombre: 'BELEN SUCRE COURIER BOX',
  consigneeLimpio: 'BELEN SUCRE',
  fechaIngreso: '2026-10-08T00:00:00.000Z',
  origen: 'FLORIDA',
  agencia: 'COURIER BOX',
  ciudad: 'AUTOMATICO DATOS CLIENTE',
  direccion: 'AUTOMATICO DATOS CLIENTE',
  valorDeclarado: 0,
  reempaque: null,
  estado: 'importado',
  createdAt: '2026-10-08T12:00:00.000Z',
  masterClienteId: { _id: 'c1', nombreOficial: 'BELEN SUCRE', codigoCasillero: 'CB1234' },
}

describe('EtiquetaPaquete', () => {
  it('lleva el WR en grande, su código de barras y los datos de la caja', () => {
    const w = mount(EtiquetaPaquete, { props: { paquete: base, formato: 'COURIERBOX' } })
    const txt = w.text()
    expect(w.find('.etq__numero').text()).toBe('WR889628')
    expect(txt).toContain('BELEN SUCRE · CB1234')
    expect(txt).toContain('0.75 lb')
    expect(txt).toContain('1 cosmetico')
    expect(txt).toContain('08/10/2026')
    expect(txt).not.toContain('AUTOMATICO')
    expect(w.find('.etq__barras').findAll('rect').length).toBeGreaterThan(10)
    expect(w.find('.etq__logo').exists()).toBe(true)
  })

  it('el formato de un aliado cambia la marca, el pie y agrega barras abajo', () => {
    const w = mount(EtiquetaPaquete, { props: { paquete: base, formato: 'GRACIABOX' } })
    expect(w.find('.etq__logo').exists()).toBe(false)
    expect(w.text()).toContain('Del mundo a tu puerta')
    expect(w.find('.etq__barras-abajo').exists()).toBe(false)

    const avc = mount(EtiquetaPaquete, { props: { paquete: base, formato: 'AVCCOURIER' } })
    expect(avc.text()).toContain('AVC COURIER')
    expect(avc.find('.etq__barras-abajo').exists()).toBe(true)
  })
})

describe('EtiquetaPaquete con el catálogo', () => {
  it('un aliado con logo subido sale con su imagen', () => {
    const formatos = [{ id: 'ENVIOSYA', nombre: 'Envíos Ya', marca: 'ENVIOS YA', logoUrl: 'https://x/logo.png', pie: ['WA 099'] }]
    const w = mount(EtiquetaPaquete, { props: { paquete: base, formato: 'ENVIOSYA', formatos } })
    expect(w.find('.etq__logo--aliado').attributes('src')).toBe('https://x/logo.png')
    expect(w.text()).toContain('WA 099')
  })
})
