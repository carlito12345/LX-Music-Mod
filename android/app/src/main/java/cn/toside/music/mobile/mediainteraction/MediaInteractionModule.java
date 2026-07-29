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
import static cn.toside.music.mobile.logger.NativeLoggerModule.write;

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
            // 使用共享目录保存封面,以便车机系统可以访问
            artworkCacheDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "LXMusic_Artwork");
            if (!artworkCacheDir.exists()) {
                artworkCacheDir.mkdirs();
            }

            // 初始化 DimInteraction
            mDimInteraction = DimInteraction.create(context);
            if (mDimInteraction != null) {
                mMediaInteraction = mDimInteraction.getMediaInteraction();
                if (mMediaInteraction != null) {
                    Log.d(TAG, "MediaInteraction initialized successfully"); write("MediaI", "INFO", "Module initialized");
                    
                    // 初始化 MediaSessionManager
                    initMediaSessionManager();
                    
                    promise.resolve(true);
                } else {
                    Log.w(TAG, "MediaInteraction is null"); write("MediaI", "INFO", "DimInteraction null - car API not available");
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

    private android.media.session.MediaSession mMediaSession;

    private void initMediaSessionManager() {
        try {
            Context context = getReactApplicationContext();
            mMediaSessionManager = (MediaSessionManager) context.getSystemService(Context.MEDIA_SESSION_SERVICE);
            mComponentName = new android.content.ComponentName(context, MediaInteractionNotificationService.class);
            
            // 创建 MediaSession 并独占媒体按钮
            mMediaSession = new android.media.session.MediaSession(context, "LXMusicMediaSession");
            mMediaSession.setFlags(android.media.session.MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | 
                                   android.media.session.MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
            mMediaSession.setMediaButtonReceiver(null); // null = 我们的 app 独占
            mMediaSession.setActive(true);
            Log.d(TAG, "MediaSessionManager initialized, media buttons locked"); write("MediaI", "INFO", "MediaSession active (exclusive)");
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

            // 根据播放状态动态控制 MediaSession 独占
            if (mMediaSession != null) {
                if (playing) {
                    if (!mMediaSession.isActive()) {
                        mMediaSession.setActive(true);
                        Log.d(TAG, "MediaSession activated (playing)"); write("MediaI", "INFO", "MediaSession activated (playing)");
                    }
                } else {
                    if (mMediaSession.isActive()) {
                        mMediaSession.setActive(false);
                        Log.d(TAG, "MediaSession deactivated (paused)"); write("MediaI", "INFO", "MediaSession deactivated (paused)");
                    }
                }
            }

            if (mMediaInteraction != null) {
                write("MediaI", "INFO", "push title=" + currentTitle + " artist=" + currentArtist + " playing=" + playing + " artwork=" + (currentArtwork != null));
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

    private Uri downloadArtwork(final String url) {
        final Uri[] result = new Uri[1];
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // 支持 HTTP/HTTPS 重定向
                    java.net.URL imageUrl = new java.net.URL(url);
                    java.net.HttpURLConnection connection = (java.net.HttpURLConnection) imageUrl.openConnection();
                    connection.setDoInput(true);
                    connection.setConnectTimeout(8000);
                    connection.setReadTimeout(8000);
                    connection.setInstanceFollowRedirects(true);
                    // 清除 HTTP 明文流量限制
                    connection.setRequestProperty("User-Agent", "Mozilla/5.0");
                    connection.connect();

                    int responseCode = connection.getResponseCode();
                    if (responseCode == 200) {
                        // 先读取所有字节
                        java.io.InputStream input = connection.getInputStream();
                        byte[] data = readAllBytes(input);
                        input.close();
                        connection.disconnect();

                        if (data.length > 0) {
                            android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeByteArray(data, 0, data.length);
                            if (bitmap != null && bitmap.getWidth() > 0 && bitmap.getHeight() > 0) {
                                // 清理旧封面文件
                                cleanupOldArtwork();
                                
                                String filename = "artwork_" + System.currentTimeMillis() + ".jpg";
                                java.io.File artworkFile = new java.io.File(artworkCacheDir, filename);
                                java.io.FileOutputStream fos = new java.io.FileOutputStream(artworkFile);
                                bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, fos);
                                fos.flush();
                                fos.close();
                                
                                // 验证文件大小
                                if (artworkFile.length() > 0) {
                                    // 同时复制到系统 Music 目录(OneOS 读取该目录)
                                    try {
                                        java.io.File musicThumbDir = new java.io.File(
                                            android.os.Environment.getExternalStoragePublicDirectory(
                                                android.os.Environment.DIRECTORY_MUSIC), ".thumbnails");
                                        if (!musicThumbDir.exists()) musicThumbDir.mkdirs();
                                        java.io.File thumbFile = new java.io.File(musicThumbDir, filename);
                                        java.io.FileOutputStream fos2 = new java.io.FileOutputStream(thumbFile);
                                        bitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, fos2);
                                        fos2.flush();
                                        fos2.close();
                                        Log.d(TAG, "Also saved to Music/.thumbnails: " + thumbFile.getAbsolutePath());
                                    } catch (Exception e) {
                                        Log.w(TAG, "Failed to save to Music/.thumbnails: " + e.getMessage());
                                    }
                                    Uri artworkUri = Uri.fromFile(artworkFile);
                                    Log.d(TAG, "Artwork saved: " + artworkUri + " size=" + artworkFile.length());
                                    result[0] = artworkUri;
                                } else {
                                    Log.w(TAG, "Artwork file is empty after save");
                                    artworkFile.delete();
                                }
                            } else {
                                Log.w(TAG, "Failed to decode bitmap from downloaded data");
                            }
                        }
                    } else {
                        connection.disconnect();
                        Log.w(TAG, "HTTP error: " + responseCode + " for " + url);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to download artwork", e);
                }
            }
        });
        thread.start();
        try {
            thread.join(3000); // 最多等待3秒
        } catch (InterruptedException e) {
            Log.e(TAG, "Download interrupted", e);
        }
        return result[0];
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

    private byte[] readAllBytes(java.io.InputStream input) throws java.io.IOException {
        java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int n;
        while ((n = input.read(chunk)) != -1) {
            buffer.write(chunk, 0, n);
        }
        return buffer.toByteArray();
    }

    private void cleanupOldArtwork() {
        try {
            java.io.File[] files = artworkCacheDir.listFiles();
            if (files != null && files.length > 5) {
                java.util.Arrays.sort(files, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
                for (int i = 0; i < files.length - 5; i++) {
                    files[i].delete();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "cleanupOldArtwork failed", e);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(Integer count) {}
}
