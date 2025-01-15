// components/VolumeSliders.tsx
import React from 'react';
import { Box } from '@mui/material';
import VolumeControlUI from './VolumeControlUI';

import PianoIcon from '@mui/icons-material/Piano';
import MicIcon from '@mui/icons-material/Mic';

interface VolumeSlidersProps {
  instVolume: number;
  vocalVolume: number;
  setInstVolume: (val: number) => void;
  setVocalVolume: (val: number) => void;
  onSliderChange: () => void; // カーソル移動時にコントロールタイマーリセット
}

const VolumeSliders: React.FC<VolumeSlidersProps> = ({
  instVolume,
  vocalVolume,
  setInstVolume,
  setVocalVolume,
  onSliderChange,
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      {/* ピアノ音量 */}
      <VolumeControlUI
        icon={<PianoIcon sx={{ color: 'white' }} />}
        value={instVolume}
        onChange={(e, newValue) => {
          setInstVolume(newValue as number);
          onSliderChange();
        }}
        onChangeCommitted={() => {
          setInstVolume(instVolume);
          onSliderChange();
        }}
        position="left"
      />
      {/* ボーカル音量 */}
      <VolumeControlUI
        icon={<MicIcon sx={{ color: 'white' }} />}
        value={vocalVolume}
        onChange={(e, newValue) => {
          setVocalVolume(newValue as number);
          onSliderChange();
        }}
        onChangeCommitted={() => {
          setVocalVolume(vocalVolume);
          onSliderChange();
        }}
        position="right"
      />
    </Box>
  );
};

export default VolumeSliders;