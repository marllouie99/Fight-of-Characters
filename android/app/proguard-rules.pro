# Add project specific ProGuard rules here.
# Keep Capacitor and Android Javascript Interfaces intact during R8 code shrinking
-keepattributes JavascriptInterface
-keepattributes *Annotation*

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.fightofcharacters.app.MainActivity$* { *; }
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
