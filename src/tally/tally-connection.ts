/**
 * Tally Connection Module
 * Handles communication with TallyPrime running on localhost:9000
 */

export interface TallyConnectionSettings {
  host: string;
  port: string | number;
}

export interface TallySendResult {
  success: boolean;
  status?: number;
  responseText: string;
  error?: string;
}

/**
 * Build Tally URL from settings
 */
export function buildTallyUrl(settings?: Partial<TallyConnectionSettings>): string {
  const host = settings?.host || "localhost";
  const port = settings?.port || 9000;
  return `http://${host}:${port}`;
}

/**
 * Check if Tally is running and accessible
 */
export async function checkTallyConnection(
  settings?: Partial<TallyConnectionSettings>
): Promise<TallySendResult> {
  try {
    const url = buildTallyUrl(settings);
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "*/*",
      },
    });

    const responseText = await response.text();

    return {
      success: response.ok,
      status: response.status,
      responseText: responseText || `HTTP ${response.status}`,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      responseText: "No response",
      error: `Connection failed: ${errorMsg}`,
    };
  }
}

/**
 * Send XML to Tally
 */
export async function sendXmlToTally(
  xml: string,
  settings?: Partial<TallyConnectionSettings>
): Promise<TallySendResult> {
  try {
    const url = buildTallyUrl(settings);

    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/xml",
      },
      body: xml,
    });

    const responseText = await response.text();

    // Parse response for success indicators
    const isSuccess =
      response.ok &&
      !responseText.includes("<LINEERROR") &&
      !responseText.includes("<Error>");

    return {
      success: isSuccess,
      status: response.status,
      responseText: responseText,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      responseText: "No response",
      error: `Send failed: ${errorMsg}`,
    };
  }
}
