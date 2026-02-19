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
      outlined
      label="Password"
      lazy-rules
      :type="showPass ? 'text' : 'password'"
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
        label="Log In"
        size="lg"
        type="submit"
        color="primary"
        class="full-width"
        :disable="loading"
      />
    </div>

    <div class="text-center">
      <router-link
        :to="`/signup?email=${encodeURIComponent(email)}`"
        class="text-primary text-weight-bold"
      >
        Don't have an account?
      </router-link>
      or
      <router-link
        :to="`/password/forgot?email=${encodeURIComponent(email)}`"
        class="text-primary text-weight-bold"
      >
        Forgot your password?
      </router-link>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import UserAvatar from 'components/UserAvatar.vue';
import { api } from 'boot/axios';
import { ref } from 'vue';
import { useAuthStore } from 'stores/auth';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const email = ref(route.query.email?.toString() || '');
const password = ref('');
const showPass = ref(false);

const onSubmit = async () => {
  loading.value = true;

  await api
    .post('v1/login/cookie', {
      email: email.value,
      password: password.value,
    })
    .then(async () => {
      await authStore.me();
      return router.push('dashboard');
    })
    .catch(() => {
      $q.dialog({
        title: 'Error',
        message: 'Invalid credentials',
        ok: true,
      });
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>
