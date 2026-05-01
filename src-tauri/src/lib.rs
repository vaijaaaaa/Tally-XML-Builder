use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Serialize, Deserialize)]
pub struct TallyResponse {
    pub success: bool,
    pub status: Option<u16>,
    pub response_text: String,
    pub error: Option<String>,
}

// Create a Tally HTTP client with a 10-second timeout
fn create_tally_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}

#[tauri::command]
async fn check_tally_connection(
    host: Option<String>,
    port: Option<u16>,
) -> Result<TallyResponse, String> {
    let host = host.unwrap_or_else(|| "localhost".to_string());
    let port = port.unwrap_or(9000);
    let url = format!("http://{}:{}", host, port);

    match create_tally_client().get(&url).send().await {
        Ok(response) => {
            let success = response.status().is_success();
            let status = response.status().as_u16();
            
            match response.text().await {
                Ok(text) => {
                    eprintln!("--- TALLY CONNECTION CHECK (HTTP {}) ---", status);
                    eprintln!("{}", text);
                    eprintln!("--- END CONNECTION CHECK ---");

                    Ok(TallyResponse {
                        success,
                        status: Some(status),
                        response_text: text,
                        error: None,
                    })
                }
                Err(e) => {
                    eprintln!("Failed to read Tally connection response: {}", e);
                    Ok(TallyResponse {
                        success: false,
                        status: Some(status),
                        response_text: "Failed to read response".to_string(),
                        error: Some(format!("Read error: {}", e)),
                    })
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to connect to Tally: {}", e);
            Ok(TallyResponse {
                success: false,
                status: None,
                response_text: "No response".to_string(),
                error: Some(format!("Connection failed: {}", e)),
            })
        }
    }
}

#[tauri::command]
async fn send_xml_to_tally(
    xml: String,
    host: Option<String>,
    port: Option<u16>,
) -> Result<TallyResponse, String> {
    let host = host.unwrap_or_else(|| "localhost".to_string());
    let port = port.unwrap_or(9000);
    let url = format!("http://{}:{}", host, port);

    match create_tally_client()
        .post(&url)
        .header("Content-Type", "text/xml")
        .body(xml)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status().as_u16();
            let success_status = response.status().is_success();
            
            match response.text().await {
                Ok(text) => {
                    let success = success_status
                        && !text.contains("<LINEERROR")
                        && !text.contains("<ERRORS>1</ERRORS>")
                        && !text.contains("<EXCEPTIONS>1</EXCEPTIONS>");

                    // Log complete response
                    eprintln!("--- TALLY RESPONSE (HTTP {}) ---", status);
                    eprintln!("{}", text);
                    eprintln!("--- END RESPONSE ---");

                    Ok(TallyResponse {
                        success,
                        status: Some(status),
                        response_text: text,
                        error: None,
                    })
                }
                Err(e) => {
                    eprintln!("Failed to read Tally response: {}", e);
                    Ok(TallyResponse {
                        success: false,
                        status: Some(status),
                        response_text: "Failed to read response".to_string(),
                        error: Some(format!("Read error: {}", e)),
                    })
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to send XML to Tally: {}", e);
            Ok(TallyResponse {
                success: false,
                status: None,
                response_text: "No response".to_string(),
                error: Some(format!("Send failed: {}", e)),
            })
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_tally_connection,
            send_xml_to_tally
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
