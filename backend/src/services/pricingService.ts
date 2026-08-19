import { query } from '../config/db.js';

export async function groceryPackageForCount(itemCount: number) {
  const { rows } = await query<{ code: string; label: string; amount_cents: number; meta: { maxItems?: number } }>(
    `select code, label, amount_cents, meta from service_pricing
     where kind = 'grocery_package' and active = true order by (meta->>'maxItems')::int`,
  );
  const match =
    rows.find((r) => itemCount <= Number(r.meta?.maxItems ?? 9999)) ?? rows[rows.length - 1];
  return match ?? { code: 'essentials', label: 'Essentials', amount_cents: 14900, meta: { maxItems: 30 } };
}

export async function airportFare(code: string, vehicleId: string, bags = 0) {
  const airport = await query<{ base_fare_cents: number }>(
    `select base_fare_cents from airports where code = $1`,
    [code],
  );
  const vehicle = await query<{ multiplier: string }>(
    `select multiplier from vehicle_classes where id = $1`,
    [vehicleId],
  );
  const base = airport.rows[0]?.base_fare_cents ?? 15000;
  const multiplier = Number(vehicle.rows[0]?.multiplier ?? 1);
  const extraBags = Math.max(0, bags - 3) * 1500;
  return Math.round(base * multiplier + extraBags);
}

export async function cancellationPreview(pickupAt: Date, fareCents: number) {
  const hours = (pickupAt.getTime() - Date.now()) / 36e5;
  const { rows } = await query<{ code: string; label: string; hours: number; fee_cents: number; note: string }>(
    `select code, label, hours, fee_cents, note from cancellation_policies order by hours desc`,
  );
  const rule = rows.find((r) => hours >= r.hours) ?? rows[rows.length - 1];
  const fee = rule?.fee_cents ?? 0;
  return {
    policy: rule?.code ?? 'SAME_DAY',
    label: rule?.label,
    fee: fee / 100,
    fee_cents: fee,
    refund_amount: Math.max(0, fareCents - fee) / 100,
    payment_action: 'FUTURE_STRIPE_REFUND',
    note: rule?.note,
  };
}

export async function getPricingCatalog() {
  const packages = await query(`select * from service_pricing where active = true order by kind, code`);
  const airports = await query(`select * from airports order by code`);
  const vehicles = await query(`select * from vehicle_classes order by name`);
  const policies = await query(`select * from cancellation_policies order by hours desc`);
  return { packages: packages.rows, airports: airports.rows, vehicles: vehicles.rows, policies: policies.rows };
}
