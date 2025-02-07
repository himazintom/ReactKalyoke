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
      style={{
        aspectRatio: '16/9',
        top: isFullScreen ? '50%' : '0',
        transform: isFullScreen ? 'translateY(-50%)' : 'none',
        position: 'absolute',
        left: '0',
        right: '0',
      }}
    />
  );
});

export default YouTubePlayer;
