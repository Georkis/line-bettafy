import { executeQuery } from './sqlite'

async function getBettaById(id) {
  const rows = await executeQuery('SELECT * FROM bettas WHERE id = ?', [id])
  return rows.length ? rows[0] : null
}

async function getChildren(bettaId) {
  return executeQuery(
    'SELECT * FROM bettas WHERE padre_id = ? OR madre_id = ? ORDER BY fecha_nacimiento DESC',
    [bettaId, bettaId],
  )
}

function pick(o, keys) {
  if (!o) return null
  const r = {}
  for (const k of keys) {
    if (k in o) r[k] = o[k]
  }
  return r
}

function cleanBetta(betta) {
  if (!betta) return null
  return pick(betta, ['id', 'codigo', 'nombre', 'sexo', 'tipo', 'variedad', 'color', 'origen', 'criador', 'fecha_nacimiento', 'estado', 'foto_principal', 'observaciones'])
}

function cleanBettaDeep(betta) {
  if (!betta) return null
  return {
    ...cleanBetta(betta),
    padre: betta.padre ? cleanBetta(betta.padre) : null,
    madre: betta.madre ? cleanBetta(betta.madre) : null,
  }
}

export async function buildTree(bettaId, showAncestors = true) {
  const betta = await getBettaById(bettaId)
  if (!betta) return null

  const [padre, madre, partners] = await Promise.all([
    showAncestors && betta.padre_id ? buildAncestor(betta.padre_id) : null,
    showAncestors && betta.madre_id ? buildAncestor(betta.madre_id) : null,
    getPartnersWithChildren(bettaId),
  ])

  const partneredChildIds = new Set(
    partners.flatMap((p) => p.children.map((c) => c.id)),
  )
  const allChildren = await getChildren(bettaId)
  const otherChildren = allChildren.filter((c) => !partneredChildIds.has(c.id))

  return {
    ...cleanBetta(betta),
    padre: padre ? cleanBettaDeep(padre) : null,
    madre: madre ? cleanBettaDeep(madre) : null,
    partners: partners.map((p) => ({
      partner: cleanBetta(p.partner),
      children: p.children,
    })),
    children: await Promise.all(otherChildren.map((c) => buildTree(c.id, false))),
  }
}

async function buildAncestor(bettaId) {
  const betta = await getBettaById(bettaId)
  if (!betta) return null
  const padre = betta.padre_id ? await getBettaById(betta.padre_id) : null
  const madre = betta.madre_id ? await getBettaById(betta.madre_id) : null
  return { ...betta, padre, madre }
}

async function getPartnersWithChildren(bettaId) {
  const cruces = await executeQuery(
    'SELECT * FROM reproducciones WHERE macho_id = ? OR hembra_id = ? ORDER BY created_at DESC',
    [bettaId, bettaId],
  )
  const result = []
  for (const cruce of cruces) {
    const partnerId = cruce.macho_id === bettaId ? cruce.hembra_id : cruce.macho_id
    const partner = await getBettaById(partnerId)
    if (!partner) continue
    const children = await executeQuery(
      `SELECT * FROM bettas WHERE (padre_id = ? AND madre_id = ?) OR (padre_id = ? AND madre_id = ?) ORDER BY fecha_nacimiento DESC`,
      [bettaId, partnerId, partnerId, bettaId],
    )
    result.push({
      partner,
      children: await Promise.all(children.map((c) => buildTree(c.id, false))),
    })
  }
  return result
}

export async function getParents(bettaId) {
  const betta = await executeQuery('SELECT padre_id, madre_id FROM bettas WHERE id = ?', [bettaId])
  if (!betta.length) return { padre: null, madre: null }
  const { padre_id, madre_id } = betta[0]
  const [padre, madre] = await Promise.all([
    padre_id ? getBettaById(padre_id) : null,
    madre_id ? getBettaById(madre_id) : null,
  ])
  return { padre: cleanBetta(padre), madre: cleanBetta(madre) }
}

export async function getSiblings(bettaId) {
  const betta = await executeQuery('SELECT padre_id, madre_id FROM bettas WHERE id = ?', [bettaId])
  if (!betta.length || (!betta[0].padre_id && !betta[0].madre_id)) return []
  const { padre_id, madre_id } = betta[0]
  return executeQuery(
    `SELECT * FROM bettas WHERE id != ? AND (padre_id = ? OR padre_id = ? OR madre_id = ? OR madre_id = ?)`,
    [bettaId, padre_id, madre_id, padre_id, madre_id],
  )
}
