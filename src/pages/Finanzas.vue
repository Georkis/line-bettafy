<template>
  <q-page class="q-pa-md p-7">
    <div class="row items-center q-mb-sm">
      <div class="text-h4">Finanzas</div>
      <q-space />
      <q-btn flat round icon="refresh" @click="loadData" :loading="store.loading" />
    </div>

    <q-card flat bordered class="q-mb-md filter-card">
      <q-card-section class="q-pa-sm">
        <div class="row items-center q-gutter-xs q-mb-sm">
          <span class="text-caption text-grey q-mr-sm">Filtro</span>
          <q-btn :color="periodo === 'mes' ? 'green' : 'white'"
                 :text-color="periodo === 'mes' ? 'white' : 'grey-9'"
                 label="Mes" unelevated dense
                 @click="periodo = 'mes'; onPeriodoChange()" />
          <q-btn :color="periodo === 'anio' ? 'green' : 'white'"
                 :text-color="periodo === 'anio' ? 'white' : 'grey-9'"
                 label="Año" unelevated dense
                 @click="periodo = 'anio'; onPeriodoChange()" />
          <q-btn :color="periodo === 'rango' ? 'green' : 'white'"
                 :text-color="periodo === 'rango' ? 'white' : 'grey-9'"
                 label="Rango" unelevated dense
                 @click="periodo = 'rango'; onPeriodoChange()" />
        </div>
        <div class="row q-gutter-sm items-center">
          <template v-if="periodo === 'mes'">
            <q-select v-model="mes" :options="meses" label="Mes" outlined dense
                      map-options emit-value style="min-width:130px"
                      @update:model-value="loadData" />
            <q-input v-model="anio" label="Año" type="number" outlined dense
                     style="width:80px" @update:model-value="loadData" />
          </template>
          <template v-else-if="periodo === 'anio'">
            <q-input v-model="anio" label="Año" type="number" outlined dense
                     style="width:80px" @update:model-value="loadData" />
            <span class="text-grey">Todo el año</span>
          </template>
          <template v-else>
            <q-input v-model="desde" label="Desde" type="date" outlined dense
                     style="width:153px" @update:model-value="loadData" />
            <q-input v-model="hasta" label="Hasta" type="date" outlined dense
                     style="width:153px" @update:model-value="loadData" />
          </template>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-gutter-sm q-mb-md" v-if="!store.loading">
      <q-card flat bordered class="resumen-card bg-green-1">
        <q-card-section class="text-center">
          <div class="text-h5 text-green">+${{ formatMoney(store.resumen.ingresos) }}</div>
          <div class="text-subtitle2">Ingresos</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="resumen-card bg-red-1">
        <q-card-section class="text-center">
          <div class="text-h5 text-negative">-${{ formatMoney(store.resumen.gastos) }}</div>
          <div class="text-subtitle2">Gastos</div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="resumen-card"
        :class="store.resumen.balance >= 0 ? 'bg-blue-1' : 'bg-orange-1'">
        <q-card-section class="text-center">
          <div class="text-h5" :class="store.resumen.balance >= 0 ? 'text-blue' : 'text-orange'">
            {{ store.resumen.balance >= 0 ? '+' : '-' }}${{ formatMoney(Math.abs(store.resumen.balance)) }}
          </div>
          <div class="text-subtitle2">Balance</div>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="store.loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <template v-else>
      <q-card v-for="t in store.list" :key="t.id" flat bordered class="q-mb-sm">
        <q-card-section class="row items-center">
          <div class="col">
            <div class="row items-center q-gutter-xs">
              <q-badge :color="t.tipo === 'ingreso' ? 'green' : 'negative'">
                {{ t.tipo === 'ingreso' ? 'INGRESO' : 'GASTO' }}
              </q-badge>
              <span class="text-subtitle1">{{ t.concepto }}</span>
            </div>
            <div class="row q-gutter-sm q-mt-xs text-caption text-grey items-center">
              <span>{{ t.fecha }}</span>
              <span v-if="t.tipo === 'ingreso'">
                | <q-badge :color="t.sexo === 'macho' ? 'primary' : 'pink'" size="sm">
                    {{ t.sexo === 'macho' ? 'MACHO' : 'HEMBRA' }}
                  </q-badge>
                <span v-if="t.betta_codigo"> | Betta: <strong>{{ t.betta_codigo }}</strong></span>
                | {{ t.cantidad }} × ${{ formatMoney(t.precio_unitario) }}
                <span v-if="t.comprador"> | Comprador: {{ t.comprador }}</span>
              </span>
              <span v-if="t.tipo === 'gasto' && t.categoria"> | {{ t.categoria }}</span>
            </div>
            <div v-if="t.observaciones" class="text-caption q-mt-xs">{{ t.observaciones }}</div>
          </div>
          <div class="text-h6 q-mr-md" :class="t.tipo === 'ingreso' ? 'text-green' : 'text-negative'">
            {{ t.tipo === 'ingreso' ? '+' : '-' }}${{ formatMoney(t.monto) }}
          </div>
          <div class="q-gutter-xs">
            <q-btn flat round icon="edit" color="warning" size="sm" @click="openEdit(t)" />
            <q-btn flat round icon="delete" color="negative" size="sm" @click="confirmDelete(t)" />
          </div>
        </q-card-section>
      </q-card>
      <div v-if="!store.list.length" class="text-center text-grey q-py-xl">
        <q-icon name="account_balance_wallet" size="64px" />
        <div class="text-h6 q-mt-sm">Sin movimientos en este período</div>
      </div>
    </template>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="openCreate" />
    </q-page-sticky>

    <q-dialog v-model="showDelete">
      <q-card>
        <q-card-section class="text-h6">Eliminar movimiento?</q-card-section>
        <q-card-section>Esta acción no se puede deshacer.</q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn flat label="Eliminar" color="negative" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <TransaccionForm v-model="showForm" :transaccion="editing" @saved="onSaved" />
  </q-page>
</template>

<script setup>
defineOptions({ name: 'FinanzasPage' })
import { ref, onMounted } from 'vue'
import { useFinanzasStore } from 'src/stores/finanzas'
import { useQuasar } from 'quasar'
import TransaccionForm from 'components/TransaccionForm.vue'

const $q = useQuasar()
const store = useFinanzasStore()

const now = new Date()
const periodo = ref('mes')
const mes = ref(now.getMonth() + 1)
const anio = ref(now.getFullYear())
const desde = ref('')
const hasta = ref('')
const showForm = ref(false)
const editing = ref(null)
const showDelete = ref(false)
const toDelete = ref(null)

const meses = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 }, { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 }, { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
]

function formatMoney(n) {
  return Number(n || 0).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

onMounted(() => loadData())

function getFilterParams() {
  if (periodo.value === 'mes') {
    return { anio: anio.value, mes: mes.value }
  }
  if (periodo.value === 'rango' && desde.value && hasta.value) {
    return { desde: desde.value, hasta: hasta.value }
  }
  return { anio: anio.value }
}

async function loadData() {
  const params = getFilterParams()
  await Promise.all([
    store.fetchByRange(params),
    store.fetchResumen(params),
  ])
}

function onPeriodoChange() {
  if (periodo.value === 'rango' && !desde.value && !hasta.value) {
    desde.value = `${anio.value}-01-01`
    hasta.value = `${anio.value}-12-31`
  }
  loadData()
}

function openCreate() { editing.value = null; showForm.value = true }
function openEdit(t) { editing.value = { ...t }; showForm.value = true }
function confirmDelete(t) { toDelete.value = t; showDelete.value = true }

async function doDelete() {
  try {
    await store.delete(toDelete.value.id)
    await store.fetchResumen(getFilterParams())
    $q.notify({ type: 'positive', message: 'Movimiento eliminado' })
  } catch (e) {
    $q.notify({ type: 'negative', message: 'Error: ' + (e.message || '') })
  }
  showDelete.value = false
  toDelete.value = null
}

function onSaved() {
  showForm.value = false
  loadData()
}
</script>

<style lang="scss" scoped>
.resumen-card {
  min-width: 150px;
  flex: 1;
}


</style>
