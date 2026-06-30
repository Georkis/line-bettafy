<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Escritorio</div>
    <div class="row q-gutter-md" v-if="stats">
      <div class="resume-card">
        <q-card flat bordered class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h3 text-primary">{{ stats.bettasTotal }}</div>
            <div class="text-subtitle2">Bettas</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h3 text-pink">{{ stats.reproTotal }}</div>
            <div class="text-subtitle2">Cruces</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h3 text-green">{{ abbreviateMoney(stats.ingresosMes) }}</div>
            <div class="text-subtitle2">Ingresos</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="stat-card">
          <q-card-section class="text-center">
            <div class="text-h3 text-negative">{{ abbreviateMoney(stats.gastosMes) }}</div>
            <div class="text-subtitle2">Gastos</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div class="row q-mt-lg q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Últimos Bettas</div>
          </q-card-section>
          <q-list separator>
            <q-item
              v-for="b in recentBettas"
              :key="b.id"
              clickable
              :to="{ name: 'betta-detail', params: { id: b.id } }"
            >
              <q-item-section avatar>
                <q-avatar :color="b.sexo === 'macho' ? 'primary' : 'pink'" text-color="white">
                  {{ b.codigo?.charAt(0) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ b.codigo }} {{ b.nombre ? `- ${b.nombre}` : '' }}</q-item-label>
                <q-item-label caption>{{ b.tipo }} {{ b.color ? `/ ${b.color}` : '' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="b.sexo === 'macho' ? 'primary' : 'pink'">{{ b.sexo }}</q-badge>
              </q-item-section>
            </q-item>
            <q-item v-if="!recentBettas.length">
              <q-item-section class="text-center text-grey">Sin bettas registrados</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">Últimos Cruces</div>
          </q-card-section>
          <q-list separator>
            <q-item v-for="r in recentRepros" :key="r.id">
              <q-item-section avatar>
                <q-icon name="pets" color="pink" size="32px" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ r.macho_codigo }} x {{ r.hembra_codigo }}</q-item-label>
                <q-item-label caption
                  >{{ r.fecha_cruce }} | {{ r.cantidad_alevines || 0 }} alevines</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item v-if="!recentRepros.length">
              <q-item-section class="text-center text-grey">Sin cruces registrados</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'DashboardPage' })
import { ref, computed, onMounted } from 'vue'
import { useBettasStore } from 'src/stores/bettas'
import { useReproduccionesStore } from 'src/stores/reproducciones'
import { useFinanzasStore } from 'src/stores/finanzas'

const bettasStore = useBettasStore()
const reproStore = useReproduccionesStore()
const finanzasStore = useFinanzasStore()

const stats = ref(null)

function abbreviateMoney(n) {
  const num = Number(n || 0)
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return '$' + num
}

onMounted(async () => {
  await Promise.all([bettasStore.fetchAll(), reproStore.fetchAll()])
  const bettaStats = await bettasStore.getStats()
  const reproStats = await reproStore.getStats()

  const now = new Date()
  const finanzas = await finanzasStore.fetchResumen(now.getFullYear(), now.getMonth() + 1)

  stats.value = {
    bettasTotal: bettaStats.total,
    reproTotal: reproStats.total,
    ingresosMes: finanzas.ingresos,
    gastosMes: finanzas.gastos,
  }
})

const recentBettas = computed(() => bettasStore.list.slice(0, 10))
const recentRepros = computed(() => reproStore.list.slice(0, 10))
</script>
<style lang="scss" scoped>
.resume-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  width: 100%;

  @media (max-width: 359px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
