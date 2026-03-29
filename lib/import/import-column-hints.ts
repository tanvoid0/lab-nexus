/** Recognized column aliases (first match wins per field). Shown on admin import + README. */
export const IMPORT_COLUMN_HINTS: { title: string; keys: string[] }[] = [
  {
    title: "Item name",
    keys: ["Name", "name", "Item", "item", "Category", "category"],
  },
  {
    title: "SKU / internal ID",
    keys: ["SKU", "sku", "Number", "number", "ID", "id"],
  },
  {
    title: "Quantity (optional, default 1)",
    keys: ["quantity", "Quantity", "Qty", "Number"],
  },
  {
    title: "Notes",
    keys: ["Notes", "notes", "Additional Notes", "additional notes"],
  },
  {
    title: "Quote / URL",
    keys: ["Quote", "quote", "URL", "url"],
  },
];
