import React, { useEffect, useState } from 'react';
import { Box, Typography, Link } from '@mui/material';
import HistoryList from '../types/HistoryList';

interface SectionProps {
  title: string;
  history: HistoryList[];
}

export const HistorySection: React.FC<SectionProps> = ({ title, history }) => {
  const hostUrl = process.env.REACT_APP_HOST_URL || '';

  const [data, setData] = useState<HistoryList[]>([]);

  useEffect(() => {
    setData(history);
  }, [history]);

  return (
    <Box sx={{
      color: 'white',
      background: 'linear-gradient(145deg, rgba(26,26,26,0.9) 0%, rgba(38,38,38,0.8) 100%)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <Typography 
        variant='h5' 
        sx={{ 
          marginBottom: 3,
          fontWeight: 600,
          background: 'linear-gradient(45deg, #fff, #ccc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </Typography>
      {data.length > 0 ? (
        data.map((item, index) => (
          <Box
            key={index}
            sx={{
              marginBottom: '2px',
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <Link 
              href={`${hostUrl}/search_id/${item.videoId}`} 
              sx={{ 
                color: 'inherit',
                textDecoration: 'none',
                display: 'block',
                '&:hover': {
                  color: '#4a9eff'
                }
              }}
            >
              {item.title}
            </Link>
          </Box>
        ))
      ) : (
        <Typography sx={{ opacity: 0.7 }}>No data available</Typography>
      )}
    </Box>
  );
};
