import React from 'react';
import { Box, Slider } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface VolumeControlUIProps {
  icon: React.ReactElement<SvgIconProps>;
  value: number;
  onChange: (event: Event, newValue: number | number[]) => void;
  onChangeCommitted: () => void;
  position: 'left' | 'right';
}

const VolumeControlUI: React.FC<VolumeControlUIProps> = ({ icon, value, onChange, onChangeCommitted, position }) => {
  return (
    <Box 
      sx={{ 
        position: 'absolute',
        [position]: '10px',
        height: {
          xs: '40%',
          sm: '55%',
          md: '60%',
          lg: '70%',
        },
        top: '5%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        {icon}
      </Box>
      <Slider
        value={value}
        onChange={onChange}//スライダーの値が変更中に呼び出される
        orientation='vertical'
        sx={{
          height: '100%',
          color: 'white',
          zIndex: 3,
        }}
        step={1}
        min={0}
        max={100}
        onChangeCommitted={onChangeCommitted}//スライダーのドラッグ完了時に呼び出される
        onMouseDown={(event) => event.stopPropagation()}
      />
    </Box>
  );
};

export default VolumeControlUI;