<template>
  <q-badge v-if="yes" color="green"> YES </q-badge>
  <q-badge v-else color="red"> NO </q-badge>
</template>

<script setup lang="ts">
interface Props {
  yes?: boolean;
}

withDefaults(defineProps<Props>(), {
  yes: true,
});
</script>
