package com.geely.lib.oneosapi;

import android.content.Context;

import com.geely.lib.oneosapi.linkmanager.LinkManager;
import com.geely.lib.oneosapi.listener.ServiceConnectionListener;

public class OneOSApiManager implements ServiceConnectionListener {
//    private static final String TAG = "OneOSApiManager";
//    private static volatile OneOSApiManager sInstance;
//    private AppStoreManager mAppStoreManager;
//    private volatile CameraManager mCameraManager;
//    private final Context mContext;
//    private ControlBoardManager mControlBoardManager;
//    private DeviceManager mDeviceManager;
//    private DockBarManager mDockBarManager;
//    private GestureManager mGestureManager;
//    private KeyInputManager mKeyInputManager;
//    private LauncherManager mLauncherManager;
//    private LinkManager mLinkManager;
//    private volatile MediaCenterManager mMediaCenterManager;
//    private MqttManager mMqttManager;
//    private volatile NaviManager mNaviManager;
//    private volatile OtaManager mOtaManager;
//    private PaymentManager mPaymentManager;
//    private PhoneManager mPhoneManager;
//    private RecommendationManager mRecommendationManager;
//    private SceneModeManager mSceneModeManager;
//    private ScheduleManager mScheduleManager;
//    private final ServiceConnectionManager mServiceConnectionManager;
//    private ShortcutManager mShortcutManager;
//    private SmartHomeManager mSmartHomeManager;
//    private StatusBarPublicManager mStatusBarPublicManager;
//    private ThemeManager mThemeManager;
//    private UserManager mUserManager;
//    private VimsManager mVimsManager;
//    private volatile VrManager mVrManager;
//    private WeatherManager mWeatherManager;
//    private WeChatManager mWechatManager;

    public static OneOSApiManager getInstance(Context context) {
        return new OneOSApiManager();
    }

//    public void init() {
//    }
//
//    public void init(ApiConnectCallBack callBack) {
//    }
//
//    public void release() {
//    }
//
//    public void registerServiceConnectionListener(ServiceConnectionListener listener) {
//    }
//
//    public void unregisterServiceConnectionListener(ServiceConnectionListener listener) {
//    }
//
//    private OneOSApiManager(Context context) {
//    }
//
//    public DeviceManager getDeviceManager() {
//        return null;
//    }
//
//    public NaviManager getNaviManager() {
//        return null;
//    }
//
//    public GestureManager getGestureManager() {
//        return null;
//    }
//
//    public VrManager getVrManager() {
//        return null;
//    }
//
//    public OtaManager getOtaManager() {
//        return null;
//    }
//
//    public MediaCenterManager getMediaCenterManager() {
//        return null;
//    }
//
//    public WeatherManager getWeatherManager() {
//        return null;
//    }
//
//    public ControlBoardManager getControlBoardManager() {
//        return null;
//    }
//
//    public SceneModeManager getSceneModeManager() {
//        return null;
//    }
//
//    public StatusBarPublicManager getStatusBarPublicManager() {
//        return null;
//    }
//
//    public PhoneManager getPhoneManager() {
//        return null;
//    }
//
//    public VimsManager getVimsManager() {
//        return null;
//    }
//
//    public ScheduleManager getScheduleManager() {
//        return null;
//    }
//
//    public UserManager getUserManager() {
//        return null;
//    }
//
//    public KeyInputManager getKeyInputManager() {
//        return null;
//    }
//
//    public RecommendationManager getRecommendationManager() {
//        return null;
//    }
//
//    public SmartHomeManager getSmartHomeManager() {
//        return null;
//    }
//
//    public CameraManager getCameraManager() {
//        return null;
//    }

    public LinkManager getLinkManager() {
        return null;
    }

//    public ThemeManager getThemeManager() {
//        return null;
//    }
//
//    public ShortcutManager getShortcutManager() {
//        return null;
//    }
//
//    public DockBarManager getDockBarManager() {
//        return null;
//    }
//
//    public LauncherManager getLauncherManager() {
//        return null;
//    }
//
//    public PaymentManager getPaymentManager() {
//        return null;
//    }
//
//    public WeChatManager getWechatManager() {
//        return null;
//    }
//
//    public AppStoreManager getAppStoreManager() {
//        return null;
//    }
//
//    private void updateServiceBinder(ServiceBaseManager manager, int serviceType) {
//    }

    @Override // com.geely.lib.oneosapi.listener.ServiceConnectionListener
    public void onServiceConnectionChanged(boolean connectionState) {
    }

    @Override // com.geely.lib.oneosapi.listener.ServiceConnectionListener
    public void onServiceBinderUpdated(int binderType) {
    }

//    public boolean addService(int type, IBinder binder) {
//        return false;
//    }
}