export type AssetUnitRow = {
  id: string;
  serialNumber: string | null;
  imei: string | null;
  trackTag: string | null;
  notes: string | null;
  onLoan: boolean;
};

export function unitLabel(
  u: Pick<AssetUnitRow, "id" | "serialNumber" | "trackTag">,
) {
  return (
    u.serialNumber?.trim() ||
    u.trackTag?.trim() ||
    `Unit ${u.id.slice(-6)}`
  );
}

export function checkoutUnitOptions(units: AssetUnitRow[]) {
  return units
    .filter((u) => !u.onLoan)
    .map((u) => ({ id: u.id, label: unitLabel(u) }));
}
