// XML Builder utilities for Tally integration

export type TallyReportName = "All Masters" | "Vouchers";

/**
 * Escape XML special characters
 */
export function escapeXml(value: string): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format date from YYYY-MM-DD to YYYYMMDD for Tally
 * Per official Tally documentation: DATE format is YYYYMMDD (no separators)
 * Example: 20240617 = June 17, 2024
 * Uses string parsing to avoid timezone issues
 */
export function formatDateForTally(dateString: string): string {
  if (!dateString) {
    // If no date provided, use today's date as fallback
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    console.warn("Empty date provided to formatDateForTally, using today:", `${year}${month}${day}`);
    return `${year}${month}${day}`;
  }
  
  // Parse YYYY-MM-DD format directly without timezone issues
  const parts = dateString.trim().split('-');
  if (parts.length !== 3) {
    console.warn(`Invalid date format: "${dateString}", expected YYYY-MM-DD`);
    // Return today's date as fallback
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
  
  const [year, month, day] = parts;
  const formatted = `${year}${month}${day}`;
  
  // Validate the formatted date is 8 digits
  if (!/^\d{8}$/.test(formatted)) {
    console.warn(`Invalid date components: year=${year}, month=${month}, day=${day}`);
    // Return today's date as fallback
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  
  return formatted;
}

/**
 * Build Tally XML envelope for MASTERS (Ledgers, Stock Items, etc.)
 * Uses IMPORTDATA/REQUESTDESC/REPORTNAME structure
 * This is ONLY for masters, not for vouchers
 */
export function buildMasterEnvelope({
  reportName,
  bodyXml,
}: {
  reportName: "All Masters";
  bodyXml: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>${reportName}</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
${bodyXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Build Tally XML envelope for VOUCHERS
 * Uses proper Tally voucher import structure with <ID>Vouchers</ID>
 * This is DIFFERENT from the master envelope and REQUIRED for vouchers to be accepted
 */
export function buildVoucherEnvelope(bodyXml: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Import</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Vouchers</ID>
  </HEADER>
  <BODY>
    <DESC></DESC>
    <DATA>
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
${bodyXml}
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
}

/**
 * Backwards compatibility: Keep old name pointing to master envelope
 * @deprecated Use buildMasterEnvelope or buildVoucherEnvelope instead
 */
export function buildTallyEnvelope({
  reportName,
  bodyXml,
}: {
  reportName: TallyReportName;
  bodyXml: string;
}): string {
  return buildMasterEnvelope({ reportName: reportName as "All Masters", bodyXml });
}
