<template>
  <AppTable title="Pings" label="Pings" :endpoint="`/v1/pings`" @row-click="rowClick"></AppTable>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

interface Row {
  id: number;
}

const router = useRouter();

const rowClick = (evt: MouseEvent, { id }: Row) => {
  evt.preventDefault();
  router.push(`/pings/${id}`).catch((err) => {
    console.error(err);
  });
};
</script>
