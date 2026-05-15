mod hn_web;
mod keychain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            hn_web::hn_login,
            hn_web::hn_logout,
            hn_web::hn_is_logged_in,
            hn_web::hn_get_username,
            hn_web::hn_vote,
            hn_web::hn_comment,
            hn_web::hn_submit,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
