<template>
  <div>
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">IPAM System</div>
        <div class="navbar-links">
          <router-link to="/">IP Addresses</router-link>
          <router-link v-if="user && user.role === 'super_admin'" to="/audit">Audit Dashboard</router-link>
          <span v-if="user" class="navbar-user">
            {{ user.name }} ({{ user.role === 'super_admin' ? 'Super Admin' : 'User' }})
          </span>
          <button class="btn btn-secondary" style="margin-left: 10px" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </nav>
    <div class="container">
      <router-view />
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api'

export default {
  name: 'Layout',
  data() {
    return {
      user: null,
    }
  },
  created() {
    const stored = localStorage.getItem('user')
    if (stored) {
      this.user = JSON.parse(stored)
    }
  },
  methods: {
    async handleLogout() {
      try {
        await authAPI.logout()
      } catch (e) {
        console.error('Logout error:', e)
      }
      this.user = null
      this.$router.replace('/login')
    },
  },
}
</script>

<style scoped>
.navbar-user {
  margin-left: 20px;
}
</style>
