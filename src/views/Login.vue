<template>
  <div class="auth-wrap">
    <div class="card" style="width: 400px">
      <h2 style="margin-bottom: 24px">Login</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p style="margin-top: 16px; text-align: center">
        Don't have an account? <router-link to="/register">Register</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api'

export default {
  name: 'Login',
  data() {
    return {
      form: { email: '', password: '' },
      error: '',
      loading: false,
    }
  },
  inject: ['setUser'],
  methods: {
    async handleSubmit() {
      this.error = ''
      this.loading = true
      try {
        const res = await authAPI.login(this.form)
        if (res.data.success) {
          this.setUser(res.data.data.user)
          this.$router.replace('/')
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed. Please try again.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.auth-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
