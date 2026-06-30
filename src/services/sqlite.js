import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'
import { Capacitor } from '@capacitor/core'

const DB_NAME = 'betta_genealogy'

let db = null
let sqliteConnection = null

export async function initDatabase() {
  if (Capacitor.isNativePlatform()) {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite)
  } else {
    const { defineCustomElements } = await import('jeep-sqlite/loader')
    await defineCustomElements()
    const el = document.querySelector('jeep-sqlite')
    if (el) el.autoSave = true
    sqliteConnection = new SQLiteConnection(CapacitorSQLite)
    await sqliteConnection.initWebStore()
  }
  db = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  await db.open()
  await createTables()
  return db
}

async function createTables() {
  const bettasExists = await db.isTable('bettas')
  if (!bettasExists.result) {
    await db.execute(`CREATE TABLE IF NOT EXISTS bettas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      nombre TEXT,
      sexo TEXT CHECK(sexo IN ('macho', 'hembra', 'indefinido')) DEFAULT 'indefinido',
      tipo TEXT,
      variedad TEXT,
      color TEXT,
      origen TEXT,
      criador TEXT,
      fecha_nacimiento TEXT,
      estado TEXT DEFAULT 'activo',
      padre_id INTEGER,
      madre_id INTEGER,
      foto_principal TEXT,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (padre_id) REFERENCES bettas(id) ON DELETE SET NULL,
      FOREIGN KEY (madre_id) REFERENCES bettas(id) ON DELETE SET NULL
    )`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_bettas_codigo ON bettas(codigo)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_bettas_padre ON bettas(padre_id)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_bettas_madre ON bettas(madre_id)`)
  }

  const fotosExists = await db.isTable('fotos')
  if (!fotosExists.result) {
    await db.execute(`CREATE TABLE IF NOT EXISTS fotos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      betta_id INTEGER NOT NULL,
      ruta TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (betta_id) REFERENCES bettas(id) ON DELETE CASCADE
    )`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_fotos_betta ON fotos(betta_id)`)
  }

  const reproduccionesExists = await db.isTable('reproducciones')
  if (!reproduccionesExists.result) {
    await db.execute(`CREATE TABLE IF NOT EXISTS reproducciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      macho_id INTEGER NOT NULL,
      hembra_id INTEGER NOT NULL,
      fecha_cruce TEXT,
      fecha_desove TEXT,
      cantidad_alevines INTEGER DEFAULT 0,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (macho_id) REFERENCES bettas(id) ON DELETE CASCADE,
      FOREIGN KEY (hembra_id) REFERENCES bettas(id) ON DELETE CASCADE
    )`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_repro_macho ON reproducciones(macho_id)`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_repro_hembra ON reproducciones(hembra_id)`)
  }

  const transaccionesExists = await db.isTable('transacciones')
  if (!transaccionesExists.result) {
    await db.execute(`CREATE TABLE IF NOT EXISTS transacciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT CHECK(tipo IN ('ingreso', 'gasto')) NOT NULL,
      concepto TEXT NOT NULL,
      cantidad INTEGER,
      precio_unitario REAL,
      monto REAL NOT NULL,
      sexo TEXT CHECK(sexo IN ('macho', 'hembra')),
      comprador TEXT,
      categoria TEXT,
      fecha TEXT NOT NULL,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha)`)
  }

  try {
    await db.execute(`ALTER TABLE transacciones ADD COLUMN betta_id INTEGER REFERENCES bettas(id) ON DELETE SET NULL`)
  } catch {
    // column already exists
  }
  try {
    await db.execute(`ALTER TABLE transacciones ADD COLUMN betta_estado_previo TEXT`)
  } catch {
    // column already exists
  }

  const depositosExists = await db.isTable('depositos')
  if (!depositosExists.result) {
    await db.execute(`CREATE TABLE IF NOT EXISTS depositos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`)
  }

  const ubicacionesExists = await db.isTable('ubicaciones_alevines')
  if (!ubicacionesExists.result) {
    await db.execute(`CREATE TABLE IF NOT EXISTS ubicaciones_alevines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reproduccion_id INTEGER NOT NULL,
      deposito_id INTEGER,
      fecha TEXT NOT NULL,
      observaciones TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (reproduccion_id) REFERENCES reproducciones(id) ON DELETE CASCADE,
      FOREIGN KEY (deposito_id) REFERENCES depositos(id) ON DELETE SET NULL
    )`)
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_ubicaciones_repro ON ubicaciones_alevines(reproduccion_id)`)

    const oldRows = await db.query(
      `SELECT id, deposito_id, fecha_ubicacion FROM reproducciones WHERE deposito_id IS NOT NULL`,
    )
    if (oldRows.values?.length) {
      await db.executeSet(oldRows.values.map((r) => ({
        statement: `INSERT INTO ubicaciones_alevines (reproduccion_id, deposito_id, fecha) VALUES (?, ?, ?)`,
        values: [r.id, r.deposito_id, r.fecha_ubicacion || ''],
      })))
    }
  }
}

export function getDb() {
  return db
}

export async function executeQuery(sql, params = []) {
  if (!db) return []
  const ret = await db.query(sql, params)
  return ret.values || []
}

export async function executeRun(sql, params = []) {
  if (!db) return { changes: 0, lastId: null }
  const ret = await db.run(sql, params)
  return ret.changes
}

export async function executeSet(set) {
  if (!db) return { changes: 0 }
  const ret = await db.executeSet(set)
  return ret.changes
}

export async function importDatabase(jsonData) {
  if (!db) return false
  const ret = await db.importFromJson(JSON.stringify(jsonData))
  return ret.changes?.changes ?? false
}

export async function exportDatabase() {
  if (!db) return null
  const json = await db.exportToJson('full')
  return json.export
}
