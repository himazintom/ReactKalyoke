import React, { useEffect, useState } from 'react';
import { Box, Typography, Link } from '@mui/material';
import { MusicList } from './MusicList';
import { HistoryList } from './FetchHistory';

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
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      marginBottom: { xs: 2, md: 0 },
      padding: '8px',
      margin: '8px'
    }}>
      <Typography variant='h5' sx={{ marginBottom: 2 }}>{title}</Typography>
      {data.length > 0 ? (
        data.map((item, index) => (
          <Typography key={index} sx={{ marginBottom: 1 }}>
            <Link href={`${hostUrl}/search_id/${item.videoId}`} sx={{ color: 'inherit', textDecoration: 'underline' }}>
              {item.title}
            </Link>
          </Typography>
        ))
      ) : (
        <Typography>No data available</Typography>
      )}
    </Box>
  );
};
