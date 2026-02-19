import { api } from 'boot/axios';
import { defineStore, type StoreDefinition } from 'pinia';

export interface User {
  id: number;
  email: string;
  given_name: string;
  surname: string;
}

interface State {
  data: User[];
}

export const useUserStore: StoreDefinition = defineStore('users', {
  state: (): State => ({
    data: [],
  }),

  actions: {
    async get(q: string = ''): Promise<User[]> {
      try {
        this.data = (await api.get('v1/users', { params: { q, take: 100 } })).data;
      } catch (err) {
        console.error(err);
      }

      return this.data;
    },
    async get_by_id(id: number): Promise<User | null> {
      try {
        return (await api.get(`v1/users/${id}`)).data;
      } catch (err) {
        console.log(err);
        return null;
      }
    },
  },
});
