import { computed, ref } from 'vue'
import { proveedoresApi, type Proveedor } from '@/services/proveedores.api'
import { useToastStore } from '@/stores/toast.store'

export interface ProveedorForm {
  nombre: string
  tipo: string
  pais: string
  ciudad: string
  contacto: string
  telefono: string
  email: string
  notas: string
}

export function emptyProveedorForm(): ProveedorForm {
  return { nombre: '', tipo: '', pais: '', ciudad: '', contacto: '', telefono: '', email: '', notas: '' }
}

/** Provider catalogue shared by the Proveedores tab and the envío form's picker. */
export function useProveedores() {
  const toastStore = useToastStore()

  const proveedores = ref<Proveedor[]>([])
  const loading = ref(false)
  const filterQuery = ref('')
  const editing = ref<Proveedor | null>(null)
  const form = ref<ProveedorForm>(emptyProveedorForm())

  const activos = computed(() => proveedores.value.filter((p) => p.activo))

  const filtered = computed(() => {
    if (!filterQuery.value) return proveedores.value
    const q = filterQuery.value.toLowerCase()
    return proveedores.value.filter((p) =>
      [p.nombre, p.tipo, p.pais, p.ciudad, p.contacto].some((field) => (field || '').toLowerCase().includes(q)),
    )
  })

  function fail(error: unknown, fallback: string) {
    toastStore.showNotification((error as Error)?.message || fallback, 'error')
  }

  async function load() {
    loading.value = true
    try {
      const data = await proveedoresApi.list({ q: filterQuery.value || undefined, limit: 200 })
      proveedores.value = data.proveedores
    } catch (error) {
      fail(error, 'Error al cargar proveedores')
    } finally {
      loading.value = false
    }
  }

  function startCreate() {
    editing.value = null
    form.value = emptyProveedorForm()
  }

  function startEdit(proveedor: Proveedor) {
    editing.value = proveedor
    form.value = {
      nombre: proveedor.nombre,
      tipo: proveedor.tipo,
      pais: proveedor.pais,
      ciudad: proveedor.ciudad,
      contacto: proveedor.contacto,
      telefono: proveedor.telefono,
      email: proveedor.email,
      notas: proveedor.notas,
    }
  }

  /** Returns the saved provider's name so the caller can preselect it in a form. */
  async function save(): Promise<string | null> {
    if (!form.value.nombre) return null
    try {
      if (editing.value) {
        await proveedoresApi.update(editing.value._id, form.value)
        await load()
        return editing.value.nombre
      }
      const data = await proveedoresApi.create(form.value)
      await load()
      return data.proveedor.nombre || null
    } catch (error) {
      fail(error, 'Error al guardar el proveedor')
      return null
    }
  }

  async function toggleActivo(proveedor: Proveedor) {
    try {
      await proveedoresApi.update(proveedor._id, { activo: !proveedor.activo })
      await load()
    } catch (error) {
      fail(error, 'Error al cambiar el estado')
    }
  }

  return { proveedores, loading, filterQuery, editing, form, activos, filtered, load, startCreate, startEdit, save, toggleActivo }
}
