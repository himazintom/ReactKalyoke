import { Box, Typography } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import TimestampAndLyric from '../../types/TimestampAndLyric';

export interface LyricUIHandles {
  prepareLyricUI: (isTimestamped: boolean, timestampAndLyric: TimestampAndLyric[]) => Promise<void>;
  setCurrentLyricIndex: (index: number) => void;
  scrollToTop: () => void;
}

interface LyricUIProps {
  isLyricCC: boolean;
}

export const LyricUI = forwardRef<LyricUIHandles, LyricUIProps>(({isLyricCC}, ref) => {

  const lyricScrollBoxRef = useRef<HTMLDivElement>(null);
  const lyricLineRef = useRef<HTMLSpanElement[]>([]);
  const [playerLyricList, setPlayerLyricList] = useState<TimestampAndLyric[]>([]);
  const [isTimestamped, setIsTimestamped] = useState<boolean>(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);

  const prepareLyricUI = async (isTimestamped: boolean, timestampAndLyric: TimestampAndLyric[]) => {
    if(timestampAndLyric !== playerLyricList){
      scrollToTop();
      setPlayerLyricList(timestampAndLyric);
      setIsTimestamped(isTimestamped);
    }
  };

  useImperativeHandle(ref, () => ({
    prepareLyricUI: prepareLyricUI,
    setCurrentLyricIndex: setCurrentLyricIndex,
    scrollToTop: scrollToTop,
  }));

  const scrollToTop = () => {
    lyricScrollBoxRef.current?.scrollTo({
      top: 0, // 一番上にスクロール
      behavior: "smooth", // スムーズなスクロールを指定
    });
  }

  useEffect(() => {
    if (lyricLineRef.current[currentLyricIndex]) {
      lyricLineRef.current[currentLyricIndex].scrollIntoView({
        behavior: 'smooth',  // スムーズにスクロール
        block: 'center',     // 中央に表示
      });
    }
  }, [currentLyricIndex]);

  return(
    <Box
      sx={{

        position: 'absolute',
        maxWidth: '80%',
        height: {
          xs: '150px',
          sm: '200px',
          md: '250px',
        },
        left: '50%',
        top: {
          xs: '5%',
          sm: '10%',
          md: '20%',
          lg: '30%',
        },
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        display: isLyricCC ? 'flex': 'none',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        zIndex: isTimestamped ? 1 : 3, // タイムスタンプモードではクリック不可
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Box
        ref={lyricScrollBoxRef}
        sx={{
          height: {
            xs: '150px',
            sm: '200px',
            md: '250px',
          },
          overflowY: isTimestamped ? 'hidden' : 'scroll',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Box sx={{ display: isTimestamped ? 'block' : 'none' }}>
          {playerLyricList.map((line, index) => (
            <Typography
              key={index}
              ref={(el) => {
                if (el) lyricLineRef.current[index] = el;
              }}
              sx={{
                minHeight: {
                  xs: '30px',
                  sm: '40px',
                  md: '50px',
                },
                color: 'white',
                fontSize: {
                  xs: '16px',
                  sm: '22px',
                  md: '28px',
                },
                opacity: index === currentLyricIndex ? 1 : 0.6,
                textAlign: 'center',
                textShadow: `
                  2px 2px 4px rgba(0, 0, 0, 1.0),
                  -2px 2px 4px rgba(0, 0, 0, 1.0),
                  2px -2px 4px rgba(0, 0, 0, 1.0),
                  -2px -2px 4px rgba(0, 0, 0, 1.0)
                `,
                transition: 'opacity 0.5s ease',
              }}
            >
              {line.lyric || ''}
            </Typography>
          ))}
        </Box>
        <Box
          sx={{
            display: isTimestamped ? 'none' : 'block',
          }}
        >
          {playerLyricList.map((line, index) => {
            return (
              <Typography
                key={index}
                sx={{
                  minHeight: {
                    xs: '30px',
                    sm: '40px',
                    md: '50px',
                  },
                  color: 'white',
                  fontSize: {
                    xs: '16px',
                    sm: '22px',
                    md: '28px',
                  },
                  textAlign: 'center',
                  textShadow: `
                    2px 2px 4px rgba(0, 0, 0, 1.0),
                    -2px 2px 4px rgba(0, 0, 0, 1.0),
                    2px -2px 4px rgba(0, 0, 0, 1.0),
                    -2px -2px 4px rgba(0, 0, 0, 1.0)
                  `,
                }}
              >
                {line.lyric || ''}
              </Typography>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
});

