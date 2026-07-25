package cn.toside.music.mobile.mediainteraction;

import android.content.Context;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import com.ecarx.xui.adaptapi.diminteraction.DimInteraction;
import com.ecarx.xui.adaptapi.diminteraction.IMediaInteraction;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.File;
import java.io.FileOutputStream;
import java.util.List;

public class MediaInteractionModule extends ReactContextBaseJavaModule {
    private static final String TAG = "MediaInteraction";
    private DimInteraction mDimInteraction;
    private IMediaInteraction mMediaInteraction;
    private MediaSessionManager mMediaSessionManager;
    private android.content.ComponentName mComponentName;
    private String currentTitle = "";
    private String currentArtist = "";
    private String currentAlbum = "";
    private Uri currentArtwork = null;
    private long currentDuration = 0;
    private long currentPosition = 0;
    private boolean isPlaying = false;
    private int sourceType = IMediaInteraction.SOURCE_TYPE_ONLINE;
    private File artworkCacheDir;

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
            Context context = getReactApplicationContext();
            
            // 创建封面缓存目录
            artworkCacheDir = new File(context.getCacheDir(), "artwork");
            if (!artworkCacheDir.exists()) {
                artworkCacheDir.mkdirs();
            }

            // 初始化 DimInteraction
            mDimInteraction = DimInteraction.create(context);
            if (mDimInteraction != null) {
                mMediaInteraction = mDimInteraction.getMediaInteraction();
                if (mMediaInteraction != null) {
                    Log.d(TAG, "MediaInteraction initialized successfully");
                    
                    // 初始化 MediaSessionManager
                    initMediaSessionManager();
                    
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

    private void initMediaSessionManager() {
        try {
            Context context = getReactApplicationContext();
            mMediaSessionManager = (MediaSessionManager) context.getSystemService(Context.MEDIA_SESSION_SERVICE);
            mComponentName = new android.content.ComponentName(context, MediaInteractionNotificationService.class);
            Log.d(TAG, "MediaSessionManager initialized");
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize MediaSessionManager", e);
        }
    }

    @ReactMethod
    public void updateMediaInfo(String title, String artist, String album, String artworkPath, double duration, boolean playing, int sourceType, Promise promise) {
        try {
            this.currentTitle = title != null ? title : "";
            this.currentArtist = artist != null ? artist : "";
            this.currentAlbum = album != null ? album : "";
            this.currentDuration = (long) duration;
            this.isPlaying = playing;
            this.sourceType = sourceType;

            // 处理封面路径:如果是网络URL,下载到本地
            this.currentArtwork = null;
            if (artworkPath != null && !artworkPath.isEmpty()) {
                if (artworkPath.startsWith("http://") || artworkPath.startsWith("https://")) {
                    this.currentArtwork = downloadArtwork(artworkPath);
                } else {
                    this.currentArtwork = Uri.parse(artworkPath);
                }
            }

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

    private Uri downloadArtwork(String url) {
        try {
            // 使用简单的 HTTP 下载
            java.net.URL imageUrl = new java.net.URL(url);
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) imageUrl.openConnection();
            connection.setDoInput(true);
            connection.connect();
            java.io.InputStream input = connection.getInputStream();
            android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeStream(input);
            input.close();
            connection.disconnect();

            if (bitmap != null) {
                // 保存到本地文件
                String filename = "artwork_" + System.currentTimeMillis() + ".jpg";
                java.io.File artworkFile = new java.io.File(artworkCacheDir, filename);
                java.io.FileOutputStream fos = new java.io.FileOutputStream(artworkFile);
                bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, fos);
                fos.close();
                
                Uri artworkUri = Uri.fromFile(artworkFile);
                Log.d(TAG, "Artwork downloaded: " + artworkUri);
                return artworkUri;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to download artwork", e);
        }
        return null;
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

    // 从 MediaSession 提取封面并保存到本地文件
    private Uri extractAndSaveArtwork(MediaMetadata metadata, String trackId) {
        try {
            // 尝试获取封面 Bitmap
            Bitmap artBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
            if (artBitmap == null) {
                artBitmap = metadata.getBitmap(MediaMetadata.METADATA_KEY_ART);
            }
            
            if (artBitmap == null) {
                Log.d(TAG, "No artwork bitmap found");
                return null;
            }

            // 保存到本地文件
            File artworkFile = new File(artworkCacheDir, trackId + ".jpg");
            FileOutputStream fos = new FileOutputStream(artworkFile);
            artBitmap.compress(Bitmap.CompressFormat.JPEG, 90, fos);
            fos.close();
            
            Uri artworkUri = Uri.fromFile(artworkFile);
            Log.d(TAG, "Artwork saved: " + artworkUri);
            return artworkUri;
        } catch (Exception e) {
            Log.e(TAG, "Failed to save artwork", e);
            return null;
        }
    }
}
