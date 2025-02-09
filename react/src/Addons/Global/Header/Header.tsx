import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  InputBase,
  Fade,
  Tooltip,
  keyframes,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import LanguageIcon from '@mui/icons-material/Language';
import logo from './KalyokeLogo.png';

import { fetchVideoDataByStr } from '../FormPost';
import { SearchResultList } from '../../PlayerPage/SearchResults';

// アニメーションの定義
const glowEffect = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(74, 158, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(74, 158, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 5px rgba(74, 158, 255, 0.2);
  }
`;

const pulseScale = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// ナビゲーションリンク用のスタイル付きコンポーネント
const StyledNavLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: 'inherit',
}));

const StyledHeaderButton = styled(Button)(({ theme }) => ({
  color: 'white',
  margin: theme.spacing(0, 1),
  padding: theme.spacing(1, 2),
  borderRadius: '8px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  background: 'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(45deg, rgba(74,158,255,0.1), rgba(74,158,255,0))',
    transform: 'translateX(-100%)',
    transition: 'transform 0.6s ease',
  },
  '&:hover': {
    transform: 'translateY(-3px)',
    background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%)',
    animation: `${glowEffect} 2s infinite`,
    '&::before': {
      transform: 'translateX(100%)',
    },
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
}));

const StyledLogo = styled('img')(({ theme }) => ({
  marginRight: theme.spacing(2),
  height: '60px',
  position: 'relative',
  top: '15px',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.2))',
  '&:hover': {
    animation: `${pulseScale} 2s infinite`,
    filter: 'drop-shadow(0 0 12px rgba(74,158,255,0.4))',
  },
}));

interface HeaderItem {
  name: string;
  path: string;
}

interface LanguageToggleProps {
  currentLanguage: string;
  onToggle: () => void;
}

const headerItems: HeaderItem[] = [
  { name: "カラオケ！したい奴はここを押せ！", path: "/" },
  { name: "ピッチを変えたい！", path: "/pitch" },
  { name: "使い方", path: "/usage" },
  { name: "歌詞コピー", path: "/lyrics_copy" },
  { name: "プレイリスト", path: "/playlist" },
];

const hostUrl = process.env.REACT_APP_HOST_URL;

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.08),
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  height: '40px',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: '1em',
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '25ch',
    },
  },
}));

const StyledSearchButton = styled(Button)(({ theme }) => ({
  minWidth: '40px',
  height: '100%',
  borderRadius: '0 4px 4px 0',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    '& .MuiSvgIcon-root': {
      transform: 'scale(1.1) rotate(5deg)',
    },
  },
  '& .MuiSvgIcon-root': {
    transition: 'transform 0.3s ease',
  },
}));

const StyledDrawerItem = styled(ListItem)<{ component?: React.ElementType }>(({ theme }) => ({
  transition: 'all 0.3s ease',
  borderRadius: theme.spacing(1),
  margin: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: 'rgba(74, 158, 255, 0.1)',
    transform: 'translateX(5px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
}));

const LanguageToggle: React.FC<LanguageToggleProps> = ({ currentLanguage, onToggle }) => {
  return (
    <Tooltip title={`Switch to ${currentLanguage === 'EN' ? 'Japanese' : 'English'}`}>
      <Button
        onClick={onToggle}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minWidth: '50px',
          padding: '6px 12px',
          backgroundColor: currentLanguage === 'EN' ? '#004466' : '#006688',
          color: 'white',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: currentLanguage === 'EN' ? '#003355' : '#005577',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {currentLanguage === 'EN' ? 'JA' : 'EN'}
        <Box sx={{ width: '24px', height: '24px', ml: 1 }}>
          <LanguageIcon sx={{ width: '100%', height: '100%' }} />
        </Box>
      </Button>
    </Tooltip>
  );
};

export const Header: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>('JA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const handleSearch = async (): Promise<void> => {
    if (searchQuery.trim() !== '') {
      try {
        const fetchSearchResult = await fetchVideoDataByStr(searchQuery);
        setSearchResults(fetchSearchResult);
      } catch (error) {
        console.error("検索中にエラーが発生しました:", error);
      }
    }
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLanguageToggle = (): void => {
    setCurrentLanguage(currentLanguage === 'EN' ? 'JA' : 'EN');
  };

  const handleAccountToggle = (): void => {
    // アカウント関連の処理をここに実装
  };

  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        color: 'white',
        padding: 2,
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {headerItems.map((item, index) => (
          <StyledNavLink key={index} to={item.path}>
            <StyledDrawerItem>
              <ListItemText primary={item.name} />
            </StyledDrawerItem>
          </StyledNavLink>
        ))}
        <StyledDrawerItem onClick={handleAccountToggle}>
          <AccountCircle sx={{ mr: 2 }} />
          <ListItemText primary="アカウント" />
        </StyledDrawerItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      flexGrow: 1,
      position: 'relative',
      zIndex: 1200
    }}>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Toolbar sx={{ height: '70px' }}>
          <Fade in timeout={1000}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Link to="/">
                <StyledLogo
                  src={logo}
                  alt="logo"
                />
              </Link>
              {isMdUp && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                  {headerItems.map((item, index) => (
                    <StyledNavLink key={index} to={item.path}>
                      <StyledHeaderButton>
                        {item.name}
                      </StyledHeaderButton>
                    </StyledNavLink>
                  ))}
                </Box>
              )}
            </Box>
          </Fade>

          <Search>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <StyledSearchButton onClick={handleSearch}>
              <SearchIcon />
            </StyledSearchButton>
          </Search>

          <LanguageToggle currentLanguage={currentLanguage} onToggle={handleLanguageToggle} />

          {isMdUp ? (
            <Tooltip title="アカウント">
              <IconButton
                size="large"
                edge="end"
                onClick={handleAccountToggle}
                color="inherit"
                sx={{
                  ml: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(5deg)',
                    color: '#4a9eff',
                  },
                }}
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
          ) : (
            <IconButton
              size="large"
              edge="end"
              onClick={toggleDrawer(true)}
              color="inherit"
              sx={{
                ml: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1) rotate(5deg)',
                  color: '#4a9eff',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            boxShadow: '-5px 0 15px rgba(0,0,0,0.3)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <SearchResultList searchResults={searchResults} hostUrl={hostUrl} />
    </Box>
  );
}; 