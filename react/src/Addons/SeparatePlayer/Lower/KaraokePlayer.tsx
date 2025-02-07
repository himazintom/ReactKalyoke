// KaraokePlayer.tsx
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { Box } from '@mui/material';
import Cookies from 'js-cookie';

import { YouTubePlayer, YouTubePlayerHandles } from './components/YouTubePlayer';
import { LyricUI, LyricUIHandles } from './components/LyricUI';
import { useAudioManager } from './hooks/useAudioManager';
import { Waveforms, WaveformsHandles } from './components/Waveforms';


import VolumeSliders from './components/VolumeSliders';
import Overlay from './components/Overlay';
import KaraokeControls from './components/KaraokeControls';
import TimestampAndLyric from '../types/TimestampAndLyric';
import VideoData from '../types/VideoData';
import { PitchShift } from 'tone';

interface KaraokePlayerProps {
  isPitchMode: boolean;
  shufflePrepareKaraoke: () => Promise<boolean>;
}

export interface KaraokePlayerHandles {
  prepareKaraokePlayer: (videoData: VideoData, isTimestamped: boolean) => Promise<boolean>;
}

export const KaraokePlayer = forwardRef<KaraokePlayerHandles, KaraokePlayerProps>(
  ({ isPitchMode, shufflePrepareKaraoke }, ref) => {
    const videoContainerRef = useRef<HTMLDivElement | null>(null);
    const youtubePlayerRef = useRef<YouTubePlayerHandles>(null);
    const lyricUIRef = useRef<LyricUIHandles>(null);
    const waveformUIRef = useRef<WaveformsHandles>(null);

    // --- State 管理 ---
    const [displayKaraokePlayer, setDisplayKaraokePlayer] = useState(false);
    const [showInitialOverlay, setShowInitialOverlay] = useState(true);
    const [isShowControls, setIsShowControls] = useState(false);
    const beforePath = useRef<string>('');
    const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ボリューム関連
    const [instVolume, setInstVolume] = useState<number>(100);
    const [vocalVolume, setVocalVolume] = useState<number>(0);

    // 再生制御
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // 曲データ
    const [karaokeTitle, setKaraokeTitle] = useState<string>('');
    const [timestampAndLyricList, setTimestampAndLyricList] = useState<TimestampAndLyric[]>([]);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isTimestamped, setIsTimestamped] = useState<boolean>(false);
    const [isLyricCC, setIsLyricCC] = useState<boolean>(true);
    const [isVisibleWaveform, setIsVisibleWaveform] = useState<boolean>(true);
    const [isLooping, setIsLooping] = useState<boolean>(false);
    const [isShuffling, setIsShuffling] = useState<boolean>(false);
    const [isShufflePlaying, setIsShufflePlaying] = useState<boolean>(false);
    const pitchShiftRef = useRef<PitchShift | null>(null);

    const currentTimeRef = useRef(currentTime);//waveformsの非同期処理のため
    const isPlayingRef = useRef(isPlaying);

    // isLooping と isShuffling の最新状態を保持するための ref を用意
    const latestIsLooping = useRef(isLooping);
    const latestIsShuffling = useRef(isShuffling);

    // 状態が変わるたびに ref を更新
    useEffect(() => {
      latestIsLooping.current = isLooping;
    }, [isLooping]);

    useEffect(() => {
      latestIsShuffling.current = isShuffling;
    }, [isShuffling]);

    // handleEndedMusic の関数自体は一度だけ生成して固定する
    const handleEndedMusic = useCallback(async () => {
      console.log("handleEndedMusic!!");
      try {
        if (latestIsLooping.current) {
          console.log("handleLooping!!");
          handleLooping();
        } else if (latestIsShuffling.current) {
          console.log("handleShuffling!!");
          await handleShuffling();
        } else {
          console.log("stopAllAudio!!");
          stopAllAudio();
        }
      } catch (error) {
        console.error("handleEndedMusic error", error);
      }
    }, []); // 依存配列を空にすることで関数自身は固定される

    useEffect(() => {
      currentTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => {
      isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    //コントロールのCookieを読み込む
    useEffect(() => {
      const lyricCCValue = Cookies.get('lyricCC');
      const isLyricCC = lyricCCValue === 'true'; // 文字列をBooleanに変換
      setIsLyricCC(isLyricCC);
  
      const visibleWaveformValue = Cookies.get('visibleWaveform');
      const isVisibleWaveform = visibleWaveformValue === 'true'; // 文字列をBooleanに変換
      setIsVisibleWaveform(isVisibleWaveform);
  
      const loopValue = Cookies.get('loop');
      const isLooping = loopValue === 'true'; // 文字列をBooleanに変換
      setIsLooping(isLooping);
      
      const shuffleValue = Cookies.get('shuffle');
      const isShuffling = shuffleValue === 'true'; // 文字列をBooleanに変換
      setIsShuffling(isShuffling);
    }, []);

    
    // onToggleLoop の修正
    const handleToggleLoop = () => {
      console.log("handleToggleLoop!!");
      setIsLooping((prevIsLooping) => {
        const newIsLooping = !prevIsLooping;
        Cookies.set('loop', String(newIsLooping), { path: '/', expires: 31 });


        if (newIsLooping) {
          setIsShuffling(false);
          Cookies.set('shuffle', 'false', { path: '/', expires: 31 });
        }
        console.log("newIsLooping", newIsLooping);
        return newIsLooping;
      });
    };


    // onToggleShuffle の修正
    const handleToggleShuffle = () => {
      console.log("handleToggleShuffle!!");
      setIsShuffling((prevIsShuffling) => {
        const newIsShuffling = !prevIsShuffling;
        Cookies.set('shuffle', String(newIsShuffling), { path: '/', expires: 31 });


        if (newIsShuffling) {
          setIsLooping(false);
          Cookies.set('loop', 'false', { path: '/', expires: 31 });
        }
        console.log("newIsShuffling", newIsShuffling);
        return newIsShuffling;
      });
    }

    useEffect(() => {
      console.log("UseEffect isLooping", isLooping);
      console.log("UseEffect isShuffling", isShuffling);
    }, [isLooping, isShuffling]);


    const handleLooping = useCallback(() => {
      seekAllAudio(0);
      playAllAudio();
      setIsPlaying(true);
      lyricUIRef.current?.scrollToTop();

      syncSeekOfMusicAndYoutubeApi();
    }, []);

    const handleShuffling = useCallback(async () => {
      setIsShufflePlaying(true);
      try {
        const result = await shufflePrepareKaraoke();
        if (result) {
          playAllAudio();
        } else {
          setIsShufflePlaying(false);
        }
      } catch (error) {
        setIsShufflePlaying(false);
      }
    }, [shufflePrepareKaraoke]);

    const syncSeekOfMusicAndWaveforms = useCallback(() => {
      setTimeout(() => {
        const time = audioRef.current?.currentTime;
        if (time !== undefined) {
          waveformUIRef.current?.seekWaveforms(time);
        }
      }, 1000);
    }, [isPlaying]);

    const playAllAudio = () => {
      setIsPlaying(true);
      playAudio();
      youtubePlayerRef.current?.playYoutube();
      syncSeekOfMusicAndYoutubeApi();
      waveformUIRef.current?.playWaveforms();
    };

    const stopAllAudio = () => {
      setIsPlaying(false);
      stopAudio();
      youtubePlayerRef.current?.stopYoutube();
      waveformUIRef.current?.pauseWaveforms();
    };

    const seekAllAudio = (time: number) => {
      seekAudio(time);
      youtubePlayerRef.current?.seekYoutube(time);
      waveformUIRef.current?.seekWaveforms(time);
    };
    
    // --- Audio の準備 ---
    const {
      AudioRef: audioRef,
      currentPitch,
      prepareAudio,
      playAudio,
      stopAudio,
      seekAudio,
      setInstVolume: setAudioInstVolume,
      setVocalVolume: setAudioVocalVolume,
      handlePitchChange,
    } = useAudioManager({ isPitchMode, handleEndedMusic });

    // --- 初期設定 ---
    useEffect(() => {
      // Cookies から音量を復元
      const storedInstVolume = JSON.parse(Cookies.get('instVolume') || '100');
      if (storedInstVolume !== null && storedInstVolume !== undefined) {
        setInstVolume(storedInstVolume);
        setAudioInstVolume(storedInstVolume);
      }

      const storedVocalVolume = JSON.parse(Cookies.get('vocalVolume') || '30');
      if (storedVocalVolume !== null && storedVocalVolume !== undefined) {
        setVocalVolume(storedVocalVolume);
        setAudioVocalVolume(storedVocalVolume);
      }
    }, []);

    // --- useImperativeHandle ---
    useImperativeHandle(ref, () => ({
      isTimestamped,
      prepareKaraokePlayer,
    }));

    // --- イベントハンドラ ---
    async function prepareKaraokePlayer(videoData: VideoData, isPlayerTimestamped: boolean) {
      try {
        setIsTimestamped(isPlayerTimestamped);

        await prepareAudio(videoData.path);
        await youtubePlayerRef.current?.prepareYouTubePlayer(videoData.videoId);
        await lyricUIRef.current?.prepareLyricUI(isPlayerTimestamped, videoData.timeStampAndLyricList);

        // prepareWaveforms を非同期で実行(デカップリング)し、現在の処理フローをブロックしないようにする
        setTimeout(() => {
          prepareWaveforms(videoData.path).catch(error => {
            console.error("prepareWaveforms エラー:", error);
          });
        }, 0);
        
        // 続きの処理
        if (isShufflePlaying) {
          playAllAudio();
        }else{
          if (beforePath.current !== videoData.path) {
            stopAllAudio();
            setShowInitialOverlay(true);
          }
          beforePath.current = videoData.path;
        }
        setIsShufflePlaying(false);
        setTimestampAndLyricList(videoData.timeStampAndLyricList);
        setKaraokeTitle(videoData.title);
        setDisplayKaraokePlayer(true);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }

    const prepareWaveforms = async (audioPath: string) => {//もし、準備ができたときにすでに再生されていたら、現在の再生地点に波形を合わせる
      console.log("prepareWaveforms");
      await waveformUIRef.current?.prepareWaveforms(audioPath);
      if (isPlayingRef.current) {
        console.log("prepareWaveforms playWaveforms");
        waveformUIRef.current?.playWaveforms();
        syncSeekOfMusicAndWaveforms();
      }
    };

    const syncSeekOfMusicAndYoutubeApi = useCallback(() => {
      setTimeout(() => {
        const time = audioRef.current?.currentTime;
        if (time !== undefined) {
          if(isPlaying){
            youtubePlayerRef.current?.seekYoutube(time);
          }
        }
      }, 1000);
    }, [isPlaying]);

    // カーソルを動かさない場合にコントロールを自動で隠す
    const resetControlTimeout = () => {
      if (controlTimeoutRef.current) {
        clearTimeout(controlTimeoutRef.current);
      }
      controlTimeoutRef.current = setTimeout(() => {
        setIsShowControls(false);
      }, 5000) as unknown as NodeJS.Timeout;//5秒後に見えなくする
    };

    // 再生状況管理
    const handlePlayPause = () => {
      if (isPlaying) {
        stopAllAudio();
      } else {
        playAllAudio();
      }
    };

    const toggleFullScreen = () => {
      if (!isFullScreen) {
        if (videoContainerRef.current?.requestFullscreen) {
          videoContainerRef.current?.requestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        setIsFullScreen(false);
      }
    };

    // 時間同期
    useEffect(() => {
      const interval = setInterval(() => {
        if (isPlaying) {
          const time = audioRef.current?.currentTime;
          if (time !== undefined) {
            setCurrentTime(time);
          }
          if (isTimestamped) {
            updatePlayerTimestampLyric();
          }
        }
      }, 100);

      const syncInterval = setInterval(() => {
        syncSeekOfMusicAndYoutubeApi();
      }, 10000);//10秒ごとに同期

      return () => {
        clearInterval(interval);
        clearInterval(syncInterval);
      };
    }, [isPlaying, isTimestamped, syncSeekOfMusicAndYoutubeApi]);

    const updatePlayerTimestampLyric = () => {
      const time = audioRef.current?.currentTime;
      if (time !== undefined) {
        setCurrentTime(time);
        const currentIndex = timestampAndLyricList.findIndex(
          (tsLyric, index) =>
            time >= tsLyric.timestamp &&
            (index === timestampAndLyricList.length - 1 || time < timestampAndLyricList[index + 1].timestamp)
        );
        lyricUIRef.current?.setCurrentLyricIndex(currentIndex);
      }
    };

    useEffect(() => {
      const handleFocus = () => {//ブラウザタブがアクティブになったときの処理
        syncSeekOfMusicAndYoutubeApi();
      };
    
      const handleBlur = () => {//ブラウザタブが非アクティブになったときの処理
      };
    
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
    
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
      };
    }, [syncSeekOfMusicAndYoutubeApi]); // 依存配列に syncSeekOfMusicAndYoutubeApi を追加

    useEffect(() => {
      return () => {
        youtubePlayerRef.current = null;
        lyricUIRef.current = null;
        waveformUIRef.current = null;
      };
    }, []);

    // --- JSX ---
    return (
      <Box
        sx={{
          display: displayKaraokePlayer ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* タイトル表示 */}
        <Box
          sx={{
            position: 'relative',
            textAlign: 'center',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            margin: '0',
            padding: '0',
            width: { xs: '100%', md: '80%' },
            maxWidth: '1280px',
            fontSize: { xs: '1.0rem', md: '1.5rem' },
          }}
        >
          {karaokeTitle}
        </Box>

        <Box
          ref={videoContainerRef}
          sx={{
            position: 'relative',
            width: { xs: '100%', md: '80%' },
            maxWidth: '1280px',
            aspectRatio: '16/9',
            height: 'auto',
            margin: '0 auto',
          }}
        >
          {/* 初回オーバーレイ */}
          <Overlay
            showInitialOverlay={showInitialOverlay}
            onOverlayClick={() => {
              resetControlTimeout();
              setShowInitialOverlay(false);
              playAllAudio();
            }}
          />

          {/* YouTubePlayer */}
          <YouTubePlayer ref={youtubePlayerRef} setDuration={setDuration} isFullScreen={isFullScreen} />

          {/* 歌詞字幕 */}
          <LyricUI ref={lyricUIRef} isLyricCC={isLyricCC} />

          {/* コントロールUIをまとめたコンポーネント */}
          <KaraokeControls
            isPitchMode={isPitchMode}
            isShowControls={isShowControls}
            isPlaying={isPlaying}
            isFullScreen={isFullScreen}
            isLyricCC={isLyricCC}
            isVisibleWaveform={isVisibleWaveform}
            isLooping={isLooping}
            isShuffling={isShuffling}
            currentTime={currentTime}
            duration={duration}
            currentPitch={currentPitch}
            onPlayPause={handlePlayPause}
            onToggleFullScreen={toggleFullScreen}
            onToggleLyricCC={() => {
              Cookies.set('lyricCC', String(!isLyricCC), { path: '/', expires: 31 });
              setIsLyricCC(!isLyricCC);
            }}
            onToggleWaveform={() => {
              Cookies.set('visibleWaveform', String(!isVisibleWaveform), { path: '/', expires: 31 });
              setIsVisibleWaveform(!isVisibleWaveform); 
            }}
            onToggleLoop={handleToggleLoop}
            onToggleShuffle={handleToggleShuffle}
            onSeekChange={(event, newValue) => {
              setCurrentTime(newValue as number);
              seekAllAudio(newValue as number);
            }}
            onMouseMove={resetControlTimeout}
            handlePitchChange={handlePitchChange}
          />

          {/* ボリュームスライダー */}
          {isShowControls && (
            <VolumeSliders
              instVolume={instVolume}
              vocalVolume={vocalVolume}
              setInstVolume={(val) => {
                Cookies.set('instVolume', String(val), { path: '/', expires: 31 });
                setInstVolume(val);
                setAudioInstVolume(val);
                resetControlTimeout();
              }}
              setVocalVolume={(val) => {
                Cookies.set('vocalVolume', String(val), { path: '/', expires: 31 });
                setVocalVolume(val);
                setAudioVocalVolume(val);
                resetControlTimeout();
              }}
              onSliderChange={resetControlTimeout}
            />
          )}

          {/* 波形 */}
          <Waveforms ref={waveformUIRef} isVisibleWaveforms={isVisibleWaveform} />

          {/* 透明なオーバーレイ: クリックしてコントロールを再表示させる */}
          {!isShowControls && (
            <Box
              onClick={() => {
                setIsShowControls(true);
                resetControlTimeout();
              }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.0)',
                zIndex: 1,
              }}
            />
          )}
        </Box>
      </Box>
    );
  }
);
