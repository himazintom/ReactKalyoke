import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Waveform = ({ audioUrl }) => {
  const waveformDivRef = useRef(null);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isFirstRender = useRef(true); // 初回レンダリングを追跡するフラグ

  useEffect(() => {
    // 初回レンダリング時は何もしない
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (waveformRef.current) {
      waveformRef.current.style.transform = 'rotate(90deg) translateX(0%)'; // リセットされたときに、初期位置に戻す
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        cursorColor: 'red',
        height: 500,
        width: 500,
        responsive: true,
        backend: 'WebAudio', // Web Audio API を使用するように設定
        autoCenter: true,
        waveColor: 'white',
        progressColor: 'black',
      });

      // オーディオファイルをロード
      wavesurferRef.current.load(audioUrl);

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

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div ref={waveformDivRef} style={{ position: 'relative', width: '500px', height:'1000px', overflow: 'hidden' }}>
      <div
        ref={waveformRef}
        style={{
          height: '1000px',
          width: '500px',
        }}
      />
      <button onClick={handlePlayPause} style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default Waveform;
