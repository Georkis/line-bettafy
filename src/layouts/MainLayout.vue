<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="custom-header">
      <q-toolbar>
        <q-btn flat dense round icon="menu" class="text-dark" @click="drawer = !drawer" />
        <q-toolbar-title class="text-dark">
          Bettafy
        </q-toolbar-title>
        <q-btn flat round icon="settings" class="text-dark" :to="{ name: 'configuracion' }" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" bordered :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'">
      <q-list>
        <q-item-label header :class="$q.dark.isActive ? 'text-white' : 'text-grey-8'" class="q-mt-md">
          Bettafy
        </q-item-label>
        <q-item v-for="link in navLinks" :key="link.name"
                clickable :to="{ name: link.route }"
                :active="$route.name === link.route"
                active-class="bg-primary text-white">
          <q-item-section avatar>
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ link.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
      <q-page-scroller position="bottom-right" :scroll-offset="150">
        <q-btn fab icon="keyboard_arrow_up" color="primary" />
      </q-page-scroller>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const drawer = ref(false)

const navLinks = [
  { label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
  { label: 'Bettas', icon: 'pets', route: 'bettas' },
  { label: 'Cruces', icon: 'favorite', route: 'reproducciones' },
  { label: 'Genealogía', icon: 'account_tree', route: 'genealogia' },
  { label: 'Finanzas', icon: 'account_balance_wallet', route: 'finanzas' },
  { label: 'Estadísticas', icon: 'bar_chart', route: 'estadisticas' },
  { label: 'Configuración', icon: 'settings', route: 'configuracion' },
]
</script>

<style lang="scss">
.q-layout {
  background: url('/background.jpg') no-repeat center center fixed;
  background-size: cover;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(158, 192, 255, 0.95);
    pointer-events: none;
  }
}

.custom-header {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(6px);
  color: #1d1d1d !important;
}

.q-card {
  background: rgba(255, 255, 255, 0.85);

  &__section {
    color: black;
  }
}

.q-field {
  &__control-container {
    color: black;
  }
}

.connector-v {
  background: black !important;
}

.connector {
  background: black !important;
}

.p-7 {
  width: 95% !important;
}

.q-dark {
  background: black !important;
  .text-h6 {
    color: white;
  }
  .text-body2 {
    color: white;
  }
  .text-weight-bold {
    color: white;
  }
  .q-field__label {
    color: black;
  }
}

</style>
