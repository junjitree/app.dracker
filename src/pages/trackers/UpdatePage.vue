<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="10em" color="primary" />
  </q-inner-loading>
  <q-form class="q-gutter-xl" :disable="loading" @submit="onSubmit">
    <div class="row">
      <q-card-section class="text-h4 col-12 q-mt-md">
        {{ isNaN(id) ? 'Add' : 'Edit' }} Tracker
      </q-card-section>

      <div class="col-xs-12 col-md-6 q-pa-md">
        <q-input
          v-model="data.name"
          :disable="disable"
          autofocus
          filled
          label="Name"
          lazy-rules
          :rules="[(val: string) => (val && val.length > 0) || 'Please enter a name']"
        />
      </div>

      <div class="col-xs-12 col-md-6 q-pa-md">
        <q-input v-model="data.desc" :disable="disable" filled label="Desc" />
      </div>

      <div class="col-12 q-mb-md q-pa-md">
        <q-btn
          :disable="loading"
          label="Save"
          size="lg"
          type="submit"
          color="primary"
          class="full-width"
        />
      </div>
    </div>
  </q-form>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface Payload {
  name: string;
  desc: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const id = ref(parseInt(route.params.tracker_id?.toString() || '0'));
const loading = ref(false);
const disable = ref(false);

const defaultData: Payload = {
  name: '',
  desc: '',
};

const data = ref(defaultData);
const endpoint = `/v1/trackers`;

const onSubmit = () => {
  loading.value = true;

  const payload: Payload = data.value;
  let req;

  if (isNaN(id.value)) {
    req = api.post(endpoint, payload);
  } else {
    req = api.put(`${endpoint}/${id.value}`, payload);
  }

  req
    .then(async () => {
      $q.notify({
        color: 'green',
        textColor: 'white',
        message: 'Data saved!',
        position: 'bottom-right',
      });

      await router.push(`${endpoint}`);
    })
    .catch((err) => {
      $q.notify({
        color: 'red',
        textColor: 'white',
        message: err.response.data.msg,
        position: 'bottom-right',
      });
    })
    .finally(() => {
      loading.value = false;
    });
};

onBeforeMount(async () => {
  if (isNaN(id.value)) {
    return;
  }

  loading.value = true;
  data.value = (await api.get(`${endpoint}/${id.value}`)).data;
  loading.value = false;
});
</script>
