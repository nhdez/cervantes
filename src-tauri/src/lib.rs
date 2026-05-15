mod hn_web;
mod keychain;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "create_favorites_table",
        sql: "CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            url TEXT,
            by TEXT NOT NULL DEFAULT '',
            score INTEGER NOT NULL DEFAULT 0,
            descendants INTEGER NOT NULL DEFAULT 0,
            time INTEGER NOT NULL DEFAULT 0,
            note TEXT NOT NULL DEFAULT '',
            tags TEXT NOT NULL DEFAULT '[]',
            saved_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
        kind: tauri_plugin_sql::MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:cervantes.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            hn_web::hn_login,
            hn_web::hn_logout,
            hn_web::hn_is_logged_in,
            hn_web::hn_get_username,
            hn_web::hn_vote,
            hn_web::hn_comment,
            hn_web::hn_submit,
            hn_web::hn_fetch_favorites,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
