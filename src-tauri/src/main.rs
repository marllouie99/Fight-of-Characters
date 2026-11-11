#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use tao::{
    dpi::{LogicalPosition, LogicalSize, PhysicalPosition},
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder, EventLoopProxy},
    window::{Fullscreen, WindowBuilder},
};
use wry::{WebContext, WebViewBuilder};

#[cfg(target_os = "windows")]
use wry::WebViewBuilderExtWindows;

#[derive(Debug, Clone)]
enum UserEvent {
    SetOrientation(String),
    SetSize {
        width: u32,
        height: u32,
        center: bool,
    },
    DragWindow {
        dx: i32,
        dy: i32,
    },
    ToggleF10Fit,
    ToggleFullscreen,
}

#[derive(Debug, Deserialize)]
struct IpcRequest {
    cmd: String,
    #[serde(default)]
    payload: Value,
}

#[derive(Debug, Serialize)]
struct AppState {
    orientation: String,
}

fn resolve_workspace_root() -> PathBuf {
    if let Ok(exe_path) = env::current_exe() {
        let mut cur = exe_path.parent().map(|p| p.to_path_buf());
        while let Some(dir) = cur {
            if dir.join("index.html").exists() && dir.join("js").exists() {
                return dir;
            }
            cur = dir.parent().map(|p| p.to_path_buf());
        }
    }
    if let Ok(cwd) = env::current_dir() {
        if cwd.join("index.html").exists() {
            return cwd;
        }
        if let Some(parent) = cwd.parent() {
            if parent.join("index.html").exists() {
                return parent.to_path_buf();
            }
        }
    }
    PathBuf::from(".")
}

fn get_downloads_dir() -> PathBuf {
    if let Ok(profile) = env::var("USERPROFILE") {
        let dl = PathBuf::from(&profile).join("Downloads");
        if dl.exists() {
            return dl;
        }
        return PathBuf::from(profile);
    }
    env::temp_dir()
}

fn get_appdata_dir() -> PathBuf {
    if let Ok(appdata) = env::var("APPDATA") {
        return PathBuf::from(appdata).join("circle-mini-battle-rust-userdata");
    }
    env::temp_dir().join("circle-mini-battle-rust-userdata")
}

fn sanitize_safe_filename(file_name: Option<&str>, default_ext: &str) -> String {
    let raw = match file_name {
        Some(s) if !s.trim().is_empty() => s,
        _ => return format!("export_{}{}", timestamp_ms(), default_ext),
    };
    let base_name = Path::new(raw)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");
    let sanitized: String = base_name
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' || c == '.' || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect();
    if sanitized.is_empty() || sanitized == "." || sanitized == ".." {
        format!("export_{}{}", timestamp_ms(), default_ext)
    } else {
        sanitized
    }
}

fn timestamp_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

fn is_path_inside(child: &Path, parent: &Path) -> bool {
    let parent_canon = parent.canonicalize().unwrap_or_else(|_| parent.to_path_buf());
    let child_canon = if child.exists() {
        child.canonicalize().unwrap_or_else(|_| child.to_path_buf())
    } else if let Some(p) = child.parent() {
        let p_canon = p.canonicalize().unwrap_or_else(|_| p.to_path_buf());
        if let Some(name) = child.file_name() {
            p_canon.join(name)
        } else {
            child.to_path_buf()
        }
    } else {
        child.to_path_buf()
    };
    child_canon.starts_with(&parent_canon)
}

fn scan_and_sync_bgm_folder(root: &Path) -> Vec<String> {
    let bgm_dir = root.join("Assets").join("Sound Effects").join("ARENA-BGMUSIC");
    if !bgm_dir.exists() {
        let _ = fs::create_dir_all(&bgm_dir);
    }
    let mut audio_files = Vec::new();
    if let Ok(entries) = fs::read_dir(&bgm_dir) {
        for entry in entries.flatten() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            let lower = file_name.to_lowercase();
            if lower.ends_with(".mp3")
                || lower.ends_with(".wav")
                || lower.ends_with(".ogg")
                || lower.ends_with(".m4a")
            {
                audio_files.push(file_name);
            }
        }
    }
    audio_files.sort();
    let manifest_path = bgm_dir.join("manifest.json");
    if let Ok(json_str) = serde_json::to_string_pretty(&audio_files) {
        let _ = fs::write(manifest_path, json_str);
    }
    audio_files
}

fn open_in_explorer(path: &Path, select_item: bool) {
    #[cfg(target_os = "windows")]
    {
        if select_item {
            let _ = Command::new("explorer.exe")
                .arg(format!("/select,{}", path.display()))
                .spawn();
        } else {
            let _ = Command::new("explorer.exe").arg(path).spawn();
        }
    }
}

fn strip_data_url_prefix(input: &str) -> &str {
    if let Some(idx) = input.find(";base64,") {
        &input[(idx + 8)..]
    } else {
        input
    }
}

fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let (Some(h), Some(l)) = (
                (bytes[i + 1] as char).to_digit(16),
                (bytes[i + 2] as char).to_digit(16),
            ) {
                out.push(((h * 16) + l) as u8);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).to_string()
}

fn guess_mime_type(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_lowercase())
        .as_deref()
    {
        Some("html") | Some("htm") => "text/html; charset=utf-8",
        Some("js") | Some("mjs") | Some("cjs") => "text/javascript; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("json") | Some("map") => "application/json; charset=utf-8",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        Some("mp3") => "audio/mpeg",
        Some("wav") => "audio/wav",
        Some("ogg") => "audio/ogg",
        Some("m4a") => "audio/mp4",
        Some("ttf") => "font/ttf",
        Some("otf") => "font/otf",
        Some("woff") => "font/woff",
        Some("woff2") => "font/woff2",
        Some("wasm") => "application/wasm",
        _ => "application/octet-stream",
    }
}

fn handle_ipc_command(
    req: IpcRequest,
    root: &Path,
    proxy: &EventLoopProxy<UserEvent>,
) -> Value {
    match req.cmd.as_str() {
        "scan-bgm-folder" => {
            let files = scan_and_sync_bgm_folder(root);
            json!(files)
        }
        "open-bgm-folder" => {
            let bgm_dir = root.join("Assets").join("Sound Effects").join("ARENA-BGMUSIC");
            let _ = fs::create_dir_all(&bgm_dir);
            open_in_explorer(&bgm_dir, false);
            json!(true)
        }
        "open-downloads-folder" => {
            let dl = get_downloads_dir();
            open_in_explorer(&dl, false);
            json!(true)
        }
        "open-assets-folder" => {
            let assets_dir = root.join("Assets").join("model");
            let _ = fs::create_dir_all(&assets_dir);
            open_in_explorer(&assets_dir, false);
            json!(true)
        }
        "show-item-in-folder" => {
            if let Some(full_path_str) = req.payload.as_str() {
                let target = PathBuf::from(full_path_str);
                let dl = get_downloads_dir();
                let assets = root.join("Assets");
                if is_path_inside(&target, &dl) || is_path_inside(&target, &assets) {
                    open_in_explorer(&target, true);
                    return json!(true);
                }
            }
            json!(false)
        }
        "save-image-file" => {
            let file_name = req.payload.get("fileName").and_then(|v| v.as_str());
            let base64_data = req
                .payload
                .get("base64Data")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let safe_name = sanitize_safe_filename(file_name, ".png");
            let dl = get_downloads_dir();
            let target_path = dl.join(&safe_name);
            if !is_path_inside(&target_path, &dl) {
                return json!({ "success": false, "error": "Target path is outside allowed downloads directory" });
            }
            let clean_b64 = strip_data_url_prefix(base64_data);
            match BASE64.decode(clean_b64) {
                Ok(bytes) => match fs::write(&target_path, bytes) {
                    Ok(_) => json!({ "success": true, "filePath": target_path.to_string_lossy() }),
                    Err(e) => json!({ "success": false, "error": e.to_string() }),
                },
                Err(e) => json!({ "success": false, "error": e.to_string() }),
            }
        }
        "save-to-assets-model" => {
            let file_name = req.payload.get("fileName").and_then(|v| v.as_str());
            let base64_data = req
                .payload
                .get("base64Data")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let assets_dir = root.join("Assets").join("model");
            let _ = fs::create_dir_all(&assets_dir);
            let safe_name = sanitize_safe_filename(file_name, ".png");
            let target_path = assets_dir.join(&safe_name);
            if !is_path_inside(&target_path, &assets_dir) {
                return json!({ "success": false, "error": "Invalid path traversal attempt in save-to-assets-model" });
            }
            let clean_b64 = strip_data_url_prefix(base64_data);
            match BASE64.decode(clean_b64) {
                Ok(bytes) => match fs::write(&target_path, bytes) {
                    Ok(_) => {
                        open_in_explorer(&target_path, true);
                        json!({ "success": true, "filePath": target_path.to_string_lossy() })
                    }
                    Err(e) => json!({ "success": false, "error": e.to_string() }),
                },
                Err(e) => json!({ "success": false, "error": e.to_string() }),
            }
        }
        "show-open-image-dialog" => {
            let file_opt = rfd::FileDialog::new()
                .set_title("Select Image File to Import")
                .add_filter(
                    "All Supported Images",
                    &["png", "jpg", "jpeg", "webp", "bmp", "gif"],
                )
                .add_filter("PNG Images (*.png)", &["png"])
                .add_filter("JPEG Images (*.jpg; *.jpeg)", &["jpg", "jpeg"])
                .add_filter("WebP Images (*.webp)", &["webp"])
                .pick_file();

            match file_opt {
                Some(file_path) => match fs::read(&file_path) {
                    Ok(bytes) => {
                        let ext = file_path
                            .extension()
                            .and_then(|e| e.to_str())
                            .unwrap_or("png")
                            .to_lowercase();
                        let mime = match ext.as_str() {
                            "jpg" | "jpeg" => "image/jpeg",
                            "webp" => "image/webp",
                            "gif" => "image/gif",
                            "bmp" => "image/bmp",
                            _ => "image/png",
                        };
                        let b64 = BASE64.encode(&bytes);
                        let data_url = format!("data:{};base64,{}", mime, b64);
                        let raw_name = file_path.file_name().and_then(|n| n.to_str());
                        let safe_name = sanitize_safe_filename(raw_name, &format!(".{}", ext));
                        json!({
                            "success": true,
                            "filePath": file_path.to_string_lossy(),
                            "fileName": safe_name,
                            "base64Data": data_url
                        })
                    }
                    Err(e) => json!({ "success": false, "error": e.to_string() }),
                },
                None => json!({ "canceled": true }),
            }
        }
        "show-save-image-dialog" => {
            let default_name = req.payload.get("defaultName").and_then(|v| v.as_str());
            let base64_data = req
                .payload
                .get("base64Data")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let safe_name = sanitize_safe_filename(default_name, ".png");
            let dl = get_downloads_dir();
            let file_opt = rfd::FileDialog::new()
                .set_title("Save Pixel Model PNG")
                .set_directory(&dl)
                .set_file_name(&safe_name)
                .add_filter("PNG Images (*.png)", &["png"])
                .save_file();

            match file_opt {
                Some(file_path) => {
                    let clean_b64 = strip_data_url_prefix(base64_data);
                    match BASE64.decode(clean_b64) {
                        Ok(bytes) => match fs::write(&file_path, bytes) {
                            Ok(_) => {
                                open_in_explorer(&file_path, true);
                                json!({ "success": true, "filePath": file_path.to_string_lossy() })
                            }
                            Err(e) => json!({ "success": false, "error": e.to_string() }),
                        },
                        Err(e) => json!({ "success": false, "error": e.to_string() }),
                    }
                }
                None => json!({ "canceled": true }),
            }
        }
        "save-skin-database" => {
            let code_content = req
                .payload
                .get("codeContent")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            if !code_content.contains("SKIN_CUSTOMIZATIONS_DATABASE") {
                return json!({
                    "success": false,
                    "error": "Invalid codeContent: Expected valid SKIN_CUSTOMIZATIONS_DATABASE module."
                });
            }
            let db_path = root
                .join("js")
                .join("configs")
                .join("skinCustomizationsDatabase.js");
            match fs::write(&db_path, code_content) {
                Ok(_) => json!({ "success": true, "filePath": db_path.to_string_lossy() }),
                Err(e) => json!({ "success": false, "error": e.to_string() }),
            }
        }
        "save-weapon-database" => {
            let code_content = req
                .payload
                .get("codeContent")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            if !code_content.contains("WEAPON_CUSTOMIZATIONS_DATABASE") {
                return json!({
                    "success": false,
                    "error": "Invalid codeContent: Expected valid WEAPON_CUSTOMIZATIONS_DATABASE module."
                });
            }
            let db_path = root
                .join("js")
                .join("configs")
                .join("weaponCustomizationsDatabase.js");
            match fs::write(&db_path, code_content) {
                Ok(_) => json!({ "success": true, "filePath": db_path.to_string_lossy() }),
                Err(e) => json!({ "success": false, "error": e.to_string() }),
            }
        }
        "set-window-orientation" => {
            let orientation = req
                .payload
                .as_str()
                .unwrap_or("vertical")
                .to_string();
            let _ = proxy.send_event(UserEvent::SetOrientation(orientation));
            json!(true)
        }
        "set-window-size" => {
            let width = req
                .payload
                .get("width")
                .and_then(|v| v.as_u64())
                .unwrap_or(540) as u32;
            let height = req
                .payload
                .get("height")
                .and_then(|v| v.as_u64())
                .unwrap_or(960) as u32;
            let center = req
                .payload
                .get("center")
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            let _ = proxy.send_event(UserEvent::SetSize {
                width,
                height,
                center,
            });
            json!(true)
        }
        "drag-window" => {
            let dx = req
                .payload
                .get("deltaX")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0)
                .round() as i32;
            let dy = req
                .payload
                .get("deltaY")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0)
                .round() as i32;
            let _ = proxy.send_event(UserEvent::DragWindow { dx, dy });
            json!(true)
        }
        "toggle-f10-fit" => {
            let _ = proxy.send_event(UserEvent::ToggleF10Fit);
            json!(true)
        }
        "toggle-fullscreen" => {
            let _ = proxy.send_event(UserEvent::ToggleFullscreen);
            json!(true)
        }
        _ => json!({ "success": false, "error": format!("Unknown command: {}", req.cmd) }),
    }
}

fn handle_http_request(
    mut request: tiny_http::Request,
    root: &Path,
    proxy: &EventLoopProxy<UserEvent>,
) {
    let raw_url = request.url().to_string();
    let path = raw_url.split('?').next().unwrap_or("/");

    if path == "/__ipc__" {
        let mut body_bytes = Vec::new();
        let _ = request.as_reader().read_to_end(&mut body_bytes);
        let ipc_req: Result<IpcRequest, _> = serde_json::from_slice(&body_bytes);
        let res_val = match ipc_req {
            Ok(req) => handle_ipc_command(req, root, proxy),
            Err(e) => json!({ "success": false, "error": e.to_string() }),
        };
        let body = serde_json::to_vec(&res_val).unwrap_or_else(|_| b"{}".to_vec());
        let mut resp = tiny_http::Response::from_data(body).with_status_code(200);
        if let Ok(h) = tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"application/json; charset=utf-8"[..]) {
            resp.add_header(h);
        }
        if let Ok(h) = tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
            resp.add_header(h);
        }
        let _ = request.respond(resp);
        return;
    }

    let clean_rel = path.trim_start_matches('/');
    let rel_path = if clean_rel.is_empty() {
        "index.html".to_string()
    } else {
        percent_decode(clean_rel)
    };

    let candidate = root.join(&rel_path);
    if !is_path_inside(&candidate, root) {
        let resp = tiny_http::Response::from_string("Forbidden").with_status_code(403);
        let _ = request.respond(resp);
        return;
    }

    let bytes = match fs::read(&candidate) {
        Ok(b) => b,
        Err(_) => {
            let resp = tiny_http::Response::from_string("Not Found").with_status_code(404);
            let _ = request.respond(resp);
            return;
        }
    };

    let mime = guess_mime_type(&candidate);
    let total_len = bytes.len();

    let range_header = request
        .headers()
        .iter()
        .find(|h| h.field.as_str().as_str().eq_ignore_ascii_case("range"))
        .map(|h| h.value.as_str().to_string());

    if let Some(range_str) = range_header {
        if let Some(byte_spec) = range_str.strip_prefix("bytes=") {
            let parts: Vec<&str> = byte_spec.split('-').collect();
            if !parts.is_empty() && total_len > 0 {
                let start = parts[0].parse::<usize>().unwrap_or(0);
                let end = if parts.len() > 1 && !parts[1].is_empty() {
                    parts[1].parse::<usize>().unwrap_or(total_len - 1)
                } else {
                    total_len - 1
                };
                if start < total_len {
                    let clamped_end = end.min(total_len - 1);
                    if start <= clamped_end {
                        let slice = bytes[start..=clamped_end].to_vec();
                        let content_range = format!("bytes {}-{}/{}", start, clamped_end, total_len);
                        let mut resp = tiny_http::Response::from_data(slice).with_status_code(206);
                        if let Ok(h) = tiny_http::Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()) {
                            resp.add_header(h);
                        }
                        if let Ok(h) = tiny_http::Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]) {
                            resp.add_header(h);
                        }
                        if let Ok(h) = tiny_http::Header::from_bytes(&b"Content-Range"[..], content_range.as_bytes()) {
                            resp.add_header(h);
                        }
                        if let Ok(h) = tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
                            resp.add_header(h);
                        }
                        let _ = request.respond(resp);
                        return;
                    }
                }
            }
        }
    }

    let mut resp = tiny_http::Response::from_data(bytes).with_status_code(200);
    if let Ok(h) = tiny_http::Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()) {
        resp.add_header(h);
    }
    if let Ok(h) = tiny_http::Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]) {
        resp.add_header(h);
    }
    if let Ok(h) = tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]) {
        resp.add_header(h);
    }
    let _ = request.respond(resp);
}

const PRELOAD_INIT_SCRIPT: &str = r#"
(function () {
  if (window.electronAPI) return;

  async function invokeRustIpc(cmd, payload) {
    try {
      const response = await fetch('/__ipc__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd, payload: payload === undefined ? null : payload })
      });
      return await response.json();
    } catch (err) {
      console.error('[Rust Shell IPC Error]', cmd, err);
      return { success: false, error: String(err) };
    }
  }

  window.__RUST_TAURI_RUNTIME__ = true;

  window.electronAPI = Object.freeze({
    scanBgmFolder: () => invokeRustIpc('scan-bgm-folder'),
    openBgmFolder: () => invokeRustIpc('open-bgm-folder'),
    showOpenImageDialog: () => invokeRustIpc('show-open-image-dialog'),
    saveImageFile: (data) => invokeRustIpc('save-image-file', data),
    showSaveImageDialog: (data) => invokeRustIpc('show-save-image-dialog', data),
    saveToAssetsModel: (data) => invokeRustIpc('save-to-assets-model', data),
    openDownloadsFolder: () => invokeRustIpc('open-downloads-folder'),
    openAssetsFolder: () => invokeRustIpc('open-assets-folder'),
    showItemInFolder: (p) => invokeRustIpc('show-item-in-folder', p),
    saveSkinDatabase: (data) => invokeRustIpc('save-skin-database', data),
    saveWeaponDatabase: (data) => invokeRustIpc('save-weapon-database', data),
    setWindowOrientation: (orientation) => invokeRustIpc('set-window-orientation', orientation),
    setWindowSize: (data) => invokeRustIpc('set-window-size', data),
    dragWindow: (deltaX, deltaY) => invokeRustIpc('drag-window', { deltaX, deltaY })
  });

  // Match Electron's native F10 (1X <-> Fit-to-Screen), F11/Alt+Enter (Fullscreen), and F5/Ctrl+R (Reload) shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F10') {
      e.preventDefault();
      invokeRustIpc('toggle-f10-fit');
      return;
    }
    if (e.key === 'F11' || (e.altKey && e.key === 'Enter')) {
      e.preventDefault();
      invokeRustIpc('toggle-fullscreen');
      return;
    }
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
      e.preventDefault();
      window.location.reload();
    }
  }, true);
})();
"#;

fn main() {
    let workspace_root = Arc::new(resolve_workspace_root());

    // Pre-sync BGM manifest on startup (matching electron-main.js createWindow)
    scan_and_sync_bgm_folder(&workspace_root);

    let app_state = Arc::new(Mutex::new(AppState {
        orientation: "vertical".to_string(),
    }));

    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    // Start lightweight loopback HTTP server on 127.0.0.1 (random available OS port)
    let server = Arc::new(
        tiny_http::Server::http("127.0.0.1:0")
            .expect("Failed to bind local loopback server on 127.0.0.1"),
    );
    let port = server.server_addr().to_ip().unwrap().port();

    let server_root = Arc::clone(&workspace_root);
    let server_proxy = proxy.clone();
    let server_handle = Arc::clone(&server);

    std::thread::spawn(move || {
        for req in server_handle.incoming_requests() {
            let root = Arc::clone(&server_root);
            let proxy = server_proxy.clone();
            handle_http_request(req, &root, &proxy);
        }
    });

    // Canonical Rule 28 Vertical Baseline: 540x960 frameless window
    let window = WindowBuilder::new()
        .with_title("Fight of Larpers 101")
        .with_inner_size(LogicalSize::new(540.0, 960.0))
        .with_min_inner_size(LogicalSize::new(320.0, 480.0))
        .with_resizable(true)
        .with_decorations(false)
        .build(&event_loop)
        .expect("Failed to create native window");

    // Center window on current monitor at launch
    center_window(&window);

    let mut web_context = WebContext::new(Some(get_appdata_dir()));

    // Configure WebView2 with the exact same OBS/DPI performance switches as Electron
    let browser_args = "--high-dpi-support=1 --force-device-scale-factor=1 --disable-renderer-backgrounding --disable-background-timer-throttling --disable-backgrounding-occluded-windows --autoplay-policy=no-user-gesture-required";

    let app_url = format!("http://127.0.0.1:{}/index.html", port);

    let webview = WebViewBuilder::with_web_context(&mut web_context)
        .with_background_color((0, 0, 0, 255))
        .with_devtools(true)
        .with_additional_browser_args(browser_args)
        .with_initialization_script(PRELOAD_INIT_SCRIPT)
        .with_url(&app_url)
        .build(&window)
        .expect("Failed to initialize WebView2");

    event_loop.run(move |event, _, control_flow| {
        let _keep_alive = &webview;
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            Event::UserEvent(user_event) => match user_event {
                UserEvent::SetOrientation(orientation) => {
                    let is_horizontal = orientation == "horizontal";
                    if let Ok(mut st) = app_state.lock() {
                        st.orientation = if is_horizontal {
                            "horizontal".to_string()
                        } else {
                            "vertical".to_string()
                        };
                    }
                    if window.fullscreen().is_none() {
                        let (w, h) = if is_horizontal {
                            (960.0, 540.0)
                        } else {
                            (540.0, 960.0)
                        };
                        window.set_inner_size(LogicalSize::new(w, h));
                        center_window(&window);
                    }
                }
                UserEvent::SetSize {
                    width,
                    height,
                    center,
                } => {
                    if window.fullscreen().is_none() {
                        window.set_inner_size(LogicalSize::new(width as f64, height as f64));
                        if center {
                            center_window(&window);
                        }
                    }
                }
                UserEvent::DragWindow { dx, dy } => {
                    if window.fullscreen().is_none() {
                        if let Ok(pos) = window.outer_position() {
                            window.set_outer_position(PhysicalPosition::new(pos.x + dx, pos.y + dy));
                        }
                    }
                }
                UserEvent::ToggleF10Fit => {
                    if window.fullscreen().is_some() {
                        window.set_fullscreen(None);
                    }
                    let is_horizontal = app_state
                        .lock()
                        .map(|s| s.orientation == "horizontal")
                        .unwrap_or(false);
                    let (base_w, base_h) = if is_horizontal {
                        (960.0, 540.0)
                    } else {
                        (540.0, 960.0)
                    };

                    let scale = window.scale_factor();
                    let cur_logical = window.inner_size().to_logical::<f64>(scale);
                    let is_near_base = (cur_logical.width - base_w).abs() < 20.0
                        && (cur_logical.height - base_h).abs() < 20.0;

                    if is_near_base {
                        let (mon_w, mon_h) = window
                            .current_monitor()
                            .map(|m| {
                                let l = m.size().to_logical::<f64>(m.scale_factor());
                                (l.width, l.height)
                            })
                            .unwrap_or((1920.0, 1080.0));
                        let max_scale_h = (mon_h - 60.0) / base_h;
                        let max_scale_w = (mon_w - 60.0) / base_w;
                        let fit_factor = max_scale_h.min(max_scale_w).max(0.5);
                        window.set_inner_size(LogicalSize::new(
                            (base_w * fit_factor).round(),
                            (base_h * fit_factor).round(),
                        ));
                    } else {
                        window.set_inner_size(LogicalSize::new(base_w, base_h));
                    }
                    center_window(&window);
                }
                UserEvent::ToggleFullscreen => {
                    if window.fullscreen().is_some() {
                        window.set_fullscreen(None);
                    } else {
                        window.set_fullscreen(Some(Fullscreen::Borderless(None)));
                    }
                }
            },
            _ => {}
        }
    });
}

fn center_window(window: &tao::window::Window) {
    if let Some(monitor) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let mon_pos = monitor.position().to_logical::<f64>(scale);
        let mon_size = monitor.size().to_logical::<f64>(scale);
        let win_size = window.outer_size().to_logical::<f64>(scale);
        let x = (mon_pos.x + (mon_size.width - win_size.width) / 2.0).max(mon_pos.x);
        let y = (mon_pos.y + (mon_size.height - win_size.height) / 2.0).max(mon_pos.y + 12.0);
        window.set_outer_position(LogicalPosition::new(x.round(), y.round()));
    }
}
