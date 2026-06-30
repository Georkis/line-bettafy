<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h4">Bettas</div>
      <q-space />
      <q-btn flat round icon="refresh" @click="store.fetchAll()" :loading="store.loading" />
    </div>

    <div class="row q-mb-md q-gutter-sm">
      <q-input v-model="searchText" placeholder="Buscar por código, nombre, variedad, color..."
               outlined dense class="col" clearable @update:model-value="onSearch">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-btn-dropdown flat dense icon="filter_list" label="Filtros">
        <q-card>
          <q-card-section class="q-gutter-sm">
            <q-select v-model="filters.sexo" :options="['macho', 'hembra', 'indefinido']" label="Sexo" clearable dense outlined />
            <q-select v-model="filters.tipo" :options="tipos" label="Tipo" clearable dense outlined />
            <q-select v-model="filters.color" :options="colores" label="Color" clearable dense outlined />
            <q-select v-model="filters.estado" :options="['activo', 'vendido', 'fallecido', 'retirado']" label="Estado" clearable dense outlined />
            <q-btn flat label="Aplicar" color="primary" @click="applyFilters" />
            <q-btn flat label="Limpiar" @click="clearFilters" />
          </q-card-section>
        </q-card>
      </q-btn-dropdown>
    </div>

    <div class="row q-gutter-md justify-center" v-if="!store.loading">
      <BettaCard
        v-for="betta in store.list" :key="betta.id"
        :betta="betta"
        @edit="openEdit"
        @delete="confirmDelete"
      />
    </div>
    <div v-else class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="48px" />
    </div>
    <div v-if="!store.loading && !store.list.length" class="text-center text-grey q-py-xl">
      <q-icon name="pets" size="64px" />
      <div class="text-h6 q-mt-sm">No hay bettas registrados</div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="openCreate" />
    </q-page-sticky>

    <q-dialog v-model="showDelete">
      <q-card>
        <q-card-section class="text-h6">¿Eliminar {{ bettaToDelete?.codigo }}?</q-card-section>
        <q-card-section>Esta acción no se puede deshacer.</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <BettaForm v-model="showForm" :betta="editingBetta" @saved="onSaved" :key="formKey" />
  </q-page>
</template>

<script setup>
defineOptions({ name: 'BettasPage' })
import { ref, onMounted } from 'vue'
import { useBettasStore } from 'src/stores/bettas'
import { useQuasar } from 'quasar'
import BettaCard from 'components/BettaCard.vue'
import BettaForm from 'components/BettaForm.vue'

const $q = useQuasar()
const store = useBettasStore()
const searchText = ref('')
const showForm = ref(false)
const editingBetta = ref(null)
const formKey = ref(0)
const showDelete = ref(false)
const bettaToDelete = ref(null)
let searchTimer = null

const filters = ref({ sexo: null, tipo: null, color: null, estado: null })
const tipos = ['plakat', 'halfmoon', 'crown tail', 'double tail', 'veil tail', 'giant', 'koi', 'other']
const colores = ['rojo', 'azul', 'verde', 'amarillo', 'naranja', 'blanco', 'negro', 'multicolor', 'koi', 'metalico']

onMounted(() => store.fetchAll())

function onSearch(val) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (val?.length > 1) store.search(val)
    else if (!val) store.fetchAll()
  }, 300)
}

function applyFilters() {
  const active = {}
  for (const [k, v] of Object.entries(filters.value)) {
    if (v) active[k] = v
  }
  if (Object.keys(active).length) store.filter(active)
  else store.fetchAll()
}

function clearFilters() {
  filters.value = { sexo: null, tipo: null, color: null, estado: null }
  store.fetchAll()
}

function openCreate() {
  editingBetta.value = null
  formKey.value++
  showForm.value = true
}

function openEdit(betta) {
  editingBetta.value = { ...betta }
  showForm.value = true
}

function confirmDelete(betta) {
  bettaToDelete.value = betta
  showDelete.value = true
}

async function doDelete() {
  try {
    await store.delete(bettaToDelete.value.id)
    $q.notify({ type: 'positive', message: `${bettaToDelete.value.codigo} eliminado` })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al eliminar: ' + (e.message || '') })
  }
  showDelete.value = false
  bettaToDelete.value = null
}

function onSaved() {
  showForm.value = false
}
</script>
