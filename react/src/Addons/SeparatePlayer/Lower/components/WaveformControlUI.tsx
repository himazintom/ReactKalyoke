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
  const currentLoadId = useRef<number>(0); // 読み込みリクエストのIDを管理するフラグ
  
  useEffect(() => {
    if (!['top', 'bottom', undefined].includes(barAlign)) {
      console.error(`Invalid value for barAlign: "${barAlign}". It must be 'top' or 'bottom' or 'center'.`);
      barAlign = 'top'; // デフォルト値にフォールバック
    }

    return () => {
      // コンポーネントのアンマウント時にWaveSurferを破棄
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, []);

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
    currentLoadId.current += 1; // 新しい読み込みリクエストのIDをインクリメント
    const loadId = currentLoadId.current;

    try {
      // 既存のWaveSurferインスタンスを破棄
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }

      if (waveformRef.current) {
        waveformRef.current.style.transform = 'translateX(0%)'; // リセット

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

        // エラーハンドリングを追加
        wavesurferRef.current.on('error', (e) => {
          console.error('prepareWaveform エラー:', e);
        });

        // オーディオファイルをロード
        await new Promise<void>((resolve, reject) => {
          if (loadId !== currentLoadId.current) {
            // 新しいリクエストが開始されている場合は無視
            return reject(new Error('新しい読み込みリクエストが開始されました'));
          }

          const handleReady = () => {
            if (loadId === currentLoadId.current) {
              resolve();
            }
          };

          const handleError = (e: any) => {
            if (loadId === currentLoadId.current) {
              reject(e);
            }
          };

          wavesurferRef.current?.once('ready', handleReady);
          wavesurferRef.current?.once('error', handleError);
          wavesurferRef.current?.load(audioPath);
        });

        // イベント設定
        wavesurferRef.current?.on('audioprocess', onAudioProcess);
        if (onReadyWaveform) {
          onReadyWaveform();
        }
      }
    } catch (error) {
      if ((error as any).message === '新しい読み込みリクエストが開始されました') {
        console.log('古い読み込みリクエストがキャンセルされました');
      } else {
        console.error('prepareWaveform エラー:', error);
      }
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
      wavesurferRef.current.seekTo(timeInSeconds / wavesurferRef.current.getDuration());
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
