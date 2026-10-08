import { describe, expect, it } from 'vitest'
import { calcularTotalesLocal } from '../facturacion.api'

const t = { fleteLb: 6.5, arancelLb: 1.99, iva: 0.15, ivaPorcentaje: 15 }

describe('calcularTotalesLocal', () => {
  it('con pesos sueltos usa la tarifa base', () => {
    expect(calcularTotalesLocal([10], t)).toMatchObject({ totalFlete: 65, totalArancel: 19.9, totalIva: 9.75, totalGeneral: 94.65 })
  })

  it('cada caja a su tarifa, igual que el servidor', () => {
    const r = calcularTotalesLocal(
      [
        { pesoLb: 2, tarifa: { fleteLb: 3.62, arancelLb: 1.99 } },
        { pesoLb: 3 },
      ],
      t,
    )
    expect(r).toMatchObject({ pesoTotalLb: 5, totalFlete: 26.74, totalArancel: 9.95, totalIva: 4.01, totalGeneral: 40.7 })
  })
})
