<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Genealogía</div>

    <div class="row q-mb-md">
      <q-select
        v-model="selectedBetta"
        :options="bettasOptions"
        label="Seleccionar Betta"
        outlined dense
        class="col"
        emit-value map-options
        clearable
        @update:model-value="loadTree"
      />
    </div>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <div v-else-if="tree" class="overflow-auto">
      <TreeView :node="tree" @select="openDetail" />
    </div>

    <div v-else-if="selectedBetta && !tree" class="text-center text-black q-py-xl">
      <q-icon name="account_tree" size="64px" />
      <div class="text-h6 q-mt-sm">Sin datos genealógicos</div>
    </div>

    <div v-else class="text-center text-black q-py-xl">
      <q-icon name="account_tree" size="64px" />
      <div class="text-h6 q-mt-sm">Selecciona un betta para ver su árbol</div>
    </div>

    <!-- Detail dialog -->
    <q-dialog v-model="detailOpen" maximized transition-show="slide-up" transition-hide="slide-down">
      <q-card>
        <q-bar class="bg-primary text-white">
          <span>{{ detailBetta?.codigo }}</span>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="q-pa-md scroll" style="max-height: 90vh">
          <div class="row q-col-gutter-md">
            <!-- Photo -->
            <div class="col-12 col-md-5">
              <q-card flat bordered>
                <q-img
                  v-if="detailPhoto"
                  :src="detailPhoto"
                  style="height: 300px"
                  fit="contain"
                />
                <div v-else class="flex flex-center bg-grey-2" style="height: 300px">
                  <q-icon name="auto_awesome" size="64px" color="grey-5" />
                </div>
              </q-card>
            </div>
            <!-- Details -->
            <div class="col-12 col-md-7">
              <div class="text-h2 q-mb-md">{{ detailBetta?.codigo }}</div>
              <div v-if="detailBetta?.nombre" class="text-subtitle1 text-grey q-mb-md">
                {{ detailBetta.nombre }}
              </div>

              <q-list dense separator>
                <q-item>
                  <q-item-section side>
                    <q-icon name="wc" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Sexo</q-item-label>
                    <q-item-label class="text-capitalize">{{ detailBetta?.sexo }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="calendar_month" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Fecha de Nacimiento</q-item-label>
                    <q-item-label>{{ detailBetta?.fecha_nacimiento || '—' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section side>
                    <q-icon name="circle" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Estado</q-item-label>
                    <q-item-label>
                      <q-badge :color="estadoColor(detailBetta?.estado)">
                        {{ detailBetta?.estado || '—' }}
                      </q-badge>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="detailBetta?.tipo">
                  <q-item-section side>
                    <q-icon name="category" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Tipo</q-item-label>
                    <q-item-label>{{ detailBetta.tipo }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="detailBetta?.variedad">
                  <q-item-section side>
                    <q-icon name="grass" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Variedad</q-item-label>
                    <q-item-label>{{ detailBetta.variedad }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="detailBetta?.color">
                  <q-item-section side>
                    <q-icon name="palette" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Color</q-item-label>
                    <q-item-label>{{ detailBetta.color }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="detailBetta?.origen">
                  <q-item-section side>
                    <q-icon name="public" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Origen</q-item-label>
                    <q-item-label>{{ detailBetta.origen }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-item v-if="detailBetta?.criador">
                  <q-item-section side>
                    <q-icon name="person" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label caption>Criador</q-item-label>
                    <q-item-label>{{ detailBetta.criador }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div v-if="detailBetta?.observaciones" class="q-mt-md">
                <div class="text-subtitle2 text-grey q-mb-xs">Observaciones</div>
                <p class="text-body2">{{ detailBetta.observaciones }}</p>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
defineOptions({ name: 'GenealogiaPage' })
import { ref, computed, onMounted } from 'vue'
import { useBettasStore } from 'src/stores/bettas'
import { buildTree } from 'src/services/genealogy'
import { getPhotoUri } from 'src/services/photo'
import TreeView from 'components/TreeView.vue'

const bettasStore = useBettasStore()
const selectedBetta = ref(null)
const tree = ref(null)
const loading = ref(false)
const detailOpen = ref(false)
const detailBetta = ref(null)
const detailPhoto = ref(null)

const bettasOptions = computed(() =>
  bettasStore.list.map((b) => ({ label: `${b.codigo}${b.nombre ? ` - ${b.nombre}` : ''}`, value: b.id })),
)

onMounted(() => bettasStore.fetchAll())

async function loadTree(id) {
  if (!id) { tree.value = null; return }
  loading.value = true
  try {
    tree.value = await buildTree(id)
  } finally {
    loading.value = false
  }
}

async function openDetail(betta) {
  detailBetta.value = betta
  detailPhoto.value = null
  detailOpen.value = true
  if (betta?.foto_principal) {
    detailPhoto.value = await getPhotoUri(betta.foto_principal)
  }
}

function estadoColor(estado) {
  const map = { activo: 'positive', vendido: 'warning', fallecido: 'negative', retirado: 'grey' }
  return map[estado] || 'grey'
}
</script>
