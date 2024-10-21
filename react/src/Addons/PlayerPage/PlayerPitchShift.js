import React, { useState, useRef, useEffect } from 'react';
import { Box, Slider, Button, Typography } from '@mui/material';
import YouTube from 'react-youtube';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import * as Tone from 'tone';

function PlayerPitchShift() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [instVolume, setInstVolume] = useState(100);
  const [vocalVolume, setVocalVolume] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showInitialOverlay, setShowInitialOverlay] = useState(true);
  const controlTimeoutRef = useRef(null);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const playerRef = useRef(null);
  const lyricsRef = useRef(null);
  const audioContextRef = useRef(null);
  const instGainNodeRef = useRef(null);
  const vocalGainNodeRef = useRef(null);
  const instAudioRef = useRef(null);
  const vocalAudioRef = useRef(null);
  const instPitchShiftRef = useRef(null);
  const vocalPitchShiftRef = useRef(null);

  const lyrics = [
    '', '無敵の笑顔で荒らすメディア', '知りたいその秘密ミステリアス',
    '抜けてるとこさえ彼女のエリア', '完璧で嘘つきな君は', '天才的なアイドル様',
    '', '今日何食べた？', '好きな本は？', '遊びに行くならどこに行くの？',
    '何も食べてない', 'それは内緒', '何を聞かれてものらりくらり',
    '', 'そう淡々と', 'だけど燦々と', '見えそうで見えない秘密は蜜の味',
    'あれもないないない', 'これもないないない', '好きなタイプは？', '相手は？',
    'さあ答えて', '', '「誰かを好きになることなんて私分からなくてさ」',
    '嘘か本当か知り得ない', 'そんな言葉にまた一人堕ちる', 'また好きにさせる',
    '', '誰もが目を奪われていく', '君は完璧で究極のアイドル', '金輪際現れない',
    '一番星の生まれ変わり', 'その笑顔で愛してるで', '誰も彼も虜にしていく',
    'その瞳がその言葉が', '嘘でもそれは完全なアイ', '', 'はいはいあの子は特別です',
    '我々はハナからおまけです', 'お星様の引き立て役Bです', '全てがあの子のお陰なわけない',
    '洒落臭い', '妬み嫉妬なんてないわけがない', 'これはネタじゃない', 'からこそ許せない',
    '完璧じゃない君じゃ許せない', '自分を許せない', '誰よりも強い君以外は認めない',
    '', '誰もが信じ崇めてる', 'まさに最強で無敵のアイドル', '弱点なんて見当たらない',
    '一番星を宿している', '弱いとこなんて見せちゃダメダメ', '知りたくないとこは見せずに',
    '唯一無二じゃなくちゃイヤイヤ', 'それこそ本物のアイ', '', '得意の笑顔で沸かすメディア',
    '隠しきるこの秘密だけは', '愛してるって嘘で積むキャリア', 'これこそ私なりの愛だ',
    '流れる汗も綺麗なアクア', 'ルビーを隠したこの瞼', '歌い踊り舞う私はマリア',
    'そう嘘はとびきりの愛だ', '', '誰かに愛されたことも', '誰かのこと愛したこともない',
    'そんな私の嘘がいつか本当になること', '信じてる', '', 'いつかきっと全部手に入れる',
    '私はそう欲張りなアイドル', '等身大でみんなのこと', 'ちゃんと愛したいから',
    '今日も嘘をつくの', 'この言葉がいつか本当になる日を願って', 'それでもまだ',
    '君と君にだけは言えずにいたけど', 'やっと言えた', 'これは絶対嘘じゃない',
    '愛してる', '',
  ];

  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
  
      // Instrumental audio setup
      const instAudio = new Audio('/Music/no_vocals.mp3');
      const instSource = audioContextRef.current.createMediaElementSource(instAudio);
      const instGainNode = audioContextRef.current.createGain();
      const instPitchShift = new Tone.PitchShift();
      instSource.connect(instGainNode).connect(instPitchShift);
      instPitchShift.connect(audioContextRef.current.destination);

      // Vocal audio setup
      const vocalAudio = new Audio('/Music/vocals.mp3');
      const vocalSource = audioContextRef.current.createMediaElementSource(vocalAudio);
      const vocalGainNode = audioContextRef.current.createGain();
      const vocalPitchShift = new Tone.PitchShift();
      vocalSource.connect(vocalGainNode).connect(vocalPitchShift);
      vocalPitchShift.connect(audioContextRef.current.destination);
  
      setIsAudioInitialized(true); // ここで状態を更新
    }
  };

  const handlePitchChange = (change) => {
    const newPitch = currentPitch + change;
    setCurrentPitch(newPitch);
    if (instPitchShiftRef.current) {
      instPitchShiftRef.current.pitch = newPitch;
    }
    if (vocalPitchShiftRef.current) {
      vocalPitchShiftRef.current.pitch = newPitch;
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();//audioContextRefをリセット
      }
      clearTimeout(controlTimeoutRef.current);//読み込み時に以前ののこっタイマーを消す
    };
  }, []);

  const resetControlTimeout = () => {
    clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
  };

  const handlePlayPause = (event) => {
    event.stopPropagation();
    if (!audioContextRef.current) {
      initializeAudio();  // 再生時にオーディオ初期化を行う
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
      instAudioRef.current.pause();
      vocalAudioRef.current.pause();
    } else {
      playerRef.current.playVideo();
      instAudioRef.current.play();
      vocalAudioRef.current.play();
    }
    setIsPlaying(!isPlaying);
    resetControlTimeout();
  };

  const handleInstVolumeChange = (event, newValue) => {
    setInstVolume(newValue);
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = newValue / 100;
    }
    resetControlTimeout();
  };

  const handleVocalVolumeChange = (event, newValue) => {
    setVocalVolume(newValue);
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = newValue / 100;
    }
    resetControlTimeout();
  };

  const handleOverlayClick = () => {
    setShowControls(true);
    resetControlTimeout();
  };

  const handleSeekChange = (event, newValue) => {
    playerRef.current.seekTo(newValue);
    instAudioRef.current.currentTime = newValue;
    vocalAudioRef.current.currentTime = newValue;
    setCurrentTime(newValue);
    resetControlTimeout();
  };

  const handleInitialOverlayClick = () => {
    resetControlTimeout();
    setShowInitialOverlay(false);
    setShowControls(true);

    if (playerRef.current) {
      initializeAudio();  // 初回再生時にオーディオ初期化
      setIsPlaying(true);
      playerRef.current.playVideo();
      instAudioRef.current.play();
      vocalAudioRef.current.play();
    } else {
      console.error('YouTube player is not ready');
    }
  };

  useEffect(() => {//音量変化
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = instVolume / 100;
    }
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = vocalVolume / 100;
    }
  }, [instVolume, vocalVolume]);

  useEffect(() => {//再生中のシークバーの位置を1秒ずつ更新する
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const currentTime = playerRef.current.getCurrentTime();
        setCurrentTime(currentTime);
      }
    }, 1000); // 1秒ごとに更新
  
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <Box sx={{
      position: 'relative',
      width: {
        xs: '100%',
        md: '80%',
      },
      paddingBottom: {
        xs: '56.25%',
        md: '45%',
      },
      height: 0,
      margin: '0 auto'
    }}>
      <Button
        onClick={()=>{
          initializeAudio();
        }}
        sx={{
          position: 'absolute',
          bottom: '20px',
          left: '10px',
          color: 'black',
          fontSize: '24px',
        }}
      >
        動画を用意する
      </Button>
      {isAudioInitialized ? (
        <>
          <YouTube
            videoId="ZRtdQ81jPUQ"
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 0,
                controls: 0,
                modestbranding: 1,
                fs: 0,
                iv_load_policy: 3,
                rel: 0,
                mute: 1,
              },
            }}
            onReady={(event) => {
              event.target.setVolume(0);
              handlePlayerReady(event);
            }}
            style={{ aspectRatio: '16/9' }}
          />
  
          {/* 初回オーバーレイ */}
          {showInitialOverlay && (
            <Box
              onClick={handleInitialOverlayClick}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 4,
                cursor: 'pointer',
              }}
            >
              <PlayArrowIcon sx={{ fontSize: '100px', color: 'white' }} />
            </Box>
          )}
  
          {/* 歌詞表示部分 */}
          <Box
            ref={lyricsRef}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '30%',
              transform: 'translateX(-50%)',
              height: {
                xs: 'calc(20px * 5 + 4px * 10)',
                sm: 'calc(24px * 5 + 6px * 10)',
                md: 'calc(28px * 5 + 8px * 10)',
                lg: 'calc(32px * 5 + 8px * 10)',
              },
              overflowY: 'hidden',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              zIndex: 3,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Box
              sx={{
                height: '100%',
                overflowY: 'scroll',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {lyrics.map((line, index) => (
                <Typography
                  key={index}
                  sx={{
                    color: 'white',
                    fontSize: {
                      xs: '20px',
                      sm: '24px',
                      md: '28px',
                      lg: '32px',
                    },
                    textAlign: 'center',
                    textShadow: `
                      2px 2px 4px rgba(0, 0, 0, 1.0), 
                      -2px 2px 4px rgba(0, 0, 0, 1.0), 
                      2px -2px 4px rgba(0, 0, 0, 1.0),
                      -2px -2px 4px rgba(0, 0, 0, 1.0)
                    `,
                    opacity: 1,
                    padding: '4px 0',
                  }}
                >
                  {line}
                </Typography>
              ))}
            </Box>
          </Box>
  
          {/* コントローラー */}
          {showControls && (
            <Box
              onClick={handleOverlayClick}
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
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                zIndex: 2,
              }}
            >
              {/* 音量調整バー */}
              <Box sx={{ position: 'absolute', left: '10px', height: '70%', top: '10%' }}>
                <Slider
                  value={instVolume}
                  onChange={handleInstVolumeChange}
                  orientation="vertical"
                  sx={{
                    height: '100%',
                    color: 'white',
                  }}
                  onChangeCommitted={resetControlTimeout}
                  onMouseDown={(event) => event.stopPropagation()}
                />
              </Box>
              <Box sx={{ position: 'absolute', right: '10px', height: '70%', top: '10%' }}>
                <Slider
                  value={vocalVolume}
                  onChange={handleVocalVolumeChange}
                  orientation="vertical"
                  sx={{
                    height: '100%',
                    color: 'white',
                  }}
                  onChangeCommitted={resetControlTimeout}
                  onMouseDown={(event) => event.stopPropagation()}
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
                  fontSize: '24px',
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
                  left: '10%',
                  width: '70%',
                  position: 'absolute',
                  bottom: '20px',
                  color: 'white',
                }}
                onChangeCommitted={resetControlTimeout}
                onMouseDown={(event) => event.stopPropagation()}
              />
  
              {/* ピッチ調節ボタン */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'white',
                }}
              >
                <Button onClick={() => handlePitchChange(-1)} sx={{ color: 'white', fontSize: '24px' }}>-</Button>
                <Typography variant="body1" sx={{ margin: '0 10px', fontSize: '24px' }}>
                  {currentPitch}
                </Typography>
                <Button onClick={() => handlePitchChange(1)} sx={{ color: 'white', fontSize: '24px' }}>+</Button>
              </Box>
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
              backgroundColor: 'rgba(0, 0, 0, 0)',
              zIndex: 1,
            }}
          />
        </>
      ) : (
        <Typography variant="h6" sx={{ color: 'black', textAlign: 'center', paddingTop: '20%' }}>
          オーディオの初期化中...
        </Typography>
      )}
    </Box>
  );
}

export default PlayerPitchShift;