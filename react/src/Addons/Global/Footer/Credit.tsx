import React from 'react';
import { Box, Typography, Container, keyframes, styled } from '@mui/material';

const glowText = keyframes`
  0% {
    text-shadow: 0 0 5px rgba(74,158,255,0.2);
  }
  50% {
    text-shadow: 0 0 20px rgba(74,158,255,0.5);
  }
  100% {
    text-shadow: 0 0 5px rgba(74,158,255,0.2);
  }
`;

const StyledCreditContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.98) 100%)',
  padding: theme.spacing(4, 0),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(74,158,255,0.05) 0%, rgba(0,0,0,0) 70%)',
    pointerEvents: 'none',
  },
}));

const StyledCreditTitle = styled(Typography)(({ theme }) => ({
  margin: 0,
  fontSize: '2.5rem',
  color: 'rgba(255,255,255,0.9)',
  textAlign: 'center',
}));

const StyledMainCredit = styled(Typography)(({ theme }) => ({
  fontSize: '4.5rem',
  margin: '0.5rem 0',
  background: 'linear-gradient(45deg, #4a9eff 30%, #6ac5fe 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: `${glowText} 3s infinite`,
  transition: 'all 0.3s ease',
  opacity: 0.9,
  '&:hover': {
    transform: 'scale(1.05)',
    opacity: 1,
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '3rem',
  },
}));

const StyledContributors = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: 'rgba(255,255,255,0.7)',
  lineHeight: 1.6,
  letterSpacing: '0.05em',
  transition: 'all 0.3s ease',
  '&:hover': {
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: '0.1em',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
  },
}));

interface Contributor {
  name: string;
}

const contributors: Contributor[] = [
  { name: '味飛' },
  { name: 'chenxxa' },
  { name: 'manajishi' },
  { name: '大納言あずさ' },
  { name: 'PINGA4869' },
  { name: 'くりごはん' },
  { name: 'M.T.' },
];

export const Credit: React.FC = () => {
  return (
    <StyledCreditContainer>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <StyledCreditTitle variant="h1">
            Credit
          </StyledCreditTitle>
          
          <Box
            sx={{
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <StyledMainCredit variant="h2">
              zero116
            </StyledMainCredit>
            
            <StyledContributors>
              {contributors.map((contributor, index) => (
                <React.Fragment key={index}>
                  {index > 0 && ' / '}
                  {contributor.name}
                </React.Fragment>
              ))}
            </StyledContributors>
          </Box>
        </Box>
      </Container>
    </StyledCreditContainer>
  );
}; 