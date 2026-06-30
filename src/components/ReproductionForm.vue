<template>
  <q-dialog v-model="visible" persistent>
    <q-card class="dialog-card">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEdit ? 'Editar Cruce' : 'Nuevo Cruce' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-form ref="formRef" @submit.prevent="handleSubmit">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-select
                v-model="form.macho_id"
                :options="machosOptions"
                label="Macho *"
                outlined dense
                emit-value map-options
                :rules="[required]"
                lazy-rules
                hint="Selecciona el betta macho"
              />
              <div class="row items-center q-mt-sm q-gutter-sm justify-center">
                <q-avatar size="64px" class="bg-grey-3">
                  <q-img v-if="machoPhoto" :src="machoPhoto" fit="cover" style="height:64px" />
                  <q-icon v-else name="pets" size="32px" class="text-grey" />
                </q-avatar>
                <q-btn flat round dense icon="add_a_photo" size="sm" color="primary"
                  :disable="!form.macho_id" @click="takePhoto('macho')" />
              </div>
            </div>
            <div class="col-6">
              <q-select
                v-model="form.hembra_id"
                :options="hembrasOptions"
                label="Hembra *"
                outlined dense
                emit-value map-options
                :rules="[required]"
                lazy-rules
                hint="Selecciona la betta hembra"
              />
              <div class="row items-center q-mt-sm q-gutter-sm justify-center">
                <q-avatar size="64px" class="bg-grey-3">
                  <q-img v-if="hembraPhoto" :src="hembraPhoto" fit="cover" style="height:64px" />
                  <q-icon v-else name="pets" size="32px" class="text-grey" />
                </q-avatar>
                <q-btn flat round dense icon="add_a_photo" size="sm" color="primary"
                  :disable="!form.hembra_id" @click="takePhoto('hembra')" />
              </div>
            </div>
          </div>
          <div class="row q-gutter-sm">
            <q-input v-model="form.fecha_cruce" label="Fecha Cruce" type="date" outlined dense class="col"
                     hint="Fecha en que se juntaron" />
            <q-input v-model="form.fecha_desove" label="Fecha Desove" type="date" outlined dense class="col"
                     hint="Fecha de puesta de huevos" />
          </div>
          <q-input v-model="form.cantidad_alevines" label="Cant. Alevines" type="number" outlined dense min="0"
                   hint="Número de alevines que nacieron" />

          <div class="text-subtitle2 q-mt-md q-mb-sm text-primary">Ubicaciones de alevines</div>
          <div v-if="ubicaciones.length" class="q-mb-sm">
            <div v-for="(u, i) in ubicaciones" :key="i"
                 class="row items-center q-gutter-xs q-py-xs q-px-sm bg-grey-2 rounded-borders q-mb-xs">
              <div class="col">
                <span class="text-caption text-weight-bold">{{ u.fecha }}</span>
                <span v-if="u.deposito_nombre" class="text-caption q-ml-sm text-primary">{{ u.deposito_nombre }}</span>
                <span v-if="u.observaciones" class="text-caption text-grey q-ml-sm">{{ u.observaciones }}</span>
              </div>
              <q-btn flat round dense icon="close" size="xs" color="negative" @click="removeUbicacion(i)" />
            </div>
          </div>
          <div v-else class="text-caption text-grey q-mb-sm">
            No hay ubicaciones registradas. Agrega una debajo.
          </div>

          <div class="q-gutter-sm">
            <div class="row items-center q-gutter-sm">
              <q-input v-model="newUbicacion.fecha" label="Fecha" type="date" outlined dense class="col" />
              <q-btn flat round dense icon="playlist_add" color="primary" size="sm"
                     :disable="!newUbicacion.fecha || !newUbicacion.deposito_id" @click="addUbicacion" />
            </div>
            <div class="row items-center q-gutter-sm">
              <q-select v-model="newUbicacion.deposito_id" :options="depositosOptions" label="Depósito" outlined dense
                        class="col" emit-value map-options clearable />
              <q-btn flat round dense icon="add" color="primary" size="sm"
                     @click="showCreateDeposito = true" />
            </div>
            <q-input v-model="newUbicacion.observaciones" label="Nota" outlined dense placeholder="Nota opcional para esta ubicación" />
          </div>

          <q-input v-model="form.observaciones" label="Observaciones generales" outlined dense type="textarea" rows="2" class="q-mt-md" />
          <q-card-actions align="right" class="q-pa-none">
            <q-btn flat label="Cancelar" color="negative" v-close-popup />
            <q-btn flat label="Guardar" color="primary" type="submit" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card-section>

      <q-dialog v-model="showCreateDeposito">
        <q-card class="dialog-card">
          <q-card-section class="row items-center">
            <div class="text-h6">Nuevo Depósito</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section>
            <q-input v-model="newDeposito.nombre" label="Nombre del depósito *" outlined dense
                     :rules="[required]" lazy-rules />
            <q-input v-model="newDeposito.descripcion" label="Descripción" outlined dense />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="negative" v-close-popup />
            <q-btn flat label="Guardar" color="primary" @click="handleCreateDeposito" :loading="creatingDeposito" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBettasStore } from 'src/stores/bettas'
import { useReproduccionesStore } from 'src/stores/reproducciones'
import { useUbicacionesStore } from 'src/stores/ubicaciones'
import { useDepositosStore } from 'src/stores/depositos'
import { useQuasar } from 'quasar'
import { takePhoto as capturePhoto, getPhotoUri } from 'src/services/photo'

const $q = useQuasar()
const props = defineProps({ modelValue: Boolean, reproduction: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])

const bettasStore = useBettasStore()
const reproStore = useReproduccionesStore()
const ubicacionesStore = useUbicacionesStore()
const depositosStore = useDepositosStore()
const formRef = ref(null)
const saving = ref(false)

const machoPhoto = ref(null)
const hembraPhoto = ref(null)

const visible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.reproduction)

const form = ref(initForm())
const ubicaciones = ref([])
const newUbicacion = ref(initNewUbicacion())

function initForm() {
  return { macho_id: null, hembra_id: null, fecha_cruce: '', fecha_desove: '', cantidad_alevines: 0, observaciones: '' }
}

function initNewUbicacion() {
  return { fecha: '', deposito_id: null, observaciones: '', deposito_nombre: null }
}

onMounted(() => {
  depositosStore.fetchAll()
})

watch(() => props.reproduction, async (val) => {
  form.value = val ? { ...initForm(), ...val } : initForm()
  if (val?.id) {
    await ubicacionesStore.fetchByReproduccion(val.id)
    ubicaciones.value = ubicacionesStore.list.map((u) => ({ ...u }))
  } else {
    ubicaciones.value = []
  }
  newUbicacion.value = initNewUbicacion()
}, { immediate: true })

watch(() => form.value.macho_id, async (id) => {
  machoPhoto.value = id ? await getPhotoUri(bettasStore.list.find((b) => b.id === id)?.foto_principal) : null
})
watch(() => form.value.hembra_id, async (id) => {
  hembraPhoto.value = id ? await getPhotoUri(bettasStore.list.find((b) => b.id === id)?.foto_principal) : null
})

const machosOptions = computed(() =>
  bettasStore.list.filter((b) => b.sexo === 'macho' && b.estado === 'activo').map((b) => ({ label: `${b.codigo}${b.nombre ? ` - ${b.nombre}` : ''}`, value: b.id })),
)
const hembrasOptions = computed(() =>
  bettasStore.list.filter((b) => b.sexo === 'hembra' && b.estado === 'activo').map((b) => ({ label: `${b.codigo}${b.nombre ? ` - ${b.nombre}` : ''}`, value: b.id })),
)

const depositosOptions = computed(() =>
  depositosStore.list.map((d) => ({ label: d.nombre, value: d.id })),
)

const showCreateDeposito = ref(false)
const creatingDeposito = ref(false)
const newDeposito = ref({ nombre: '', descripcion: '' })

async function handleCreateDeposito() {
  if (!newDeposito.value.nombre) {
    $q.notify({ type: 'warning', message: 'El nombre del depósito es requerido', position: 'top' })
    return
  }
  creatingDeposito.value = true
  try {
    const id = await depositosStore.create({ nombre: newDeposito.value.nombre, descripcion: newDeposito.value.descripcion })
    newUbicacion.value.deposito_id = id
    showCreateDeposito.value = false
    newDeposito.value = { nombre: '', descripcion: '' }
    $q.notify({ type: 'positive', message: 'Depósito creado correctamente' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + (e.message || 'Error al crear depósito') })
  } finally {
    creatingDeposito.value = false
  }
}

function addUbicacion() {
  if (!newUbicacion.value.fecha && !newUbicacion.value.deposito_id) {
    $q.notify({ type: 'warning', message: 'Completa fecha y depósito para agregar una ubicación', position: 'top' })
    return
  }
  if (!newUbicacion.value.fecha || !newUbicacion.value.deposito_id) {
    $q.notify({ type: 'warning', message: 'Fecha y depósito son requeridos si uno está presente', position: 'top' })
    return
  }
  const dep = depositosStore.list.find((d) => d.id === newUbicacion.value.deposito_id)
  ubicaciones.value.push({
    fecha: newUbicacion.value.fecha,
    deposito_id: newUbicacion.value.deposito_id,
    observaciones: newUbicacion.value.observaciones,
    deposito_nombre: dep?.nombre || null,
  })
  newUbicacion.value = initNewUbicacion()
}

function removeUbicacion(index) {
  ubicaciones.value.splice(index, 1)
}

function required(val) { return !!val || 'Campo requerido' }

async function takePhoto(sexo) {
  const id = sexo === 'macho' ? form.value.macho_id : form.value.hembra_id
  if (!id) return
  try {
    const path = await capturePhoto()
    await bettasStore.updatePhoto(id, path)
    const uri = await getPhotoUri(path)
    if (sexo === 'macho') machoPhoto.value = uri
    else hembraPhoto.value = uri
    $q.notify({ type: 'positive', message: `Foto de ${sexo === 'macho' ? 'macho' : 'hembra'} actualizada` })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error al tomar foto: ' + (e.message || '') })
  }
}

async function saveUbicaciones(reproduccionId) {
  await ubicacionesStore.deleteByReproduccion(reproduccionId)
  for (const u of ubicaciones.value) {
    await ubicacionesStore.create({ reproduccion_id: reproduccionId, deposito_id: u.deposito_id, fecha: u.fecha, observaciones: u.observaciones })
  }
}

async function handleSubmit() {
  const isValid = await formRef.value.validate()
  if (!isValid) {
    $q.notify({ type: 'warning', message: 'Corrige los campos marcados en rojo', position: 'top' })
    return
  }
  if (form.value.macho_id === form.value.hembra_id) {
    $q.notify({ type: 'warning', message: 'Macho y hembra deben ser diferentes', position: 'top' })
    return
  }
  if (newUbicacion.value.fecha || newUbicacion.value.deposito_id) {
    if (!newUbicacion.value.fecha || !newUbicacion.value.deposito_id) {
      $q.notify({ type: 'warning', message: 'Completa o limpia los campos de nueva ubicación antes de guardar', position: 'top' })
      return
    }
    ubicaciones.value.push({
      fecha: newUbicacion.value.fecha,
      deposito_id: newUbicacion.value.deposito_id,
      observaciones: newUbicacion.value.observaciones,
      deposito_nombre: depositosStore.list.find((d) => d.id === newUbicacion.value.deposito_id)?.nombre || null,
    })
    newUbicacion.value = initNewUbicacion()
  }
  const badUbicacion = ubicaciones.value.find((u) => !u.fecha || !u.deposito_id)
  if (badUbicacion) {
    $q.notify({ type: 'warning', message: 'Cada ubicación debe tener fecha y depósito', position: 'top' })
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await reproStore.update(props.reproduction.id, form.value)
      await saveUbicaciones(props.reproduction.id)
      $q.notify({ type: 'positive', message: 'Cruce actualizado correctamente' })
    } else {
      const newId = await reproStore.create(form.value)
      await saveUbicaciones(newId)
      $q.notify({ type: 'positive', message: 'Cruce registrado correctamente' })
    }
    await reproStore.fetchAll()
    emit('saved')
    visible.value = false
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + (e.message || 'Error al guardar') })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.dialog-card {
  min-width: 360px;
  max-width: 600px;
  width: 100%;
  background: white;
}

@media (max-width: 399px) {
  .dialog-card {
    min-width: unset;
    max-width: 98vw;
    margin: 0 4px;
  }
}

.q-card-section:last-child {
  max-height: 70vh;
  overflow-y: auto;
}

.rounded-borders {
  border-radius: 6px;
}
</style>
