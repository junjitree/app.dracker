<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="10em" color="primary" />
  </q-inner-loading>

  <q-form class="q-gutter-md" @submit="onSubmit">
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
              showPass = !showPass
            }
          "
        />
      </template>
    </q-input>

    <q-input
      v-model="password_confirm"
      outlined
      label="Confirm Password"
      lazy-rules
      :type="showPass ? 'text' : 'password'"
      :disable="loading"
      :rules="[
        (val: string) => (val && val.length > 0) || 'Please confirm your password',
        (val: string) => val === password || 'Passwords do not match',
      ]"
    >
      <template #append>
        <q-icon
          :name="showPass ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="
            () => {
              showPass = !showPass
            }
          "
        />
      </template>
    </q-input>

    <div class="q-mb-md">
      <q-btn :disable="loading" label="Update Password" size="lg" type="submit" color="primary" class="full-width" />
    </div>

    <div class="text-center">
      <router-link to="/" class="text-primary text-weight-bold"> Remember your password? </router-link>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { api } from 'boot/axios'
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const password = ref('')
const password_confirm = ref('')
const showPass = ref(false)
const errorMsg = 'This password reset link is invalid or has expired.'

onMounted(() => {
  if (!route.query.token) {
    $q.dialog({
      title: 'Error',
      message: errorMsg,
      ok: true,
      persistent: true,
    }).onOk(() => {
      router.push('/').catch((err) => {
        console.error(err)
      })
    })
  }
})

const onSubmit = async () => {
  loading.value = true

  const payload = {
    token: route.query.token,
    password: password.value,
    password_confirm: password_confirm.value,
  }

  await api
    .post('v1/password', payload)
    .then(() => {
      $q.dialog({
        title: 'Success',
        message: 'Password was updated!',
        ok: true,
        persistent: true,
      }).onOk(() => {
        router.push('/').catch((err) => {
          console.error(err)
        })
      })
    })
    .catch(() => {
      $q.dialog({
        title: 'Error',
        message: errorMsg,
        ok: true,
        persistent: true,
      }).onOk(() => {
        router.push('/').catch((err) => {
          console.error(err)
        })
      })
    })
    .finally(() => {
      loading.value = false
    })
}
</script>
