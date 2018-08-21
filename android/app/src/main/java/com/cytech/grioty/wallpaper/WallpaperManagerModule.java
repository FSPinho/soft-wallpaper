package com.cytech.grioty.wallpaper;

import android.app.WallpaperManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Environment;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.io.IOException;

public class WallpaperManagerModule extends ReactContextBaseJavaModule {

    public WallpaperManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "WallpaperManager";
    }

    @ReactMethod
    public void setWallpaper(ReadableMap options, Promise promise) {

        String imagePath = options.getString("path");

        try {

            WallpaperManager wallpaperManager = WallpaperManager.getInstance(getReactApplicationContext());
            Bitmap imageBitmap = BitmapFactory.decodeFile(imagePath);
            wallpaperManager.setBitmap(imageBitmap);

        } catch (IOException e) {

            e.printStackTrace();
            promise.reject(e);

        }

        promise.resolve(true);

    }

}
