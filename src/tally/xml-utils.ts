/**
 * XML Utilities for Tally integration
 * Decoding, escaping, and entity handling
 */

/**
 * Decode XML entities
 * Converts &apos; → ', &quot; → ", &lt; → <, &gt; → >, &amp; → &
 */
export function decodeXmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // Must be last to avoid double-decoding
}

/**
 * Extract XML text content safely
 * Handles nested tags and attributes
 */
export function extractXmlText(xml: string, tagName: string): string | null {
  try {
    // Create a regex that handles nested elements
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i");
    const match = xml.match(regex);
    if (match && match[1]) {
      return decodeXmlEntities(match[1].trim());
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a string looks like a valid Tally master name
 */
export function isValidLedgerName(name: string | null | undefined): boolean {
  if (!name) return false;
  if (typeof name !== "string") return false;
  if (name === "undefined" || name === "null") return false;
  return name.trim().length > 0;
}

/**
 * Detect if an error message indicates a missing master
 */
export function detectMissingMaster(errorText: string): string | null {
  const missingPatterns = [
    /Ledger\s+'([^']+)'\s+does not exist/i,
    /Master\s+'([^']+)'\s+not found/i,
    /Cannot find\s+([^.]+)/i,
    /Stock item\s+'([^']+)'\s+not found/i,
    /Unit\s+'([^']+)'\s+does not exist/i,
  ];

  for (const pattern of missingPatterns) {
    const match = errorText.match(pattern);
    if (match && match[1]) {
      return `Missing Tally master: "${match[1]}" does not exist.\n\nCreate it in Tally or map it to an existing master before importing.`;
    }
  }

  return null;
}

/**
 * Format XML for display with proper indentation
 */
export function formatXmlForDisplay(xml: string, maxLines?: number): string {
  try {
    // Add newlines before closing tags for readability
    let formatted = xml
      .replace(/></g, ">\n<")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (maxLines && formatted.length > maxLines) {
      formatted = formatted.slice(0, maxLines);
      formatted.push(`... (${formatted.length - maxLines} more lines)`);
    }

    return formatted.join("\n");
  } catch {
    return xml;
  }
}

/**
 * Check if XML response indicates success
 */
export function isTallySuccessResponse(xml: string): boolean {
  // Check for error indicators
  if (xml.includes("<LINEERROR")) return false;
  if (xml.includes("<ERRORS>1</ERRORS>")) return false;
  if (xml.includes("<EXCEPTIONS>1</EXCEPTIONS>")) return false;
  if (xml.includes("<CANCELLED>Yes</CANCELLED>")) return false;

  // Check for success indicators
  return xml.includes("<IMPORTRESULT>") || xml.includes("Success");
}

/**
 * Parse GST details from response
 */
export function parseGstDetails(xml: string): {
  cgst?: number;
  sgst?: number;
  igst?: number;
} {
  const result: any = {};

  const cgstMatch = xml.match(/<CGST>([^<]+)<\/CGST>/i);
  if (cgstMatch) {
    result.cgst = parseFloat(cgstMatch[1]);
  }

  const sgstMatch = xml.match(/<SGST>([^<]+)<\/SGST>/i);
  if (sgstMatch) {
    result.sgst = parseFloat(sgstMatch[1]);
  }

  const igstMatch = xml.match(/<IGST>([^<]+)<\/IGST>/i);
  if (igstMatch) {
    result.igst = parseFloat(igstMatch[1]);
  }

  return result;
}
