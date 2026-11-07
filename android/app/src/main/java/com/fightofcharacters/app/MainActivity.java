package com.fightofcharacters.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen awake during initial boot & match startup
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        applyImmersiveGameMode();

        // Optimize Capacitor WebView for 60 FPS Canvas 2D / WebGL combat rendering
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            WebSettings settings = webView.getSettings();
            if (settings != null) {
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            }

            // Expose native screen control bridge for dynamic Keep-Awake & Screen Pinning
            webView.addJavascriptInterface(new ScreenControlBridge(), "NativeScreenControl");
        }
    }

    public class ScreenControlBridge {
        @JavascriptInterface
        public void setKeepScreenAwake(final boolean awake) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (awake) {
                            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        } else {
                            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        }
                    } catch (Exception e) {}
                }
            });
        }

        @JavascriptInterface
        public void startScreenPinning() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        startLockTask();
                    } catch (Exception e) {}
                }
            });
        }

        @JavascriptInterface
        public void stopScreenPinning() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        stopLockTask();
                    } catch (Exception e) {}
                }
            });
        }

        @JavascriptInterface
        public boolean isScreenPinningSupported() {
            return true;
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveGameMode();
        }
    }

    private void applyImmersiveGameMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
}
