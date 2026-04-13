import { ref, computed } from 'vue';
import { User } from '../types';
import { userService } from '../api/services';

const user = ref<User | null>(null);
const isAuthenticated = computed(() => !!user.value);

export function useAuth() {
  const login = async (username: string) => {
    const foundUser = await userService.getUserByUsername(username);
    if (foundUser) {
      user.value = foundUser;
      return true;
    }
    return false;
  };
  
  const logout = () => {
    user.value = null;
  };
  
  return { user, isAuthenticated, login, logout };
}
