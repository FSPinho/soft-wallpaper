package com.cytech.grioty;

import android.app.Application;

import com.facebook.CallbackManager;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.react.ReactApplication;
import co.apptailor.googlesignin.RNGoogleSigninPackage;
import com.geektime.rnonesignalandroid.ReactNativeOneSignalPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.reactcommunity.rnlanguages.RNLanguagesPackage;
import com.facebook.reactnative.androidsdk.FBSDKPackage;
import com.cytech.grioty.BuildConfig;
import com.jamesisaac.rnbackgroundtask.BackgroundTaskPackage;
import com.oblador.vectoricons.VectorIconsPackage;

import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.auth.RNFirebaseAuthPackage;
import io.invertase.firebase.database.RNFirebaseDatabasePackage;

import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private static CallbackManager mCallbackManager = CallbackManager.Factory.create();

    protected static CallbackManager getCallbackManager() {
        return mCallbackManager;
    }

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                    new MainReactPackage(),
            new RNGoogleSigninPackage(),
            new ReactNativeOneSignalPackage(),
                    new LottiePackage(),
                    new RNLanguagesPackage(),
                    new FBSDKPackage(mCallbackManager),
                    new BackgroundTaskPackage(),
                    new VectorIconsPackage(),
                    new RNFirebasePackage(),
                    new RNFirebaseAuthPackage(),
                    new RNFirebaseDatabasePackage()
            );
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        AppEventsLogger.activateApp(this);

        SoLoader.init(this, /* native exopackage */ false);
        BackgroundTaskPackage.useContext(this);
    }
}
