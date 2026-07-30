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
                    promise.resolve(true);
                } else {
                    Log.w(TAG, "MediaInteraction is null"); write("MediaI", "INFO", "DimInteraction null - car API not available");
                    promise.resolve(false);
                }
            } else {
                write("MediaI", "INFO", "DimInteraction.create() returned null");
                promise.resolve(false);
            }
            
            // MediaSession 始终初始化(不依赖 DimInteraction),用于独占方控
            try {
                initMediaSessionManager();
                write("MediaI", "INFO", "MediaSessionManager always init");
            } catch (Exception e) {
                Log.e(TAG, "MediaSession init failed", e);
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
            mMediaSession.setCallback(new android.media.session.MediaSession.Callback() {
                public void onPlay() { sendButtonAction("play"); }
                public void onPause() { sendButtonAction("pause"); }
                public void onPlayPause() { sendButtonAction("playPause"); }
                public void onSkipToNext() { sendButtonAction("next"); }
                public void onSkipToPrevious() { sendButtonAction("previous"); }
                public void onStop() { sendButtonAction("pause"); }
            });
            Log.d(TAG, "MediaSessionManager initialized, media buttons locked"); write("MediaI", "INFO", "MediaSession active (exclusive)");
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize MediaSessionManager", e);
        }
    }

    private void sendButtonAction(String action) {
        try {
            android.content.Intent i = new android.content.Intent("cn.toside.music.mobile.MINI_PLAYER_BUTTON");
            i.putExtra("button_action", action);
            i.setPackage(getReactApplicationContext().getPackageName());
            getReactApplicationContext().sendBroadcast(i);
            Log.d(TAG, "Sent button action: " + action);
        } catch (Exception e) {
            Log.e(TAG, "sendButtonAction error: " + e.getMessage());
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

            // 封面:先查缓存(按歌命名),命中秒显;未命中异步下载补推
            this.currentArtwork = null;
            if (artworkPath != null && !artworkPath.isEmpty()) {
                if (artworkPath.startsWith("http://") || artworkPath.startsWith("https://")) {
                    java.io.File cachedFile = new java.io.File(artworkCacheDir, artworkKey(currentTitle, currentArtist));
                    if (cachedFile.exists() && cachedFile.length() > 0) {
                        this.currentArtwork = Uri.fromFile(cachedFile);
                    } else {
                        this.currentArtwork = null; // 先推无封面
                        downloadAndCacheAsync(artworkPath, currentTitle, currentArtist); // 下完补推
                    }
                } else {
                    this.currentArtwork = Uri.parse(artworkPath);
                }
            }

            // MediaSession 始终保持激活,防止系统音乐抢方控
            if (mMediaSession != null && !mMediaSession.isActive()) {
                mMediaSession.setActive(true);
                Log.d(TAG, "MediaSession kept active"); write("MediaI", "INFO", "MediaSession kept active");
            }

            write("MediaI", "INFO", "push title=" + currentTitle + " artist=" + currentArtist + " playing=" + playing + " artwork=" + (currentArtwork != null));
            // 播放时抢占车机在线音源 + 防反抢(解决方控冲突:收音机/USB/蓝牙)
            if (playing) {
              try {
                final android.os.Handler h = new android.os.Handler(android.os.Looper.getMainLooper());
                // 延迟 800ms 确保 OneOS 服务就绪后首次抢占
                h.postDelayed(new Runnable() { @Override public void run() {
                  try {
                    cn.toside.music.mobile.carkey.OneOSApiManager osm = cn.toside.music.mobile.carkey.OneOSApiManager.getInstance(getReactApplicationContext());
                    cn.toside.music.mobile.carkey.MediaCenterHelper.requestOnlineSource(osm);
                  } catch (Exception ignore) {}
                  // 持续抢占(每10秒),防止 USB/BT/Radio 反抢
                  if (isPlaying) h.postDelayed(this, 10000);
                }}, 800);
              } catch (Exception ignore) {}
            }
            // 补全 MediaSession 元数据(GMediaProxy/车机读取)
            if (mMediaSession != null) {
                MediaMetadata.Builder mb = new MediaMetadata.Builder();
                fillMetadata(mb);
                if (currentDuration > 0) {
                    mb.putLong(MediaMetadata.METADATA_KEY_DURATION, currentDuration);
                }
                mMediaSession.setMetadata(mb.build());
                PlaybackState.Builder pb = new PlaybackState.Builder()
                    .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                        | PlaybackState.ACTION_SEEK_TO)
                    .setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                              currentPosition, isPlaying ? 1.0f : 0.0f);
                mMediaSession.setPlaybackState(pb.build());
            }
            if (mMediaInteraction != null) {
                IMediaInteraction.IPlaybackInfo pi = buildPlaybackInfo();
                if (pi != null) mMediaInteraction.updatePlaybackInfo(pi);
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
    write("MediaI", "INFO", "progress: " + (int)(position));
        try {
            this.currentPosition = (long) position;
            // 同步 MediaSession 位置
            if (mMediaSession != null) {
                PlaybackState.Builder pb = new PlaybackState.Builder()
                    .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                        | PlaybackState.ACTION_SEEK_TO)
                    .setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                              currentPosition, isPlaying ? 1.0f : 0.0f);
                mMediaSession.setPlaybackState(pb.build());
            }
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

// 下载封面到本地(异步,用完回调补推)
    private void downloadAndCacheAsync(final String url, final String title, final String artist) {
        final String key = artworkKey(title, artist);
        final java.io.File file = new java.io.File(artworkCacheDir, key);
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    java.net.URL imageUrl = new java.net.URL(url);
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) imageUrl.openConnection();
                    conn.setDoInput(true); conn.setConnectTimeout(10000); conn.setReadTimeout(10000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0");
                    conn.connect();
                    if (conn.getResponseCode() != 200) { conn.disconnect(); return; }
                    java.io.InputStream in = conn.getInputStream();
                    byte[] data = readAllBytes(in); in.close(); conn.disconnect();
                    if (data.length == 0) return;
                    Bitmap bmp = android.graphics.BitmapFactory.decodeByteArray(data, 0, data.length);
                    if (bmp == null || bmp.getWidth() == 0) return;
                    // 存本地 + 清理 + 复制到 Music/.thumbnails
                    cleanupOldArtwork();
                    java.io.FileOutputStream fos = new java.io.FileOutputStream(file);
                    bmp.compress(Bitmap.CompressFormat.JPEG, 90, fos);
                    fos.flush(); fos.close();
                    try {
                        java.io.File musicDir = new java.io.File(android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_MUSIC), ".thumbnails");
                        if (!musicDir.exists()) musicDir.mkdirs();
                        java.io.File thumbFile = new java.io.File(musicDir, key);
                        java.io.FileOutputStream fos2 = new java.io.FileOutputStream(thumbFile);
                        bmp.compress(Bitmap.CompressFormat.JPEG, 90, fos2);
                        fos2.flush(); fos2.close();
                    } catch(Exception e) { Log.w(TAG, "thumb copy fail: " + e.getMessage()); }

                    // 回调主线程:确认还是这首歌才推
                    final Uri uri = Uri.fromFile(file);
                    new android.os.Handler(android.os.Looper.getMainLooper()).post(new Runnable() {
                        @Override public void run() {
                            if (currentTitle != null && currentArtist != null
                                && currentTitle.equals(nvl(title))
                                && currentArtist.equals(nvl(artist))) {
                                currentArtwork = uri;
                                if (mMediaInteraction != null) {
                                    write("MediaI", "INFO", "artwork async done: " + nvl(title));
                                    IMediaInteraction.IPlaybackInfo pi = buildPlaybackInfo();
                                    if (pi != null) mMediaInteraction.updatePlaybackInfo(pi);
                                }
                                // 同时更新 MediaSession 封面
                                if (mMediaSession != null) {
                                    MediaMetadata.Builder mb = new MediaMetadata.Builder();
                                    fillMetadata(mb);
                                    try {
                                        Bitmap b = android.provider.MediaStore.Images.Media.getBitmap(
                                            getReactApplicationContext().getContentResolver(), uri);
                                        if (b != null) mb.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, b);
                                    } catch(Exception ignored) {}
                                    mMediaSession.setMetadata(mb.build());
                                }
                            }
                        }
                    });
                } catch (Exception e) { Log.e(TAG, "download fail: " + e.getMessage()); }
            }
        }).start();
    }

    // 旧的同步 downloadArtwork 替换为查缓存 + 异步下载
    private Uri downloadArtwork(final String url) {
        // 不再使用,保留兼容
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

    // 填 MediaSession 元数据
    private void fillMetadata(MediaMetadata.Builder mb) {
        mb.putString(MediaMetadata.METADATA_KEY_TITLE, nvl(currentTitle));
        mb.putString(MediaMetadata.METADATA_KEY_ARTIST, nvl(currentArtist));
        mb.putString(MediaMetadata.METADATA_KEY_ALBUM, nvl(currentAlbum));
        if (currentArtwork != null) {
            try {
                Bitmap bmp = android.provider.MediaStore.Images.Media.getBitmap(
                    getReactApplicationContext().getContentResolver(), currentArtwork);
                if (bmp != null) mb.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bmp);
            } catch (Exception e) {}
        }
    }
    // 复用 PlaybackInfo 构建
    private IMediaInteraction.IPlaybackInfo buildPlaybackInfo() {
        if (mMediaInteraction == null) return null;
        return new IMediaInteraction.IPlaybackInfo() {
            @Override public String getAlbum() { return currentAlbum; }
            @Override public String getArtist() { return currentArtist; }
            @Override public Uri getArtwork() { return currentArtwork; }
            @Override public String getCurrentLyricSentence() { return ""; }
            @Override public long getDuration() { return currentDuration; }
            @Override public int getFavoriteState() { return 0; }
            @Override public int getLoopMode() { return LOOP_MODE_ALL; }
            @Override public Uri getLyric() { return null; }
            @Override public String getLyricContent() { return ""; }
            @Override public Uri getMediaPath() { return null; }
            @Override public Uri getNextArtwork() { return null; }
            @Override public int getPlaybackStatus() { return isPlaying ? PLAYBACK_STATUS_PLAYING : PLAYBACK_STATUS_PAUSED; }
            @Override public int getPlayingItemPositionInQueue() { return 0; }
            @Override public Uri getPreviousArtwork() { return null; }
            @Override public String getRadioFrequency() { return ""; }
            @Override public int getRadioMode() { return RADIO_MODE_PLAYING; }
            @Override public String getRadioStationName() { return ""; }
            @Override public int getSourceType() { return sourceType; }
            @Override public String getTitle() { return currentTitle; }
            @Override public String getUUID() { return ""; }
        };
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

    private String artworkKey(String title, String artist) {
    return "art_" + java.lang.Integer.toHexString((nvl(title) + "|" + nvl(artist)).hashCode()) + ".jpg";
  }
  private String nvl(String s) { return s != null ? s : ""; }
  private void cleanupOldArtwork() {
        try {
            java.io.File[] files = artworkCacheDir.listFiles();
            if (files != null && files.length > 30) {
                java.util.Arrays.sort(files, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
                for (int i = 0; i < files.length - 30; i++) {
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
