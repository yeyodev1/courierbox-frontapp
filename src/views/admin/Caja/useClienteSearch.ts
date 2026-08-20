import { computed, ref, watch } from 'vue'
import { contactosApi } from '@/services/contactos.api'
import { contactosCbAPI } from '@/services/contactos_cb.api'
import { useToastStore } from '@/stores/toast.store'

export interface ClienteResult {
  clientId: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  lastOrderDate: string
}

export interface NuevoContactoForm {
  clientName: string
  clientEmail: string
  clientPhone: string
}

export function emptyContactoForm(): NuevoContactoForm {
  return { clientName: '', clientEmail: '', clientPhone: '' }
}

/**
 * Client picker for an income movement. Typing away from the chosen client
 * clears the selection, so a movement can never carry a stale client id.
 */
export function useClienteSearch(onSelect: (client: ClienteResult) => void) {
  const toastStore = useToastStore()

  const query = ref('')
  const results = ref<ClienteResult[]>([])
  const selected = ref<ClienteResult | null>(null)
  const confirmed = ref(false)
  const searching = ref(false)
  const creating = ref(false)

  const showEmptyHelp = computed(
    () => query.value.trim().length >= 2 && !searching.value && !confirmed.value && results.value.length === 0,
  )

  function reset() {
    query.value = ''
    results.value = []
    selected.value = null
    confirmed.value = false
  }

  async function search() {
    const q = query.value.trim()
    if (q.length < 2) {
      results.value = []
      return
    }

    searching.value = true
    try {
      const data = await contactosApi.list({ q, limit: 20 })
      results.value = data.contactos.map((contacto) => ({
        clientId: contacto._id,
        clientName: contacto.clientName,
        clientEmail: contacto.clientEmail,
        clientPhone: contacto.clientPhone,
        lastOrderDate: contacto.lastOrderDate,
      }))
    } catch {
      results.value = []
    } finally {
      searching.value = false
    }
  }

  function select(client: ClienteResult) {
    selected.value = client
    confirmed.value = true
    query.value = client.clientName
    results.value = []
    onSelect(client)
  }

  function clearSelection() {
    selected.value = null
    confirmed.value = false
  }

  watch(query, (value) => {
    if (!selected.value) return
    const normalized = value.trim().toLowerCase()
    const matchesSelection = [selected.value.clientName, selected.value.clientEmail || '', selected.value.clientPhone || '']
      .map((item) => item.trim().toLowerCase())
      .includes(normalized)

    if (matchesSelection) {
      confirmed.value = true
      return
    }
    clearSelection()
    onSelect({ clientId: '', clientName: '', lastOrderDate: '' })
  })

  /**
   * Creates the contact, but first looks for an exact match so the operator
   * cannot fork the same person into two records by typing it again.
   */
  async function createContacto(form: NuevoContactoForm): Promise<boolean> {
    const clientName = form.clientName.trim()
    const clientEmail = form.clientEmail.trim()
    const clientPhone = form.clientPhone.trim()

    if (!clientName) {
      toastStore.showNotification('Ingresa el nombre del cliente', 'error')
      return false
    }

    creating.value = true
    try {
      const searchText = [clientName, clientEmail, clientPhone].filter(Boolean).join(' ')
      const existing = await contactosApi.list({ q: searchText, limit: 20 })
      const exact = existing.contactos.find((contacto) => {
        const sameName = contacto.clientName.trim().toLowerCase() === clientName.toLowerCase()
        const sameEmail = clientEmail && (contacto.clientEmail || '').trim().toLowerCase() === clientEmail.toLowerCase()
        const samePhone = clientPhone && (contacto.clientPhone || '').replace(/\D/g, '') === clientPhone.replace(/\D/g, '')
        return sameName || sameEmail || samePhone
      })

      if (exact) {
        select({
          clientId: exact._id,
          clientName: exact.clientName,
          clientEmail: exact.clientEmail,
          clientPhone: exact.clientPhone,
          lastOrderDate: exact.lastOrderDate,
        })
        toastStore.showNotification('Ese contacto ya existía, se reutilizó para evitar duplicados', 'success')
        return true
      }

      const result = await contactosCbAPI.create({
        nombre: clientName,
        email: clientEmail || undefined,
        telefono: clientPhone || undefined,
        notas: 'Contacto creado desde caja',
      })
      select({
        clientId: result.contacto._id,
        clientName: result.contacto.nombre,
        clientEmail: result.contacto.email,
        clientPhone: result.contacto.telefono,
        lastOrderDate: new Date().toISOString(),
      })
      toastStore.showNotification('Contacto creado y disponible en caja', 'success')
      return true
    } catch (error) {
      toastStore.showNotification((error as Error)?.message || 'No se pudo crear el contacto', 'error')
      return false
    } finally {
      creating.value = false
    }
  }

  return { query, results, selected, confirmed, searching, creating, showEmptyHelp, reset, search, select, clearSelection, createContacto }
}
