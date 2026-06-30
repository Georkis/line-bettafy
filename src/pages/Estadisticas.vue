<template>
  <q-page class="q-pa-md p-7">
    <div class="text-h4 q-mb-md">Estadísticas</div>
    <div class="row q-gutter-md" v-if="stats">
      <q-card flat bordered class="col-12 col-sm-5">
        <q-card-section>
          <div class="text-h6">Por Sexo</div>
        </q-card-section>
        <q-list separator>
          <q-item v-for="s in stats.bySexo" :key="s.sexo">
            <q-item-section>
              <q-item-label>{{ s.sexo }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="s.sexo === 'macho' ? 'primary' : s.sexo === 'hembra' ? 'pink' : 'grey'">
                {{ s.count }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <q-card flat bordered class="col-12 col-sm-5">
        <q-card-section>
          <div class="text-h6">Por Estado</div>
        </q-card-section>
        <q-list separator>
          <q-item v-for="s in stats.byEstado" :key="s.estado">
            <q-item-section>
              <q-item-label>{{ s.estado }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge>{{ s.count }}</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <q-card flat bordered class="col-12 col-sm-5">
        <q-card-section>
          <div class="text-h6">Por Tipo</div>
        </q-card-section>
        <q-list separator>
          <q-item v-for="s in stats.byTipo" :key="s.tipo">
            <q-item-section>
              <q-item-label>{{ s.tipo || 'Sin especificar' }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge>{{ s.count }}</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
      <q-card flat bordered class="col-12 col-sm-5">
        <q-card-section>
          <div class="text-h6">Reproducción</div>
        </q-card-section>
        <q-list separator>
          <q-item>
            <q-item-section>Total Cruces</q-item-section>
            <q-item-section side>{{ reproStats.total }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Total Alevines</q-item-section>
            <q-item-section side>{{ reproStats.totalAlevines }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section>Promedio/cruce</q-item-section>
            <q-item-section side>{{ reproStats.total ? (reproStats.totalAlevines / reproStats.total).toFixed(1) : 0 }}</q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'EstadisticasPage' })
import { ref, onMounted } from 'vue'
import { useBettasStore } from 'src/stores/bettas'
import { useReproduccionesStore } from 'src/stores/reproducciones'

const bettasStore = useBettasStore()
const reproStore = useReproduccionesStore()
const stats = ref(null)
const reproStats = ref({ total: 0, totalAlevines: 0 })

onMounted(async () => {
  const [bettaStats, repStats] = await Promise.all([
    bettasStore.getStats(),
    reproStore.getStats(),
  ])
  stats.value = bettaStats
  reproStats.value = repStats
})
</script>
