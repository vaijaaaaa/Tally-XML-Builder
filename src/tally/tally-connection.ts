/**
 * Tally Connection Module
 * Handles communication with TallyPrime running on localhost:9000
 * Uses Tauri Rust backend to avoid CORS issues
 */

// Import invoke at module level - will be available once module loads
let invokeImpl: any = null;
let initPromise: Promise<void> | null = null;

async function ensureInvoke() {
  if (invokeImpl) return invokeImpl;
  
  if (initPromise) {
    await initPromise;
    return invokeImpl;
  }
  
  initPromise = (async () => {
    // Give Tauri time to inject __TAURI__ global
    for (let i = 0; i < 100; i++) {
      if ((window as any).__TAURI__?.core?.invoke) {
        invokeImpl = (window as any).__TAURI__.core.invoke;
        console.log("✓ Invoke ready from window.__TAURI__.core");
        return;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    
    // If window.__TAURI__ isn't available, try the npm module
    try {
      const mod = await import("@tauri-apps/api/core");
      invokeImpl = mod.invoke;
      console.log("✓ Invoke ready from @tauri-apps/api/core");
      return;
    } catch (e) {
      console.error("Failed to load invoke:", e);
      throw new Error("Could not initialize Tauri invoke - are you running in a Tauri context?");
    }
  })();
  
  await initPromise;
  return invokeImpl;
}

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
 * Uses Rust backend to make HTTP request (avoids CORS)
 */
export async function checkTallyConnection(
  settings?: Partial<TallyConnectionSettings>
): Promise<TallySendResult> {
  try {
    const host = settings?.host || "localhost";
    const port = Number(settings?.port || 9000);

    const invoke = await ensureInvoke();
    console.log("Calling Tauri command: check_tally_connection with host=" + host + ", port=" + port);
    
    const result: any = await invoke("check_tally_connection", {
      host,
      port,
    });

    console.log("Tally check result:", result);
    return {
      success: result.success,
      status: result.status,
      responseText: result.response_text || `HTTP ${result.status}`,
      error: result.error,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("checkTallyConnection error:", err);
    return {
      success: false,
      responseText: "No response",
      error: `Connection failed: ${errorMsg}`,
    };
  }
}

/**
 * Send XML to Tally
 * Uses Rust backend to make HTTP POST request (avoids CORS)
 */
export async function sendXmlToTally(
  xml: string,
  settings?: Partial<TallyConnectionSettings>
): Promise<TallySendResult> {
  try {
    const host = settings?.host || "localhost";
    const port = Number(settings?.port || 9000);

    const invoke = await ensureInvoke();
    console.log("Calling Tauri command: send_xml_to_tally with host=" + host + ", port=" + port);
    
    const result: any = await invoke("send_xml_to_tally", {
      xml,
      host,
      port,
    });

    console.log("Tally send result:", result);
    return {
      success: result.success,
      status: result.status,
      responseText: result.response_text,
      error: result.error,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("sendXmlToTally error:", err);
    return {
      success: false,
      responseText: "No response",
      error: `Send failed: ${errorMsg}`,
    };
  }
}
