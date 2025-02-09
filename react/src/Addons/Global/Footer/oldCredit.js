import { Box, Typography } from '@mui/material';

export const Credit = () => {
  return (
    <Box sx={{
      backgroundColor: '#282c34',
      padding: 2
    }}>
      <Box>
        <Typography sx={{
          margin: 0,
          fontSize: '40px',
          color: '#FFF',
          textAlign: 'center',
        }}>
          Credit
        </Typography>
        
        <Box sx={{
          textAlign: 'center',
          color: '#FFF'
        }}>
          <Typography sx={{
            fontSize: '80px',
            margin: 0
          }}>
            zero116
          </Typography>
          
          <Typography sx={{
            fontSize: '20px',
            margin: 0
          }}>
            味飛/chenxxa manajishi 大納言あずさ PINGA4869 くりごはん M.T.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}