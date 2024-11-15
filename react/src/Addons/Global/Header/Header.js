import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText, Box, Button } from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';  // 追加: MenuIconをインポート
import logo from './KalyokeLogo.png';
import { styled, alpha } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import LanguageIcon from '@mui/icons-material/Language';

import { fetchVideoDataByStr } from '../FormPost.js';
import { SearchResultList } from '../../PlayerPage/SearchResults.tsx';

import './Header.css';

const headerItems = [
  { name: "使い方", path: "/usage" },
  { name: "歌詞コピー", path: "/lyrics_copy" },
  { name: "プレイリスト", path: "/playlist" },
];

const hostUrl = process.env.REACT_APP_HOST_URL;

const LanguageToggle = ({ currentLanguage, onToggle }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        onClick={onToggle}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '50px',
          padding: '5px 10px',
          backgroundColor: currentLanguage === 'EN' ? '#004466' : '#006688',
          color: 'white',
          borderRadius: '5px'
        }}
      >
        {currentLanguage === 'EN' ? 'JA' : 'EN'}
        <Box sx={{ width: '30px', height: '30px', ml: 1 }}>
          <LanguageIcon sx={{ width: '100%', height: '100%' }} />
        </Box>
      </Button>
    </Box>
  );
};

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  height: '50px',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: '1em', //`calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export const Header = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('JA');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const handleSearch = async () => {
    if (searchQuery.trim() !== '') {
      console.log('Searching for:', searchQuery);
      
      try {
        // 非同期処理を待機して結果を取得
        const searchResult = await fetchVideoDataByStr(searchQuery);
        console.log('Result:', searchResult);
  
        // 結果をステートにセット
        setSearchResults(searchResult);
        
      } catch (error) {
        console.error("検索中にエラーが発生しました:", error);
      }
    }
  };

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleLanguageToggle = () => {
    setCurrentLanguage(currentLanguage === 'EN' ? 'JA' : 'EN');
  };

  const handleAccountToggle = () => {
    console.log("account");
  }

  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {headerItems.map((item, index) => (
          <ListItem button key={index} component={Link} to={item.path}>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
        <ListItem button onClick={handleAccountToggle}>
          <AccountCircle />
          <ListItemText primary="アカウント" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" className="header-gradient-background">
        <Toolbar sx={{ height: '64px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link to="/">
            <img
              src={logo}
              className="header-logo" 
              alt="logo" 
              style={{ marginRight: '16px', height: '60px', position: 'relative', top: '15px' }} 
            />
            </Link>
            {isMdUp && (//もし画面がMdより大きかったらHeaderに一覧を表示する
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2}}>
                {headerItems.map((item, index) => (
                <Button
                  key={index}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  className='header-item' // classNameを設定
                  sx={{ overflow: 'hidden' }} // overflow: hiddenを適用
                >
                  {item.name}
                </Button>
              ))}
              </Box>
            )}
          </Box>
          <Search>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(); // Enterキーが押されたときにhandleSearchを呼び出す
                }
              }}
            />
            <Button onClick={handleSearch} sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
            </Button>
          </Search>
          
          <LanguageToggle currentLanguage={currentLanguage} onToggle={handleLanguageToggle} />
          {isMdUp ? (//画面が大きかったら
            <>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleAccountToggle}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </>
          ) : (//もし、画面が小さかったらサイドバーを表示
            <>  
              <IconButton
                size="large"                // ボタンサイズを指定。largeにより大きなボタンになる
                edge="end"                  // ボタンを端（右端または左端）に配置するためのプロパティ
                aria-label="menu"           // アクセシビリティ用のラベル。スクリーンリーダーなどで読み上げられる
                aria-controls="menu-appbar" // このボタンがコントロールするメニューのIDを指定
                aria-haspopup="true"        // メニューがポップアップとして表示されることを示す属性
                onClick={toggleDrawer(true)}// ボタンがクリックされたときにサイドドロワーを開く関数を呼び出す
                color="inherit"             // ボタンの色を継承する設定（通常は親コンポーネントの色を使用）
              >
                <MenuIcon />                {/*メニューアイコンを表示する。表示されるのは三本線のアイコン*/}
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
      <SearchResultList searchResults={searchResults} hostUrl={hostUrl} />
    </Box>
  );
}