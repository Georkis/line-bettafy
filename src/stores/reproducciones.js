import { defineStore } from 'pinia'
import { executeQuery, executeRun } from 'src/services/sqlite'

export const useReproduccionesStore = defineStore('reproducciones', {
  state: () => ({
    list: [],
    current: null,
    loading: false,
  }),

  actions: {
    async fetchAll() {
      this.loading = true
      try {
        this.list = await executeQuery(
          `SELECT r.*,
             m.codigo as macho_codigo, m.nombre as macho_nombre,
             h.codigo as hembra_codigo, h.nombre as hembra_nombre,
             (SELECT d.nombre FROM ubicaciones_alevines u
              LEFT JOIN depositos d ON u.deposito_id = d.id
              WHERE u.reproduccion_id = r.id
              ORDER BY u.fecha DESC, u.id DESC LIMIT 1) as ultimo_deposito,
             (SELECT u.fecha FROM ubicaciones_alevines u
              WHERE u.reproduccion_id = r.id
              ORDER BY u.fecha DESC, u.id DESC LIMIT 1) as ultima_fecha_ubicacion,
             (SELECT COUNT(*) FROM ubicaciones_alevines u
              WHERE u.reproduccion_id = r.id) as total_ubicaciones
           FROM reproducciones r
           LEFT JOIN bettas m ON r.macho_id = m.id
           LEFT JOIN bettas h ON r.hembra_id = h.id
           ORDER BY r.created_at DESC`,
        )
      } finally {
        this.loading = false
      }
    },

    async fetchById(id) {
      const rows = await executeQuery(
        `SELECT r.*,
           m.codigo as macho_codigo, m.nombre as macho_nombre,
           h.codigo as hembra_codigo, h.nombre as hembra_nombre,
           (SELECT d.nombre FROM ubicaciones_alevines u
            LEFT JOIN depositos d ON u.deposito_id = d.id
            WHERE u.reproduccion_id = r.id
            ORDER BY u.fecha DESC, u.id DESC LIMIT 1) as ultimo_deposito,
           (SELECT u.fecha FROM ubicaciones_alevines u
            WHERE u.reproduccion_id = r.id
            ORDER BY u.fecha DESC, u.id DESC LIMIT 1) as ultima_fecha_ubicacion,
           (SELECT COUNT(*) FROM ubicaciones_alevines u
            WHERE u.reproduccion_id = r.id) as total_ubicaciones
         FROM reproducciones r
         LEFT JOIN bettas m ON r.macho_id = m.id
         LEFT JOIN bettas h ON r.hembra_id = h.id
         WHERE r.id = ?`,
        [id],
      )
      this.current = rows.length ? rows[0] : null
      return this.current
    },

    async create(repro) {
      const result = await executeRun(
        `INSERT INTO reproducciones (macho_id, hembra_id, fecha_cruce, fecha_desove, cantidad_alevines, observaciones)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [repro.macho_id, repro.hembra_id, repro.fecha_cruce, repro.fecha_desove, repro.cantidad_alevines || 0, repro.observaciones || null],
      )
      return result.lastId
    },

    async update(id, repro) {
      await executeRun(
        `UPDATE reproducciones SET macho_id = ?, hembra_id = ?, fecha_cruce = ?, fecha_desove = ?, cantidad_alevines = ?, observaciones = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [repro.macho_id, repro.hembra_id, repro.fecha_cruce, repro.fecha_desove, repro.cantidad_alevines, repro.observaciones, id],
      )
    },

    async delete(id) {
      await executeRun('DELETE FROM reproducciones WHERE id = ?', [id])
      this.list = this.list.filter((r) => r.id !== id)
    },

    async getByBetta(bettaId) {
      return executeQuery(
        `SELECT r.*,
           m.codigo as macho_codigo, m.nombre as macho_nombre,
           h.codigo as hembra_codigo, h.nombre as hembra_nombre,
           (SELECT d.nombre FROM ubicaciones_alevines u
            LEFT JOIN depositos d ON u.deposito_id = d.id
            WHERE u.reproduccion_id = r.id
            ORDER BY u.fecha DESC, u.id DESC LIMIT 1) as ultimo_deposito,
           (SELECT u.fecha FROM ubicaciones_alevines u
            WHERE u.reproduccion_id = r.id
            ORDER BY u.fecha DESC, u.id DESC LIMIT 1) as ultima_fecha_ubicacion,
           (SELECT COUNT(*) FROM ubicaciones_alevines u
            WHERE u.reproduccion_id = r.id) as total_ubicaciones
         FROM reproducciones r
         LEFT JOIN bettas m ON r.macho_id = m.id
         LEFT JOIN bettas h ON r.hembra_id = h.id
         WHERE r.macho_id = ? OR r.hembra_id = ?
         ORDER BY r.created_at DESC`,
        [bettaId, bettaId],
      )
    },

    async getStats() {
      const total = await executeQuery('SELECT COUNT(*) as count FROM reproducciones')
      const totalAlevines = await executeQuery('SELECT COALESCE(SUM(cantidad_alevines), 0) as total FROM reproducciones')
      return {
        total: total[0]?.count || 0,
        totalAlevines: totalAlevines[0]?.total || 0,
      }
    },
  },
})
