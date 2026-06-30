import { defineStore } from 'pinia'
import { executeQuery, executeRun } from 'src/services/sqlite'

export const useUbicacionesStore = defineStore('ubicaciones', {
  state: () => ({
    list: [],
  }),

  actions: {
    async fetchByReproduccion(reproduccionId) {
      this.list = await executeQuery(
        `SELECT u.*, d.nombre as deposito_nombre
         FROM ubicaciones_alevines u
         LEFT JOIN depositos d ON u.deposito_id = d.id
         WHERE u.reproduccion_id = ?
         ORDER BY u.fecha DESC, u.id DESC`,
        [reproduccionId],
      )
      return this.list
    },

    async create(data) {
      const result = await executeRun(
        `INSERT INTO ubicaciones_alevines (reproduccion_id, deposito_id, fecha, observaciones) VALUES (?, ?, ?, ?)`,
        [data.reproduccion_id, data.deposito_id || null, data.fecha, data.observaciones || null],
      )
      return result.lastId
    },

    async delete(id) {
      await executeRun('DELETE FROM ubicaciones_alevines WHERE id = ?', [id])
    },

    async deleteByReproduccion(reproduccionId) {
      await executeRun('DELETE FROM ubicaciones_alevines WHERE reproduccion_id = ?', [reproduccionId])
    },
  },
})
