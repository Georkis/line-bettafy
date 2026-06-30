<template>
  <q-dialog v-model="visible" persistent>
    <q-card class="dialog-card">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ isEdit ? 'Editar Movimiento' : 'Nuevo Movimiento' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-form ref="formRef" @submit.prevent="handleSubmit" class="q-gutter-md">
          <div class="row">
            <q-btn :color="form.tipo === 'ingreso' ? 'green' : 'grey'"
                   :outline="form.tipo !== 'ingreso'"
                   label="Ingreso" unelevated class="col q-mr-xs"
                   @click="form.tipo = 'ingreso'" />
            <q-btn :color="form.tipo === 'gasto' ? 'negative' : 'grey'"
                   :outline="form.tipo !== 'gasto'"
                   label="Gasto" unelevated class="col"
                   @click="form.tipo = 'gasto'" />
          </div>

          <q-input v-model="form.concepto" label="Concepto *" outlined dense :rules="[required]" lazy-rules />

          <template v-if="form.tipo === 'ingreso'">
            <q-select v-model="form.betta_id" :options="bettasOptions" label="Betta (opcional)" outlined dense
                      emit-value map-options clearable hint="Vincula la venta a un betta específico" />
            <div class="row">
              <q-input v-model="form.cantidad" label="Cantidad" type="number" outlined dense class="col q-mr-xs" min="1"
                       :disable="!!form.betta_id" />
              <q-input v-model="form.precio_unitario" label="Precio unitario $" type="number" outlined dense class="col" min="0" />
            </div>
            <div class="row q-gutter-sm items-end">
              <div class="col text-subtitle2 text-green" v-if="form.cantidad && form.precio_unitario">
                Total: ${{ (Number(form.cantidad) || 1) * (Number(form.precio_unitario) || 0) }}
              </div>
            </div>
            <q-select v-model="form.sexo" :options="['macho', 'hembra']" label="Sexo del lote" outlined dense
                      emit-value clearable hint="Se autocompleta si seleccionas un betta" />
            <q-input v-model="form.comprador" label="Comprador" outlined dense />
          </template>

          <template v-if="form.tipo === 'gasto'">
            <q-input v-model="form.monto" label="Monto $ *" type="number" outlined dense
                     :rules="[required]" lazy-rules min="0" />
            <q-select v-model="form.categoria" :options="categoriasGasto" label="Categoría *" outlined dense
                      emit-value :rules="[required]" lazy-rules />
          </template>

          <q-input v-model="form.fecha" label="Fecha *" type="date" outlined dense :rules="[required]" lazy-rules />

          <q-input v-model="form.observaciones" label="Observaciones" outlined dense type="textarea" rows="2" />

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
import { ref, computed, watch, onMounted } from 'vue'
import { useFinanzasStore } from 'src/stores/finanzas'
import { useBettasStore } from 'src/stores/bettas'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const props = defineProps({ modelValue: Boolean, transaccion: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useFinanzasStore()
const bettasStore = useBettasStore()
const formRef = ref(null)
const saving = ref(false)

onMounted(() => bettasStore.fetchAll())

const categoriasGasto = [
  'Alimentación',
  'Equipamiento',
  'Medicinas',
  'Transporte/Envío',
  'Insumos generales',
]

const visible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const isEdit = computed(() => !!props.transaccion)

const form = ref(initForm())

function initForm() {
  return {
    tipo: 'ingreso',
    concepto: '',
    cantidad: 1,
    precio_unitario: '',
    monto: '',
    sexo: null,
    comprador: '',
    categoria: null,
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: '',
    betta_id: null,
  }
}

watch(() => props.transaccion, (val) => {
  if (val) {
    form.value = {
      ...initForm(),
      ...val,
      cantidad: val.cantidad || 1,
      precio_unitario: val.precio_unitario || '',
      monto: val.monto || '',
    }
  } else {
    form.value = initForm()
  }
}, { immediate: true })

watch(visible, (val) => {
  if (val && !props.transaccion) {
    form.value = initForm()
  }
})

const bettasOptions = computed(() =>
  bettasStore.list.filter((b) => b.estado === 'activo').map((b) => ({
    label: `${b.codigo}${b.nombre ? ` - ${b.nombre}` : ''} (${b.sexo})`,
    value: b.id,
  })),
)

watch(() => form.value.betta_id, (id) => {
  if (id) {
    form.value.cantidad = 1
    const betta = bettasStore.list.find((b) => b.id === id)
    if (betta) form.value.sexo = betta.sexo === 'indefinido' ? null : betta.sexo
  }
})

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
      await store.update(props.transaccion.id, form.value)
      $q.notify({ type: 'positive', message: 'Movimiento actualizado' })
    } else {
      await store.create(form.value)
      $q.notify({ type: 'positive', message: 'Movimiento creado' })
    }
    emit('saved')
    visible.value = false
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + (e.message || '') })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.dialog-card {
  min-width: 360px;
  max-width: 500px;
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
</style>
