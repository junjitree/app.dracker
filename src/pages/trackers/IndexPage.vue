<template>
  <AppTable
    title="Trackers"
    endpoint="/v1/trackers"
    :columns="columns"
    :trigger="trigger"
    @row-click="rowClick"
  >
    <template #actions>
      <q-btn icon="add" to="/trackers/new" color="primary" outline />
    </template>
  </AppTable>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

interface Row {
  id: number;
}
const trigger = ref(0);
const router = useRouter();

const columns: QTableColumn[] = [
  {
    name: 'id',
    field: 'id',
    label: 'ID',
    sortable: true,
  },
  {
    name: 'slug',
    field: 'slug',
    label: 'Slug',
    sortable: true,
    align: 'left',
  },
  {
    name: 'name',
    field: 'name',
    label: 'Name',
    sortable: true,
    align: 'left',
  },
  {
    name: 'desc',
    field: 'desc',
    label: 'Desc',
    sortable: true,
    align: 'left',
  },
  {
    name: 'created_at',
    field: 'created_at',
    label: 'Created',
    sortable: true,
  },
  {
    name: 'updated_at',
    field: 'updated_at',
    label: 'Updated',
    sortable: true,
  },
];

const rowClick = (evt: MouseEvent, { id }: Row) => {
  evt.preventDefault();
  router.push(`/trackers/${id}`).catch((err) => {
    console.error(err);
  });
};
</script>
