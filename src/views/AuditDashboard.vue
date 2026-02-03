<template>
  <div class="audit-dashboard">
    <div class="dashboard-header">
      <h1>Audit Log Dashboard</h1>
      <p class="subtitle">Comprehensive audit trail for all system activities</p>
    </div>

    <!-- Loading state -->
    <div v-if="dashboardLoading && !dashboardData" class="dashboard-message">
      <p>Loading dashboard…</p>
    </div>

    <!-- Error state (e.g. 401) -->
    <div v-else-if="!dashboardLoading && dashboardData === null && !accessDenied" class="dashboard-message error">
      <p>Unable to load audit dashboard. You may need to log in again.</p>
      <button type="button" class="btn btn-primary" @click="fetchDashboard">Retry</button>
      <router-link to="/login" class="btn btn-secondary">Log in again</router-link>
    </div>

    <!-- Statistics Overview -->
    <div v-else-if="dashboardData" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>Total Logs</h3>
          <p class="stat-value">{{ dashboardData.total_logs?.toLocaleString() || 0 }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔐</div>
        <div class="stat-content">
          <h3>Login/Logout Events</h3>
          <p class="stat-value">{{ (dashboardData.login_logout_events?.length || 0) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>Active Users</h3>
          <p class="stat-value">{{ (dashboardData.logs_by_user?.length || 0) }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔗</div>
        <div class="stat-content">
          <h3>Active Sessions</h3>
          <p class="stat-value">{{ (dashboardData.unique_sessions?.length || 0) }}</p>
        </div>
      </div>
    </div>

    <!-- Tabs for different views -->
    <div class="tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'overview' }]"
        @click="activeTab = 'overview'"
      >
        Overview
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'ip-address' }]"
        @click="activeTab = 'ip-address'"
      >
        IP Address History
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'user' }]"
        @click="activeTab = 'user'"
      >
        User History
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'session' }]"
        @click="activeTab = 'session'"
      >
        Session Tracking
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'auth' }]"
        @click="activeTab = 'auth'"
      >
        Login/Logout Events
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="tab-content">
      <!-- Empty state when no logs yet -->
      <div v-if="dashboardData && dashboardData.total_logs === 0" class="card empty-state">
        <p>No audit events yet. Log in/out or create/update/delete IP addresses to generate logs.</p>
      </div>
      <!-- Logs by Event -->
      <div class="card">
        <h2>Logs by Event Type</h2>
        <div v-if="dashboardData?.logs_by_event && Object.keys(dashboardData.logs_by_event).length" class="chart-container">
          <div 
            v-for="(count, event) in dashboardData.logs_by_event" 
            :key="event"
            class="chart-item"
          >
            <div class="chart-label">{{ event || 'Unknown' }}</div>
            <div class="chart-bar-container">
              <div 
                class="chart-bar" 
                :style="{ width: `${(count / dashboardData.total_logs) * 100}%` }"
              ></div>
              <span class="chart-value">{{ count }}</span>
            </div>
          </div>
        </div>
        <p v-else>No event data available</p>
      </div>

      <!-- Logs by Entity Type -->
      <div class="card">
        <h2>Logs by Entity Type</h2>
        <div v-if="dashboardData?.logs_by_subject_type" class="chart-container">
          <div 
            v-for="(count, type) in dashboardData.logs_by_subject_type" 
            :key="type"
            class="chart-item"
          >
            <div class="chart-label">{{ type ? type.replace('App\\Models\\', '') : 'Unknown' }}</div>
            <div class="chart-bar-container">
              <div 
                class="chart-bar" 
                :style="{ width: `${(count / dashboardData.total_logs) * 100}%` }"
              ></div>
              <span class="chart-value">{{ count }}</span>
            </div>
          </div>
        </div>
        <p v-else>No entity type data available</p>
      </div>

      <!-- Top Users -->
      <div class="card">
        <h2>Top Active Users</h2>
        <table class="table" v-if="dashboardData?.logs_by_user?.length">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Total Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in dashboardData.logs_by_user" :key="user.causer_id">
              <td>{{ user.causer_id }}</td>
              <td>{{ user.user_email || 'N/A' }}</td>
              <td>{{ user.count }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>No user data available</p>
      </div>
    </div>

    <!-- IP Address History Tab -->
    <div v-if="activeTab === 'ip-address'" class="tab-content">
      <div class="card">
        <h2>IP Address Audit History</h2>
        <p class="tab-hint">View changes per IP: <strong>lifetime</strong> (all time) or <strong>within a session</strong> (filter by session ID).</p>
        <div class="search-section">
          <input 
            v-model.number="ipAddressId" 
            type="number" 
            placeholder="Enter IP Address ID"
            class="search-input"
          />
          <button @click="fetchIpAddressLogs" class="btn btn-primary">View History</button>
          <label class="checkbox-label">
            <input type="checkbox" v-model="filterBySession" />
            Filter by Session
          </label>
          <input 
            v-if="filterBySession"
            v-model="sessionId" 
            type="text" 
            placeholder="Session ID"
            class="search-input"
          />
          <button v-if="filterBySession" type="button" class="btn btn-secondary" @click="useMySessionForIp">Use my session</button>
        </div>
        <div v-if="ipAddressLogs" class="logs-section">
          <div class="logs-header">
            <h3>IP Address #{{ ipAddressId }} - {{ filterBySession ? 'Session View' : 'Lifetime History' }}</h3>
            <p>Total: {{ ipAddressLogs.total_logs || ipAddressLogs.data?.length || 0 }} logs</p>
          </div>
          <div v-if="ipAddressLogs.data?.length" style="overflow-x: auto">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Description</th>
                  <th>Session ID</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in ipAddressLogs.data" :key="log.id">
                  <td>{{ log.id }}</td>
                  <td><span class="badge badge-event">{{ log.event || '-' }}</span></td>
                  <td>{{ log.user_email || `User #${log.causer_id}` }}</td>
                  <td>{{ log.description || '-' }}</td>
                  <td><code class="session-id">{{ log.session_id || '-' }}</code></td>
                  <td>{{ log.ip_address || '-' }}</td>
                  <td>{{ formatDate(log.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else>No logs found for this IP address</p>
        </div>
      </div>
    </div>

    <!-- User History Tab -->
    <div v-if="activeTab === 'user'" class="tab-content">
      <div class="card">
        <h2>User Audit History</h2>
        <p class="tab-hint">View changes per user: <strong>lifetime</strong> (all time) or <strong>within a session</strong> (filter by session ID).</p>
        <div class="search-section">
          <input 
            v-model.number="userId" 
            type="number" 
            placeholder="Enter User ID"
            class="search-input"
          />
          <button @click="fetchUserLogs" class="btn btn-primary">View History</button>
          <label class="checkbox-label">
            <input type="checkbox" v-model="filterUserBySession" />
            Filter by Session
          </label>
          <input 
            v-if="filterUserBySession"
            v-model="userSessionId" 
            type="text" 
            placeholder="Session ID"
            class="search-input"
          />
          <button v-if="filterUserBySession" type="button" class="btn btn-secondary" @click="useMySessionForUser">Use my session</button>
        </div>
        <div v-if="userLogs" class="logs-section">
          <div class="logs-header">
            <h3>User #{{ userId }} - {{ filterUserBySession ? 'Session View' : 'Lifetime History' }}</h3>
            <p>Total: {{ userLogs.total_logs || userLogs.data?.length || 0 }} logs</p>
          </div>
          <div v-if="userLogs.data?.length" style="overflow-x: auto">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Description</th>
                  <th>Session ID</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in userLogs.data" :key="log.id">
                  <td>{{ log.id }}</td>
                  <td><span class="badge badge-event">{{ log.event || '-' }}</span></td>
                  <td>{{ log.subject_type ? log.subject_type.replace('App\\Models\\', '') : '-' }}</td>
                  <td>{{ log.subject_id || '-' }}</td>
                  <td>{{ log.description || '-' }}</td>
                  <td><code class="session-id">{{ log.session_id || '-' }}</code></td>
                  <td>{{ log.ip_address || '-' }}</td>
                  <td>{{ formatDate(log.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else>No logs found for this user</p>
        </div>
      </div>
    </div>

    <!-- Session Tracking Tab -->
    <div v-if="activeTab === 'session'" class="tab-content">
      <div class="card">
        <h2>Session Tracking</h2>
        <p class="tab-hint">View all activities within a session. Use <strong>View my session</strong> to see your current session.</p>
        <div class="search-section">
          <input 
            v-model="sessionIdSearch" 
            type="text" 
            placeholder="Enter Session ID"
            class="search-input"
          />
          <button @click="fetchSessionLogs" class="btn btn-primary">View Session</button>
          <button type="button" class="btn btn-secondary" @click="viewMySession">View my session</button>
        </div>
        <div v-if="sessionLogs" class="logs-section">
          <div class="logs-header">
            <h3>Session: {{ sessionIdSearch }}</h3>
            <p>Total: {{ sessionLogs.data?.length || 0 }} activities</p>
          </div>
          <div v-if="sessionLogs.data?.length" style="overflow-x: auto">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in sessionLogs.data" :key="log.id">
                  <td>{{ log.id }}</td>
                  <td><span class="badge badge-event">{{ log.event || '-' }}</span></td>
                  <td>{{ log.user_email || `User #${log.causer_id}` }}</td>
                  <td>{{ log.subject_type ? log.subject_type.replace('App\\Models\\', '') : '-' }}</td>
                  <td>{{ log.subject_id || '-' }}</td>
                  <td>{{ log.description || '-' }}</td>
                  <td>{{ log.ip_address || '-' }}</td>
                  <td>{{ formatDate(log.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else>No logs found for this session</p>
        </div>
      </div>
    </div>

    <!-- Login/Logout Events Tab -->
    <div v-if="activeTab === 'auth'" class="tab-content">
      <div class="card">
        <h2>Login/Logout Events</h2>
        <div v-if="loadingAuth" class="loading">Loading authentication events...</div>
        <div v-else-if="dashboardData?.login_logout_events?.length" style="overflow-x: auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>User</th>
                <th>Description</th>
                <th>Session ID</th>
                <th>IP Address</th>
                <th>User Agent</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in dashboardData.login_logout_events" :key="log.id">
                <td>{{ log.id }}</td>
                <td>
                  <span :class="['badge', log.event === 'login' ? 'badge-success' : 'badge-warning']">
                    {{ log.event }}
                  </span>
                </td>
                <td>{{ log.user_email || `User #${log.causer_id}` }}</td>
                <td>{{ log.description || '-' }}</td>
                <td><code class="session-id">{{ log.session_id || '-' }}</code></td>
                <td>{{ log.ip_address || '-' }}</td>
                <td class="user-agent">{{ truncate(log.user_agent, 50) }}</td>
                <td>{{ formatDate(log.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>No login/logout events found</p>
      </div>
    </div>

    <!-- Filters and Recent Logs -->
    <div class="card">
      <h2>Filter & Search Audit Logs</h2>
      <div class="filters-grid">
        <div class="form-group">
          <label>Event/Action</label>
          <select v-model="filters.action" class="filter-select">
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="created">Create</option>
            <option value="updated">Update</option>
            <option value="deleted">Delete</option>
          </select>
        </div>
        <div class="form-group">
          <label>Entity Type</label>
          <select v-model="filters.entity_type" class="filter-select">
            <option value="">All Types</option>
            <option value="App\Models\IpAddress">IP Address</option>
            <option value="App\Models\User">User</option>
          </select>
        </div>
        <div class="form-group">
          <label>User ID</label>
          <input v-model.number="filters.user_id" type="number" placeholder="Filter by user ID" />
        </div>
        <div class="form-group">
          <label>Session ID</label>
          <input v-model="filters.session_id" type="text" placeholder="Filter by session" />
        </div>
        <div class="form-group">
          <label>Start Date</label>
          <input v-model="filters.start_date" type="date" />
        </div>
        <div class="form-group">
          <label>End Date</label>
          <input v-model="filters.end_date" type="date" />
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="fetchLogs">Apply Filters</button>
        <button class="btn btn-secondary" @click="clearFilters">Clear Filters</button>
      </div>
    </div>

    <!-- Recent Logs Table -->
    <div class="card">
      <h2>Recent Audit Logs</h2>
      <div v-if="loading" class="loading">Loading audit logs...</div>
      <template v-else>
        <div v-if="logsData?.data?.length" style="overflow-x: auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>User</th>
                <th>Description</th>
                <th>Session ID</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logsData.data" :key="log.id">
                <td>{{ log.id }}</td>
                <td><span class="badge badge-event">{{ log.event || '-' }}</span></td>
                <td>{{ log.subject_type ? log.subject_type.replace('App\\Models\\', '') : '-' }}</td>
                <td>{{ log.subject_id || '-' }}</td>
                <td>{{ log.user_email || `User #${log.causer_id}` }}</td>
                <td>{{ log.description || '-' }}</td>
                <td><code class="session-id">{{ log.session_id || '-' }}</code></td>
                <td>{{ log.ip_address || '-' }}</td>
                <td>{{ formatDate(log.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="logsData.total > logsData.per_page" class="pagination">
            <p>Showing {{ logsData.from }} to {{ logsData.to }} of {{ logsData.total }} logs</p>
            <div class="pagination-controls">
              <button 
                @click="changePage(logsData.current_page - 1)" 
                :disabled="logsData.current_page === 1"
                class="btn btn-sm"
              >
                Previous
              </button>
              <span>Page {{ logsData.current_page }} of {{ logsData.last_page }}</span>
              <button 
                @click="changePage(logsData.current_page + 1)" 
                :disabled="logsData.current_page === logsData.last_page"
                class="btn btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        <p v-else>No audit logs found.</p>
      </template>
    </div>
  </div>
</template>

<script>
import { auditLogAPI, getOrCreateAuditSessionId } from '../services/api'

export default {
  name: 'AuditDashboard',
  data() {
    return {
      activeTab: 'overview',
      dashboardData: null,
      dashboardLoading: true,
      logsData: null,
      ipAddressLogs: null,
      userLogs: null,
      sessionLogs: null,
      loading: true,
      loadingAuth: false,
      accessDenied: false,
      ipAddressId: null,
      userId: null,
      sessionIdSearch: '',
      sessionId: '',
      userSessionId: '',
      filterBySession: false,
      filterUserBySession: false,
      filters: {
        action: '',
        entity_type: '',
        user_id: null,
        session_id: '',
        start_date: '',
        end_date: '',
        page: 1,
      },
    }
  },
  created() {
    this.fetchDashboard()
    this.fetchLogs()
  },
  methods: {
    async fetchDashboard() {
      this.accessDenied = false
      this.dashboardLoading = true
      const token = localStorage.getItem('token')
      if (!token) {
        this.dashboardLoading = false
        this.$router.replace('/login')
        return
      }
      try {
        const res = await auditLogAPI.getDashboard()
        this.dashboardData = res.data.data
      } catch (e) {
        if (e.response?.status === 403) {
          this.accessDenied = true
          this.dashboardData = null
          this.$router.replace('/')
          return
        }
        if (e.response?.status === 401) {
          console.error('Unauthorized for audit dashboard – token missing or invalid')
          this.dashboardData = null
          this.$router.replace('/login')
          return
        }
        console.error('Failed to fetch dashboard:', e)
        this.dashboardData = null
      } finally {
        this.dashboardLoading = false
      }
    },
    async fetchLogs() {
      this.loading = true
      this.accessDenied = false
      try {
        const params = {}
        if (this.filters.action) params.action = this.filters.action
        if (this.filters.entity_type) params.entity_type = this.filters.entity_type
        if (this.filters.user_id != null && this.filters.user_id !== '') params.user_id = this.filters.user_id
        if (this.filters.session_id) params.session_id = this.filters.session_id
        if (this.filters.start_date) params.start_date = this.filters.start_date
        if (this.filters.end_date) params.end_date = this.filters.end_date
        if (this.filters.page) params.page = this.filters.page
        const res = await auditLogAPI.getAll(params)
        this.logsData = res.data.data
      } catch (e) {
        if (e.response?.status === 403) {
          this.accessDenied = true
          this.$router.replace('/')
          return
        }
        if (e.response?.status === 401) {
          this.$router.replace('/login')
          return
        }
        console.error('Failed to fetch logs:', e)
        this.logsData = { data: [], total: 0, per_page: 50, from: 0, to: 0, current_page: 1, last_page: 1 }
      } finally {
        this.loading = false
      }
    },
    useMySessionForIp() {
      const sid = getOrCreateAuditSessionId()
      if (sid) {
        this.sessionId = sid
        this.filterBySession = true
      }
    },
    useMySessionForUser() {
      const sid = getOrCreateAuditSessionId()
      if (sid) {
        this.userSessionId = sid
        this.filterUserBySession = true
      }
    },
    viewMySession() {
      const sid = getOrCreateAuditSessionId()
      if (sid) {
        this.sessionIdSearch = sid
        this.fetchSessionLogs()
      }
    },
    async fetchIpAddressLogs() {
      if (!this.ipAddressId) {
        alert('Please enter an IP Address ID')
        return
      }
      try {
        const params = {}
        if (this.filterBySession && this.sessionId) {
          params.session_id = this.sessionId
        }
        const res = await auditLogAPI.getIpAddressLogs(this.ipAddressId, params)
        this.ipAddressLogs = res.data
      } catch (e) {
        if (e.response?.status === 403) {
          this.accessDenied = true
          this.$router.replace('/')
          return
        }
        if (e.response?.status === 401) {
          this.$router.replace('/login')
          return
        }
        console.error('Failed to fetch IP address logs:', e)
        alert('Failed to fetch IP address logs')
      }
    },
    async fetchUserLogs() {
      if (!this.userId) {
        alert('Please enter a User ID')
        return
      }
      try {
        const params = {}
        if (this.filterUserBySession && this.userSessionId) {
          params.session_id = this.userSessionId
        }
        const res = await auditLogAPI.getUserLogs(this.userId, params)
        this.userLogs = res.data
      } catch (e) {
        if (e.response?.status === 403) {
          this.accessDenied = true
          this.$router.replace('/')
          return
        }
        if (e.response?.status === 401) {
          this.$router.replace('/login')
          return
        }
        console.error('Failed to fetch user logs:', e)
        alert('Failed to fetch user logs')
      }
    },
    async fetchSessionLogs() {
      if (!this.sessionIdSearch) {
        alert('Please enter a Session ID')
        return
      }
      try {
        const res = await auditLogAPI.getSessionLogs(this.sessionIdSearch)
        this.sessionLogs = res.data
      } catch (e) {
        if (e.response?.status === 403) {
          this.accessDenied = true
          this.$router.replace('/')
          return
        }
        if (e.response?.status === 401) {
          this.$router.replace('/login')
          return
        }
        console.error('Failed to fetch session logs:', e)
        alert('Failed to fetch session logs')
      }
    },
    changePage(page) {
      if (page >= 1) {
        this.filters.page = page
        this.fetchLogs()
      }
    },
    clearFilters() {
      this.filters = {
        action: '',
        entity_type: '',
        user_id: null,
        session_id: '',
        start_date: '',
        end_date: '',
        page: 1,
      }
      this.fetchLogs()
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleString() : '-'
    },
    truncate(str, length) {
      if (!str) return '-'
      return str.length > length ? str.substring(0, length) + '...' : str
    },
  },
}
</script>

<style scoped>
.audit-dashboard {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  color: #1a1a1a;
}

.subtitle {
  color: #666;
  margin: 0;
}

.dashboard-message {
  padding: 24px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 24px;
}

.dashboard-message.error {
  background: #fef2f2;
  color: #991b1b;
}

.dashboard-message .btn {
  margin: 8px;
}

.card.empty-state {
  text-align: center;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.stat-icon {
  font-size: 32px;
}

.stat-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  color: #1a1a1a;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e0e0e0;
}

.tab-button {
  padding: 12px 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #333;
}

.tab-button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.tab-content {
  margin-bottom: 32px;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.card h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #1a1a1a;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-label {
  min-width: 120px;
  font-size: 14px;
  color: #333;
}

.chart-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.chart-bar {
  height: 24px;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 4px;
  min-width: 4px;
}

.chart-value {
  font-weight: 600;
  color: #333;
  min-width: 50px;
  text-align: right;
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}

.logs-section {
  margin-top: 20px;
}

.logs-header {
  margin-bottom: 16px;
}

.logs-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.logs-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.tab-hint {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table thead {
  background: #f5f5f5;
}

.table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
}

.table td {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.table tbody tr:hover {
  background: #f9f9f9;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-event {
  background: #e0e7ff;
  color: #3730a3;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.session-id {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.user-agent {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.filter-select,
.form-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.pagination-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #666;
}
</style>
