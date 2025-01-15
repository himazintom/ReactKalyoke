import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

// プロパティの型定義
interface WaveformProps {
  audioUrl: string;
  isPlaying: boolean;
  barAlign?: 'top' | 'bottom' | '';
  onReady?: () => void;
  isVisible: boolean;
}

// カスタムハンドルの型定義
export interface WaveformHandle {
  handleSeekTo(timeInSeconds: number): void;
}

// Waveform コンポーネントの定義
const Waveform = forwardRef<WaveformHandle, WaveformProps>(({
  audioUrl,
  isPlaying,
  barAlign = '',
  onReady,
  isVisible
}, ref) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isFirstRender = useRef(true); // 初回レンダリングを追跡するフラグ

   // バリデーション：barAlignが空白、'top'、'bottom'のいずれかであることを確認
  if (!['', 'top', 'bottom'].includes(barAlign)) {
    console.error(`Invalid value for barAlign: "${barAlign}". It must be '', 'top', or 'bottom'.`);
    barAlign = ''; // デフォルト値にフォールバック
  }
  
  useEffect(() => {
    // 初回レンダリング時は何もしない
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (waveformRef.current) {
      waveformRef.current.style.transform = 'translateX(0%)'; // リセットされたときに、初期位置に戻す
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        cursorColor: 'red',
        height: 'auto',
        barAlign: barAlign as 'top' | 'bottom',
        backend: 'WebAudio', // Web Audio API を使用するように設定
        fillParent: true,
        autoCenter: true,
        waveColor: 'rgba(255,255,255,0.8)',
        progressColor: 'rgba(255,255,255,0.5)',
        barGap: 4,
        barRadius: 5,
        barWidth: 5,
        interact: false,
      });

      // オーディオファイルをロード
      wavesurferRef.current.load(audioUrl);

      // readyイベントで曲の長さを取得して幅を設定
      wavesurferRef.current.on('ready', () => {

        wavesurferRef.current?.setVolume(0); // ミュートにする
        const duration = wavesurferRef.current?.getDuration();

        if (duration !== undefined) {
          // 30秒ごとに100%ずつ幅を増加
          let widthPercentage = (Math.floor(duration / 30) + 1) * 200;

          if (waveformRef.current) {
            waveformRef.current.style.width = `${widthPercentage}%`;
          }
        }

        if (onReady) {
          onReady(); // Call the onReady callback
        }

      });

      wavesurferRef.current.on('audioprocess', () => {
        const currentTime = wavesurferRef.current?.getCurrentTime();
        const duration = wavesurferRef.current?.getDuration();
        if (currentTime !== undefined && duration !== undefined) {
          const progress = (currentTime / duration) * 100;
          if (waveformRef.current) {
            waveformRef.current.style.transform = `translateX(-${progress}%)`;
          }
        }
      });

      return () => {
        if (wavesurferRef.current) {
          try {
            wavesurferRef.current.destroy();
            wavesurferRef.current = null;
          } catch (error) {
            console.error('Error while destroying WaveSurfer:', error);
          }
        }
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.play();
      } else {
        wavesurferRef.current.pause();
      }
    }
  }, [isPlaying]);


  const handleSeekTo = (timeInSeconds: number) => {
    if (wavesurferRef.current) {
      const duration = wavesurferRef.current.getDuration();
      if (duration > 0) {
        const progress = timeInSeconds / duration;
        wavesurferRef.current.seekTo(progress);
      }
    }
  }

  useImperativeHandle(ref, () => ({
    handleSeekTo
  }));


  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={waveformRef} style={{ position: 'relative', height: '100%', marginLeft: '50%', transform: 'translateX(0%)', display: isVisible ? 'block' : 'none' }}></div>
    </div>
  );
});

export default Waveform;
