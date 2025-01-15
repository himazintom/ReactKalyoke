// components/KaraokeControls.tsx
import React from 'react';
import { Box, Button, Slider } from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import LoopIcon from '@mui/icons-material/Loop';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

import ToggleButton from './ToggleButton';

interface KaraokeControlsProps {
  isShowControls: boolean;
  isPlaying: boolean;
  isFullScreen: boolean;
  isLyricCC: boolean;
  isVisibleWaveform: boolean;
  isLooping: boolean;
  isShuffling: boolean;
  currentTime: number;
  duration: number;

  onPlayPause: () => void;
  onToggleFullScreen: () => void;
  onToggleLyricCC: () => void;
  onToggleWaveform: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;

  onSeekChange: (event: Event, newValue: number | number[]) => void;
  onMouseMove: () => void; // コントロール非表示のタイマーリセット用
}

const KaraokeControls: React.FC<KaraokeControlsProps> = ({
  isShowControls,
  isPlaying,
  isFullScreen,
  isLyricCC,
  isVisibleWaveform,
  isLooping,
  isShuffling,
  currentTime,
  duration,
  onPlayPause,
  onToggleFullScreen,
  onToggleLyricCC,
  onToggleWaveform,
  onToggleLoop,
  onToggleShuffle,
  onSeekChange,
  onMouseMove,
}) => {
  if (!isShowControls) return null;

  // トグルボタンをまとめて配列にする
  const controlButtons = [
    {
      onClick: onToggleLyricCC,
      isActive: isLyricCC,
      icon: <ClosedCaptionIcon />,
      position: { bottom: '50px', left: '70px' },
    },
    {
      onClick: onToggleWaveform,
      isActive: isVisibleWaveform,
      icon: <GraphicEqIcon />,
      position: { bottom: '50px', left: '130px' },
    },
    {
      onClick: onToggleFullScreen,
      isActive: isFullScreen,
      icon: isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />,
      position: { bottom: '55px', right: '10px' },
    },
    {
      onClick: onToggleLoop,
      isActive: isLooping,
      icon: <LoopIcon />,
      position: { bottom: '55px', right: '70px' },
    },
    {
      onClick: onToggleShuffle,
      isActive: isShuffling,
      icon: <ShuffleIcon />,
      position: { bottom: '55px', right: '130px' },
    },
  ];

  return (
    <Box
      onMouseMove={onMouseMove}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* 再生・一時停止ボタン */}
      <Button
        onClick={onPlayPause}
        sx={{
          position: 'absolute',
          bottom: '50px',
          left: '10px',
          color: 'white',
          zIndex: 2,
        }}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </Button>

      {/* 各トグルボタン */}
      {controlButtons.map((btn, index) => (
        <ToggleButton
          key={index}
          onClick={btn.onClick}
          isActive={btn.isActive}
          icon={btn.icon}
          positionStyle={btn.position}
        />
      ))}

      {/* シークバー */}
      <Slider
        value={currentTime}
        min={0}
        max={duration}
        onChange={onSeekChange}
        sx={{
          width: '95%',
          position: 'absolute',
          bottom: '10px',
          color: 'white',
          zIndex: 2,
        }}
        onChangeCommitted={onMouseMove} // ドラッグ完了時にもタイマーをリセット
        onMouseDown={(event) => event.stopPropagation()}
      />
    </Box>
  );
};

export default KaraokeControls;
