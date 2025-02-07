import React from 'react';
import { Button } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface ToggleButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  positionStyle: Partial<{ bottom: string; left: string; right: string }>; // 修正
  height: string;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick, isActive, icon, positionStyle, height }) => {
  return (
    <Button
      onClick={onClick}
      sx={{
        position: 'absolute',
        color: isActive ? 'skyBlue' : 'white',
        ...positionStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.0)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        borderRadius: '4px',
        minWidth: '36px',
        height: height,
        zIndex: 2,
      }}
    >
      {icon}
    </Button>
  );
};

export default ToggleButton;