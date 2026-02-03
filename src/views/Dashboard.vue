<template>
  <div>
    <div class="dashboard-header">
      <h1>IP Address Management</h1>
      <button v-if="!showForm" class="btn btn-primary" @click="openAddForm">
        Add IP Address
      </button>
    </div>

    <div v-if="showForm" class="card">
      <h2>{{ editingIp ? 'Edit IP Address' : 'Add New IP Address' }}</h2>
      <div v-if="error" class="alert alert-error">
        <div v-if="Array.isArray(error)">
          <ul style="margin: 0; padding-left: 20px">
            <li v-for="(msg, index) in error" :key="index">{{ msg }}</li>
          </ul>
        </div>
        <div v-else>{{ error }}</div>
      </div>
      <form @submit.prevent="handleSubmit">
        <div v-if="!editingIp" class="form-group">
          <label>IP Address (IPv4 or IPv6)</label>
          <input
            v-model="form.ip_address"
            type="text"
            required
            placeholder="e.g., 192.168.1.1 or 2001:0db8:85a3::8a2e:0370:7334"
          />
        </div>
        <div class="form-group">
          <label>Label</label>
          <input v-model="form.label" type="text" required />
        </div>
        <div class="form-group">
          <label>Comment (Optional)</label>
          <textarea v-model="form.comment" />
        </div>
        <div style="display: flex; gap: 10px">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="createLoading || updateLoading"
          >
            {{ editingIp ? 'Update' : 'Create' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="closeForm">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div class="card">
      <h2>IP Addresses</h2>
      <div v-if="loading" class="loading">Loading...</div>
      <template v-else>
        <table v-if="ipAddresses.length" class="table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Label</th>
              <th>Comment</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ip in ipAddresses" :key="ip.id">
              <td>{{ ip.ip_address }}</td>
              <td>{{ ip.label }}</td>
              <td>{{ ip.comment || '-' }}</td>
              <td>{{ ip.creator?.name || 'Unknown' }}</td>
              <td>{{ formatDate(ip.created_at) }}</td>
              <td>
                <button
                  v-if="canEdit(ip)"
                  class="btn btn-secondary"
                  style="margin-right: 8px"
                  @click="handleEdit(ip)"
                >
                  Edit
                </button>
                <button
                  v-if="canDelete()"
                  class="btn btn-danger"
                  @click="handleDelete(ip.id)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>No IP addresses found. Add your first IP address above.</p>
      </template>
    </div>
  </div>
</template>

<script>
import { ipAddressAPI } from '../services/api'

export default {
  name: 'Dashboard',
  data() {
    return {
      showForm: false,
      editingIp: null,
      form: { ip_address: '', label: '', comment: '' },
      error: '',
      ipAddresses: [],
      loading: true,
      createLoading: false,
      updateLoading: false,
    }
  },
  computed: {
    user() {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}')
      } catch {
        return {}
      }
    },
  },
  created() {
    this.fetchIpAddresses()
  },
  methods: {
    async fetchIpAddresses() {
      this.loading = true
      try {
        const res = await ipAddressAPI.getAll()
        this.ipAddresses = res.data.data || []
      } catch (e) {
        this.ipAddresses = []
      } finally {
        this.loading = false
      }
    },
    openAddForm() {
      this.showForm = true
      this.editingIp = null
      this.form = { ip_address: '', label: '', comment: '' }
      this.error = ''
    },
    closeForm() {
      this.showForm = false
      this.editingIp = null
      this.form = { ip_address: '', label: '', comment: '' }
      this.error = ''
    },
    async handleSubmit() {
      this.error = ''
      if (this.editingIp) {
        this.updateLoading = true
        try {
          await ipAddressAPI.update(this.editingIp.id, {
            label: this.form.label,
            comment: this.form.comment,
          })
          this.fetchIpAddresses()
          this.closeForm()
        } catch (err) {
          const errors = err.response?.data?.errors
          if (errors) {
            // Store validation errors as array for better display
            this.error = Object.values(errors).flat()
          } else {
            this.error = err.response?.data?.message || 'Failed to update IP address.'
          }
        } finally {
          this.updateLoading = false
        }
      } else {
        this.createLoading = true
        try {
          await ipAddressAPI.create(this.form)
          this.fetchIpAddresses()
          this.closeForm()
        } catch (err) {
          const errors = err.response?.data?.errors
          if (errors) {
            // Store validation errors as array for better display
            this.error = Object.values(errors).flat()
          } else {
            this.error = err.response?.data?.message || 'Failed to create IP address.'
          }
        } finally {
          this.createLoading = false
        }
      }
    },
    handleEdit(ip) {
      this.editingIp = ip
      this.form = {
        ip_address: ip.ip_address,
        label: ip.label,
        comment: ip.comment || '',
      }
      this.showForm = true
      this.error = ''
    },
    async handleDelete(id) {
      if (!window.confirm('Are you sure you want to delete this IP address?')) return
      try {
        await ipAddressAPI.delete(id)
        this.fetchIpAddresses()
      } catch (e) {
        console.error(e)
      }
    },
    canEdit(ip) {
      return this.user.role === 'super_admin' || ip.created_by === this.user.id
    },
    canDelete() {
      return this.user.role === 'super_admin'
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleString() : '-'
    },
  },
}
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
</style>
