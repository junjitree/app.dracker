<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="10em" color="primary" />
  </q-inner-loading>

  <q-form class="q-gutter-md" @submit="onSubmit">
    <q-input
      v-model="email"
      autofocus
      outlined
      type="email"
      label="Email address"
      lazy-rules
      :disable="loading"
      :rules="[
        (val: string) => (val && val.length > 0) || 'Please enter your email',
        (val: string) => /.+@.+\..+/.test(val) || 'Invalid email address',
      ]"
    >
      <template #append>
        <UserAvatar :email="email" />
      </template>
    </q-input>

    <div class="q-mb-md">
      <q-btn
        :disable="loading"
        label="Reset Password"
        size="lg"
        type="submit"
        color="primary"
        class="full-width"
      />
    </div>

    <div class="text-center">
      <router-link
        :to="`/?email=${encodeURIComponent(email)}`"
        class="text-primary text-weight-bold"
      >
        Remember your password?
      </router-link>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import UserAvatar from 'components/UserAvatar.vue';
import { api } from 'boot/axios';
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const route = useRoute();

const loading = ref(false);
const email = ref(route.query.email?.toString() || '');

const onSubmit = async () => {
  loading.value = true;

  const payload = {
    email: email.value,
  };

  await api
    .post('v1/password/forgot', payload)
    .then(() => {
      $q.dialog({
        title: 'Success',
        message: 'Password reset link sent!',
        ok: true,
        persistent: true,
      });
    })
    .catch(() => {
      $q.dialog({
        title: 'Error',
        message: 'Something went wrong, please try again.',
        ok: true,
        persistent: true,
      });
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>
