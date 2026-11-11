use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");

    let target = env::var("TARGET").unwrap_or_default();
    if target.contains("windows") {
        let arch = if target.contains("x86_64") {
            "x64"
        } else if target.contains("aarch64") {
            "arm64"
        } else {
            "x86"
        };

        if let Ok(out_dir_str) = env::var("OUT_DIR") {
            let out_dir = PathBuf::from(out_dir_str);
            // OUT_DIR is target/{debug|release}/build/{pkg}/out
            // Target binary dir is target/{debug|release} (ancestor 3)
            if let Some(target_dir) = out_dir.ancestors().nth(3) {
                let build_dir = target_dir.join("build");
                if let Ok(entries) = fs::read_dir(&build_dir) {
                    for entry in entries.flatten() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        if name.starts_with("webview2-com-sys-") {
                            let candidate = entry.path().join("out").join(arch).join("WebView2Loader.dll");
                            if candidate.exists() {
                                let dest = target_dir.join("WebView2Loader.dll");
                                let _ = fs::copy(&candidate, &dest);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}
