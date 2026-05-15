use keyring::Entry;

const SERVICE: &str = "com.mecomic.dev";
const SESSION_KEY: &str = "hn_session";
const USERNAME_KEY: &str = "hn_username";

pub fn save_session(cookie: &str) -> Result<(), String> {
    Entry::new(SERVICE, SESSION_KEY)
        .map_err(|e| e.to_string())?
        .set_password(cookie)
        .map_err(|e| e.to_string())
}

pub fn load_session() -> Option<String> {
    Entry::new(SERVICE, SESSION_KEY).ok()?.get_password().ok()
}

pub fn clear_session() {
    if let Ok(e) = Entry::new(SERVICE, SESSION_KEY) {
        let _ = e.delete_credential();
    }
}

pub fn save_username(username: &str) -> Result<(), String> {
    Entry::new(SERVICE, USERNAME_KEY)
        .map_err(|e| e.to_string())?
        .set_password(username)
        .map_err(|e| e.to_string())
}

pub fn load_username() -> Option<String> {
    Entry::new(SERVICE, USERNAME_KEY).ok()?.get_password().ok()
}

pub fn clear_username() {
    if let Ok(e) = Entry::new(SERVICE, USERNAME_KEY) {
        let _ = e.delete_credential();
    }
}
