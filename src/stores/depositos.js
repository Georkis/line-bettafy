import { defineStore } from 'pinia'
import { executeQuery, executeRun } from 'src/services/sqlite'

export const useDepositosStore = defineStore('depositos', {
  state: () => ({
    list: [],
    loading: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.list = await executeQuery('SELECT * FROM depositos ORDER BY nombre ASC')
      } finally {
        this.loading = false
      }
    },

    async create(deposito) {
      const result = await executeRun(
        `INSERT INTO depositos (nombre, descripcion) VALUES (?, ?)`,
        [deposito.nombre, deposito.descripcion || null],
      )
      await this.fetchAll()
      return result.lastId
    },

    async update(id, deposito) {
      await executeRun(
        `UPDATE depositos SET nombre = ?, descripcion = ?, updated_at = datetime('now') WHERE id = ?`,
        [deposito.nombre, deposito.descripcion, id],
      )
      await this.fetchAll()
    },

    async delete(id) {
      await executeRun('DELETE FROM depositos WHERE id = ?', [id])
      this.list = this.list.filter((d) => d.id !== id)
    },
  },
})
