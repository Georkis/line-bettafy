<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Configuración</div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Apariencia</div>
      </q-card-section>
      <q-card-section>
        <q-toggle :model-value="config.theme === 'dark'" label="Modo oscuro"
                  checked-icon="dark_mode" unchecked-icon="light_mode"
                  @update:model-value="toggleTheme" />
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Preferencias</div>
      </q-card-section>
      <q-card-section class="q-gutter-sm">
        <q-select v-model="config.defaultSexo" :options="['macho', 'hembra', 'indefinido']"
                  label="Sexo por defecto" outlined dense
                  @update:model-value="config.setDefaultSexo" />
        <q-input v-model="config.itemsPerPage" label="Items por página" type="number" outlined dense
                 @update:model-value="config.setItemsPerPage" />
      </q-card-section>
    </q-card>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Respaldos</div>
      </q-card-section>
      <q-card-section class="q-gutter-sm">
        <q-btn flat color="primary" icon="backup" label="Exportar respaldo" @click="doExport" :loading="exporting" />
        <q-btn flat color="secondary" icon="restore" label="Importar respaldo" @click="triggerImport" :loading="importing" />
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="onFileSelected" />
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">Acerca de</div>
      </q-card-section>
      <q-card-section>
        <div class="text-body2">Bettafy v1.0.0</div>
        <div class="text-caption text-grey">App de registro para bettas</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'ConfiguracionPage' })
import { ref } from 'vue'
import { useConfiguracionStore } from 'src/stores/configuracion'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const config = useConfiguracionStore()
const exporting = ref(false)
const importing = ref(false)
const fileInput = ref(null)

function toggleTheme(val) {
  config.setTheme(val ? 'dark' : 'light')
  $q.dark.set(val)
}

function triggerImport() {
  fileInput.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  importing.value = true
  try {
    await config.importBackup(file)
    $q.notify({ type: 'positive', message: 'Respaldo importado. Reinicia la app para ver los datos.' })
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Error al importar: ' + err.message })
  } finally {
    importing.value = false
    e.target.value = ''
  }
}

async function doExport() {
  exporting.value = true
  try {
    await config.exportBackup()
    $q.notify({ type: 'positive', message: 'Respaldo exportado correctamente' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al exportar: ' + e.message })
  } finally {
    exporting.value = false
  }
}

if (config.theme === 'dark') $q.dark.set(true)
</script>
