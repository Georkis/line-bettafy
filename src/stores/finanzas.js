import { defineStore } from 'pinia'
import { executeQuery, executeRun } from 'src/services/sqlite'

export const useFinanzasStore = defineStore('finanzas', {
  state: () => ({
    list: [],
    loading: false,
    resumen: { ingresos: 0, gastos: 0, balance: 0 },
  }),

  actions: {
    async fetchByRange({ anio, mes, desde, hasta }) {
      this.loading = true
      try {
        let sql = `SELECT t.*, b.codigo as betta_codigo, b.nombre as betta_nombre
                   FROM transacciones t
                   LEFT JOIN bettas b ON t.betta_id = b.id
                   WHERE 1=1`
        const params = []
        if (desde && hasta) {
          sql += ` AND t.fecha >= ? AND t.fecha <= ?`
          params.push(desde, hasta)
        } else if (anio && mes) {
          sql += ` AND strftime('%Y', t.fecha) = ? AND strftime('%m', t.fecha) = ?`
          params.push(String(anio), String(mes).padStart(2, '0'))
        } else if (anio) {
          sql += ` AND strftime('%Y', t.fecha) = ?`
          params.push(String(anio))
        }
        sql += ` ORDER BY t.fecha DESC, t.created_at DESC`
        this.list = await executeQuery(sql, params)
      } finally {
        this.loading = false
      }
      return this.list
    },

    async fetchResumen({ anio, mes, desde, hasta }) {
      let sql = `SELECT tipo, SUM(monto) as total FROM transacciones WHERE 1=1`
      const params = []
      if (desde && hasta) {
        sql += ` AND fecha >= ? AND fecha <= ?`
        params.push(desde, hasta)
      } else if (anio && mes) {
        sql += ` AND strftime('%Y', fecha) = ? AND strftime('%m', fecha) = ?`
        params.push(String(anio), String(mes).padStart(2, '0'))
      } else if (anio) {
        sql += ` AND strftime('%Y', fecha) = ?`
        params.push(String(anio))
      }
      const rows = await executeQuery(sql, params)
      const ingresos = Number(rows.find((r) => r.tipo === 'ingreso')?.total || 0)
      const gastos = Number(rows.find((r) => r.tipo === 'gasto')?.total || 0)
      this.resumen = { ingresos, gastos, balance: ingresos - gastos }
      return this.resumen
    },

    async create(transaccion) {
      const monto = transaccion.tipo === 'ingreso'
        ? (transaccion.cantidad || 1) * (transaccion.precio_unitario || 0)
        : transaccion.monto

      let estadoPrevio = null
      if (transaccion.tipo === 'ingreso' && transaccion.betta_id) {
        const rows = await executeQuery('SELECT estado FROM bettas WHERE id = ?', [transaccion.betta_id])
        if (rows.length) {
          estadoPrevio = rows[0].estado
        }
      }

      const result = await executeRun(
        `INSERT INTO transacciones (tipo, concepto, cantidad, precio_unitario, monto, sexo, comprador, categoria, fecha, observaciones, betta_id, betta_estado_previo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaccion.tipo,
          transaccion.concepto,
          transaccion.tipo === 'ingreso' ? (transaccion.cantidad || 1) : null,
          transaccion.tipo === 'ingreso' ? (transaccion.precio_unitario || 0) : null,
          monto,
          transaccion.tipo === 'ingreso' ? (transaccion.sexo || null) : null,
          transaccion.tipo === 'ingreso' ? (transaccion.comprador || null) : null,
          transaccion.tipo === 'gasto' ? (transaccion.categoria || null) : null,
          transaccion.fecha,
          transaccion.observaciones || null,
          transaccion.betta_id || null,
          estadoPrevio,
        ],
      )

      if (transaccion.tipo === 'ingreso' && transaccion.betta_id) {
        await executeRun(
          `UPDATE bettas SET estado = 'vendido', updated_at = datetime('now') WHERE id = ?`,
          [transaccion.betta_id],
        )
      }

      return result.lastId
    },

    async update(id, transaccion) {
      const oldRows = await executeQuery('SELECT betta_id, betta_estado_previo FROM transacciones WHERE id = ?', [id])
      const oldBettaId = oldRows.length ? oldRows[0].betta_id : null
      const oldEstadoPrevio = oldRows.length ? oldRows[0].betta_estado_previo : null
      const newBettaId = transaccion.tipo === 'ingreso' ? (transaccion.betta_id || null) : null

      if (oldBettaId && oldBettaId !== newBettaId) {
        await executeRun(
          `UPDATE bettas SET estado = ?, updated_at = datetime('now') WHERE id = ?`,
          [oldEstadoPrevio || 'activo', oldBettaId],
        )
      }

      let estadoPrevio = null
      if (newBettaId && newBettaId !== oldBettaId) {
        const rows = await executeQuery('SELECT estado FROM bettas WHERE id = ?', [newBettaId])
        estadoPrevio = rows.length ? rows[0].estado : null
        await executeRun(
          `UPDATE bettas SET estado = 'vendido', updated_at = datetime('now') WHERE id = ?`,
          [newBettaId],
        )
      }

      const monto = transaccion.tipo === 'ingreso'
        ? (transaccion.cantidad || 1) * (transaccion.precio_unitario || 0)
        : transaccion.monto

      const estadoPrevioToSave = estadoPrevio || (oldBettaId === newBettaId ? oldEstadoPrevio : null)

      await executeRun(
        `UPDATE transacciones SET tipo = ?, concepto = ?, cantidad = ?, precio_unitario = ?, monto = ?, sexo = ?, comprador = ?, categoria = ?, fecha = ?, observaciones = ?, betta_id = ?, betta_estado_previo = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          transaccion.tipo,
          transaccion.concepto,
          transaccion.tipo === 'ingreso' ? (transaccion.cantidad || 1) : null,
          transaccion.tipo === 'ingreso' ? (transaccion.precio_unitario || 0) : null,
          monto,
          transaccion.tipo === 'ingreso' ? (transaccion.sexo || null) : null,
          transaccion.tipo === 'ingreso' ? (transaccion.comprador || null) : null,
          transaccion.tipo === 'gasto' ? (transaccion.categoria || null) : null,
          transaccion.fecha,
          transaccion.observaciones || null,
          newBettaId,
          estadoPrevioToSave,
          id,
        ],
      )
    },

    async delete(id) {
      const rows = await executeQuery('SELECT betta_id, betta_estado_previo, tipo FROM transacciones WHERE id = ?', [id])
      if (rows.length && rows[0].tipo === 'ingreso' && rows[0].betta_id) {
        await executeRun(
          `UPDATE bettas SET estado = ?, updated_at = datetime('now') WHERE id = ?`,
          [rows[0].betta_estado_previo || 'activo', rows[0].betta_id],
        )
      }
      await executeRun('DELETE FROM transacciones WHERE id = ?', [id])
      this.list = this.list.filter((t) => t.id !== id)
    },
  },
})
