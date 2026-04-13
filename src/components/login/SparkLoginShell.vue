<script setup lang="ts">
import { ref, watch } from 'vue';
import AnimatedCharacters, { type CharacterConfig } from './AnimatedCharacters.vue';

const emit = defineEmits<{
  submit: [payload: { username: string; password: string; remember: boolean }];
  register: [];
  forgotPassword: [];
}>();

const username = ref('admin');
const password = ref('password123');
const remember = ref(false);
const showPassword = ref(false);
const focusedField = ref<'none' | 'email' | 'password' | 'other'>('none');
const isTyping = ref(false);
const isLoginError = ref(false);
const errorTimer = ref<number | null>(null);
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const characterConfig: CharacterConfig = {
  scale: 0.92,
};

function clearBanners() {
  errorMsg.value = '';
  successMsg.value = '';
}

function triggerErrorState() {
  isLoginError.value = true;
  if (errorTimer.value) window.clearTimeout(errorTimer.value);
  errorTimer.value = window.setTimeout(() => {
    isLoginError.value = false;
  }, 2200);
}

function onSubmit() {
  clearBanners();
  emit('submit', {
    username: username.value,
    password: password.value,
    remember: remember.value,
  });
}

watch([username, password], () => {
  if (errorMsg.value) errorMsg.value = '';
  if (isLoginError.value) {
    isLoginError.value = false;
    if (errorTimer.value) {
      window.clearTimeout(errorTimer.value);
      errorTimer.value = null;
    }
  }
});

defineExpose({
  setError(message: string) {
    errorMsg.value = message;
    successMsg.value = '';
    if (message) triggerErrorState();
  },
  setLoading(value: boolean) {
    loading.value = value;
  },
  setSuccess(message: string) {
    successMsg.value = message;
    errorMsg.value = '';
    isLoginError.value = false;
  },
});
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="left-panel">
        <div class="left-brand">
          <img src="/favicon.svg" alt="HNUST logo" class="left-brand__logo" />
          <div>
            <p class="left-brand__title">HNUST Easy WeiBo</p>
            <p class="left-brand__meta">校园社交分享平台</p>
          </div>
        </div>

        <div class="characters-stage">
          <AnimatedCharacters
            :config="characterConfig"
            :focused-field="focusedField"
            :is-password-visible="showPassword"
            :password-length="password.length"
            :is-login-error="isLoginError"
            :is-typing="isTyping"
          />
        </div>

        <div class="left-footer-spacer" aria-hidden="true"></div>
      </section>

      <section class="right-panel">
        <div class="form-panel">
          <div class="mobile-brand">
            <img src="/favicon.svg" alt="HNUST logo" class="mobile-brand__logo" />
            <span>HNUST Easy WeiBo</span>
          </div>

          <div class="form-center">
            <div v-if="errorMsg" class="form-banner form-banner--error" role="alert">
              {{ errorMsg }}
            </div>
            <div v-else-if="successMsg" class="form-banner form-banner--success" role="status">
              {{ successMsg }}
            </div>

            <h1>登录到 HNUST Easy WeiBo</h1>
            <p class="subtitle">使用校园账号进入信息流、通知和个人主页。</p>

            <label class="field-label" for="login-username">用户名</label>
            <div class="input-wrap" :class="{ focused: focusedField === 'email' }">
              <input
                id="login-username"
                v-model.trim="username"
                type="text"
                placeholder="admin / johndoe / janedoe"
                autocomplete="username"
                @focus="
                  focusedField = 'email';
                  isTyping = true;
                "
                @blur="
                  focusedField = 'none';
                  isTyping = false;
                "
              />
            </div>

            <label class="field-label" for="login-password">密码</label>
            <div class="input-wrap" :class="{ focused: focusedField === 'password' }">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                maxlength="30"
                @focus="
                  focusedField = 'password';
                  isTyping = true;
                "
                @blur="
                  focusedField = 'none';
                  isTyping = false;
                "
              />
              <button class="eye-btn" type="button" tabindex="-1" @click="showPassword = !showPassword">
                <svg
                  v-if="!showPassword"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg
                  v-else
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>

            <div class="action-row">
              <label class="checkbox-wrap">
                <input v-model="remember" type="checkbox" />
                <span class="checkmark" :class="{ checked: remember }">
                  <svg v-if="remember" width="10" height="10" viewBox="0 0 10 10">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="#fff"
                      stroke-width="1.5"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span>记住这台设备</span>
              </label>
              <button class="forgot-link" type="button" @click="emit('forgotPassword')">忘记密码？</button>
            </div>

            <button class="login-btn" type="button" :disabled="loading" @click="onSubmit">
              {{ loading ? '登录中...' : '登录' }}
            </button>

            <p class="signup-row">
              还没有账号？
              <button class="signup-link" type="button" @click="emit('register')">立即注册</button>
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f3f4f6;
}

.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.left-panel {
  position: relative;
  background: #ededed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 48px;
  overflow: hidden;
}

.characters-stage {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 500px;
  position: relative;
  z-index: 20;
}

.left-footer-spacer {
  width: 100%;
  height: 24px;
  flex-shrink: 0;
}

.left-brand {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #171717;
  position: relative;
  z-index: 20;
  align-self: stretch;
}

.left-brand__logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.left-brand__title {
  font-size: 1.15rem;
  font-weight: 700;
}

.left-brand__meta {
  margin-top: 2px;
  color: #71717a;
  font-size: 0.88rem;
}

.right-panel {
  background: white;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.form-panel {
  width: min(540px, 100%);
  min-height: 100vh;
  padding: 64px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transform: translateY(24px) scale(0.985);
  animation: form-reveal 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.12s forwards;
}

.form-center {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.mobile-brand {
  display: none;
}

.mobile-brand__logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.form-banner {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  text-align: center;
}

.form-banner--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.form-banner--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

h1 {
  font-size: clamp(1.8rem, 1.45rem + 1vw, 2.1rem);
  font-weight: 700;
  color: #171717;
  letter-spacing: -0.03em;
  line-height: 1.15;
  white-space: nowrap;
}

.subtitle {
  margin-top: 10px;
  margin-bottom: 34px;
  color: #737373;
  font-size: 1.02rem;
  line-height: 1.6;
}

.field-label {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #171717;
  margin-bottom: 10px;
}

.input-wrap {
  width: 100%;
  height: 62px;
  display: flex;
  align-items: center;
  border: 1px solid #d4d4d8;
  border-radius: 999px;
  background: #fff;
  padding: 0 22px;
  margin-bottom: 22px;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}

.input-wrap.focused {
  border-color: #52525b;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.input-wrap input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.1rem;
  color: #171717;
  height: 100%;
}

.input-wrap input::placeholder {
  color: #a1a1aa;
}

.eye-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #71717a;
  width: 32px;
  height: 32px;
}

.action-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
  font-size: 0.98rem;
}

.checkbox-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #52525b;
  font-weight: 500;
  user-select: none;
}

.checkbox-wrap input {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 1.5px solid #171717;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.checkmark.checked {
  background: #171717;
}

.forgot-link {
  border: none;
  background: none;
  color: #171717;
  font-weight: 600;
  cursor: pointer;
}

.login-btn {
  width: 100%;
  height: 72px;
  border: none;
  border-radius: 999px;
  background: #171717;
  color: white;
  font-size: 1.22rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.login-btn:hover:not(:disabled) {
  background: #000;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signup-row {
  margin-top: 24px;
  font-size: 1rem;
  color: #737373;
  text-align: center;
}

.signup-link {
  border: none;
  background: none;
  color: #171717;
  font-weight: 700;
  cursor: pointer;
}

@keyframes form-reveal {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 1080px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .left-panel {
    min-height: 360px;
    padding: 40px 32px 24px;
  }

  .characters-stage {
    height: 360px;
  }

  .left-footer-spacer {
    height: 16px;
  }

  .form-panel {
    min-height: auto;
    width: 100%;
    max-width: 560px;
    padding: 40px 28px 52px;
  }
}

@media (max-width: 720px) {
  .left-panel {
    display: none;
  }

  .form-panel {
    padding: 32px 20px 42px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    font-weight: 700;
    color: #171717;
  }

  h1 {
    white-space: normal;
  }

  .input-wrap {
    height: 58px;
    padding: 0 18px;
    margin-bottom: 18px;
  }

  .input-wrap input {
    font-size: 1rem;
  }

  .action-row {
    font-size: 0.92rem;
  }

  .login-btn {
    height: 64px;
    font-size: 1.12rem;
  }
}
</style>
