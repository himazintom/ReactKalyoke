import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import * as FormPost from '../FormPost';
import { FormErrorMessages } from './FormErrorMessages';
import Cookies from 'js-cookie';

interface PlayerFormProps {
  onPrepareKaraoke: (videoId: string, lyric: string) => Promise<void>;
}


export const PlayerForm: React.FC<PlayerFormProps> = ({
  onPrepareKaraoke,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [lyric, setLyric] = useState<string>('');
  const lyricUpdateIntervalDay = Number(process.env.REACT_APP_LYRIC_UPDATE_INTERVAL_DAY) || 7;
  const beforeYoutubeUrlFormVideoId = useRef<string>('');
  const beforeVideoId = useRef<string>('');
  const beforeLyric = useRef<string>('');

  const [isAutoSearchLyric, setIsAutoSearchLyric] = useState<boolean>(false);
  const [isPrepareKaraoke, setIsPrepareKaraoke] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const lyricTextFieldRef = useRef<HTMLInputElement>(null);

  const [youtubeUrlErrorMessage, setYoutubeUrlErrorMessage] = useState<string>('');
  const [lyricFormErrorMessage, setLyricFormUrlErrorMessage] = useState<string>('');
  const [lyricFormWarningMessage, setLyricFormUrlWarningMessage] = useState<string[]>([]);

  useEffect(() => {
    const fetchLastSongData = async () => {
      const yourHistory = JSON.parse(Cookies.get('yourHistory') || '[]');
      if (yourHistory.length > 0) {
        const videoId = yourHistory[0]['videoId'];

        const url = 'https://www.youtube.com/watch?v=' + videoId;
        setYoutubeUrl(url);
        const lyric = await FormPost.fetchLyricFromDB(videoId);
        if (lyric == null) {
          setLyric("");
        } else {
          setLyric(lyric);
        }
      }
    };

    fetchLastSongData();
  }, []);


  const resetForms = () => {
    setYoutubeUrl("");
    setLyric("");
    setUrlError(null);
    setError(null);
    setLyricFormUrlWarningMessage([]);
    setLyricFormUrlErrorMessage("");
  };

  const extractVideoId = (youtubeUrl: string): string | null => {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;
    const match = youtubeUrl.match(regex);
    if (!match) {
      const regex2 = /https:\/\/himazi\.f5\.si\/search_id\/([\w-]{11})/;
      const match2 = youtubeUrl.match(regex2);
      return match2 ? match2[1] : null;
    }
    return match[1];
  }

  const searchAndSaveLyric = async (videoId: string, title: string, language: string): Promise<string> => {
    try {
      const searchedLyric = await FormPost.searchLyricFromWeb(title, language);
      if (searchedLyric) {
        await FormPost.updateLyricUpdateDate(videoId);
        return searchedLyric;
      }
      return "";
    } catch (error) {
      console.error("Error in searchAndSaveLyric:", error);
      return "";
    }
  };

  const autoSearchLyric = useCallback(async (videoId: string, language = "en"): Promise<string> => {
    try {
      setIsAutoSearchLyric(true);
      const existCheck = await FormPost.checkVideoExist(videoId);
      let resultLyric = "";
  
      if (existCheck) {
        const fetchedLyric = await FormPost.fetchLyricFromDB(videoId);
  
        if (fetchedLyric) {
          resultLyric = fetchedLyric;
        } else {
          const nowDate = new Date();
          let lyricUpdateDateDB = await FormPost.fetchLyricUpdateDateFromDB(videoId);
          let lyricUpdateDate: Date = lyricUpdateDateDB ? new Date(lyricUpdateDateDB) : nowDate;
  
          if (isNaN(lyricUpdateDate.getTime())) lyricUpdateDate = nowDate;
  
          const diffDays = Math.round((nowDate.getTime() - lyricUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
  
          if (diffDays > lyricUpdateIntervalDay) {
            const title = await FormPost.getTitleByVideoId(videoId);
            if (title) {
              resultLyric = await searchAndSaveLyric(videoId, title, language);
            }
          }
        }
      } else {
        const title = await FormPost.getTitleByVideoId(videoId);
        if (title) {
          resultLyric = await searchAndSaveLyric(videoId, title, language);
        }
      }
  
      return resultLyric;
    } catch (error) {
      console.error("Error in autoSearchLyric:", error);
      return "";
    } finally {
      setIsAutoSearchLyric(false);
    }
  }, [lyricUpdateIntervalDay]);

  const processUrl = useCallback(async (url: string) => {
    try {
      let videoId = extractVideoId(url);
      if (!videoId) {
        setYoutubeUrlErrorMessage("無効なYouTube URLです。");
        setLyric("");
        return;
      }

      setYoutubeUrlErrorMessage(""); // エラーが解消された場合

      if (videoId !== beforeYoutubeUrlFormVideoId.current) { // 新しい videoId の場合
        beforeYoutubeUrlFormVideoId.current = videoId;

        const searchedLyric = await autoSearchLyric(videoId);
        setLyric(searchedLyric);
      }
    } catch (error) {
      console.error("Error processing URL:", error);
      setYoutubeUrlErrorMessage("URLの処理中にエラーが発生しました。");
    }
  }, [autoSearchLyric]);

  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setYoutubeUrl(url);
  }, []);

  const handleLyricChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newLyric = event.target.value;
    setLyric(newLyric);
  }, []);

  const handleUrlEnterKeyDown = useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      await processUrl(youtubeUrl);
      lyricTextFieldRef.current?.focus(); // フォーカスを歌詞フォームに移動
    }
  }, [youtubeUrl, processUrl]);

  const handleUrlPaste = useCallback(async (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault(); // デフォルトの貼り付け処理を無効化
    const pastedText = event.clipboardData.getData('text'); // 貼り付けられたテキストを取得
    setYoutubeUrl(pastedText); // 値を更新
    await processUrl(pastedText); // 貼り付け後の URL を処理
  }, [processUrl]);

  const prepareKaraoke = useCallback(async () => {//カラオケの準備をする関数①
    try {
      setIsPrepareKaraoke(true);
      //もし無効なURLなら返す
      const videoId = extractVideoId(youtubeUrl);
      if (!videoId) {
        setYoutubeUrlErrorMessage("無効なYouTube URLです。");
        return;
      }

      //もし以前と同じURLで歌詞も変わっていないなら返す
      if(beforeVideoId.current === videoId){
        if(beforeLyric.current === lyric){
          return;
        }
      }
      beforeVideoId.current = videoId;
      beforeLyric.current = lyric;

      await onPrepareKaraoke(videoId, lyric);
    } catch (error) {
      console.error("Error preparing karaoke:", error);
    } finally {
      setIsPrepareKaraoke(false);
    }

  }, [onPrepareKaraoke, youtubeUrl, lyric]);

  return (
    <Box sx={{
      background: 'linear-gradient(145deg, rgba(26,26,26,0.95) 0%, rgba(38,38,38,0.9) 100%)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <FormErrorMessages
        youtubeUrlErrorMessage={youtubeUrlErrorMessage}
        lyricFormErrorMessage={lyricFormErrorMessage}
        lyricFormWarningMessage={lyricFormWarningMessage}
      />
      
      {/* URLセクション */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Typography 
            variant="h4" 
            sx={{
              background: 'linear-gradient(45deg, #fff, #ccc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 600
            }}
          >
            YoutubeURL
          </Typography>
          <Button
            variant='contained'
            onClick={resetForms}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '12px',
              padding: '10px 24px',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            リセット
          </Button>
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          value={youtubeUrl}
          onChange={handleUrlChange}
          onPaste={handleUrlPaste}
          onKeyDown={handleUrlEnterKeyDown}
          placeholder="https://www.youtube.com/watch?v=..."
          InputProps={{
            sx: {
              backgroundColor: 'rgba(255,255,255,0.8)',
              color: 'black',
              borderRadius: '12px',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255,255,255,0.4)',
              }
            }
          }}
          error={Boolean(urlError)}
          helperText={urlError}
        />
      </Box>

      {/* 歌詞セクション */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{
            mb: 2,
            background: 'linear-gradient(45deg, #fff, #ccc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600
          }}
        >
          歌詞
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={10}
          variant='outlined'
          value={lyric}
          onChange={handleLyricChange}
          placeholder='歌詞をここに入力してください'
          inputRef={lyricTextFieldRef}
          InputProps={{
            sx: {
              backgroundColor: 'rgba(255,255,255)',
              color: 'black',
              borderRadius: '12px',
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },

              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255,255,255,0.4)',
              },
              '& textarea': {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(45deg, #4a9eff 30%, #2979ff 90%)',
                  borderRadius: '4px',
                  border: '2px solid transparent',
                  backgroundClip: 'padding-box',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5aafff 30%, #3989ff 90%)',
                  }
                },
              },
            }
          }}
        />
      </Box>

      {error && (
        <Typography 
          color="error" 
          sx={{ 
            mb: 2,
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          {error}
        </Typography>
      )}

      {/* アクションボタン */}
      <Box sx={{ textAlign: 'center' }}>
        {isAutoSearchLyric ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 2 
          }}>
            <CircularProgress 
              size={24} 
              sx={{ 
                color: '#4a9eff'
              }} 
            />
            <Typography sx={{ color: 'white' }}>
              歌詞を検索中...
            </Typography>
          </Box>
        ) : isPrepareKaraoke ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 2, 
            height: '56px' 
          }}>
            <CircularProgress 
              sx={{ 
                color: '#4a9eff'
              }} 
            />
            <Typography sx={{ color: 'white' }}>
              カラオケの準備をしています...
            </Typography>
          </Box>
        ) : (
          <Button
            variant='contained'
            onClick={prepareKaraoke}
            disabled={isAutoSearchLyric || isPrepareKaraoke}
            sx={{
              width: '200px',
              height: '56px',
              background: 'linear-gradient(45deg, #4a9eff 30%, #2979ff 90%)',
              borderRadius: '12px',
              fontSize: '1.2rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 20px rgba(41,121,255,0.4)'
              },
              '&:disabled': {
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)'
              }
            }}
          >
            Sing
          </Button>
        )}
      </Box>
    </Box>
  )
};
