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

    const currentTimeRef = useRef(currentTime);//waveformsの非同期処理のため
    const isPlayingRef = useRef(isPlaying);

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

    // 音楽終了時の処理
    const handleEndedMusic = useCallback(() => {
      if (isLooping) {
        handleLooping();
      } else if (isShuffling) {
        handleShuffling();
      }
    }, [isLooping, isShuffling]);

    // --- Audio の準備 ---
    const {
      instAudioRef,
      prepareAudio,
      playAudio,
      stopAudio,
      seekAudio,
      setInstVolume: setAudioInstVolume,
      setVocalVolume: setAudioVocalVolume,
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
        // prepareWaveforms を非同期で実行(デカップリング)し、現在の処理フローをブロックしないようにする
        setTimeout(() => {
          prepareWaveforms(videoData.path).catch(error => {
            console.error("prepareWaveforms エラー:", error);
          });
        }, 0);

        await Promise.all([
          prepareAudio(videoData.path),
          youtubePlayerRef.current?.prepareYouTubePlayer(videoData.videoId),
          lyricUIRef.current?.prepareLyricUI(isPlayerTimestamped, videoData.timeStampAndLyricList),
        ]);

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
      await waveformUIRef.current?.prepareWaveforms(audioPath);
      if (isPlayingRef.current) {
        waveformUIRef.current?.playWaveforms();
        syncSeekOfMusicAndWaveforms();
      }
    };

    const handleLooping = useCallback(() => {
      seekAllAudio(0);
      playAllAudio();
      setIsPlaying(true);
      lyricUIRef.current?.scrollToTop();
      syncSeekOfMusicAndYoutubeApi();
    }, []);

    const handleShuffling = useCallback(async () => {
      setIsShufflePlaying(true);
      await shufflePrepareKaraoke();
      playAllAudio();
    }, []);

    const syncSeekOfMusicAndYoutubeApi = useCallback(() => {
      setTimeout(() => {
        const time = instAudioRef.current?.currentTime;
        if (time !== undefined) {
          if(isPlaying){
            youtubePlayerRef.current?.seekYoutube(time);
          }
        }
      }, 1000);
    }, [instAudioRef, youtubePlayerRef]);

    const syncSeekOfMusicAndWaveforms = useCallback(() => {
      setTimeout(() => {
        const time = instAudioRef.current?.currentTime;
        if (time !== undefined) {
          waveformUIRef.current?.seekWaveforms(time);
        }
      }, 1000);
    }, [instAudioRef, waveformUIRef]);

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
      waveformUIRef.current?.stopWaveforms();
    };

    const seekAllAudio = (time: number) => {
      seekAudio(time);
      youtubePlayerRef.current?.seekYoutube(time);
      waveformUIRef.current?.seekWaveforms(time);
    };

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
          const time = instAudioRef.current?.currentTime;
          if (time !== undefined) {
            setCurrentTime(time);
          }
          if (isTimestamped) {
            updatePlayerTimestampLyric();
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }, [isPlaying, isTimestamped]);

    const updatePlayerTimestampLyric = () => {
      const time = instAudioRef.current?.currentTime;
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
          <YouTubePlayer ref={youtubePlayerRef} setDuration={setDuration} />

          {/* 歌詞字幕 */}
          <LyricUI ref={lyricUIRef} isLyricCC={isLyricCC} />

          {/* コントロールUIをまとめたコンポーネント */}
          <KaraokeControls
            isShowControls={isShowControls}
            isPlaying={isPlaying}
            isFullScreen={isFullScreen}
            isLyricCC={isLyricCC}
            isVisibleWaveform={isVisibleWaveform}
            isLooping={isLooping}
            isShuffling={isShuffling}
            currentTime={currentTime}
            duration={duration}
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
            onToggleLoop={() => {
              Cookies.set('loop', String(!isLooping), { path: '/', expires: 31 });
              Cookies.set('shuffle', String(false), { path: '/', expires: 31 });
              setIsLooping(!isLooping);
              if (isShuffling) setIsShuffling(false);
            }}
            onToggleShuffle={() => {
              Cookies.set('loop', String(false), { path: '/', expires: 31 });
              Cookies.set('shuffle', String(!isShuffling), { path: '/', expires: 31 });
              setIsShuffling(!isShuffling);
              if (isLooping) setIsLooping(false);
            }}
            onSeekChange={(event, newValue) => {
              setCurrentTime(newValue as number);
              seekAllAudio(newValue as number);
            }}
            onMouseMove={resetControlTimeout}
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
