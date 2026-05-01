/**
 * Tally Response Parser
 * Safely extracts and parses Tally XML response fields
 */

export interface ParsedTallyResponse {
  success: boolean;
  lineError: string | null;
  importResult: string | null;
  created: string | null;
  altered: string | null;
  exceptions: number | null;
  errors: number | null;
  cancelled: string | null;
  desc: string | null;
  cmpInfo: string | null;
  readableError: string;
  rawResponse: string;
}

/**
 * Safely extract XML element value
 */
function extractXmlValue(xml: string, tagName: string): string | null {
  try {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</\\s*${tagName}\\s*>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Parse Tally XML response and extract key fields
 */
export function parseTallyResponse(rawResponse: string): ParsedTallyResponse {
  // Safely extract each field
  const lineError = extractXmlValue(rawResponse, 'LINEERROR');
  const importResult = extractXmlValue(rawResponse, 'IMPORTRESULT');
  const created = extractXmlValue(rawResponse, 'CREATED');
  const altered = extractXmlValue(rawResponse, 'ALTERED');
  const cancelled = extractXmlValue(rawResponse, 'CANCELLED');
  const desc = extractXmlValue(rawResponse, 'DESC');
  const cmpInfo = extractXmlValue(rawResponse, 'CMPINFO');

  // Parse numeric fields
  let exceptions: number | null = null;
  let errors: number | null = null;

  const exceptionsStr = extractXmlValue(rawResponse, 'EXCEPTIONS');
  const errorsStr = extractXmlValue(rawResponse, 'ERRORS');

  if (exceptionsStr) {
    const num = parseInt(exceptionsStr, 10);
    exceptions = isNaN(num) ? null : num;
  }

  if (errorsStr) {
    const num = parseInt(errorsStr, 10);
    errors = isNaN(num) ? null : num;
  }

  // Determine success
  const success = !lineError && exceptions !== 1 && errors !== 1;

  // Build readable error message
  let readableError = '';

  if (lineError) {
    // Strategy 1: LINEERROR exists, show it as main error
    readableError = `Tally Line Error: ${lineError}`;
  } else if (exceptions !== null && exceptions > 0) {
    // Strategy 2: No LINEERROR but EXCEPTIONS > 0
    readableError = 'Tally rejected the XML but did not return LINEERROR. Please check full raw response.';
  } else if (errors !== null && errors > 0) {
    // Strategy 3: ERRORS flag set
    readableError = 'Tally returned an error. Please check full raw response.';
  } else if (!success) {
    readableError = 'XML import failed. Please check full raw response.';
  }

  return {
    success,
    lineError,
    importResult,
    created,
    altered,
    exceptions,
    errors,
    cancelled,
    desc,
    cmpInfo,
    readableError,
    rawResponse,
  };
}

/**
 * Format parsed response for display
 */
export function formatTallyErrorDisplay(parsed: ParsedTallyResponse): string {
  const lines: string[] = [];

  // Readable error
  if (parsed.readableError) {
    lines.push(`❌ ${parsed.readableError}`);
  } else if (parsed.success) {
    lines.push(`✓ XML imported successfully`);
  }

  // Key fields
  if (parsed.lineError) lines.push(`• LINEERROR: ${parsed.lineError}`);
  if (parsed.importResult) lines.push(`• IMPORTRESULT: ${parsed.importResult}`);
  if (parsed.created) lines.push(`• CREATED: ${parsed.created}`);
  if (parsed.altered) lines.push(`• ALTERED: ${parsed.altered}`);
  if (parsed.exceptions !== null) lines.push(`• EXCEPTIONS: ${parsed.exceptions}`);
  if (parsed.errors !== null) lines.push(`• ERRORS: ${parsed.errors}`);
  if (parsed.cancelled) lines.push(`• CANCELLED: ${parsed.cancelled}`);
  if (parsed.desc) lines.push(`• DESC: ${parsed.desc}`);
  if (parsed.cmpInfo) lines.push(`• CMPINFO: ${parsed.cmpInfo}`);

  // Raw response
  lines.push('');
  lines.push('── Full Raw Response ──');
  lines.push(parsed.rawResponse);

  return lines.join('\n');
}
