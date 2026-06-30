<template>
  <q-page class="q-pa-md p-7" v-if="betta">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" :to="{ name: 'bettas' }" />
      <div class="text-h5 q-ml-sm">{{ betta.codigo }}</div>
      <q-space />
      <q-btn flat round icon="edit" color="warning" @click="showForm = true" />
      <q-btn flat round icon="delete" color="negative" @click="showDelete = true" />
    </div>

    <div class="row q-gutter-md">
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-img v-if="mainPhoto" :src="mainPhoto" height="250px" fit="cover">
            <template v-slot:error>
              <div class="flex flex-center bg-grey-3 absolute-full">
                <q-icon name="broken_image" size="48px" color="grey" />
              </div>
            </template>
          </q-img>
          <div v-else class="no-photo flex flex-center bg-grey-3 relative-position" style="height: 250px">
            <q-icon name="auto_awesome" size="64px" color="grey" />
          </div>
          <div class="absolute-top-right q-pa-xs" style="z-index: 1">
            <q-btn flat round dense icon="add_a_photo" color="white" size="sm" @click="updateMainPhoto" />
          </div>
          <q-card-section>
            <div class="row">
              <div class="col-6"><span class="text-grey">Sexo:</span> <q-badge :color="betta.sexo === 'macho' ? 'primary' : 'pink'">{{ betta.sexo }}</q-badge></div>
              <div class="col-6"><span class="text-grey">Estado:</span> {{ betta.estado }}</div>
              <div class="col-6 q-mt-sm"><span class="text-grey">Tipo:</span> {{ betta.tipo }}</div>
              <div class="col-6 q-mt-sm"><span class="text-grey">Color:</span> {{ betta.color }}</div>
              <div class="col-6 q-mt-sm"><span class="text-grey">Variedad:</span> {{ betta.variedad }}</div>
              <div class="col-6 q-mt-sm"><span class="text-grey">Origen:</span> {{ betta.origen }}</div>
              <div class="col-6 q-mt-sm"><span class="text-grey">Criador:</span> {{ betta.criador }}</div>
              <div class="col-6 q-mt-sm"><span class="text-grey">Nacimiento:</span> {{ betta.fecha_nacimiento }}</div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="text-grey">Padres</div>
            <div class="row q-mt-xs">
              <div class="col-6">
                <span class="text-grey">Padre:</span>
                <span v-if="parents.padre" class="text-primary cursor-pointer" @click="$router.push({ name: 'betta-detail', params: { id: parents.padre.id } })">
                  {{ parents.padre.codigo }}
                </span>
                <span v-else class="text-grey">-</span>
              </div>
              <div class="col-6">
                <span class="text-grey">Madre:</span>
                <span v-if="parents.madre" class="text-pink cursor-pointer" @click="$router.push({ name: 'betta-detail', params: { id: parents.madre.id } })">
                  {{ parents.madre.codigo }}
                </span>
                <span v-else class="text-grey">-</span>
              </div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="text-grey">Observaciones</div>
            <div class="text-body2 q-mt-xs">{{ betta.observaciones || 'Sin observaciones' }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Fotos</div>
          </q-card-section>
          <q-card-section>
            <Gallery :photos="photos" @add="addPhoto" @delete="deletePhoto" />
          </q-card-section>
        </q-card>

        <q-card flat bordered>
          <q-card-section class="row items-center">
            <div class="text-h6">Cruces</div>
            <q-space />
            <q-btn flat dense icon="add" color="pink" label="Nuevo" @click="showReproForm = true" />
          </q-card-section>
          <q-list separator>
            <q-item v-for="r in reproducciones" :key="r.id">
              <q-item-section>
                <q-item-label>
                  {{ r.macho_codigo }} x {{ r.hembra_codigo }}
                </q-item-label>
                <q-item-label caption>{{ r.fecha_cruce }} | {{ r.cantidad_alevines || 0 }} alevines</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!reproducciones.length">
              <q-item-section class="text-center text-grey">Sin cruces</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="showDelete">
      <q-card>
        <q-card-section class="text-h6">¿Eliminar {{ betta.codigo }}?</q-card-section>
        <q-card-section>Esta acción no se puede deshacer.</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <BettaForm v-model="showForm" :betta="betta" @saved="loadBetta" />
    <ReproductionForm v-model="showReproForm" @saved="loadReproducciones" />
  </q-page>
  <div v-else class="flex flex-center q-py-xl">
    <q-spinner color="primary" size="48px" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBettasStore } from 'src/stores/bettas'
import { useReproduccionesStore } from 'src/stores/reproducciones'
import { getParents } from 'src/services/genealogy'
import { executeQuery, executeRun } from 'src/services/sqlite'
import { takePhoto, deletePhoto as deletePhotoFile, getPhotoUri } from 'src/services/photo'
import { useQuasar } from 'quasar'
import BettaForm from 'components/BettaForm.vue'
import ReproductionForm from 'components/ReproductionForm.vue'
import Gallery from 'components/Gallery.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const bettasStore = useBettasStore()
const reproStore = useReproduccionesStore()
const betta = ref(null)
const parents = ref({ padre: null, madre: null })
const photos = ref([])
const reproducciones = ref([])
const showForm = ref(false)
const showDelete = ref(false)
const showReproForm = ref(false)
const mainPhoto = ref(null)

onMounted(async () => {
  await loadBetta()
})

async function loadBetta() {
  const id = Number(route.params.id)
  betta.value = await bettasStore.fetchById(id)
  if (!betta.value) {
    router.push({ name: 'bettas' })
    return
  }
  mainPhoto.value = await getPhotoUri(betta.value.foto_principal)
  parents.value = await getParents(id)
  photos.value = await executeQuery('SELECT * FROM fotos WHERE betta_id = ?', [id])
  await loadReproducciones()
}

async function updateMainPhoto() {
  try {
    const path = await takePhoto()
    if (path) {
      await bettasStore.updatePhoto(betta.value.id, path)
      betta.value.foto_principal = path
      mainPhoto.value = await getPhotoUri(path)
      $q.notify({ type: 'positive', message: 'Foto principal actualizada' })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al tomar foto: ' + (e.message || '') })
  }
}

async function loadReproducciones() {
  reproducciones.value = await reproStore.getByBetta(betta.value.id)
}

async function addPhoto() {
  try {
    const ruta = await takePhoto()
    if (ruta) {
      await executeRun('INSERT INTO fotos (betta_id, ruta) VALUES (?, ?)', [betta.value.id, ruta])
      photos.value = await executeQuery('SELECT * FROM fotos WHERE betta_id = ?', [betta.value.id])
      $q.notify({ type: 'positive', message: 'Foto agregada' })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al tomar foto: ' + e.message })
  }
}

async function deletePhoto(photo) {
  try {
    await deletePhotoFile(photo.ruta)
    await executeRun('DELETE FROM fotos WHERE id = ?', [photo.id])
    photos.value = photos.value.filter((p) => p.id !== photo.id)
    $q.notify({ type: 'positive', message: 'Foto eliminada' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + e.message })
  }
}

async function doDelete() {
  try {
    await bettasStore.delete(betta.value.id)
    $q.notify({ type: 'positive', message: `${betta.value.codigo} eliminado` })
    router.push({ name: 'bettas' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al eliminar: ' + (e.message || '') })
  }
}
</script>
