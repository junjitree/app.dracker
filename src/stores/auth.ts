import { api } from 'boot/axios';
import { defineStore } from 'pinia';

interface User {
  id: number;
  email: string;
  given_name: string;
  surname: string;
}

interface AuthState {
  user: User | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
  }),

  actions: {
    async me() {
      try {
        const { data } = await api.get<User>('v1/users/me');

        if (!data) {
          return this.logout(false);
        }

        this.user = data;
      } catch (err) {
        console.error(err);
        return this.logout(false);
      }
    },

    async logout(call_api: boolean = true) {
      this.user = null;

      if (!call_api) {
        return;
      }

      await api.delete('v1/logout');
    },
  },

  getters: {
    id: (state): number => {
      if (!state.user) {
        return 0;
      }
      return state.user.id;
    },
    email: (state): string => {
      if (!state.user) {
        return 'user@domain.tld';
      }
      return state.user.email;
    },
    fullName: (state): string => {
      if (!state.user) {
        return 'Anon';
      }

      const fullName = `${state.user.given_name} ${state.user.surname}`;

      if (fullName == ' ') {
        return 'Anon';
      }

      return fullName;
    },
  },
});
