# ProGuard rules for KEC BusConnect Android App
-keepattributes Signature, InnerClasses, AnnotationDefault, *Annotation*

# Retrofit
-keepclassmembers,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn retrofit2.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# Gson
-keepattributes EnclosedMethod
-keep class com.google.gson.reflect.TypeToken
-keep class * extends com.google.gson.reflect.TypeToken
-keep public class * implements com.google.gson.TypeAdapterFactory
-keep public class * implements com.google.gson.JsonSerializer
-keep public class * implements com.google.gson.JsonDeserializer
-keep public class * implements com.google.gson.InstanceCreator
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# KEC BusConnect Data Models
# Keep all data classes in the model package to ensure GSON can serialize/deserialize them
-keep class com.kec.busconnect.data.model.** { *; }

# Google Play Services Location & Maps
-keep class com.google.android.gms.location.** { *; }
-keep class com.google.android.gms.maps.** { *; }
-dontwarn com.google.android.gms.**
