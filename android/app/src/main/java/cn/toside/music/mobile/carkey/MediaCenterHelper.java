package cn.toside.music.mobile.carkey;

import android.os.IBinder;
import android.os.Parcel;
import android.os.RemoteException;
import android.util.Log;

/**
 * MediaCenter 直接 IPC 调用(绕过 AIDL 编译)
 * 通过 OneOS service(3) 的 Binder 直接调用 requestAudioSource
 */
public class MediaCenterHelper {
  private static final String TAG = "[MediaCenter]";
  private static final String IFACE = "com.geely.lib.oneosapi.mediacenter.IMediaCenter";

  /** 请求车机切换到在线音乐音源 */
  public static boolean requestOnlineSource(OneOSApiManager api) {
    try {
      IBinder binder = api.getServiceManager().getService(3);
      if (binder == null) { Log.w(TAG, "service(3) null"); return false; }
      return requestAudioSource(binder, 4); // 4 = AUDIO_SOURCE_ONLINE
    } catch (RemoteException e) {
      Log.e(TAG, "requestOnlineSource: " + e.getMessage());
      return false;
    }
  }

  /** 释放在线音源,切回默认音源 */
  public static boolean abandonOnlineSource(OneOSApiManager api) {
    try {
      IBinder binder = api.getServiceManager().getService(3);
      if (binder == null) return false;
      return abandonAudioSource(binder, 4);
    } catch (RemoteException e) { return false; }
  }

  private static boolean requestAudioSource(IBinder binder, int source) {
    Parcel data = Parcel.obtain();
    Parcel reply = Parcel.obtain();
    try {
      data.writeInterfaceToken(IFACE);
      data.writeInt(source); // audioSource
      data.writeInt(0);      // requestType
      data.writeString("cn.toside.music.mobile"); // packageName
      boolean ok = binder.transact(57, data, reply, 0); // 57 = TRANSACTION_requestAudioSource
      reply.readException();
      boolean result = reply.readInt() != 0;
      Log.d(TAG, "requestOnlineSource(" + source + ") = " + result + " transact=" + ok);
      return result;
    } catch (RemoteException e) {
      Log.e(TAG, "requestAudioSource err: " + e.getMessage());
      return false;
    } finally { data.recycle(); reply.recycle(); }
  }

  private static boolean abandonAudioSource(IBinder binder, int source) {
    Parcel data = Parcel.obtain();
    Parcel reply = Parcel.obtain();
    try {
      data.writeInterfaceToken(IFACE);
      data.writeInt(source);
      boolean ok = binder.transact(58, data, reply, 0); // 58 = TRANSACTION_abandonAudioSource
      reply.readException();
      return ok;
    } catch (RemoteException e) { return false;
    } finally { data.recycle(); reply.recycle(); }
  }
}
