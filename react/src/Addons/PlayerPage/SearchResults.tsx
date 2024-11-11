import { Box, Paper } from '@mui/material';
import { motion, AnimatePresence, color } from 'framer-motion';
import { styled } from '@mui/material/styles';

const ScrollableResults = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '64px', // Header height
  right: 0,
  width: '300px',
  maxHeight: '400px',
  overflowY: 'auto',
  zIndex: 1000,
  // backgroundColor: theme.palette.background.paper, // 背景色の設定
  borderRadius: '4px',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.background.paper,
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.primary.main,
    borderRadius: '4px',
  },
}));

const SearchResultItem = styled(motion(Paper))(({ theme }) => ({
  margin: '8px',
  padding: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease', // スムーズな背景変化
  backgroundColor: theme.palette.background.default, // デフォルトの背景色
  '&:hover': {
    backgroundColor: '#f0f0f0' // 白とはいいろに変更
  },
}));

export const SearchResultList = ({ searchResults = [], hostUrl = '' }) => {
  return (
    <AnimatePresence>
      {searchResults.length > 0 && (
        <ScrollableResults
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {searchResults.map((result, index) => (
            <SearchResultItem
              key={index}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: index * 0.1
              }}
              elevation={1}
            >
              <a 
                href={`${hostUrl}/search_id/${result.videoid}`}
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  display: 'block'
                }}
              >
                {result.title}
              </a>
            </SearchResultItem>
          ))}
        </ScrollableResults>
      )}
    </AnimatePresence>
  );
}