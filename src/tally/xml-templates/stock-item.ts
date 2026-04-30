import { escapeXml } from "../xml-builder";

interface StockItemInput {
  name: string;
  hsnCode?: string;
  gstRate: number;
  productType?: string;
  unit?: string;
}

/**
 * Build Stock Item Create XML for products
 * Used in "All Masters" report
 */
export function buildStockItemXml(input: StockItemInput): string {
  const { name, hsnCode, gstRate, productType, unit } = input;

  const parent = productType || "Primary";
  const baseUnit = unit || "Bag";

  let xml = `          <STOCKITEM NAME="${escapeXml(name)}" ACTION="Create">
            <NAME>${escapeXml(name)}</NAME>
            <PARENT>${escapeXml(parent)}</PARENT>
            <BASEUNITS>${escapeXml(baseUnit)}</BASEUNITS>
            <GSTAPPLICABLE>Yes</GSTAPPLICABLE>`;

  if (hsnCode) {
    xml += `\n            <HSNCODE>${escapeXml(hsnCode)}</HSNCODE>`;
  }

  xml += `\n          </STOCKITEM>`;

  return xml;
}
