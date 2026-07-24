package cn.toside.music.mobile.carkey;

/* loaded from: classes.dex */
public interface ServiceConnectionListener {
    void onServiceBinderUpdated(int binderType);

    void onServiceConnectionChanged(boolean connectionState);
}