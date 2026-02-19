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

    <q-input
      v-model="password"
      autofocus
      outlined
      label="Password"
      :type="showPass ? 'text' : 'password'"
      lazy-rules
      :disable="loading"
      :rules="[(val: string) => (val && val.length > 0) || 'Please enter your password']"
    >
      <template #append>
        <q-icon
          :name="showPass ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="
            () => {
              showPass = !showPass;
            }
          "
        />
      </template>
    </q-input>

    <div class="q-mb-md">
      <q-btn
        :disable="loading"
        label="Create Account"
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
import { useRoute, useRouter } from 'vue-router';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const email = ref(route.query.email?.toString() || '');
const password = ref('');
const given_name = ref('');
const surname = ref('');
const showPass = ref(false);

const onSubmit = async () => {
  loading.value = true;

  const payload = {
    email: email.value,
    password: password.value,
    given_name: given_name.value,
    surname: surname.value,
  };

  await api
    .post('v1/signup', payload)
    .then(() => {
      $q.dialog({
        title: 'Success',
        message: 'Email verification sent!',
        ok: true,
        persistent: true,
      }).onDismiss(() => {
        router.push('/').catch((err) => {
          console.error(err);
        });
      });
    })
    .catch((err) => {
      console.log(err.response.data.msg);
      $q.dialog({
        title: 'Error',
        message: err?.response?.data?.msg || 'Something went wrong, please try again.',
        ok: true,
        persistent: true,
      });
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>
