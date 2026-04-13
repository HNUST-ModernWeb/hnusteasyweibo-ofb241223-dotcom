<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useToast } from '../composables/useToast';
import SparkLoginShell from '../components/login/SparkLoginShell.vue';

const router = useRouter();
const { login } = useAuth();
const { showToast } = useToast();

const loginRef = ref<{
  setError: (message: string) => void;
  setLoading: (value: boolean) => void;
  setSuccess: (message: string) => void;
} | null>(null);

const onSubmit = async ({ username, password }: { username: string; password: string }) => {
  if (username.length < 3) {
    loginRef.value?.setError('用户名至少 3 个字符');
    return;
  }

  if (password.length < 6) {
    loginRef.value?.setError('密码至少 6 个字符');
    return;
  }

  loginRef.value?.setError('');
  loginRef.value?.setLoading(true);

  const ok = await login(username);
  if (ok) {
    loginRef.value?.setSuccess('登录成功，正在跳转...');
    showToast('登录成功！欢迎回来', 'success');
    setTimeout(() => {
      router.push('/');
    }, 1000);
  } else {
    loginRef.value?.setError('用户名或密码错误，可试用 admin / johndoe / janedoe');
    showToast('登录失败，请检查用户名', 'error');
  }

  loginRef.value?.setLoading(false);
};

const handleRegister = () => {
  showToast('注册功能将在后端接入后开放', 'error');
};

const handleForgotPassword = () => {
  showToast('找回密码功能将在后端接入后开放', 'error');
};
</script>

<template>
  <SparkLoginShell
    ref="loginRef"
    @submit="onSubmit"
    @register="handleRegister"
    @forgot-password="handleForgotPassword"
  />
</template>
