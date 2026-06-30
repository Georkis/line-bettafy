<template>
  <q-card class="betta-card" flat bordered>
    <q-img v-if="photoSrc" :src="photoSrc" height="150px" fit="cover">
      <div class="absolute-top-left q-pa-xs">
        <q-badge :color="sexoColor" :label="betta.sexo" />
      </div>
    </q-img>
    <div v-else class="no-photo flex flex-center" :style="{ backgroundColor: sexoColor }">
      <q-icon name="auto_awesome" size="48px" color="white" />
    </div>
    <q-card-section>
      <div class="text-h6 q-mb-xs">{{ betta.codigo }}</div>
      <div v-if="betta.nombre" class="text-subtitle2 text-grey">{{ betta.nombre }}</div>
      <div class="row q-mt-sm q-gutter-xs">
        <q-chip v-if="betta.tipo" size="sm" color="primary" text-color="white">{{ betta.tipo }}</q-chip>
        <q-chip v-if="betta.color" size="sm" color="accent" text-color="white">{{ betta.color }}</q-chip>
        <q-chip v-if="betta.variedad" size="sm" outline>{{ betta.variedad }}</q-chip>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions align="right">
      <q-btn flat round icon="info" color="primary" :to="{ name: 'betta-detail', params: { id: betta.id } }">
        <q-tooltip>Ver detalle</q-tooltip>
      </q-btn>
      <q-btn flat round icon="edit" color="warning" @click="$emit('edit', betta)">
        <q-tooltip>Editar</q-tooltip>
      </q-btn>
      <q-btn flat round icon="delete" color="negative" @click="$emit('delete', betta)">
        <q-tooltip>Eliminar</q-tooltip>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getPhotoUri } from 'src/services/photo'

const props = defineProps({ betta: { type: Object, required: true } })
defineEmits(['edit', 'delete'])

const photoSrc = ref(null)

watch(() => props.betta.foto_principal, async (val) => {
  photoSrc.value = val ? await getPhotoUri(val) : null
}, { immediate: true })

const sexoColor = {
  macho: '#1976D2',
  hembra: '#E91E63',
  indefinido: '#9E9E9E',
}
</script>

<style lang="scss" scoped>
.betta-card {
  width: 100%;
  max-width: 300px;
}
.no-photo {
  height: 150px;
}
</style>
