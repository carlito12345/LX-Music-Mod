package com.geely.lib.oneosapi.listener;

public interface ServiceConnectionListener {
    void onServiceBinderUpdated(int binderType);

    void onServiceConnectionChanged(boolean connectionState);
}
