import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import YouTube from 'react-youtube';

interface YouTubePlayerProps {
  setDuration: (duration: number) => void;
  isFullScreen: boolean;
}

export interface YouTubePlayerHandles {
  playYoutube: () => void;
  stopYoutube: () => void;
  seekYoutube: (time: number) => void;
  prepareYouTubePlayer: (videoId: string) => Promise<boolean>;
}

export const YouTubePlayer = forwardRef<
  YouTubePlayerHandles,
  YouTubePlayerProps
>(({ setDuration, isFullScreen }, ref) => {
  const [youtubeApiVideoId, setYoutubePlayerVideoId] = useState('dQw4w9WgXcQ');
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false); // プレイヤーの準備状態を管理
  const prepareResolveRef = useRef<((ready: boolean) => void) | null>(null);

  const handlePlayerReady = (event: { target: YT.Player }) => {
    playerRef.current = event.target;
    setIsReady(true); // プレイヤーが準備完了
    setDuration(event.target.getDuration());

    if (prepareResolveRef.current) {
      prepareResolveRef.current(true);
      prepareResolveRef.current = null;
    }
  };

  const prepareYouTubePlayer = async (videoId: string): Promise<boolean> => {
    if (youtubeApiVideoId === videoId) return true; // 同じ videoId なら何もしない
    return new Promise((resolve) => {
      prepareResolveRef.current = resolve;
      setIsReady(false); // 新しい動画の準備開始
      setYoutubePlayerVideoId(videoId);
    });
  };

  const playYoutube = () => {
    if (isReady && playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const stopYoutube = () => {
    if (isReady && playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };

  const seekYoutube = (time: number) => {
    if (isReady && playerRef.current) {
      playerRef.current.seekTo(time, true);
    }
  };

  useImperativeHandle(ref, () => ({
    prepareYouTubePlayer,
    playYoutube,
    stopYoutube,
    seekYoutube,
  }));

  // fullscreen 時はウィンドウサイズから幅・高さを計算し16:9の比率を維持する
  let containerStyle: React.CSSProperties;
  if (isFullScreen) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const aspectRatio = 16 / 9;
    if (windowWidth / windowHeight > aspectRatio) {
      // 高さが制限要因の場合
      containerStyle = {
        width: `${windowHeight * aspectRatio}px`,
        height: `${windowHeight}px`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        overflow: 'hidden',
      };
    } else {
      // 幅が制限要因の場合
      containerStyle = {
        width: `${windowWidth}px`,
        height: `${windowWidth / aspectRatio}px`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'absolute',
        overflow: 'hidden',
      };
    }
  } else {
    containerStyle = {
      aspectRatio: '16/9',
      top: '0',
      transform: 'none',
      position: 'absolute',
      left: '0',
      right: '0',
      overflow: 'hidden',
    };
  }

  return (
    <YouTube
      videoId={youtubeApiVideoId}
      opts={{
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          mute: 1,
          cc_load_policy: 0, // YouTube API の CC を表示しない
        },
      }}
      onReady={handlePlayerReady}
      style={containerStyle}
    />
  );
});

export default YouTubePlayer;
