import { motion, AnimatePresence, color } from 'framer-motion';
import { styled } from '@mui/material/styles';

const ScrollableResults = styled(motion.div)(({ theme }) => ({
  position: 'absolute',
  top: '64px',
  right: 0,
  width: '300px',
  maxHeight: '400px',
  overflowY: 'auto',
  overflowX: 'hidden', // 横スクロールを隠す
  zIndex: 1000,
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

// aタグのスタイルを別途定義
const StyledLink = styled('a')({
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  width: '100%',
  height: '100%'
});

const SearchResultItem = styled(motion.div)(({ theme }) => ({
  margin: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
  backgroundColor: theme.palette.background.default,
  '&:hover': {
    backgroundColor: '#f0f0f0'
  },
  whiteSpace: 'normal', // テキストを折り返す
  wordWrap: 'break-word', // 長い単語を折り返す
}));

interface SearchResult {
  videoId: string;
  title: string;
}

export const SearchResultList = ({ searchResults = [] as SearchResult[], hostUrl = '' }) => {
  return (
    <AnimatePresence>
      {searchResults.length > 0 && (
        <ScrollableResults
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {searchResults.map((result, index) => (
            <StyledLink 
              key={index}
              href={`${hostUrl}/search_id/${result.videoId}`}
            >
              <SearchResultItem
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  delay: index * 0.1
                }}
                sx={{ padding: '12px' }} // paddingをここに移動
              >
                {result.title}
              </SearchResultItem>
            </StyledLink>
          ))}
        </ScrollableResults>
      )}
    </AnimatePresence>
  );
}