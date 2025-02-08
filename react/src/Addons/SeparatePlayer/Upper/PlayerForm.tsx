import React, { useState, useCallback, useRef } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import * as FormPost from '../FormPost';
import { FormErrorMessages } from './FormErrorMessages';


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

  const resetForms = useCallback(() => {
    setYoutubeUrl("");
    setLyric("");
    setUrlError(null);
    setError(null);
    setLyricFormUrlWarningMessage([]);
    setLyricFormUrlErrorMessage("");
  }, [setYoutubeUrl, setLyric]);

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
    <>
      <Box sx={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        color: 'white',
        padding: '16px',
        margin: '2px'
      }}>
        <Box sx={{ marginBottom: 2 }}>
          <FormErrorMessages
            youtubeUrlErrorMessage={youtubeUrlErrorMessage}
            lyricFormErrorMessage={lyricFormErrorMessage}
            lyricFormWarningMessage={lyricFormWarningMessage}
          />
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">YoutubeURL</Typography>
            <Button
              variant='contained'
              onClick={resetForms}
              sx={{ width: '200px', height: '50px', backgroundColor: '#333', color: 'white', '&:hover': { backgroundColor: '#111' } }}
            >
              リセット
            </Button>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            value={youtubeUrl}
            onChange={handleUrlChange} // 入力変更時の処理
            onPaste={handleUrlPaste}   // 貼り付け時の処理
            onKeyDown={handleUrlEnterKeyDown} // Enter キー押下時の処理
            placeholder="https://www.youtube.com/watch?v=..."
            InputProps={{
              style: { backgroundColor: 'white', color: 'black' },
            }}
            error={Boolean(urlError)}
            helperText={urlError}
          />
        </Box>
        <Box sx={{ marginBottom: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">歌詞</Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant='outlined'
            value={lyric}
            onChange={handleLyricChange}
            placeholder='歌詞をここに入力してください'
            InputProps={{
              style: { backgroundColor: 'white', color: 'black' },
            }}
            inputRef={lyricTextFieldRef}
          />
        </Box>
        
        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ textAlign: 'center' }}>
          {isAutoSearchLyric ? (     
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} sx={{ color: 'white' }} />
              <Typography sx={{ color: 'white' }}>
                歌詞を検索中...
              </Typography>
            </Box>
          ) : (
            isPrepareKaraoke ? (    
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, height: '50px' }}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography sx={{ color: 'white' }}>
                  カラオケの準備をしています...
                </Typography>
              </Box>
            ) : (
              <Button
                variant='contained'
                onClick={prepareKaraoke}
                sx={{ 
                  width: '200px', 
                  height: '50px', 
                  backgroundColor: '#666', 
                  color: 'white', 
                  '&:hover': { backgroundColor: '#444' } 
                }}
              >
                Sing
              </Button>
            )
          )}
        </Box>
      </Box>
    </>
  )
};
