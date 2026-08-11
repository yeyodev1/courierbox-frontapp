import { describe, expect, it } from 'vitest'
import { normalizeTrackingResult } from './tracking'

describe('normalizeTrackingResult', () => {
  it('fills in the arrays the public card indexes into', () => {
    // Regression: the scraper can omit these, and /rastrear/:codigo used to
    // crash on `data.imagenes.length`.
    const r = normalizeTrackingResult({ codigo: 'TBA123' } as never)
    expect(r.imagenes).toEqual([])
    expect(r.eventos).toEqual([])
  })

  it('survives a null or undefined payload', () => {
    expect(normalizeTrackingResult(null).eventos).toEqual([])
    expect(normalizeTrackingResult(undefined).imagenes).toEqual([])
  })

  it('coerces non-array values instead of trusting the type', () => {
    const r = normalizeTrackingResult({ eventos: 'nope', imagenes: {} } as never)
    expect(r.eventos).toEqual([])
    expect(r.imagenes).toEqual([])
  })

  it('drops empty image urls so the gallery never renders a broken tile', () => {
    const r = normalizeTrackingResult({ imagenes: ['https://a/1.jpg', '', null] } as never)
    expect(r.imagenes).toEqual(['https://a/1.jpg'])
  })

  it('defaults the status instead of rendering an empty label', () => {
    const r = normalizeTrackingResult({} as never)
    expect(r.estado).toBe('desconocido')
    expect(r.estadoLabel).toBe('Sin información')
  })

  it('keeps well-formed data untouched', () => {
    const evento = { fecha: '2026-01-01', fechaTexto: '1 ene', descripcion: 'Recibido' }
    const r = normalizeTrackingResult({
      codigo: 'TBA1',
      estado: 'en_transito',
      estadoLabel: 'En tránsito',
      pesoLb: 4.2,
      eventos: [evento],
      imagenes: ['https://a/1.jpg'],
    } as never)

    expect(r.codigo).toBe('TBA1')
    expect(r.estado).toBe('en_transito')
    expect(r.pesoLb).toBe(4.2)
    expect(r.eventos).toEqual([evento])
    expect(r.imagenes).toEqual(['https://a/1.jpg'])
  })
})
