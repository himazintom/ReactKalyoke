// components/Overlay.tsx
import React from 'react';
import { Box } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface OverlayProps {
  showInitialOverlay: boolean;
  onOverlayClick: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ showInitialOverlay, onOverlayClick }) => {
  if (!showInitialOverlay) return null;
  return (
    <Box
      onClick={onOverlayClick}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 4,
        cursor: 'pointer',
      }}
    >
      <PlayArrowIcon sx={{ fontSize: '100px', color: 'white' }} />
    </Box>
  );
};

export default Overlay;
