<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="10em" color="primary" />
  </q-inner-loading>

  <q-form class="q-gutter-xl" :disable="loading" @submit="onSubmit">
    <div class="row">
      <q-card-section class="text-h4 col-12 q-mt-md"> Edit Profile </q-card-section>

      <div class="col-xs-12 col-md-6 q-pa-md">
        <q-input
          v-model="data.given_name"
          :disable="disable"
          autofocus
          filled
          label="First Name"
          lazy-rules
          :rules="[(val: string) => (val && val.length > 0) || 'Please enter a first name']"
        />
      </div>

      <div class="col-xs-12 col-md-6 q-pa-md">
        <q-input
          v-model="data.surname"
          :disable="disable"
          filled
          label="Last Name"
          lazy-rules
          :rules="[(val: string) => (val && val.length > 0) || 'Please enter a last name']"
        />
      </div>

      <div class="col-xs-12 col-md-12 q-pa-md">
        <q-input
          v-model="data.email"
          :disable="disable"
          filled
          label="Email"
          type="email"
          lazy-rules
          :rules="[
            (val: string) => (val && val.length > 0) || 'Please enter an email',
            (val: string) => /.+@.+\..+/.test(val) || 'Please enter a valid email',
          ]"
        >
          <template #append>
            <UserAvatar :email="data.email" />
          </template>
        </q-input>
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
import UserAvatar from 'components/UserAvatar.vue';
import { api } from 'boot/axios';
import { ref, onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';

interface UserPayload {
  email: string;
  given_name: string;
  surname: string;
}

const $q = useQuasar();
const authStore = useAuthStore();

const endpoint = '/v1/users/me';

const loading = ref(false);
const disable = ref(false);

const defaultData: UserPayload = {
  email: '',
  given_name: '',
  surname: '',
};

const data = ref(defaultData);

const onSubmit = () => {
  loading.value = true;

  const payload: UserPayload = data.value;

  api
    .put(endpoint, payload)
    .then(async () => {
      $q.notify({
        color: 'green',
        textColor: 'white',
        message: 'Data saved!',
        position: 'bottom-right',
      });

      await authStore.me();
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
  loading.value = true;
  data.value = (await api.get(endpoint)).data;
  loading.value = false;
});
</script>
