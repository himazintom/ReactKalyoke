import React from 'react';
import { Box, Typography, Container, Grid, IconButton, styled, keyframes } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';
import { Link } from 'react-router-dom';
import { Credit } from './Credit';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledFooterContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
  color: 'white',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
  },
}));

const StyledFooterSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 0),
  animation: `${fadeIn} 0.6s ease-out`,
}));

const StyledFooterTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: '40px',
    height: '2px',
    background: 'linear-gradient(90deg, #4a9eff, transparent)',
  },
}));

const StyledFooterLink = styled(Link)(({ theme }) => ({
  color: 'rgba(255,255,255,0.7)',
  textDecoration: 'none',
  display: 'block',
  marginBottom: theme.spacing(1.5),
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#4a9eff',
    transform: 'translateX(5px)',
  },
}));

const StyledSocialLink = styled('a')(({ theme }) => ({
  color: 'inherit',
  textDecoration: 'none',
}));

const StyledSocialButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255,255,255,0.7)',
  transition: 'all 0.3s ease',
  margin: theme.spacing(0, 1),
  '&:hover': {
    color: '#4a9eff',
    transform: 'translateY(-3px)',
    backgroundColor: 'rgba(74,158,255,0.1)',
  },
}));

const StyledCopyright = styled(Box)(({ theme }) => ({
  borderTop: '1px solid rgba(255,255,255,0.1)',
  padding: theme.spacing(3, 0),
  textAlign: 'center',
  color: 'rgba(255,255,255,0.5)',
  background: 'rgba(0,0,0,0.2)',
}));

const StyledDescription = styled(Typography)(({ theme }) => ({
  color: 'rgba(255,255,255,0.7)',
  marginBottom: theme.spacing(2),
  lineHeight: 1.6,
}));

interface FooterLink {
  text: string;
  path: string;
}

const footerLinks: FooterLink[] = [
  { text: 'プライバシーポリシー', path: '/privacy' },
  { text: '利用規約', path: '/terms' },
  { text: 'お問い合わせ', path: '/contact' },
];

const socialLinks = [
  { icon: <GitHubIcon />, href: 'https://github.com/himazi', label: 'GitHub' },
  { icon: <TwitterIcon />, href: 'https://twitter.com/himazi', label: 'Twitter' },
  { icon: <EmailIcon />, href: 'mailto:contact@kalyoke.com', label: 'Email' },
];

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Credit />
      <StyledFooterContainer>
        <StyledFooterSection>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <StyledFooterTitle>
                  Kalyoke
                </StyledFooterTitle>
                <StyledDescription>
                  オンラインカラオケを、もっと楽しく、もっと便利に。
                </StyledDescription>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <StyledFooterTitle>
                  リンク
                </StyledFooterTitle>
                <Box>
                  {footerLinks.map((link, index) => (
                    <StyledFooterLink key={index} to={link.path}>
                      {link.text}
                    </StyledFooterLink>
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <StyledFooterTitle>
                  フォローする
                </StyledFooterTitle>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {socialLinks.map((link, index) => (
                    <StyledSocialLink
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                    >
                      <StyledSocialButton>
                        {link.icon}
                      </StyledSocialButton>
                    </StyledSocialLink>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Container>
        </StyledFooterSection>
        
        <StyledCopyright>
          <Container maxWidth="lg">
            <Typography variant="body2">
              © {currentYear} Kalyoke. All rights reserved.
            </Typography>
          </Container>
        </StyledCopyright>
      </StyledFooterContainer>
    </>
  );
}; 