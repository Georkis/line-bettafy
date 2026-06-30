<template>
  <div class="gallery">
    <div class="row q-gutter-sm justify-center" v-if="photos.length">
      <q-card v-for="(photo, idx) in photos" :key="photo.id" flat bordered class="photo-card">
        <q-img :src="photoUris[idx]" height="200px" width="200px" fit="cover">
          <div class="absolute-bottom text-caption q-pa-xs bg-transparent">
            {{ photo.descripcion || '' }}
          </div>
        </q-img>
        <q-card-actions align="right" class="q-pa-none">
          <q-btn flat round dense icon="delete" size="sm" color="negative" @click="$emit('delete', photo)" />
        </q-card-actions>
      </q-card>
    </div>
    <div v-else class="text-center text-grey q-py-xl">
      <q-icon name="photo_library" size="48px" />
      <div class="q-mt-sm">Sin fotos</div>
    </div>
    <div class="row justify-center q-mt-md">
      <q-btn flat color="primary" icon="add_a_photo" label="Agregar foto" @click="$emit('add')" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getPhotoUri } from 'src/services/photo'

defineOptions({ name: 'BettaGallery' })
const props = defineProps({ photos: { type: Array, default: () => [] } })
defineEmits(['add', 'delete'])

const photoUris = ref([])

watch(() => props.photos, async (list) => {
  photoUris.value = await Promise.all((list || []).map((p) => getPhotoUri(p.ruta)))
}, { immediate: true })
</script>

<style lang="scss" scoped>
.photo-card {
  max-width: 200px;
}
</style>
