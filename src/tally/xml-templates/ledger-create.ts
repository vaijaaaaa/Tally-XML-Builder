import { escapeXml } from "../xml-builder";

interface LedgerCreateInput {
  name: string;
  ledgerType: "customer" | "supplier";
  address?: string;
  state?: string;
  gstin?: string;
}

/**
 * Build Ledger Create XML for customers and suppliers
 * Used in "All Masters" report
 */
export function buildLedgerCreateXml(input: LedgerCreateInput): string {
  const { name, ledgerType, address, state, gstin } = input;

  const parent = ledgerType === "customer" ? "Sundry Debtors" : "Sundry Creditors";
  const gstRegistrationType = gstin ? "Regular" : "Unregistered/Consumer";

  let xml = `          <LEDGER NAME="${escapeXml(name)}" ACTION="Create">
            <NAME>${escapeXml(name)}</NAME>
            <PARENT>${parent}</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
            <GSTREGISTRATIONTYPE>${gstRegistrationType}</GSTREGISTRATIONTYPE>`;

  if (gstin) {
    xml += `\n            <PARTYGSTIN>${escapeXml(gstin)}</PARTYGSTIN>`;
  }

  if (state) {
    xml += `\n            <LEDSTATENAME>${escapeXml(state)}</LEDSTATENAME>`;
  }

  if (address) {
    xml += `\n            <ADDRESS.LIST TYPE="String">
              <ADDRESS>${escapeXml(address)}</ADDRESS>
            </ADDRESS.LIST>`;
  }

  xml += `\n          </LEDGER>`;

  return xml;
}
