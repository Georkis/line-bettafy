import { defineStore } from 'pinia'
import { executeQuery, executeRun } from 'src/services/sqlite'

export const useBettasStore = defineStore('bettas', {
  state: () => ({
    list: [],
    current: null,
    loading: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.list = await executeQuery('SELECT * FROM bettas ORDER BY updated_at DESC')
      } finally {
        this.loading = false
      }
    },

    async fetchById(id) {
      const rows = await executeQuery('SELECT * FROM bettas WHERE id = ?', [id])
      this.current = rows.length ? rows[0] : null
      return this.current
    },

    async search(query) {
      this.loading = true
      try {
        const q = `%${query}%`
        this.list = await executeQuery(
          `SELECT * FROM bettas WHERE codigo LIKE ? OR nombre LIKE ? OR variedad LIKE ? OR color LIKE ? ORDER BY updated_at DESC`,
          [q, q, q, q],
        )
      } finally {
        this.loading = false
      }
      return this.list
    },

    async filter(filters) {
      this.loading = true
      try {
        let sql = 'SELECT * FROM bettas WHERE 1=1'
        const params = []
        if (filters.sexo) { sql += ' AND sexo = ?'; params.push(filters.sexo) }
        if (filters.tipo) { sql += ' AND tipo = ?'; params.push(filters.tipo) }
        if (filters.color) { sql += ' AND color = ?'; params.push(filters.color) }
        if (filters.estado) { sql += ' AND estado = ?'; params.push(filters.estado) }
        if (filters.variedad) { sql += ' AND variedad = ?'; params.push(filters.variedad) }
        sql += ' ORDER BY updated_at DESC'
        this.list = await executeQuery(sql, params)
      } finally {
        this.loading = false
      }
      return this.list
    },

    async create(betta) {
      const result = await executeRun(
        `INSERT INTO bettas (codigo, nombre, sexo, tipo, variedad, color, origen, criador, fecha_nacimiento, padre_id, madre_id, foto_principal, observaciones, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [betta.codigo, betta.nombre, betta.sexo || 'indefinido', betta.tipo, betta.variedad, betta.color, betta.origen, betta.criador, betta.fecha_nacimiento, betta.padre_id || null, betta.madre_id || null, betta.foto_principal || null, betta.observaciones || null, betta.estado || 'activo'],
      )
      return result.lastId
    },

    async update(id, betta) {
      await executeRun(
        `UPDATE bettas SET codigo = ?, nombre = ?, sexo = ?, tipo = ?, variedad = ?, color = ?, origen = ?, criador = ?, fecha_nacimiento = ?, padre_id = ?, madre_id = ?, foto_principal = ?, observaciones = ?, estado = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [betta.codigo, betta.nombre, betta.sexo, betta.tipo, betta.variedad, betta.color, betta.origen, betta.criador, betta.fecha_nacimiento, betta.padre_id || null, betta.madre_id || null, betta.foto_principal || null, betta.observaciones || null, betta.estado, id],
      )
    },

    async updatePhoto(id, fotoPath) {
      await executeRun(
        `UPDATE bettas SET foto_principal = ?, updated_at = datetime('now') WHERE id = ?`,
        [fotoPath, id],
      )
      const betta = this.list.find((b) => b.id === id)
      if (betta) betta.foto_principal = fotoPath
      if (this.current?.id === id) this.current.foto_principal = fotoPath
    },

    async delete(id) {
      await executeRun('DELETE FROM bettas WHERE id = ?', [id])
      this.list = this.list.filter((b) => b.id !== id)
    },

    async getStats() {
      const total = await executeQuery('SELECT COUNT(*) as count FROM bettas')
      const bySexo = await executeQuery('SELECT sexo, COUNT(*) as count FROM bettas GROUP BY sexo')
      const byEstado = await executeQuery('SELECT estado, COUNT(*) as count FROM bettas GROUP BY estado')
      const byTipo = await executeQuery('SELECT tipo, COUNT(*) as count FROM bettas GROUP BY tipo')
      return {
        total: total[0]?.count || 0,
        bySexo,
        byEstado,
        byTipo,
      }
    },
  },
})
