import React from 'react';
import { Box, Typography, Link } from '@mui/material';

import { Credit } from './oldCredit';


export const Footer = () => {
  return (
    <>
      <Credit/>
      <Box sx={{ backgroundColor: '#282c34', color: 'white', padding: 2, textAlign: 'center' }}>
        <Typography variant="body1">2024 produced by himazi</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>プライバシーポリシー</Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>利用規約</Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>お問い合わせ</Link>
        </Box>
      </Box>
    </>
  );
}