package cn.toside.music.mobile.mediainteraction;

import android.net.Uri;
import android.util.Log;

import com.ecarx.xui.adaptapi.diminteraction.DimInteraction;
import com.ecarx.xui.adaptapi.diminteraction.IMediaInteraction;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class MediaInteractionModule extends ReactContextBaseJavaModule {
    private static final String TAG = "MediaInteraction";
    private DimInteraction mDimInteraction;
    private IMediaInteraction mMediaInteraction;
    private String currentTitle = "";
    private String currentArtist = "";
    private String currentAlbum = "";
    private Uri currentArtwork = null;
    private long currentDuration = 0;
    private long currentPosition = 0;
    private boolean isPlaying = false;
    private int sourceType = IMediaInteraction.SOURCE_TYPE_ONLINE;

    public MediaInteractionModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "MediaInteraction";
    }

    @ReactMethod
    public void initialize(Promise promise) {
        try {
            mDimInteraction = DimInteraction.create(getReactApplicationContext());
            if (mDimInteraction != null) {
                mMediaInteraction = mDimInteraction.getMediaInteraction();
                if (mMediaInteraction != null) {
                    Log.d(TAG, "MediaInteraction initialized successfully");
                    promise.resolve(true);
                } else {
                    Log.w(TAG, "MediaInteraction is null");
                    promise.resolve(false);
                }
            } else {
                Log.w(TAG, "DimInteraction is null");
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize MediaInteraction", e);
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void updateMediaInfo(String title, String artist, String album, String artworkPath, double duration, boolean playing, int sourceType, Promise promise) {
        Log.d(TAG, "updateMediaInfo: title=" + title + ", artist=" + artist + ", artworkPath=" + artworkPath + ", playing=" + playing);
        try {
            this.currentTitle = title != null ? title : "";
            this.currentArtist = artist != null ? artist : "";
            this.currentAlbum = album != null ? album : "";
            this.currentArtwork = artworkPath != null && !artworkPath.isEmpty() ? Uri.parse(artworkPath) : null;
            Log.d(TAG, "Parsed artwork URI: " + this.currentArtwork);
            this.currentDuration = (long) duration;
            this.isPlaying = playing;
            this.sourceType = sourceType;

            if (mMediaInteraction != null) {
                mMediaInteraction.updatePlaybackInfo(new IMediaInteraction.IPlaybackInfo() {
                    @Override
                    public String getAlbum() { return currentAlbum; }

                    @Override
                    public String getArtist() { return currentArtist; }

                    @Override
                    public Uri getArtwork() { return currentArtwork; }

                    @Override
                    public String getCurrentLyricSentence() { return ""; }

                    @Override
                    public long getDuration() { return currentDuration; }

                    @Override
                    public int getFavoriteState() { return 0; }

                    @Override
                    public int getLoopMode() { return LOOP_MODE_ALL; }

                    @Override
                    public Uri getLyric() { return null; }

                    @Override
                    public String getLyricContent() { return ""; }

                    @Override
                    public Uri getMediaPath() { return null; }

                    @Override
                    public Uri getNextArtwork() { return null; }

                    @Override
                    public int getPlaybackStatus() {
                        return isPlaying ? PLAYBACK_STATUS_PLAYING : PLAYBACK_STATUS_PAUSED;
                    }

                    @Override
                    public int getPlayingItemPositionInQueue() { return 0; }

                    @Override
                    public Uri getPreviousArtwork() { return null; }

                    @Override
                    public String getRadioFrequency() { return ""; }

                    @Override
                    public int getRadioMode() { return RADIO_MODE_PLAYING; }

                    @Override
                    public String getRadioStationName() { return ""; }

                    @Override
                    public int getSourceType() { return sourceType; }

                    @Override
                    public String getTitle() { return currentTitle; }

                    @Override
                    public String getUUID() { return ""; }
                });
                Log.d(TAG, "Media info updated: " + title);
                promise.resolve(true);
            } else {
                Log.w(TAG, "MediaInteraction not initialized");
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to update media info", e);
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void updateProgress(double position, Promise promise) {
        try {
            this.currentPosition = (long) position;
            if (mMediaInteraction != null) {
                mMediaInteraction.updateCurrentProgress(currentPosition);
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to update progress", e);
            promise.reject("PROGRESS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void release(Promise promise) {
        try {
            if (mDimInteraction != null) {
                mDimInteraction = null;
                mMediaInteraction = null;
                Log.d(TAG, "MediaInteraction released");
            }
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Failed to release MediaInteraction", e);
            promise.reject("RELEASE_ERROR", e.getMessage());
        }
    }
}
