import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Checkbox, FormControlLabel, Typography, Link } from '@mui/material';
import { useLocation } from 'react-router-dom';
import * as FormPost from './FormPost';


function UrlForm() {
  const [yourHistory, setYourHistory] = useState([]);
  const [everyoneHistory, setEveryoneHistory] = useState([]);
  const [recommendation, setRecommendations] = useState([]);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [lyric, setlyric] = useState('');
  const [isOverseas, setIsOverseas] = useState(false);
  const [youtubeUrlErrorMessage, setYoutubeUrlErrorMessage] = useState(''); // エラーメッセージ用の状態
  const [lyricFormErrorMessage, setLyricFormUrlErrorMessage] = useState(''); // エラーメッセージ用の状態
  const [lyricFormWarningMessage, setLyricFormUrlWarningMessage] = useState(''); // エラーメッセージ用の状態
  const [isChangeLyricForm, setIsChangeLyricForm]= useState(false);

  const location = useLocation();
  const videoData = location.state?.videoData;

  let beforeVideoId=""

  useEffect(() => {//searchidでページ推移されたときにformを記入済みにしておく
    if(videoData){
      setYoutubeUrl(`https://www.youtube.com/watch?v=${videoData.videoId}`);
      setlyric(videoData['lyric'])
    }
  }, []);  // 空の依存配列にすることで、初回マウント時にのみ実行される

  useEffect(() => {
    const fetchData = async () => {
      const history = await FormPost.fetchEveryoneHistory();
      setEveryoneHistory(history);
    };
  
    fetchData();
  }, []);  // 空の依存配列にすることで、初回マウント時にのみ実行される
  
  
  function extractVideoId(youtubeUrl) {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;
    const match = youtubeUrl.match(regex);
    return match ? match[1] : null;
  }

  const handleUrlChange = async (event) => {
    const url = event.target.value;
    setYoutubeUrl(url);
  
    let videoId = extractVideoId(url);
    if (videoId) {
      if(videoId!=beforeVideoId){
        beforeVideoId=videoId
        try {
          const lyric = await FormPost.fetchLyricFromDB(videoId);
          console.log("lyric=", lyric);
          setlyric(lyric);
        } catch (error) {
          console.error('Error fetching lyric:', error);
        }
      }
      
    }
  };

  function timestampExistCheck(text) {
    if (!text) {
      return false;  // 文字列が空または未定義の場合
    }
  
    // 歌詞を行ごとに分割
    const lines = text.split('\n');
    const timestampRegex = /\[\d{2}:\d{2}\.\d{2}\]/;
    let warnings = [];
    
    // いずれかの行にタイムスタンプが存在するかチェック
    let timestampExist = lines.some(line => timestampRegex.test(line));
    if (!timestampExist) {
      return false;  // タイムスタンプが一つもない場合、falseを返す
    }
  
    // 全ての行をチェックして、タイムスタンプがない場合は警告をリストに追加
    lines.forEach((line, index) => {
      if (line.trim() !== "" && !timestampRegex.test(line)) {
        warnings.push(`${index + 1}行目: 「${line}」にタイムスタンプがありません`);
      }
    });
    if(warnings.length > 0){//もしタイムスタンプ抜けがあったら警告文だけ出しておく
      setLyricFormUrlWarningMessage(warnings);
      return false;
    }
    return true; // タイムスタンプの問題がある行があれば警告のリストを、なければ true を返す
  }

  function timestampChronologyCheck(text) {
    if(text){
      const lines = text.split('\n');
      const timestampRegex = /\[\d{2}:\d{2}\.\d{2}\]/;
      let lastTimestamp = 0; // 最後に確認したタイムスタンプを初期化
    
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const timestampMatch = line.match(timestampRegex);
        if (timestampMatch) {
          // タイムスタンプを抽出して秒に変換
          const timeParts = timestampMatch[0].substring(1, timestampMatch[0].length - 1).split(':');
          const minutes = parseInt(timeParts[0], 10);
          const seconds = parseFloat(timeParts[1]);
          const currentTimestamp = minutes * 60 + seconds;
    
          if (currentTimestamp < lastTimestamp) {
            // 時系列に沿っていない場合
            setLyricFormUrlErrorMessage(`${i + 1}行目: 「${line}」が時系列に沿っていません。1行前より大きな時間を登録してください。`);
            return true;
          }
          lastTimestamp = currentTimestamp; // 最後のタイムスタンプを更新
        }
      }
    }
    return false;
  } 

  const handlelyricChange = (event) => {
    setLyricFormUrlErrorMessage('')
    if(!isChangeLyricForm){
      setIsChangeLyricForm('true');
    }
    setlyric(event.target.value);
  };

  const handleOverseasChange = (event) => {
    setIsOverseas(event.target.checked);
  };

  const handleSearchlyric = () => {
    console.log('検索された歌詞:', lyric);
  };

  const handleSing = async () => {
    let videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setYoutubeUrlErrorMessage("入力されたURLはYouTubeのURLの形式ではありません"); // エラーメッセージを設定
      return;
    } else {
      setYoutubeUrlErrorMessage(''); // エラーメッセージをクリア
    }

    if (timestampExistCheck(lyric)) { // すべての行にタイムスタンプがあったら
      if (!timestampChronologyCheck(lyric)) { // 時系列があっているかを最終チェック
        return; // 時系列が崩れてたらエラー文を出して無効にする
      }
    }

    if (beforeVideoId === videoId) { // videoIdが変わってないとき
      if (isChangeLyricForm) { // 歌詞に変更があった時
        const result = await FormPost.updateLyricInDB(videoId, lyric);
        if (result === "error") {
          setLyricFormUrlErrorMessage("歌詞の更新中にエラーが発生したようです");
        } else {
          setLyricFormUrlErrorMessage('歌詞が正常に更新されました');
        }
      }
    } else { // 新しく入力されたvideoIdのurlだったら
      try {
        const data = await FormPost.fetchDataFromApi(youtubeUrl, videoId, lyric); // 曲情報を取得
        console.log("data", data);
      } catch (error) {
        console.error("API呼び出し中にエラーが発生しました:", error);
        setLyricFormUrlErrorMessage("データの取得中にエラーが発生しました");
      }
    }
};

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      justifyContent: 'space-between',
      alignItems: { xs: 'center', md: 'flex-start' },
      padding: 2,
    }}>
      {/* 左側のおすすめセクション */}
      <Box sx={{
        width: { xs: '100%', md: '20%' },
        padding: 2,
        color: 'white',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        marginBottom: { xs: 2, md: 0 }
      }}>
        <Typography variant="h5" sx={{ marginBottom: 2 }}>あなたの履歴</Typography>
          {recommendation.map((song, index) => (
            <Typography key={index} sx={{ marginBottom: 1 }}>
              <Link href={song.url} target="_blank" rel="noopener" sx={{ color: 'inherit', textDecoration: 'none' }}>
                {song.title}
              </Link>
            </Typography>
          ))}
      </Box>

      {/* 中央のフォームセクション */}
      <Box sx={{
        width: { xs: '100%', md: '50%' },
        padding: 2,
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        color: 'white',
        marginBottom: { xs: 2, md: 0 }
      }}>
        {/* エラーメッセージ表示部分 */}
        {youtubeUrlErrorMessage && (
          <Typography color="error" sx={{ width: '100%', textAlign: 'center' }}>
            {youtubeUrlErrorMessage}
          </Typography>
        )}
        {lyricFormErrorMessage && (
          <Typography color="error" sx={{ width: '100%', textAlign: 'center' }}>
            {lyricFormErrorMessage}
          </Typography>
        )}
        {lyricFormWarningMessage && (//リストを１行ごと表示
          <Box sx={{ width: '100%', textAlign: 'center', color: 'yellow' }}>
            {lyricFormWarningMessage.map((message, index) => (
              <Typography key={index} variant="body2">
                {message}
              </Typography>
            ))}
          </Box>
        )}
        <Box sx={{ marginBottom: 2 }}>
          <h3>YoutubeURL</h3>
          <TextField
            fullWidth
            variant="outlined"
            value={youtubeUrl}
            onChange={handleUrlChange}
            placeholder="https://www.youtube.com/watch?v=..."
            InputProps={{
              style: { backgroundColor: 'white', color: 'black' },
            }}
          />
        </Box>
        <Box sx={{ marginBottom: 2 }}>
          <Box sx={{display:'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
            <h3>歌詞</h3>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isOverseas}
                    onChange={handleOverseasChange}
                    style={{ color: 'white' }}
                  />
                }
                label="海外の曲か？"
              />
              <Button
                variant="contained"
                onClick={handleSearchlyric}
                sx={{ marginLeft: 'auto', backgroundColor: '#555', color: 'white', '&:hover': { backgroundColor: '#333' } }}
              >
                歌詞検索
              </Button>
            </Box>
          </Box>
          <TextField
              fullWidth
              multiline
              rows={10}
              variant="outlined"
              value={lyric}
              onChange={handlelyricChange}
              placeholder="歌詞をここに入力してください"
              InputProps={{
                style: { backgroundColor: 'white', color: 'black' },
              }}
          />
        </Box>
        
        
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSing}
            sx={{ width: '200px', height: '50px', backgroundColor: '#333', color: 'white', '&:hover': { backgroundColor: '#111' } }}
          >
            ③Sing
          </Button>
        </Box>
      </Box>

      {/* 右側の履歴セクション */}
      <Box sx={{
        width: { xs: '100%', md: '25%' },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'white',
      }}>
        <Box sx={{
          padding: 2,
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          marginBottom: 2
        }}>
          <Typography variant="h5" sx={{ marginBottom: 2 }}>あなたの履歴</Typography>
          {yourHistory.map((song, index) => (
            <Typography key={index} sx={{ marginBottom: 1 }}>
              <Link href={song.url} target="_blank" rel="noopener" sx={{ color: 'inherit', textDecoration: 'none' }}>
                {song.title}
              </Link>
            </Typography>
          ))}
        </Box>
        <Box sx={{
          padding: 2,
          backgroundColor: '#1a1a1a',
          borderRadius: '8px'
        }}>
          <Typography variant="h5" sx={{ marginBottom: 2 }}>みんなの履歴</Typography>
          {everyoneHistory.map((song, index) => (
            <Typography key={index} sx={{ marginBottom: 1 }}>
              <Link href={song.url} target="_blank" rel="noopener" sx={{ color: 'inherit', textDecoration: 'none' }}>
                {song.title}
              </Link>
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default UrlForm;
