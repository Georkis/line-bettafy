<template>
  <q-dialog v-model="visible" persistent>
    <q-card class="dialog-card">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEdit ? 'Editar Betta' : 'Nuevo Betta' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-form ref="formRef" @submit.prevent="handleSubmit" class="q-gutter-md">
          <div class="row q-gutter-sm">
            <q-input v-model="form.codigo" label="Código *" outlined dense class="col" :rules="[required]" lazy-rules
                     hint="Identificador único del betta" />
            <q-input v-model="form.nombre" label="Nombre" outlined dense class="col" />
          </div>
          <div class="row q-gutter-sm">
            <q-select v-model="form.sexo" :options="sexos" label="Sexo *" outlined dense class="col" :rules="[required]" lazy-rules
                      hint="Macho, hembra o indefinido" />
            <q-select v-model="form.estado" :options="estados" label="Estado" outlined dense class="col" />
          </div>
          <div class="row q-gutter-sm">
            <q-input v-model="form.tipo" label="Tipo" outlined dense class="col" hint="Ej: Halfmoon, Plakat" />
            <q-input v-model="form.variedad" label="Variedad" outlined dense class="col" hint="Ej: Koi, Dragon" />
          </div>
          <div class="row q-gutter-sm">
            <q-input v-model="form.color" label="Color" outlined dense class="col" hint="Color predominante" />
            <q-input v-model="form.origen" label="Origen" outlined dense class="col" hint="País o criadero" />
          </div>
          <div class="row q-gutter-sm">
            <q-input v-model="form.criador" label="Criador" outlined dense class="col" />
            <q-input v-model="form.fecha_nacimiento" label="Fecha Nac." type="date" outlined dense class="col" />
          </div>
          <q-select
            v-model="form.padre_id"
            :options="machosOptions"
            label="Padre"
            outlined dense
            emit-value map-options
            clearable
            hint="Opcional — Selecciona el padre si lo conoces"
          />
          <q-select
            v-model="form.madre_id"
            :options="hembrasOptions"
            label="Madre"
            outlined dense
            emit-value map-options
            clearable
            hint="Opcional — Selecciona la madre si la conoces"
          />
          <div class="row items-center q-gutter-sm">
            <q-avatar size="80px" class="bg-grey-3">
              <q-img v-if="photoUri" :src="photoUri" fit="cover" style="height:80px" />
              <q-icon v-else name="add_a_photo" size="40px" class="text-grey" />
            </q-avatar>
            <div class="col">
              <q-btn flat dense icon="add_a_photo" label="Tomar foto" color="primary" size="sm" @click="capturePhoto" />
              <div class="text-caption text-grey">Foto principal del betta</div>
            </div>
          </div>
          <q-input v-model="form.observaciones" label="Observaciones" outlined dense type="textarea" rows="2"
                   hint="Notas adicionales sobre el betta" />
          <q-card-actions align="right" class="q-px-none q-pb-none">
            <q-btn flat label="Cancelar" color="negative" v-close-popup />
            <q-btn flat label="Guardar" color="primary" type="submit" :loading="saving" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBettasStore } from 'src/stores/bettas'
import { useQuasar } from 'quasar'
import { takePhoto, getPhotoUri } from 'src/services/photo'

const $q = useQuasar()
const props = defineProps({ modelValue: Boolean, betta: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useBettasStore()
const formRef = ref(null)
const sexos = ['macho', 'hembra', 'indefinido']
const estados = ['activo', 'vendido', 'fallecido', 'retirado']
const saving = ref(false)
const photoUri = ref(null)

const visible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.betta)

const form = ref(initForm())

function initForm() {
  return {
    codigo: '', nombre: '', sexo: null, estado: 'activo',
    tipo: '', variedad: '', color: '', origen: '', criador: '',
    fecha_nacimiento: '', padre_id: null, madre_id: null, foto_principal: null, observaciones: '',
  }
}

watch(() => props.betta, (val) => {
  form.value = val ? { ...initForm(), ...val } : initForm()
  if (val?.foto_principal) {
    import('src/services/photo').then(({ getPhotoUri }) => getPhotoUri(val.foto_principal)).then((uri) => { photoUri.value = uri })
  } else {
    photoUri.value = null
  }
}, { immediate: true })

async function capturePhoto() {
  try {
    const path = await takePhoto()
    if (path) {
      form.value.foto_principal = path
      photoUri.value = await getPhotoUri(path)
      $q.notify({ type: 'positive', message: 'Foto capturada' })
    }
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + (e.message || '') })
  }
}

const machosOptions = computed(() =>
  store.list.filter((b) => b.sexo === 'macho').map((b) => ({ label: `${b.codigo}${b.nombre ? ` - ${b.nombre}` : ''}`, value: b.id })),
)
const hembrasOptions = computed(() =>
  store.list.filter((b) => b.sexo === 'hembra').map((b) => ({ label: `${b.codigo}${b.nombre ? ` - ${b.nombre}` : ''}`, value: b.id })),
)

function required(val) { return !!val || 'Campo requerido' }

async function handleSubmit() {
  const isValid = await formRef.value.validate()
  if (!isValid) {
    $q.notify({ type: 'warning', message: 'Corrige los campos marcados en rojo', position: 'top' })
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await store.update(props.betta.id, form.value)
      $q.notify({ type: 'positive', message: 'Betta actualizado correctamente' })
    } else {
      await store.create(form.value)
      $q.notify({ type: 'positive', message: 'Betta creado correctamente' })
    }
    await store.fetchAll()
    emit('saved')
    visible.value = false
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('UNIQUE constraint failed: bettas.codigo')) {
      $q.notify({ type: 'warning', message: `El código "${form.value.codigo}" ya existe. Usa uno diferente.`, position: 'top' })
    } else {
      $q.notify({ type: 'negative', message: 'Error: ' + msg })
    }
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
</style>
