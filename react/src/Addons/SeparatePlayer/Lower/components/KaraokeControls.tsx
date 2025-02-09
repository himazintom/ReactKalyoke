// components/KaraokeControls.tsx
import React from 'react';
import { Box, Button, Slider, Typography } from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import LoopIcon from '@mui/icons-material/Loop';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

import ToggleButton from './ToggleButton';

interface KaraokeControlsProps {
  isPitchMode: boolean;
  isShowControls: boolean;
  isPlaying: boolean;
  isFullScreen: boolean;
  isLyricCC: boolean;
  isVisibleWaveform: boolean;
  isLooping: boolean;
  isShuffling: boolean;
  currentTime: number;
  duration: number;
  currentPitch: number;

  onPlayPause: () => void;
  onToggleFullScreen: () => void;
  onToggleLyricCC: () => void;
  onToggleWaveform: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;

  onSeekChange: (event: Event, newValue: number | number[]) => void;
  onMouseMove: () => void; // コントロール非表示のタイマーリセット用
  handlePitchChange: (change: number) => void;
}

const buttonHeight = '36px'; // ボタンの高さを変数で定義
const bottomButtonsLine = '50px';

const KaraokeControls: React.FC<KaraokeControlsProps> = ({
  isPitchMode,
  isShowControls,
  isPlaying,
  isFullScreen,
  isLyricCC,
  isVisibleWaveform,
  isLooping,
  isShuffling,
  currentTime,
  duration,
  currentPitch,
  onPlayPause,
  onToggleFullScreen,
  onToggleLyricCC,
  onToggleWaveform,
  onToggleLoop,
  onToggleShuffle,
  onSeekChange,
  onMouseMove,
  handlePitchChange,
}) => {
  if (!isShowControls) return null;

  // トグルボタンをまとめて配列にする
  const controlButtons = [
    {
      onClick: onToggleLyricCC,
      isActive: isLyricCC,
      icon: <FormatAlignCenterIcon />,
      position: { bottom: bottomButtonsLine, left: '80px' },
    },
    {
      onClick: onToggleWaveform,
      isActive: isVisibleWaveform,
      icon: <GraphicEqIcon />,
      position: { bottom: bottomButtonsLine, left: '140px' },
    },
    {
      onClick: onToggleFullScreen,
      isActive: isFullScreen,
      icon: isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />,
      position: { bottom: bottomButtonsLine, right: '10px' },
    },
    {
      onClick: onToggleLoop,
      isActive: isLooping,
      icon: <LoopIcon />,
      position: { bottom: bottomButtonsLine, right: '70px' },
    },
    {
      onClick: onToggleShuffle,
      isActive: isShuffling,
      icon: <ShuffleIcon />,
      position: { bottom: bottomButtonsLine, right: '130px' },
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
          height: buttonHeight, // 変数を使用
        }}
      >
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </Button>

      {/* ピッチ調節ボタン */}
      {isPitchMode &&
        <Box
          sx={{
            position: 'absolute',
            bottom: bottomButtonsLine,
            left: { xs: 'auto', lg: '200px' },
            display: 'flex',
            justifyContent: { xs: 'flex-start', md: 'center'},
            color: 'white',
            height: buttonHeight,
          }}
        >
          <Button
            onClick={() => handlePitchChange(-1)}
            sx={{
              color: 'white',
              fontSize: '20px',
              minWidth: '36px',
              height: buttonHeight, // 変数を使用
              backgroundColor: 'rgba(255, 255, 255, 0.0)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              zIndex: 2,
            }}
          >
            -
          </Button>
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              minWidth: '36px',
              textAlign: 'center',
            }}
          >
            {currentPitch}
          </Typography>
          <Button
            onClick={() => handlePitchChange(1)}
            sx={{
              color: 'white',
              fontSize: '20px',
              minWidth: '36px',
              height: buttonHeight, // 変数を使用
              backgroundColor: 'rgba(255, 255, 255, 0.0)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              zIndex: 2,
            }}
          >
            +
          </Button>
        </Box>
      }

      {/* 各トグルボタン */}
      {controlButtons.map((btn, index) => (
        <ToggleButton
          key={index}
          onClick={btn.onClick}
          isActive={btn.isActive}
          icon={btn.icon}
          positionStyle={btn.position}
          height={buttonHeight}
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
