<template>
  <div class="tree-view">
    <div class="tree-node flex flex-center column">
      <!-- ── Ancestors ── -->
      <template v-if="node.padre || node.madre">
        <div class="row justify-center q-gutter-xl">
          <!-- Father side -->
          <div v-if="node.padre" class="flex flex-center column ancestor-side">
            <!-- Paternal grandparents as chips -->
            <div class="row q-gutter-xs q-mb-xs grandparent-chips">
              <q-chip v-if="node.padre.padre" size="md" outline color="primary" class="cursor-pointer"
                @click.stop="$emit('select', node.padre.padre)">
                {{ node.padre.padre.codigo }}
              </q-chip>
              <q-chip v-if="node.padre.madre" size="md" outline color="pink" class="cursor-pointer"
                @click.stop="$emit('select', node.padre.madre)">
                {{ node.padre.madre.codigo }}
              </q-chip>
            </div>
            <!-- Father card -->
            <q-card flat bordered class="node-card sexo-macho cursor-pointer" @click="$emit('select', node.padre)">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-weight-bold">{{ node.padre.codigo }}</div>
                <div v-if="node.padre.nombre" class="text-caption text-grey">{{ node.padre.nombre }}</div>
                <div class="row justify-center q-gutter-xs q-mt-xs">
                  <q-badge color="primary" class="text-capitalize">{{ node.padre.sexo }}</q-badge>
                  <q-badge v-if="node.padre.estado" :color="estadoColor(node.padre.estado)" outline>
                    {{ node.padre.estado }}
                  </q-badge>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <!-- Mother side -->
          <div v-if="node.madre" class="flex flex-center column ancestor-side">
            <!-- Maternal grandparents as chips -->
            <div class="row q-gutter-xs q-mb-xs grandparent-chips">
              <q-chip v-if="node.madre.padre" size="xs" outline color="primary" class="cursor-pointer"
                @click.stop="$emit('select', node.madre.padre)">
                {{ node.madre.padre.codigo }}
              </q-chip>
              <q-chip v-if="node.madre.madre" size="xs" outline color="pink" class="cursor-pointer"
                @click.stop="$emit('select', node.madre.madre)">
                {{ node.madre.madre.codigo }}
              </q-chip>
            </div>
            <!-- Mother card -->
            <q-card flat bordered class="node-card sexo-hembra cursor-pointer" @click="$emit('select', node.madre)">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-weight-bold">{{ node.madre.codigo }}</div>
                <div v-if="node.madre.nombre" class="text-caption text-grey">{{ node.madre.nombre }}</div>
                <div class="row justify-center q-gutter-xs q-mt-xs">
                  <q-badge color="pink" class="text-capitalize">{{ node.madre.sexo }}</q-badge>
                  <q-badge v-if="node.madre.estado" :color="estadoColor(node.madre.estado)" outline>
                    {{ node.madre.estado }}
                  </q-badge>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <div class="connector-v" />
      </template>

      <!-- ── Current node ── -->
      <q-card flat bordered class="node-card root-card cursor-pointer" :class="`sexo-${node.sexo}`"
        @click="$emit('select', node)">
        <q-card-section class="q-pa-md text-center">
          <q-avatar v-if="node.foto_principal" size="48px" class="q-mb-sm">
            <img :src="node.foto_principal" />
          </q-avatar>
          <q-avatar v-else size="48px" class="q-mb-sm" :color="node.sexo === 'macho' ? 'primary' : node.sexo === 'hembra' ? 'pink' : 'grey'"
            text-color="white" icon="auto_awesome" />
          <div class="text-h6">{{ node.codigo }}</div>
          <div v-if="node.nombre" class="text-subtitle2 text-grey">{{ node.nombre }}</div>
          <div class="row justify-center q-gutter-xs q-mt-sm">
            <q-badge :color="node.sexo === 'macho' ? 'primary' : 'pink'" class="text-capitalize">
              {{ node.sexo }}
            </q-badge>
            <q-badge v-if="node.estado" :color="estadoColor(node.estado)" outline>
              {{ node.estado }}
            </q-badge>
            <q-badge v-if="node.fecha_nacimiento" color="grey-7" outline>
              {{ node.fecha_nacimiento }}
            </q-badge>
          </div>
        </q-card-section>
      </q-card>

      <!-- ── Partners & descendants ── -->
      <template v-if="node.partners && node.partners.length">
        <div class="connector-v" />
        <div class="row justify-center q-gutter-lg">
          <div v-for="group in node.partners" :key="group.partner.id" class="flex flex-center column partner-group">
            <div class="connector-v" />
            <!-- Partner card -->
            <q-card flat bordered class="node-card cursor-pointer" :class="`sexo-${group.partner.sexo}`"
              @click="$emit('select', group.partner)">
              <q-card-section class="q-pa-sm text-center">
                <div class="text-weight-bold">{{ group.partner.codigo }}</div>
                <div v-if="group.partner.nombre" class="text-caption text-grey">{{ group.partner.nombre }}</div>
                <div class="row justify-center q-gutter-xs q-mt-xs">
                  <q-badge :color="group.partner.sexo === 'macho' ? 'primary' : 'pink'" class="text-capitalize">
                    {{ group.partner.sexo }}
                  </q-badge>
                  <q-badge v-if="group.partner.estado" :color="estadoColor(group.partner.estado)" outline>
                    {{ group.partner.estado }}
                  </q-badge>
                </div>
              </q-card-section>
            </q-card>
            <!-- Children of this partner -->
            <template v-if="group.children && group.children.length">
              <div class="connector-v" />
              <div class="row justify-center q-gutter-sm">
                <div v-for="child in group.children" :key="child.id" class="flex flex-center column">
                  <TreeView :node="child" @select="(b) => $emit('select', b)" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- ── Children without partner ── -->
      <template v-if="node.children && node.children.length">
        <div class="connector-v" />
        <div class="row justify-center q-gutter-sm">
          <div v-for="child in node.children" :key="child.id" class="flex flex-center column">
            <TreeView :node="child" @select="(b) => $emit('select', b)" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({ node: { type: Object, required: true } })
defineEmits(['select'])

function estadoColor(estado) {
  const map = { activo: 'positive', vendido: 'warning', fallecido: 'negative', retirado: 'grey' }
  return map[estado] || 'grey'
}
</script>

<style lang="scss" scoped>
.tree-view {
  display: flex;
  justify-content: center;
}
.tree-node {
  flex-direction: column;
}
.ancestor-side {
  min-width: 160px;
}
.partner-group {
  min-width: 160px;
}
.node-card {
  min-width: 140px;
  border-radius: 10px;
  transition: transform 0.15s, box-shadow 0.15s;
  &.sexo-macho { border-left: 4px solid #1976D2; }
  &.sexo-hembra { border-left: 4px solid #E91E63; }
  &.sexo-indefinido { border-left: 4px solid #9E9E9E; }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
.root-card {
  min-width: 180px;
}
.grandparent-chips {
  max-width: 160px;
  flex-wrap: wrap;
  justify-content: center;
}
.connector-v {
  width: 2px;
  height: 20px;
  background: #bbb;
  margin: 0 auto;
}
</style>
