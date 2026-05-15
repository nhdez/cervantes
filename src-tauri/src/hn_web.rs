use once_cell::sync::Lazy;
use reqwest::{Client, header};
use scraper::{Html, Selector};
use std::sync::Mutex;
use crate::keychain;

static CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .cookie_store(true)
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("HTTP client build failed")
});

static SESSION: Lazy<Mutex<Option<String>>> = Lazy::new(|| {
    Mutex::new(keychain::load_session())
});

fn get_session() -> Option<String> {
    SESSION.lock().unwrap().clone()
}

fn set_session(cookie: String) {
    *SESSION.lock().unwrap() = Some(cookie.clone());
    let _ = keychain::save_session(&cookie);
}

fn clear_session_state() {
    *SESSION.lock().unwrap() = None;
    keychain::clear_session();
    keychain::clear_username();
}

fn cookie_header(session: &str) -> String {
    format!("user={}", session)
}

#[tauri::command]
pub async fn hn_login(username: String, password: String) -> Result<(), String> {
    let resp = CLIENT
        .post("https://news.ycombinator.com/login")
        .form(&[("acct", username.as_str()), ("pw", password.as_str()), ("goto", "news")])
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let cookie_val = resp.cookies()
        .find(|c| c.name() == "user")
        .map(|c| c.value().to_string());

    match cookie_val {
        Some(val) => {
            set_session(val);
            let _ = keychain::save_username(&username);
            Ok(())
        }
        None => Err("Login failed — bad credentials or HN is unavailable.".to_string()),
    }
}

#[tauri::command]
pub async fn hn_logout() -> Result<(), String> {
    clear_session_state();
    Ok(())
}

#[tauri::command]
pub async fn hn_is_logged_in() -> bool {
    get_session().is_some()
}

#[tauri::command]
pub async fn hn_get_username() -> Option<String> {
    keychain::load_username()
}

#[tauri::command]
pub async fn hn_vote(item_id: u64, direction: String) -> Result<(), String> {
    let session = get_session().ok_or("Not logged in")?;
    if direction != "up" {
        return Err(format!("Direction '{}' is not yet supported", direction));
    }
    let item_url = format!("https://news.ycombinator.com/item?id={}", item_id);
    let html = CLIENT.get(&item_url)
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;

    let href = {
        let doc = Html::parse_document(&html);
        let sel_str = format!("a#up_{}", item_id);
        let sel = Selector::parse(&sel_str).map_err(|e| e.to_string())?;
        doc.select(&sel).next()
            .and_then(|el| el.value().attr("href"))
            .ok_or("Vote link not found — item may not be votable")?
            .to_string()
    };
    CLIENT.get(format!("https://news.ycombinator.com{}", href))
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn hn_comment(parent_id: u64, text: String) -> Result<(), String> {
    let session = get_session().ok_or("Not logged in")?;
    let item_url = format!("https://news.ycombinator.com/item?id={}", parent_id);
    let html = CLIENT.get(&item_url)
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;

    let (hmac, goto) = {
        let doc = Html::parse_document(&html);
        let hmac = doc.select(&Selector::parse("input[name='hmac']").unwrap()).next()
            .and_then(|el| el.value().attr("value"))
            .ok_or("hmac token not found")?.to_string();
        let goto = doc.select(&Selector::parse("input[name='goto']").unwrap()).next()
            .and_then(|el| el.value().attr("value"))
            .unwrap_or("news").to_string();
        (hmac, goto)
    };

    let resp = CLIENT.post("https://news.ycombinator.com/comment")
        .header(header::COOKIE, cookie_header(&session))
        .form(&[
            ("parent", parent_id.to_string()),
            ("goto", goto),
            ("text", text),
            ("hmac", hmac),
        ])
        .send().await.map_err(|e| e.to_string())?;

    if resp.status().is_success() || resp.status().is_redirection() {
        Ok(())
    } else {
        Err(format!("Comment failed: HTTP {}", resp.status()))
    }
}

#[tauri::command]
pub async fn hn_submit(title: String, url: Option<String>, text: Option<String>) -> Result<u64, String> {
    let session = get_session().ok_or("Not logged in")?;
    let submit_html = CLIENT.get("https://news.ycombinator.com/submit")
        .header(header::COOKIE, cookie_header(&session))
        .send().await.map_err(|e| e.to_string())?
        .text().await.map_err(|e| e.to_string())?;

    let (fnid, fnop) = {
        let doc = Html::parse_document(&submit_html);
        let fnid = doc.select(&Selector::parse("input[name='fnid']").unwrap()).next()
            .and_then(|el| el.value().attr("value"))
            .ok_or("fnid not found")?.to_string();
        let fnop = doc.select(&Selector::parse("input[name='fnop']").unwrap()).next()
            .and_then(|el| el.value().attr("value"))
            .unwrap_or("submit-page").to_string();
        (fnid, fnop)
    };

    let resp = CLIENT.post("https://news.ycombinator.com/r")
        .header(header::COOKIE, cookie_header(&session))
        .form(&[
            ("fnid", fnid),
            ("fnop", fnop),
            ("title", title),
            ("url", url.unwrap_or_default()),
            ("text", text.unwrap_or_default()),
        ])
        .send().await.map_err(|e| e.to_string())?;

    if let Some(loc) = resp.headers().get("location") {
        let loc_str = loc.to_str().unwrap_or("");
        if let Some(id_str) = loc_str.strip_prefix("/item?id=") {
            return id_str.parse::<u64>().map_err(|e| e.to_string());
        }
    }
    Err("Submission may have succeeded but item ID could not be extracted.".to_string())
}

#[tauri::command]
pub async fn hn_fetch_favorites(username: String) -> Result<Vec<u64>, String> {
    let session = get_session().ok_or("Not logged in")?;
    let url = format!("https://news.ycombinator.com/favorites?id={}", username);
    let html = CLIENT
        .get(&url)
        .header(header::COOKIE, cookie_header(&session))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let ids = {
        let doc = Html::parse_document(&html);
        let sel = Selector::parse("tr.athing[id]").map_err(|e| e.to_string())?;
        doc.select(&sel)
            .filter_map(|el| el.value().attr("id"))
            .filter_map(|id_str| id_str.parse::<u64>().ok())
            .collect::<Vec<u64>>()
    };

    Ok(ids)
}
