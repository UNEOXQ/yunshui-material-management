# 雲水基材管理系統 - ProGuard 配置
# 用於 Android Release 建置的程式碼混淆和優化

# 基本 ProGuard 規則
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# 保留註解
-keepattributes *Annotation*

# 保留行號資訊 (用於除錯)
-keepattributes SourceFile,LineNumberTable

# 保留泛型簽名
-keepattributes Signature

# 保留內部類別
-keepattributes InnerClasses,EnclosingMethod

# React Native 相關規則
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.flipper.** { *; }

# React Native Hermes 引擎
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jsc.** { *; }

# React Native 橋接
-keep class * extends com.facebook.react.bridge.ReactContextBaseJavaModule { *; }
-keep class * extends com.facebook.react.bridge.BaseJavaModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }
-keep class * extends com.facebook.react.uimanager.SimpleViewManager { *; }

# React Native 事件
-keep class * extends com.facebook.react.uimanager.events.Event { *; }

# React Native 套件
-keep class * implements com.facebook.react.bridge.ReactPackage { *; }

# JavaScript 介面
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 序列化相關
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Parcelable 實作
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# 保留 enum 類別
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# 保留 R 類別
-keep class **.R
-keep class **.R$* {
    <fields>;
}

# Android 支援庫
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# OkHttp (網路請求)
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Retrofit (如果使用)
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# Gson (JSON 解析)
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# 圖片載入庫 (Glide/Picasso)
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
    **[] $VALUES;
    public *;
}

# SQLite 資料庫
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }

# 加密相關
-keep class javax.crypto.** { *; }
-keep class java.security.** { *; }

# 反射相關
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# 自定義模型類別 (根據專案需求調整)
-keep class com.yunshui.mobile.models.** { *; }
-keep class com.yunshui.mobile.api.** { *; }
-keep class com.yunshui.mobile.services.** { *; }

# WebView 相關
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, jav.lang.String);
}

# 相機和媒體相關
-keep class android.media.** { *; }
-keep class android.hardware.camera2.** { *; }

# 推播通知
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# 第三方庫 (根據實際使用調整)

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# React Native Keychain
-keep class com.oblador.keychain.** { *; }

# React Native AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# React Native Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Paper
-keep class com.callstack.reactnativepaper.** { *; }

# 移除日誌 (Release 版本)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# 移除 React Native 開發工具
-assumenosideeffects class com.facebook.react.bridge.ReactContext {
    void logMessage(...);
}

# 優化設定
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification
-dontpreverify

# 不混淆的類別 (保持原始名稱)
-keep public class com.yunshui.mobile.MainActivity { *; }
-keep public class com.yunshui.mobile.MainApplication { *; }

# 保留 BuildConfig
-keep class com.yunshui.mobile.BuildConfig { *; }

# 保留 Application 類別
-keep public class * extends android.app.Application

# 保留 Activity 類別
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# 保留 Fragment 類別
-keep public class * extends androidx.fragment.app.Fragment
-keep public class * extends android.app.Fragment

# 警告忽略
-dontwarn java.nio.file.*
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
-dontwarn javax.annotation.**
-dontwarn kotlin.Unit
-dontwarn kotlin.coroutines.jvm.internal.DebugMetadata
-dontwarn kotlin.jvm.internal.DefaultConstructorMarker
-dontwarn kotlin.jvm.internal.Intrinsics