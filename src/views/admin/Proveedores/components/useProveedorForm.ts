import type { Proveedor } from '@/services/proveedores.api'

export interface ProveedorFormState {
  nombre: string
  tipo: string
  pais: string
  ciudad: string
  contacto: string
  telefono: string
  email: string
  notas: string
  activo: boolean
}

export function emptyProveedorForm(): ProveedorFormState {
  return {
    nombre: '',
    tipo: '',
    pais: '',
    ciudad: '',
    contacto: '',
    telefono: '',
    email: '',
    notas: '',
    activo: true,
  }
}

export function proveedorToForm(data: Proveedor | null): ProveedorFormState {
  if (!data) return emptyProveedorForm()
  return {
    nombre: data.nombre || '',
    tipo: data.tipo || '',
    pais: data.pais || '',
    ciudad: data.ciudad || '',
    contacto: data.contacto || '',
    telefono: data.telefono || '',
    email: data.email || '',
    notas: data.notas || '',
    activo: data.activo ?? true,
  }
}

/**
 * Folds case, accents and repeated spaces so "Courier USA" and "courier usa"
 * count as the same type when matching against the defaults or usage counters.
 */
export function normalizeType(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}
