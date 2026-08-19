package com.feiyu.music;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * 原生 WebDAV 请求插件。
 * 使用 OkHttp 直接发请求，支持 PROPFIND 等 WebDAV 方法（Android 的 HttpURLConnection
 * 会拒绝这些非标准方法），同时绕过 WebView 的 CORS 限制。
 */
@CapacitorPlugin(name = "WebDav")
public class WebDavPlugin extends Plugin {

    private static final MediaType XML = MediaType.get("application/xml; charset=utf-8");

    private OkHttpClient client;

    @Override
    public void load() {
        super.load();
        client =
            new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(300, TimeUnit.SECONDS)
                .build();
    }

    @PluginMethod
    public void request(final PluginCall call) {
        new Thread(
                () -> {
                    try {
                        String url = call.getString("url", "");
                        String method = call.getString("method", "GET").toUpperCase();
                        String body = call.getString("body", null);
                        boolean binary = Boolean.TRUE.equals(call.getBoolean("binary", false));
                        JSObject headers = call.getObject("headers");

                        Request.Builder builder = new Request.Builder().url(url);
                        if (body != null && !body.isEmpty()) {
                            builder.method(method, RequestBody.create(body, XML));
                        } else {
                            builder.method(method, null);
                        }

                        if (headers != null) {
                            Iterator<String> keys = headers.keys();
                            while (keys.hasNext()) {
                                String k = keys.next();
                                builder.header(k, headers.getString(k));
                            }
                        }

                        try (Response response = client.newCall(builder.build()).execute()) {
                            int status = response.code();
                            String data;
                            if (binary) {
                                byte[] bytes = response.body() != null ? response.body().bytes() : new byte[0];
                                data = Base64.encodeToString(bytes, Base64.NO_WRAP);
                            } else {
                                data = response.body() != null ? response.body().string() : "";
                            }

                            JSObject ret = new JSObject();
                            ret.put("status", status);
                            ret.put("data", data);
                            call.resolve(ret);
                        }
                    } catch (Exception e) {
                        String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                        call.reject(msg, e);
                    }
                })
            .start();
    }
}
