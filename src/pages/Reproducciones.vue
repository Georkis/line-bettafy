<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h4">Cruces</div>
      <q-space />
      <q-btn flat round icon="refresh" @click="store.fetchAll()" :loading="store.loading" />
    </div>

    <div v-if="!store.loading">
      <q-card v-for="r in store.list" :key="r.id" flat bordered class="q-mb-sm">
        <q-card-section class="row items-center">
          <div class="col">
            <div class="text-subtitle1">
              <q-badge color="primary" class="q-mr-sm">&#9794; {{ r.macho_codigo }}</q-badge>
              x
              <q-badge color="pink" class="q-ml-sm">&#9792; {{ r.hembra_codigo }}</q-badge>
            </div>
            <div class="text-caption text-grey q-mt-xs">
              {{ r.fecha_cruce || 'Sin fecha' }}
              <span v-if="r.cantidad_alevines"> | {{ r.cantidad_alevines }} alevines</span>
            </div>
            <div class="text-caption q-mt-xs">
              <span v-if="r.total_ubicaciones" class="text-primary">
                <q-icon name="location_on" size="14px" class="q-mr-xs" />
                {{ r.ultimo_deposito }}
                <span v-if="r.ultima_fecha_ubicacion"> — {{ r.ultima_fecha_ubicacion }}</span>
                <q-badge v-if="r.total_ubicaciones > 1" outline color="primary" class="q-ml-xs">
                  +{{ r.total_ubicaciones - 1 }}
                </q-badge>
              </span>
            </div>
            <div v-if="r.observaciones" class="text-caption q-mt-xs">{{ r.observaciones }}</div>
          </div>
          <div class="q-gutter-xs">
            <q-btn flat round icon="edit" color="warning" size="sm" @click="openEdit(r)" />
            <q-btn flat round icon="delete" color="negative" size="sm" @click="confirmDelete(r)" />
          </div>
        </q-card-section>
      </q-card>
      <div v-if="!store.list.length" class="text-center text-grey q-py-xl">
        <q-icon name="pets" size="64px" />
        <div class="text-h6 q-mt-sm">No hay cruces registrados</div>
      </div>
    </div>
    <div v-else class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="pink" @click="openCreate" />
    </q-page-sticky>

    <q-dialog v-model="showDelete">
      <q-card>
        <q-card-section class="text-h6">¿Eliminar cruce?</q-card-section>
        <q-card-section>Esta acción no se puede deshacer.</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <ReproductionForm v-model="showForm" :reproduction="editingRepro" @saved="onSaved" />
  </q-page>
</template>

<script setup>
defineOptions({ name: 'ReproduccionesPage' })
import { ref, onMounted } from 'vue'
import { useReproduccionesStore } from 'src/stores/reproducciones'
import { useBettasStore } from 'src/stores/bettas'
import { useQuasar } from 'quasar'
import ReproductionForm from 'components/ReproductionForm.vue'

const $q = useQuasar()
const store = useReproduccionesStore()
const bettasStore = useBettasStore()
const showForm = ref(false)
const editingRepro = ref(null)
const showDelete = ref(false)
const reproToDelete = ref(null)

onMounted(async () => {
  await bettasStore.fetchAll()
  await store.fetchAll()
})

function openCreate() {
  editingRepro.value = null
  showForm.value = true
}

function openEdit(r) {
  editingRepro.value = { ...r }
  showForm.value = true
}

function confirmDelete(r) {
  reproToDelete.value = r
  showDelete.value = true
}

async function doDelete() {
  try {
    await store.delete(reproToDelete.value.id)
    $q.notify({ type: 'positive', message: 'Cruce eliminado' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al eliminar: ' + (e.message || '') })
  }
  showDelete.value = false
  reproToDelete.value = null
}

function onSaved() {
  showForm.value = false
}
</script>
