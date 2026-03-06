<template>
  <AppTable
    title="Pings"
    label="Pings"
    sort="created_at"
    :endpoint="`/v1/pings`"
    :columns="columns"
    @row-click="rowClick"
  ></AppTable>
</template>

<script setup lang="ts">
import { type QTableColumn } from 'quasar';
import { useRouter } from 'vue-router';

interface Row {
  id: number;
}

const router = useRouter();

const columns: QTableColumn[] = [
  {
    name: 'id',
    field: 'id',
    label: 'ID',
    sortable: true,
  },
  {
    name: 'tracker',
    field: 'tracker',
    label: 'Tracker',
    sortable: true,
    align: 'left',
  },
  {
    name: 'note',
    field: 'note',
    label: 'Note',
    sortable: true,
    align: 'left',
  },
  {
    name: 'created_at',
    field: 'created_at',
    label: 'Created',
    sortable: true,
  },
];

const rowClick = (evt: MouseEvent, { id }: Row) => {
  evt.preventDefault();
  router.push(`/pings/${id}`).catch((err) => {
    console.error(err);
  });
};
</script>
