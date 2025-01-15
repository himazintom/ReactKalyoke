import React from 'react';
import { Box, Typography } from '@mui/material';

interface FormErrorMessagesProps {
  youtubeUrlErrorMessage?: string;
  lyricFormErrorMessage?: string;
  lyricFormWarningMessage?: string[];
}

export const FormErrorMessages: React.FC<FormErrorMessagesProps> = ({
  youtubeUrlErrorMessage,
  lyricFormErrorMessage,
  lyricFormWarningMessage,
}) => {
  return (
    <>
      {youtubeUrlErrorMessage && (
        <Typography color='error' sx={{ width: '100%', textAlign: 'center' }}>
          {youtubeUrlErrorMessage}
        </Typography>
      )}
      {lyricFormErrorMessage && (
        <Typography color='error' sx={{ width: '100%', textAlign: 'center' }}>
          {lyricFormErrorMessage}
        </Typography>
      )}
      {lyricFormWarningMessage && (
        <Box sx={{ width: '100%', textAlign: 'center', color: 'yellow' }}>
          {lyricFormWarningMessage.map((message, index) => (
            <Typography key={index} variant='body2'>
              {message}
            </Typography>
          ))}
        </Box>
      )}
    </>
  );
};