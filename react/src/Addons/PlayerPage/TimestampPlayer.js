import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Slider, Button, Typography } from '@mui/material';
import YouTube from 'react-youtube';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

function TimestampPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [instVolume, setInstVolume] = useState(50);
  const [vocalVolume, setVocalVolume] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(2);
  
  const lyricsWithTimestamps = useMemo(() => [
    { time: 0, text: '' },
    { time: 0, text: '' },
    { time: 0, text: '' },
    { time: 1, text: '無敵の笑顔で荒らすメディア' },
    { time: 3, text: '知りたいその秘密ミステリアス' },
    { time: 6, text: '抜けてるとこさえ彼女のエリア' },
    { time: 9, text: '完璧で嘘つきな君は' },
    { time: 11, text: '天才的なアイドル様' },
    { time: 14, text: '' },
    { time: 17, text: '今日何食べた？' },
    { time: 18, text: '好きな本は？' },
    { time: 20, text: '遊びに行くならどこに行くの？' },
    { time: 23, text: '何も食べてない' },
    { time: 24, text: 'それは内緒' },
    { time: 26, text: '何を聞かれてものらりくらり' },
    { time: 28, text: '' },
    { time: 29, text: 'そう淡々と' },
    { time: 30, text: 'だけど燦々と' },
    { time: 31, text: '見えそうで見えない秘密は蜜の味' },
    { time: 34, text: 'あれもないないない' },
    { time: 35, text: 'これもないないない' },
    { time: 37, text: '好きなタイプは？' },
    { time: 38, text: '相手は？' },
    { time: 39, text: 'さあ答えて' },
    { time: 40, text: '' },
    { time: 40, text: '「誰かを好きになることなんて私分からなくてさ」' },
    { time: 46, text: '嘘か本当か知り得ない' },
    { time: 49, text: 'そんな言葉にまた一人堕ちる' },
    { time: 52, text: 'また好きにさせる' },
    { time: 54, text: '' },
    { time: 54, text: '誰もが目を奪われていく' },
    { time: 57, text: '君は完璧で究極のアイドル' },
    { time: 61, text: '金輪際現れない' },
    { time: 63, text: '一番星の生まれ変わり' },
    { time: 66, text: 'その笑顔で愛してるで' },
    { time: 69, text: '誰も彼も虜にしていく' },
    { time: 73, text: 'その瞳がその言葉が' },
    { time: 75, text: '嘘でもそれは完全なアイ' },
    { time: 78, text: '' },
    { time: 78, text: 'はいはいあの子は特別です' },
    { time: 81, text: '我々はハナからおまけです' },
    { time: 84, text: 'お星様の引き立て役Bです' },
    { time: 87, text: '全てがあの子のお陰なわけない' },
    { time: 90, text: '洒落臭い' },
    { time: 91, text: '妬み嫉妬なんてないわけがない' },
    { time: 93, text: 'これはネタじゃない' },
    { time: 94, text: 'からこそ許せない' },
    { time: 95, text: '完璧じゃない君じゃ許せない' },
    { time: 97, text: '自分を許せない' },
    { time: 98, text: '誰よりも強い君以外は認めない' },
    { time: 101, text: '' },
    { time: 101, text: '誰もが信じ崇めてる' },
    { time: 103, text: 'まさに最強で無敵のアイドル' },
    { time: 107, text: '弱点なんて見当たらない' },
    { time: 109, text: '一番星を宿している' },
    { time: 112, text: '弱いとこなんて見せちゃダメダメ' },
    { time: 115, text: '知りたくないとこは見せずに' },
    { time: 118, text: '唯一無二じゃなくちゃイヤイヤ' },
    { time: 121, text: 'それこそ本物のアイ' },
    { time: 124, text: '' },
    { time: 124, text: '得意の笑顔で沸かすメディア' },
    { time: 127, text: '隠しきるこの秘密だけは' },
    { time: 131, text: '愛してるって嘘で積むキャリア' },
    { time: 134, text: 'これこそ私なりの愛だ' },
    { time: 137, text: '流れる汗も綺麗なアクア' },
    { time: 140, text: 'ルビーを隠したこの瞼' },
    { time: 143, text: '歌い踊り舞う私はマリア' },
    { time: 147, text: 'そう嘘はとびきりの愛だ' },
    { time: 150, text: '' },
    { time: 151, text: '誰かに愛されたことも' },
    { time: 154, text: '誰かのこと愛したこともない' },
    { time: 157, text: 'そんな私の嘘がいつか本当になること' },
    { time: 163, text: '信じてる' },
    { time: 164, text: '' },
    { time: 164, text: 'いつかきっと全部手に入れる' },
    { time: 167, text: '私はそう欲張りなアイドル' },
    { time: 171, text: '等身大でみんなのこと' },
    { time: 173, text: 'ちゃんと愛したいから' },
    { time: 176, text: '今日も嘘をつくの' },
    { time: 178, text: 'この言葉がいつか本当になる日を願って' },
    { time: 182, text: 'それでもまだ' },
    { time: 184, text: '君と君にだけは言えずにいたけど' },
    { time: 188, text: 'やっと言えた' },
    { time: 190, text: 'これは絶対嘘じゃない' },
    { time: 192, text: '愛してる' },
    { time: 194, text: '' },
  ], []);

  const playerRef = useRef(null);
  const lyricsRef = useRef(null);

  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const handleInstVolumeChange = (event, newValue) => {
    setInstVolume(newValue);
    // Inst音量調整処理
  };

  const handleVocalVolumeChange = (event, newValue) => {
    setVocalVolume(newValue);
    // Vocal音量調整処理
  };

  const handleOverlayClick = () => {
    setShowControls(true);
    setTimeout(() => {
      setShowControls(false);
    }, 5000);
  };

  const handleSeekChange = (event, newValue) => {
    playerRef.current.seekTo(newValue);
    setCurrentTime(newValue);
  };

  useEffect(() => {
    if (lyricsRef.current) {
      const initialLyricElement = lyricsRef.current.children[0]; // 最初の歌詞を取得
      if (initialLyricElement) {
        const scrollTopValue = initialLyricElement.offsetTop - lyricsRef.current.clientHeight / 2 + initialLyricElement.clientHeight / 2;
        lyricsRef.current.scrollTo({ top: scrollTopValue, behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);

        const currentIndex = lyricsWithTimestamps.findIndex(
          (lyric, index) =>
            time >= lyric.time &&
            (index === lyricsWithTimestamps.length - 1 || time < lyricsWithTimestamps[index + 1].time)
        );
        setCurrentLyricIndex(currentIndex);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, lyricsWithTimestamps]);

  return (
    <Box sx={{
      position: 'relative',
      width: '80%',
      margin: '100px auto'
    }}>
      <YouTube
        videoId="ZRtdQ81jPUQ" // YouTubeの動画IDを指定
        opts={{
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
          },
        }}
        onReady={handlePlayerReady}
        style={{ aspectRatio: '16/9' }}
      />

      {/* 歌詞表示部分 */}
      <Box
        ref={lyricsRef}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflowY: 'hidden', // 表示行数を制限するためにoverflowをhiddenに設定
          pointerEvents: 'none', // YouTube操作を無効化
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '200px', // 5行分の高さに調整
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              transform: `translateY(-${(currentLyricIndex - 2) * 40}px)`, // 行ごとに20%上に移動
              transition: 'transform 0.5s ease', // なめらかなアニメーション
            }}
          >
            {/* 常に5行のみ表示 */}
            {lyricsWithTimestamps.map((line, index) => (
            <Typography
              key={index}
              sx={{
                color: 'white',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)', // フチを追加
                fontSize: index === currentLyricIndex ? '32px' : '24px', // 中央行は少し大きく
                opacity: index === currentLyricIndex ? 1 : 0.6, // 中央行は透明度0
                whiteSpace: 'pre-wrap',
                minHeight: '40px', // 空行でも40pxの高さを確保
              }}
            >
              {line.text}
            </Typography>
          ))}
          </Box>
        </Box>
      </Box>

      {/* コントローラー */}
      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2,
          }}
        >
          {/* 音量調整バー */}
          <Box sx={{ position: 'absolute', left: '10px', height: '80%', top: '10%' }}>
            <Slider
              value={instVolume}
              onChange={handleInstVolumeChange}
              orientation="vertical"
              sx={{
                height: '100%',
                color: 'white',
              }}
            />
          </Box>
          <Box sx={{ position: 'absolute', right: '10px', height: '80%', top: '10%' }}>
            <Slider
              value={vocalVolume}
              onChange={handleVocalVolumeChange}
              orientation="vertical"
              sx={{
                height: '100%',
                color: 'white',
              }}
            />
          </Box>

          {/* 再生・一時停止ボタン */}
          <Button
            onClick={handlePlayPause}
            sx={{
              position: 'absolute',
              bottom: '20px',
              left: '10px',
              color: 'white',
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </Button>

          {/* シークバー */}
          <Slider
            value={currentTime}
            min={0}
            max={duration}
            onChange={handleSeekChange}
            sx={{
              width: '80%',
              position: 'absolute',
              bottom: '10px',
              color: 'white',
            }}
          />
        </Box>
      )}

      {/* 透明なオーバーレイ */}
      <Box
        onClick={handleOverlayClick}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0)', // 透明な背景
          zIndex: 1,
        }}
      />
    </Box>
  );
}

export default TimestampPlayer;
