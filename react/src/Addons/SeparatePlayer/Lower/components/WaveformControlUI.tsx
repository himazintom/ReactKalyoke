import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

export interface WaveformControlUIHandles { 
  prepareWaveform: (audioPath: string) => void;
  playWaveform: () => void;
  pauseWaveform: () => void;
  stopWaveform: () => void;
  seekWaveform: (timeInSeconds: number) => void;
}

interface WaveformControlUIProps {
  barAlign: 'top' | 'bottom' | undefined;
}

export const WaveformControlUI = forwardRef<WaveformControlUIHandles, WaveformControlUIProps>(({ barAlign }, ref) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  useEffect(() => {
    if (!['top', 'bottom', undefined].includes(barAlign)) {
      console.error(`Invalid value for barAlign: "${barAlign}". It must be 'top' or 'bottom' or 'center'.`);
      barAlign = 'top'; // デフォルト値にフォールバック
    }
  }, [barAlign]);

  const onReadyWaveform = () => {
    wavesurferRef.current?.setVolume(0); // ミュートにする
    const duration = wavesurferRef.current?.getDuration();
    if (duration !== undefined) {
      // 30秒ごとに100%ずつ幅を増加
      let widthPercentage = (Math.floor(duration / 30) + 1) * 200;
      if (waveformRef.current) {
        waveformRef.current.style.width = `${widthPercentage}%`;
      } 
    }
  }

  const onAudioProcess = () => {
    const currentTime = wavesurferRef.current?.getCurrentTime();
    const duration = wavesurferRef.current?.getDuration();
    if(currentTime !== undefined && duration !== undefined) {
      const progress = (currentTime / duration) * 100;
      if (waveformRef.current) {
        waveformRef.current.style.transform = `translateX(-${progress}%)`;
      }
    }
  }

  const prepareWaveform = async (audioPath: string) => {
    try {
      if (waveformRef.current) {
        waveformRef.current.style.transform = 'translateX(0%)'; // リセット

        // 既存のWaveSurferインスタンスを破棄
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          cursorColor: 'red',
          height: 'auto',
          barAlign: barAlign,
          backend: 'WebAudio',
          fillParent: true,
          autoCenter: true,
          waveColor: 'rgba(255,255,255,0.8)',
          progressColor: 'rgba(255,255,255,0.5)',
          barGap: 4,
          barRadius: 5,
          barWidth: 5,
          interact: false,
        });

        // オーディオファイルを非同期でロード
        await new Promise<void>((resolve, reject) => {
          wavesurferRef.current?.once('ready', () => resolve());
          wavesurferRef.current?.once('error', (e) => reject(e));
          wavesurferRef.current?.load(audioPath);
        });

        // イベント設定
        wavesurferRef.current?.on('audioprocess', onAudioProcess);
        if (onReadyWaveform) {
          onReadyWaveform();
        }
      }
    } catch (error) {
      console.error('prepareWaveform エラー:', error);
    }
  };

  const playWaveform = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play();
    }
  }

  const pauseWaveform = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.pause();
    }
  }

  const stopWaveform = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
    }
  }

  const seekWaveform = (timeInSeconds: number) => {
    if (wavesurferRef.current) {
      const duration = wavesurferRef.current.getDuration();
      const progress = timeInSeconds / duration;
      wavesurferRef.current.seekTo(progress); // 特定の秒数にシークする
    }
  }

  // useImperativeHandleを使って外部からメソッドにアクセスできるようにする
  useImperativeHandle(ref, () => ({
    prepareWaveform,
    playWaveform,
    pauseWaveform,
    stopWaveform,
    seekWaveform
  }));

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={waveformRef} style={{ position: 'relative', height: '100%', marginLeft: '50%', transform: 'translateX(0%)'}}></div>
    </div>
  );
});

export default WaveformControlUI;
