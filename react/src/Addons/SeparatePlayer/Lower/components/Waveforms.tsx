import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import WaveformControlUI, { WaveformControlUIHandles } from './WaveformControlUI';
import { Box } from '@mui/material';

export interface WaveformsHandles {
  prepareWaveforms: (audioPath: string) => Promise<void>;
  playWaveforms: () => void;
  pauseWaveforms: () => void;
  stopWaveforms: () => void;
  seekWaveforms: (time: number) => void;
}

interface WaveformsProps {
  isVisibleWaveforms: boolean;
}

export const Waveforms = forwardRef<WaveformsHandles, WaveformsProps>(({ isVisibleWaveforms }, ref) => {
  const upperWaveformRef = useRef<WaveformControlUIHandles | null>(null);
  const lowerWaveformRef = useRef<WaveformControlUIHandles | null>(null);

  const beforePath = useRef<string>('');
  const isWaveformsReady = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useImperativeHandle(ref, () => ({
    prepareWaveforms,
    playWaveforms,
    pauseWaveforms,
    stopWaveforms,
    seekWaveforms,
  }));

  const prepareWaveforms = async(audioPath: string) => {
    if (beforePath.current !== audioPath) {//もし異なるパスなら、波形を停止して、準備する
      stopWaveforms();
      isWaveformsReady.current = false;

      await Promise.all([
        upperWaveformRef.current?.prepareWaveform(`${audioPath}/vocals.mp3`),
        lowerWaveformRef.current?.prepareWaveform(`${audioPath}/no_vocals.mp3`),
      ]);

      isWaveformsReady.current = true;

      beforePath.current = audioPath;
    }
  };

  const playWaveforms = () => {
    if (isWaveformsReady.current) {
      setIsPlaying(true);
      upperWaveformRef.current?.playWaveform();
      lowerWaveformRef.current?.playWaveform();
    }
  };

  const pauseWaveforms = () => {
    if (isWaveformsReady.current) {
      setIsPlaying(false);
      upperWaveformRef.current?.pauseWaveform();
      lowerWaveformRef.current?.pauseWaveform();
    }
  };

  const stopWaveforms = () => {
    if (isWaveformsReady.current) {
      if(isPlaying){
        setIsPlaying(false);
        upperWaveformRef.current?.stopWaveform();
        lowerWaveformRef.current?.stopWaveform();
      }
    }
  };

  const seekWaveforms = (time: number) => {
    if (isWaveformsReady.current) {
      upperWaveformRef.current?.seekWaveform(time);
      lowerWaveformRef.current?.seekWaveform(time);
    }
  };

  return (
    <Box sx={{ display: isVisibleWaveforms ? 'block' : 'none' }}>
      <Box sx={{ position: 'absolute', width: '100%', height: '15%', top: '0' }}>
        <WaveformControlUI ref={upperWaveformRef} barAlign="top" />
      </Box>
      <Box sx={{ position: 'absolute', width: '100%', height: '15%', top: '85%' }}>
        <WaveformControlUI ref={lowerWaveformRef} barAlign="bottom" />
      </Box>
    </Box>
  );
});