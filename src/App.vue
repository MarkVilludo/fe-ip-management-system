<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
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
  provide() {
    return {
      user: () => this.user,
      setUser: (u) => { this.user = u },
      clearUser: () => { this.user = null },
    }
  },
}
</script>
