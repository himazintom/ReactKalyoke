import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, TextField, CircularProgress } from '@mui/material';
import * as FormPost from '../PlayerPage/FormPost';

function Playlist() {
  const [youtubePlaylistUrlErrorMessage, setYoutubePlaylistUrlErrorMessage] = useState('');
  const [youtubePlaylistUrl, setYoutubePlaylistUrl] = useState('');
  const [preparePlaylistKaraokeStatus, setPreparePlaylistKaraokeStatus] = useState(0);
  const [playlistDatas, setPlaylistDatas] = useState([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
  const [isMovieProcess, setIdMovieProcess] = useState(-1);
  const itemRefs = useRef([]); // Ref for tracking each item

  const extractPlaylistId = (youtubePlaylistUrl) => {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:playlist\?list=|watch\?.*list=))([\w-]{34})(?:\S+)?$/;
    const match = youtubePlaylistUrl.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const preparePlaylistKaraoke = async () => {
      let playlistId;
      if (preparePlaylistKaraokeStatus > 0) {
        playlistId = extractPlaylistId(youtubePlaylistUrl);
      }
      switch (preparePlaylistKaraokeStatus) {
        case 0:
          break;
        case 1:
          if (!playlistId) {
            setYoutubePlaylistUrlErrorMessage('入力されたURLはYouTubeのURLの形式ではありません');
            return;
          } else {
            setYoutubePlaylistUrlErrorMessage('');
          }
          setPreparePlaylistKaraokeStatus(2);
          break;
        case 2:
          setIdMovieProcess(-1);
          setIsPlaylistLoading(true);
          try {
            const datas = await FormPost.fetchPlaylistDatas(youtubePlaylistUrl);
            if (datas.length === 0) {
              setYoutubePlaylistUrlErrorMessage('処理の途中でエラーが発生しました');
              return;
            }
            setPlaylistDatas(datas);
            setIdMovieProcess(0);
          } catch (error) {
            setYoutubePlaylistUrlErrorMessage('データの取得に失敗しました');
          } finally {
            setIsPlaylistLoading(false);
            setPreparePlaylistKaraokeStatus(3);
          }
          break;
        case 3:
          const datas = playlistDatas;
          let errorMessage = [];

          for (let i = 0; i < datas.length; i++) {
            const data = datas[i];
            const existCheck = await FormPost.checkVideoExist(data['videoid']);
            if (!existCheck.exists) {//曲がデータベースになかったら
              const url = 'https://www.youtube.com/watch?v=' + data['videoid'];
              const lyric = await FormPost.getLyricByWeb(data['title'], 'ja');
              const updateLyric = lyric === 'Null' ? '' : lyric;
              const videoCheck = await FormPost.Demucs(url, data['videoid'], updateLyric);
              if (!videoCheck) {
                errorMessage.push(`${data['title']} (${data['videoid']}) の用意中にエラーが起こりました`);
              }
            }
            setIdMovieProcess(i);
          }
          setYoutubePlaylistUrlErrorMessage(errorMessage.join('\n'));
          setPreparePlaylistKaraokeStatus(4);
          break;
        default:
          break;
      }
    };

    preparePlaylistKaraoke();
  }, [preparePlaylistKaraokeStatus]);

  // Smooth scrolling effect when isMovieProcess changes
  useEffect(() => {
    if (itemRefs.current[isMovieProcess]) {
      itemRefs.current[isMovieProcess].scrollIntoView({
        behavior: 'smooth',
        block: 'start',  // Ensure item is at the top of the block
      });
    }
  }, [isMovieProcess]);

  const resetForms = () => {
    setYoutubePlaylistUrl('');
    setYoutubePlaylistUrlErrorMessage('');
    setPreparePlaylistKaraokeStatus(0);
  };

  const handleYoutubePlaylistUrlChange = (e) => {
    setYoutubePlaylistUrl(e.target.value);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{
        width: { xs: '100%', md: '50%' },
        padding: 2,
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        color: 'white',
        marginBottom: { xs: 2, md: 0 }
      }}>
        {youtubePlaylistUrlErrorMessage && (
          <Typography color='error' sx={{ width: '100%', textAlign: 'center' }}>
            {youtubePlaylistUrlErrorMessage}
          </Typography>
        )}

        <Box sx={{ textAlign: 'left', color: 'white', marginBottom: 2 }}>
          ※プレイリストを「非公開」ではなく「限定公開」または「公開」にしてください
          <br />
          ※違った歌詞が登録されることがあります。もし間違いを見つけたら修正してくれるとうれしいです
        </Box>

        <Box sx={{ marginBottom: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Youtube Playlist URL</h3>
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
            variant='outlined'
            value={youtubePlaylistUrl}
            onChange={handleYoutubePlaylistUrlChange}
            placeholder='https://www.youtube.com/playlist?list=...'
            InputProps={{
              style: { backgroundColor: 'white', color: 'black' },
            }}
          />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          {preparePlaylistKaraokeStatus === 0 && (
            <Button
              variant='contained'
              onClick={() => setPreparePlaylistKaraokeStatus(1)}
              sx={{ width: '200px', height: '50px', backgroundColor: '#333', color: 'white', '&:hover': { backgroundColor: '#111' } }}
            >
              Make
            </Button>
          )}
        </Box>

        {isPlaylistLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
            <CircularProgress sx={{ color: 'white' }} />
            <Typography sx={{ marginLeft: 2, color: 'white' }}>プレイリストを取得中...</Typography>
          </Box>
        )}

        {!isPlaylistLoading && playlistDatas.length > 0 && (
           <Box sx={{ marginTop: 4 }}>
      <Typography variant="h6">プレイリストの動画一覧:</Typography>
      
        {/* 縦にスクロールできるブロック */}
        <Box 
          sx={{
            height: '300px',  // 高さを指定して3～4アイテム分の表示領域を設定
            overflowY: 'auto', // 縦スクロールを有効化
            border: '1px solid #ccc', // 境界線で視覚的に分かりやすくする
            padding: 2,
          }}
        >
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {playlistDatas.map((video, index) => (
              <li
                key={index}
                ref={(el) => (itemRefs.current[index] = el)} // Add ref to each item
                style={{ position: 'relative', marginBottom: '20px' }}
              >
                {/* サムネイル画像 */}
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  style={{ width: '120px', marginRight: '10px' }} 
                />
                
                {/* 黒いオーバーレイ */}
                {isMovieProcess < index && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '120px',
                      height: '70px',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明の黒
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CircularProgress style={{ color: 'white' }} />
                  </div>
                )}

                {/* 動画のタイトル */}
                <Typography variant="body1" sx={{ color: 'white' }}>{video.title}</Typography>
              </li>
            ))}
          </ul>
        </Box>
      </Box>
        )}
      </Box>
    </Box>
  );
}

export default Playlist;
