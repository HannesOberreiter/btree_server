import httpErrors from 'http-errors';

import type { Database } from '../../types/database.types.js';

const ownedReferenceTables = {
  apiary: 'apiaries',
  chargeType: 'charge_types',
  checkupType: 'checkup_types',
  feedType: 'feed_types',
  harvestType: 'harvest_types',
  hive: 'hives',
  scale: 'scales',
  treatmentDisease: 'treatment_diseases',
  treatmentType: 'treatment_types',
  treatmentVet: 'treatment_vets',
  waxOriginType: 'wax_origin_types',
  waxProduct: 'wax_products',
} as const;

type OwnedReference = keyof typeof ownedReferenceTables;

async function requireOwnership(
  db: Database,
  reference: OwnedReference,
  id: number,
  companyId: number,
) {
  const row = await db
    .selectFrom(ownedReferenceTables[reference])
    .select('id')
    .where('id', '=', id)
    .where('user_id', '=', companyId)
    .executeTakeFirst();
  if (!row) throw httpErrors.NotFound();
}

export function requireApiaryOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'apiary', id, companyId);
}

export function requireChargeTypeOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'chargeType', id, companyId);
}

export function requireCheckupTypeOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'checkupType', id, companyId);
}

export function requireFeedTypeOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'feedType', id, companyId);
}

export function requireHarvestTypeOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'harvestType', id, companyId);
}

export function requireHiveOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'hive', id, companyId);
}

export function requireScaleOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'scale', id, companyId);
}

export function requireTreatmentDiseaseOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'treatmentDisease', id, companyId);
}

export function requireTreatmentTypeOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'treatmentType', id, companyId);
}

export function requireTreatmentVetOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'treatmentVet', id, companyId);
}

export function requireWaxOriginTypeOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'waxOriginType', id, companyId);
}

export function requireWaxProductOwnership(
  db: Database,
  id: number,
  companyId: number,
) {
  return requireOwnership(db, 'waxProduct', id, companyId);
}
