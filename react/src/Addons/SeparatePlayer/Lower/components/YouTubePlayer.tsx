import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import YouTube from 'react-youtube';

interface YouTubePlayerProps {
  setDuration: (duration: number) => void;
}

export interface YouTubePlayerHandles {
  playYoutube: () => void;
  stopYoutube: () => void;
  seekYoutube: (time: number) => void;
  prepareYouTubePlayer: (videoId: string) => Promise<boolean>;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandles, YouTubePlayerProps>(
  ({ setDuration }, ref) => {
    const [youtubeApiVideoId, setYoutubePlayerVideoId] = useState('dQw4w9WgXcQ');
    const playerRef = useRef<YT.Player | null>(null);
    const changeCCRef = useRef<boolean>(false);
    const beforeCurrentTimeRef = useRef<number | null>(null);
    const prepareResolveRef = useRef<((ready: boolean) => void) | null>(null);
    const youtubeCCResolveRef = useRef<((ready: boolean) => void) | null>(null);

    const handlePlayerReady = (event: { target: YT.Player }) => {
      //生成されたプレイヤーインスタンスを保持
      //※YouTubeコンポーネントには直接refを付けることはできない。
      //なぜならrefはYT.Playerではない。YT.Playerはonreadyのevent.targetとして渡される。
      playerRef.current = event.target;
      if(changeCCRef.current && beforeCurrentTimeRef.current){
        changeCCRef.current = false;
        if(youtubeCCResolveRef.current){
          youtubeCCResolveRef.current(true);
          youtubeCCResolveRef.current = null;
        }
        seekYoutube(beforeCurrentTimeRef.current);
      }else{
        event.target.setVolume(0);
        setDuration(event.target.getDuration());
        // もし prepareResolveRef に resolve 関数があれば、ここで true を返す
        if (prepareResolveRef.current) {
          prepareResolveRef.current(true);
          prepareResolveRef.current = null; // 一度呼び出したらクリアする
        }
      }
    };

    // 親コンポーネントから呼ばれるメソッド: videoIdを更新して、準備完了を待つ
    const prepareYouTubePlayer = async (videoId: string): Promise<boolean> => {
      if(youtubeApiVideoId === videoId) return true;//同じvideoIdだったら何もしない
      return new Promise((resolve) => {
        // resolve を格納しておき、onReady イベントで呼ぶ
        stopYoutube();
        prepareResolveRef.current = resolve;
        setYoutubePlayerVideoId(videoId);
      });
    };

    // 再生
    const playYoutube = () => {
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    };

    // 停止（ポーズ）
    const stopYoutube = () => {
      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    };

    // 指定した時刻にシーク
    const seekYoutube = (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
      }
    };

    // 親コンポーネントで使えるメソッドを公開
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
            cc_load_policy: 0,//youtubeAPIのCCを表示しないように設定
          },
        }}
        onReady={handlePlayerReady}
        style={{
          aspectRatio: '16/9',
          position: 'relative',
          left: '0',
          right: '0',
        }}
      />
    );
  }
);

export default YouTubePlayer;
