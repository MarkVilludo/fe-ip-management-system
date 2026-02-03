import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import AuditDashboard from '../views/AuditDashboard.vue'
import Layout from '../components/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guest: true },
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
      },
    ],
  },
  {
    path: '/audit',
    component: Layout,
    meta: { requiresAuth: true, requireSuperAdmin: true },
    children: [
      {
        path: '',
        name: 'AuditDashboard',
        component: AuditDashboard,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')

  if (to.meta.guest) {
    if (token && userStr) {
      return next({ path: '/' })
    }
    return next()
  }

  if (to.meta.requiresAuth) {
    if (!token || !userStr) {
      return next({ path: '/login', replace: true })
    }
    const user = JSON.parse(userStr)
    if (to.meta.requireSuperAdmin && user.role !== 'super_admin') {
      return next({ path: '/', replace: true })
    }
  }

  next()
})

export default router
