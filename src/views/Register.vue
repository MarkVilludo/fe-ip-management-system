<template>
  <div class="auth-wrap">
    <div class="card" style="width: 400px">
      <h2 style="margin-bottom: 24px">Register</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" required minlength="8" />
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input v-model="form.password_confirmation" type="password" required minlength="8" />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <p style="margin-top: 16px; text-align: center">
        Already have an account? <router-link to="/login">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api'

export default {
  name: 'Register',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
      },
      error: '',
      success: '',
      loading: false,
    }
  },
  methods: {
    async handleSubmit() {
      this.error = ''
      this.success = ''
      if (this.form.password !== this.form.password_confirmation) {
        this.error = 'Passwords do not match'
        return
      }
      this.loading = true
      try {
        const res = await authAPI.register({
          name: this.form.name,
          email: this.form.email,
          password: this.form.password,
        })
        if (res.data.success) {
          this.success = 'Registration successful! Redirecting to login...'
          setTimeout(() => this.$router.replace('/login'), 2000)
        }
      } catch (err) {
        const errors = err.response?.data?.errors
        if (errors) {
          this.error = Object.values(errors)
            .flat()
            .join(', ')
        } else {
          this.error = err.response?.data?.message || 'Registration failed. Please try again.'
        }
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
