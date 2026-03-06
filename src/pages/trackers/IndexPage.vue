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

    <template #body-cell-actions="{ row }">
      <q-td :class="`text-${row.align}`">
        <q-btn
          :disable="loading"
          icon="delete"
          color="red"
          dense
          flat
          @click.stop="rowDestroy(row)"
        >
          <q-tooltip anchor="bottom middle" self="top middle">Delete</q-tooltip>
        </q-btn>
      </q-td>
    </template>
  </AppTable>
</template>

<script setup lang="ts">
import { useQuasar, type QTableColumn } from 'quasar';
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

interface Row {
  id: number;
}

const $q = useQuasar();
const trigger = ref(0);
const router = useRouter();
const loading = ref(false);

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
  {
    name: 'actions',
    field: 'actions',
    label: 'Actions',
    align: 'center',
  },
];

const rowClick = (evt: MouseEvent, { id }: Row) => {
  evt.preventDefault();
  router.push(`/trackers/${id}`).catch((err) => {
    console.error(err);
  });
};

const rowDestroy = ({ id }: Row) => {
  $q.dialog({
    title: 'Sure?',
    message: 'Delete Tracker',
    ok: 'Confirm',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    loading.value = true;
    api
      .delete(`/v1/trackers/${id}`)
      .then(() => {
        trigger.value++;
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        loading.value = false;
      });
  });
};
</script>
