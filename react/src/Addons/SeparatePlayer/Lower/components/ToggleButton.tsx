import React from 'react';
import { Button } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface ToggleButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactElement<SvgIconProps>;
  positionStyle: React.CSSProperties;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick, isActive, icon, positionStyle }) => {
  return (
    <Button
      onClick={onClick}
      sx={{
        position: 'absolute',
        color: isActive ? 'skyBlue' : 'white',
        ...positionStyle,
        zIndex: 2,
      }}
    >
      {icon}
    </Button>
  );
};

export default ToggleButton;