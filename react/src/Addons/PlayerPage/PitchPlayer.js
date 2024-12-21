import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Slider, Button, Typography, Checkbox, TextField, FormControlLabel, Link } from '@mui/material';
import { useLocation } from 'react-router-dom';
import YouTube from 'react-youtube';
import Cookies from 'js-cookie';
import CircularProgress from '@mui/material/CircularProgress';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import LoopIcon from '@mui/icons-material/Loop';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import PianoIcon from '@mui/icons-material/Piano';
import MicIcon from '@mui/icons-material/Mic';
import * as Tone from 'tone';

import * as FormPost from '../Global/FormPost.tsx';

export const PitchPlayer = () => {
  const hostUrl = process.env.REACT_APP_HOST_URL;

  // History and recommendation states
  const [yourHistory, setYourHistory] = useState([]);
  const [everyoneHistory, setEveryoneHistory] = useState([]);
  const [recommendation, setRecommendations] = useState([]);

  // Form states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [beforeYoutubeUrlFormVideoId, setBeforeYoutubeUrlFormVideoId] = useState('');
  const [lyric, setLyric] = useState('');
  const [beforeAutoLyric, setBeforeAutoLyric] = useState(null);
  const [isAutoSearchLyric, setIsAutoSearchLyric] = useState(false);
  const [isOverseas, setIsOverseas] = useState(false);
  const [youtubeUrlErrorMessage, setYoutubeUrlErrorMessage] = useState('');
  const [lyricFormErrorMessage, setLyricFormUrlErrorMessage] = useState('');
  const [lyricFormWarningMessage, setLyricFormUrlWarningMessage] = useState('');
  const [isChangeLyricForm, setIsChangeLyricForm] = useState(true);
  const [prepareKaraokeStatus, setPrepareKaraokeStatus] = useState(0);

  // Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [instVolume, setInstVolume] = useState(100);
  const [vocalVolume, setVocalVolume] = useState(10);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showInitialOverlay, setShowInitialOverlay] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(0);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [youtubeApiVideoId, setYoutubeApiVideoId] = useState('');

  // Lyric states
  const [playerLyricList, setPlayerLyricList] = useState([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isTimestampLyric, setIsTimestampLyric] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isShufflePlaying, setIsShufflePlaying] = useState(false);

  // Refs
  const controlTimeoutRef = useRef(null);
  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const instGainNodeRef = useRef(null);
  const vocalGainNodeRef = useRef(null);
  const instAudioRef = useRef(null);
  const vocalAudioRef = useRef(null);
  const lyricScrollBoxRef = useRef(null);
  const lyricLineRef = useRef([]);
  const instPitchShiftRef = useRef(null);
  const vocalPitchShiftRef = useRef(null);

  // Location and video data
  const location = useLocation();
  const videoData = location.state?.videoData;
  const [beforeVideoId, setBeforeVideoId] = useState('');

  // Ready states
  const [isPlayerLyricReady, setIsPlayerLyricReady] = useState(false);
  const [isYoutubeApiReady, setIsYoutubeApiReady] = useState(false);
  const [isMusicsReady, setIsMusicsReady] = useState(false);
  const [isKaraokeReady, setIsKaraokeReady] = useState(false);
  const [isOnceKaraokeReady, setIsOnceKaraokeReady] = useState(false);

  // Utility Functions
  const fetchHistoryData = useCallback(async () => {
    const history = await FormPost.fetchEveryoneHistory();
    setEveryoneHistory(history);
  }, []);

  const fetchRecommendData = useCallback(async () => {
    const recommends = await FormPost.fetchRandomMusics(5);
    setRecommendations(recommends);
  },[]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);//関数を依存関係に入れるとループが防げるらしい

  useEffect(() => {
    fetchRecommendData();
  }, [fetchRecommendData]);

  const extractVideoId = (youtubeUrl) => {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;
    const match = youtubeUrl.match(regex);
    return match ? match[1] : null;
  }

  const calculateVolume = (value) => {
    const calculatedVolume = (value/100)**0.8;
    const clampedVolume = Math.max(0.0, Math.min(calculatedVolume, 100.0));
    return clampedVolume;
  };

  const resetForms = () => {
    setYoutubeUrl('');
    setLyric('');
  }

  // Audio Initialization
  const initializeAudio = async (path) => {
    // 現在再生中なら停止
    if (isPlaying) {
      playerRef.current.pauseVideo();
      if (instAudioRef.current) {
        instAudioRef.current.stop();
      }
      if (vocalAudioRef.current) {
        vocalAudioRef.current.stop();
      }
      setIsPlaying(false);
    }
  
    // クリーンアップ
    if (instAudioRef.current) {
      instAudioRef.current.disconnect();
      instAudioRef.current.dispose();
    }
    if (vocalAudioRef.current) {
      vocalAudioRef.current.disconnect();
      vocalAudioRef.current.dispose();
    }
    if (instPitchShiftRef.current) {
      instPitchShiftRef.current.disconnect();
      instPitchShiftRef.current.dispose();
    }
    if (vocalPitchShiftRef.current) {
      vocalPitchShiftRef.current.disconnect();
      vocalPitchShiftRef.current.dispose();
    }
  
    await Tone.start();
    const folderpath = hostUrl + path;
  
    try {
      // Create players first
      const instPlayer = new Tone.Player();
      const vocalPlayer = new Tone.Player();
  
      // Create gain nodes
      const instGain = new Tone.Gain(calculateVolume(instVolume));
      const vocalGain = new Tone.Gain(calculateVolume(vocalVolume));
  
      // Create pitch shift nodes
      const instPitchShift = new Tone.PitchShift({
        pitch: currentPitch,
        windowSize: 0.1,
        delayTime: 0
      });
  
      const vocalPitchShift = new Tone.PitchShift({
        pitch: currentPitch,
        windowSize: 0.1,
        delayTime: 0
      });
  
      // チェーンの接続
      instPlayer.chain(instGain, instPitchShift, Tone.Destination);
      vocalPlayer.chain(vocalGain, vocalPitchShift, Tone.Destination);
  
      // Add ended callback
      instPlayer.onstop = handleEndedMusic;
  
      // Store references
      instAudioRef.current = instPlayer;
      vocalAudioRef.current = vocalPlayer;
      instGainNodeRef.current = instGain;
      vocalGainNodeRef.current = vocalGain;
      instPitchShiftRef.current = instPitchShift;
      vocalPitchShiftRef.current = vocalPitchShift;
  
      // Load audio files with proper waiting
      await Promise.all([
        new Promise((resolve, reject) => {
          instPlayer.load(`${folderpath}/no_vocals.mp3`).then(() => {
            resolve();
          }).catch(reject);
        }),
        new Promise((resolve, reject) => {
          vocalPlayer.load(`${folderpath}/vocals.mp3`).then(() => {
            resolve();
          }).catch(reject);
        })
      ]);
  
      setIsMusicsReady(true);
      setIsAudioInitialized(true);
  
    } catch (error) {
      console.error("Error initializing audio:", error);
      throw error;
    }
  };

  // Lyrics Processing Functions
  const timestampExistCheck = (text) => {
    if (!text) {
      return false;
    }
  
    const lines = text.split('\n');
    const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/;
    let warnings = [];
    
    let timestampExist = lines.some(line => timestampRegex.test(line));
    if (!timestampExist) {
      return false;
    }
  
    lines.forEach((line, index) => {
      if (!timestampRegex.test(line)) {
        warnings.push(`${index + 1}行目: 「${line}」にタイムスタンプがありません`);
      }
    });
    
    if(warnings.length > 0) {
      setLyricFormUrlWarningMessage(warnings);
      return false;
    }
    return true;
  }

  const timestampChronologyCheck = (text) => {
    if (text) {
      const lines = text.split('\n');
      const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/;
      let lastTimestamp = 0;
    
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const timestampMatch = line.match(timestampRegex);
        if (timestampMatch) {
          const timeParts = timestampMatch[0].substring(1, timestampMatch[0].length - 1).split(':');
          const minutes = parseInt(timeParts[0], 10);
          const seconds = parseFloat(timeParts[1]);
          const currentTimestamp = minutes * 60 + seconds;
    
          if (currentTimestamp < lastTimestamp) {
            setLyricFormUrlErrorMessage(
              `${i + 1}行目: 「${line}」が時系列に沿っていません。1行前より大きな時間を登録してください。`
            );
            return true;
          }
          lastTimestamp = currentTimestamp;
        }
      }
    }
    return false;
  }

  const timestampize = (text) => {
    try {
      const playerLyricList = [];
  
      playerLyricList.push({ timestamp: 0.0, lyric: '' });
      playerLyricList.push({ timestamp: 0.0, lyric: '' });
  
      if (text) {
        const lines = text.split('\n');
        const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/;
  
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const timestampMatch = line.match(timestampRegex);
  
          if (timestampMatch) {
            const timeParts = timestampMatch[0].substring(1, timestampMatch[0].length - 1).split(':');
            const minutes = parseInt(timeParts[0], 10);
            const seconds = parseFloat(timeParts[1]);
            const currentTimestamp = minutes * 60 + seconds;
  
            const lyric = line.replace(timestampRegex, '').trim();
  
            playerLyricList.push({
              timestamp: currentTimestamp,
              lyric: lyric,
            });
          }
        }
      }
      return playerLyricList;
    } catch (error) {
      console.error('Error processing text:', error);
      return [];
    }
  };
  // History Management
  const setHistoryData = (title, videoId) => {
    const historyData = { 
      title: title,
      videoId: videoId
    };
    const updateYourHistory = yourHistory.filter(item => item.videoId !== videoId);
    updateYourHistory.unshift(historyData);
    if (updateYourHistory.length > 5) {
      updateYourHistory.pop();
    }
    setYourHistory(updateYourHistory);
    Cookies.set('yourHistory', JSON.stringify(updateYourHistory), { path: '/', expires: 31 });
  }

  // Event Handlers
  const handlePlayerReady = (event) => {
    playerRef.current = event.target;
    setIsYoutubeApiReady(true);
    setDuration(event.target.getDuration());
  };

  // Modify play/pause handling
  const handlePlayPause = (event) => {
    event.stopPropagation();
    if (isPlaying) {
      playerRef.current.pauseVideo();
      instAudioRef.current.stop();
      vocalAudioRef.current.stop();
    } else {
      const startTime = Tone.now();
      playerRef.current.playVideo();
      instAudioRef.current.start(startTime);
      vocalAudioRef.current.start(startTime);
      syncSeekOfMusicAndYoutubeApi();
    }
    setIsPlaying(!isPlaying);
    resetControlTimeout();
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
    resetControlTimeout();
  };

  // Modify volume changes
  const handleInstVolumeChange = (event, newValue) => {
    setInstVolume(newValue);
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = calculateVolume(newValue);
    }
    resetControlTimeout();
  };

  const handleVocalVolumeChange = (event, newValue) => {
    setVocalVolume(newValue);
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = calculateVolume(newValue);
    }
    resetControlTimeout();
  };

  const handleUrlChange = async (event) => {
    const url = event.target.value;
    setYoutubeUrl(url);
  
    let videoId = extractVideoId(url);
    if (videoId) {
      if(videoId !== beforeYoutubeUrlFormVideoId) {
        setBeforeYoutubeUrlFormVideoId(videoId);
        setLyric('');
        try {
          const lyric = await FormPost.fetchLyricFromDB(videoId);
          if(lyric !== 'Null') {
            setLyric(lyric);
          }
        } catch (error) {
          console.error('Error fetching lyric:', error);
        }
        setIsChangeLyricForm(true);
      }
    }
  };

  const handleLyricChange = (event) => {
    setLyricFormUrlErrorMessage('');
    if(!isChangeLyricForm) {
      setIsChangeLyricForm(true);
    }
    setLyric(event.target.value);
  };

  const handleOverseasChange = (event) => {
    setIsOverseas(event.target.checked);
  };

  const handleSearchLyric = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setYoutubeUrlErrorMessage('入力されたURLはYouTubeのURLの形式ではありません');
      return;
    }
    setYoutubeUrlErrorMessage('');
    setIsAutoSearchLyric(true);
    
    const language = isOverseas ? 'en' : 'ja';
    const title = await FormPost.getTitleByVideoId(videoId);
    if(title === 'Null') {
      setLyricFormUrlErrorMessage('歌詞は見つかりませんでした: title missing');
    }
    const searchedLyric = await FormPost.searchLyricFromWeb(title, language);
    
    if(searchedLyric === 'Null' || searchedLyric === '') {
      setLyricFormUrlErrorMessage('歌詞は見つかりませんでした');
    } else {
      setBeforeAutoLyric(lyric);
      setLyric(searchedLyric);
    }
    setIsChangeLyricForm(true);
    setIsAutoSearchLyric(false);
  };

  const handleUndoAutoLyric = () => {
    setLyric(beforeAutoLyric);
    setBeforeAutoLyric(null);
  };

  const handleInitialOverlayClick = () => {
    resetControlTimeout();
    setShowInitialOverlay(false);
    setShowControls(true);

    if (playerRef.current) {
      setIsPlaying(true);
      playerRef.current.playVideo();
      instAudioRef.current.play();
      vocalAudioRef.current.play();
      syncSeekOfMusicAndYoutubeApi();
    }
  };

  const handleOverlayClick = () => {
    setShowControls(true);
    resetControlTimeout();
  };

  const handleSeekChange = (event, newValue) => {
    seekChange(newValue);
    resetControlTimeout();
  };

  const handleEndedMusic = useCallback(async () => {
    setIsPlaying(false);
    playerRef.current.pauseVideo();
    instAudioRef.current.pause();
    vocalAudioRef.current.pause();
    
    if (isLooping) {
      seekChange(0);
      setIsPlaying(true);
      playerRef.current.playVideo();
      instAudioRef.current.play();
      vocalAudioRef.current.play();
      syncSeekOfMusicAndYoutubeApi();
    } else if (isShuffling) {
      const videoData = await FormPost.fetchRandomMusics(1);
      if (videoData && videoData.length > 0) {
        setIsShufflePlaying(true);
        const data = videoData[0];
        const url = 'https://www.youtube.com/watch?v=' + data['videoId'];
        setYoutubeUrl(url);
        setLyric(data['lyric']);
        setIsChangeLyricForm(true);
      }
    }
  }, [isLooping, isShuffling]);

  // Control Functions
  const seekChange = (value) => {
    playerRef.current.seekTo(value);
    if (instAudioRef.current) {
      instAudioRef.current.stop();
      vocalAudioRef.current.stop();
      if (isPlaying) {
        const startTime = Tone.now();
        instAudioRef.current.start(startTime, value);
        vocalAudioRef.current.start(startTime, value);
      }
    }
    setCurrentTime(value);
    updatePlayerLyric();
  };

  const resetControlTimeout = () => {
    clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const syncSeekOfMusicAndYoutubeApi = () => {
    setTimeout(() => {
      const timeDifference = Math.abs(instAudioRef.current.currentTime - playerRef.current.getCurrentTime());
      if (timeDifference > 0.1) {
        playerRef.current.seekTo(instAudioRef.current.currentTime);
      }
    }, 1000);
  };

  const toggleFullScreen = useCallback(() => {
    if (!isFullScreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullScreen(false);
    }
  }, [isFullScreen]);

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if(isShuffling) {
      setIsShuffling(false);
    }
  };

  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
    if(isLooping) {
      setIsLooping(false);
    }
  };

  const updatePlayerLyric = () => {
    const time = instAudioRef.current.currentTime;
    setCurrentTime(time);

    const currentIndex = playerLyricList.findIndex(
      (lyric, index) =>
        time >= lyric.timestamp &&
        (index === playerLyricList.length - 1 || time < playerLyricList[index + 1].timestamp)
    );
    setCurrentLyricIndex(currentIndex);
  };

  // Effects
  useEffect(() => {
    const yourHistory = JSON.parse(Cookies.get('yourHistory') || '[]');
    if (yourHistory.length > 0) {
      setYourHistory(yourHistory);
      if(!videoData) {
        const videoId = yourHistory[0]['videoId'];
        const url = 'https://www.youtube.com/watch?v=' + videoId;
        setYoutubeUrl(url);
        setLyricByCookie(videoId);
      }
    }
  }, []);

  const setLyricByCookie = async(videoId) => {
    const lyric = await FormPost.fetchLyricFromDB(videoId);
    setLyric(lyric);
  }

  useEffect(() => {
    const setUrlAndLyricInForm = async () => {
      if (videoData) {
        const videoId = videoData.videoId;
        setYoutubeUrl(`https://www.youtube.com/watch?v=${videoId}`);
        setLyric(await FormPost.fetchLyricFromDB(videoId));
      }
    };
    setUrlAndLyricInForm();
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      clearTimeout(controlTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = calculateVolume(instVolume);
      Cookies.set('instVolume', instVolume, { path: '/', expires: 31 });
    }
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = calculateVolume(vocalVolume);
      Cookies.set('vocalVolume', vocalVolume, { path: '/', expires: 31 });
    }
  }, [instVolume, vocalVolume]);

  useEffect(() => {
    if(instAudioRef.current){
      instAudioRef.current.removeEventListener('ended', handleEndedMusic);
      instAudioRef.current.addEventListener('ended', handleEndedMusic);
    }
    Cookies.set('loop', isLooping, { path: '/', expires: 31 });
    Cookies.set('shuffle', isShuffling, { path: '/', expires: 31 });

    return () => {
      if (instAudioRef.current) {
        instAudioRef.current.removeEventListener('ended', handleEndedMusic);
      }
    };
  }, [handleEndedMusic]);

  useEffect(() => {
    if(isShufflePlaying) {
      setPrepareKaraokeStatus(1);
    }
  }, [isShufflePlaying]);

  useEffect(() => {
    if(isKaraokeReady) {
      if(!isOnceKaraokeReady) {
        setIsOnceKaraokeReady(true);
      }
      if(isShufflePlaying) {
        setTimeout(() => {
          setIsPlaying(true);
          playerRef.current.playVideo();
          instAudioRef.current.play();
          vocalAudioRef.current.play();
          syncSeekOfMusicAndYoutubeApi();
          setIsShufflePlaying(false);
        }, 1000);
      }
    }
  }, [isKaraokeReady]);

  useEffect(() => {
    setIsKaraokeReady(isPlayerLyricReady && isYoutubeApiReady && isMusicsReady);
  }, [isPlayerLyricReady, isYoutubeApiReady, isMusicsReady]);

  useEffect(() => {
    if (lyricLineRef.current[currentLyricIndex]) {
      lyricLineRef.current[currentLyricIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLyricIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying && playerLyricList.length > 0) {
        updatePlayerLyric();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playerLyricList]);

  // Prepare karaoke status effect
  useEffect(() => {
    const prepareKaraoke = async () => {
      let videoId;
      if (prepareKaraokeStatus > 0) {
        videoId = extractVideoId(youtubeUrl);
      }
      switch (prepareKaraokeStatus) {
        case 0:
          break;
        case 1:
          setIsTimestampLyric(false);
          setPrepareKaraokeStatus(2);
          break;
        case 2:
          if (!videoId) {
            setYoutubeUrlErrorMessage('入力されたURLはYouTubeのURLの形式ではありません');
            return;
          } else {
            setYoutubeUrlErrorMessage('');
          }
          if (timestampExistCheck(lyric)) {
            if (timestampChronologyCheck(lyric)) {
              return;
            }
            setIsPlayerLyricReady(false);
            if(isChangeLyricForm) {
              const timestampedLyric = timestampize(lyric);
              setPlayerLyricList(timestampedLyric);
            }
            setIsTimestampLyric(true);
          }
          setPrepareKaraokeStatus(3);
          break;
        case 3:
          if (isTimestampLyric) {
            if (beforeVideoId !== videoId) {
              setCurrentLyricIndex(2);
            }
            setIsPlayerLyricReady(true);
          } else {
            setCurrentLyricIndex(-1);
          }
          setPrepareKaraokeStatus(4);
          break;
        case 4:
          if (beforeVideoId === videoId) {
            if (isShufflePlaying) {
              seekChange(0);
              setIsPlaying(true);
              playerRef.current.playVideo();
              instAudioRef.current.play();
              vocalAudioRef.current.play();
              syncSeekOfMusicAndYoutubeApi();
              setIsShufflePlaying(false);
            }

            if (isChangeLyricForm) {
              try {
                const result = await FormPost.updateLyricInDB(videoId, lyric);
                if (result.error) {
                  setLyricFormUrlErrorMessage('歌詞の更新中にエラーが発生したようです: ' + result.error);
                } else {
                  setLyricFormUrlErrorMessage('');
                  if (!isTimestampLyric) {
                    setPlayerLyricList(
                      lyric.split('\n').map(line => ({ lyric: line }))
                    );
                    setIsPlayerLyricReady(true);
                  }
                }
              } catch (error) {
                console.error('Error updating lyric:', error);
                setLyricFormUrlErrorMessage('サーバーへの接続中にエラーが発生しました');
              }
            }
          } else {
            setBeforeVideoId(videoId);
            try {
              const data = await FormPost.separateMusic(youtubeUrl, videoId, lyric);
              setIsYoutubeApiReady(false);
              setIsMusicsReady(false);

              setYoutubeApiVideoId(videoId);
              initializeAudio(data['path']);
              setEveryoneHistory(data['history']);
              if (!isTimestampLyric) {
                setPlayerLyricList(
                  lyric.split('\n').map(line => ({ lyric: line }))
                );
                setIsPlayerLyricReady(true);
              }
              if (!isShufflePlaying) {
                setShowInitialOverlay(true);
              }
              if (lyricScrollBoxRef.current) {
                lyricScrollBoxRef.current.scrollTop = 0;
              }
              setHistoryData(data['title'], videoId);
            } catch (error) {
              console.error('Error fetching data:', error);
            }
          }
          setPrepareKaraokeStatus(0);
          setIsChangeLyricForm(false);
          break;
        default:
          break;
      }
    };

    prepareKaraoke();
  }, [prepareKaraokeStatus]);

  return (
    <Box>
      {/* Form Section */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'center', md: 'flex-start' },
        padding: 2,
      }}>
        {/* Left Section: Recommendations */}
        <Box sx={{
          width: { xs: '100%', md: '20%' },
          padding: 2,
          color: 'white',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          marginBottom: { xs: 2, md: 0 }
        }}>
          <Typography variant="h5" sx={{ marginBottom: 2 }}>あなたへのオススメ！</Typography>
          {recommendation.map((song, index) => (
            <Typography key={index} sx={{ marginBottom: 1 }}>
              <Link href={`${hostUrl}/search_id/${song.videoId}`} sx={{ color: 'inherit', textDecoration: 'underline' }}>
                {song.title}
              </Link>
            </Typography>
          ))}
        </Box>

        {/* Center Section: Main Form */}
        <Box sx={{
          width: { xs: '100%', md: '50%' },
          padding: 2,
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          color: 'white',
          marginBottom: { xs: 2, md: 0 }
        }}>
          {/* Error Messages */}
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
          {lyricFormWarningMessage && (
            <Box sx={{ width: '100%', textAlign: 'center', color: 'yellow' }}>
              {Array.isArray(lyricFormWarningMessage) && lyricFormWarningMessage.map((message, index) => (
                <Typography key={index} variant="body2">
                  {message}
                </Typography>
              ))}
            </Box>
          )}

          {/* YouTube URL Input */}
          <Box sx={{ marginBottom: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <h3>YoutubeURL</h3>
              <Button
                variant="contained"
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
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              InputProps={{
                style: { backgroundColor: 'white', color: 'black' },
              }}
            />
          </Box>

          {/* Lyrics Input */}
          <Box sx={{ marginBottom: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <h3>歌詞</h3>
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {beforeAutoLyric != null && (
                    <Button
                      variant="contained"
                      onClick={handleUndoAutoLyric}
                      sx={{ backgroundColor: '#555', color: 'white', '&:hover': { backgroundColor: '#333' } }}
                    >
                      戻す
                    </Button>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {isAutoSearchLyric ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                      <Typography sx={{ color: 'white' }}>
                        歌詞を検索中...
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isOverseas}
                            onChange={handleOverseasChange}
                            style={{ color: 'white' }}
                          />
                        }
                        label="海外の曲か？"
                        sx={{ margin: 0 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleSearchLyric}
                        sx={{ backgroundColor: '#555', color: 'white', '&:hover': { backgroundColor: '#333' } }}
                      >
                        歌詞検索
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={10}
              variant="outlined"
              value={lyric}
              onChange={handleLyricChange}
              placeholder="歌詞をここに入力してください"
              InputProps={{
                style: { backgroundColor: 'white', color: 'black' },
              }}
            />
          </Box>

          {/* Sing Button */}
          <Box sx={{ textAlign: 'center' }}>
            {prepareKaraokeStatus === 0 ? (
              <Button
                variant="contained"
                onClick={() => setPrepareKaraokeStatus(1)}
                sx={{ 
                  width: '200px', 
                  height: '50px', 
                  backgroundColor: '#333', 
                  color: 'white', 
                  '&:hover': { backgroundColor: '#111' } 
                }}
              >
                Sing
              </Button>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
                <CircularProgress sx={{ color: 'white' }} />
                <Typography sx={{ ml: 2, color: 'white' }}>
                  カラオケの準備をしています...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Right Section: History */}
        <Box sx={{
          width: { xs: '100%', md: '25%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: 'white',
        }}>
          {/* Your History */}
          <Box sx={{
            padding: 2,
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            marginBottom: 2
          }}>
            <Typography variant="h5" sx={{ marginBottom: 2 }}>あなたの履歴</Typography>
            {yourHistory.map((song, index) => (
              <Typography key={index} sx={{ marginBottom: 1 }}>
                <Link href={`${hostUrl}/search_id/${song.videoId}`} sx={{ color: 'inherit', textDecoration: 'underline' }}>
                  {song.title}
                </Link>
              </Typography>
            ))}
          </Box>
          {/* Everyone's History */}
          <Box sx={{
            padding: 2,
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <Typography variant="h5" sx={{ marginBottom: 2 }}>みんなの履歴</Typography>
            {everyoneHistory.map((song, index) => (
              <Typography key={index} sx={{ marginBottom: 1 }}>
                <Link href={`${hostUrl}/search_id/${song.videoId}`} sx={{ color: 'inherit', textDecoration: 'underline' }}>
                  {song.title}
                </Link>
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Player Section */}
      <Box
        ref={videoContainerRef}
        sx={{
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
          margin: '0 auto',
          display: (isKaraokeReady || isOnceKaraokeReady) ? 'block' : 'none',
        }}
      >
        {/* YouTube Player */}
        <YouTube
          videoId={youtubeApiVideoId}
          opts={{
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 0,
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
          style={{
            aspectRatio: '16/9',
            top: isFullScreen ? '50%' : '0',
            transform: isFullScreen ? 'translateY(-50%)' : 'none',
            position: 'absolute',
            left: '0',
            right: '0',
          }}
        />

        {/* Initial Overlay */}
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

        {/* Lyrics Display */}
        {isPlayerLyricReady && (
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
                xs: '10%',
                sm: '15%',
                md: '25%',
                lg: '35%',
              },
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              zIndex: isTimestampLyric ? 1 : 3,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Box
              sx={{
                height: {
                  xs: '150px',
                  sm: '200px',
                  md: '250px',
                },
                overflowY: isTimestampLyric ? 'hidden' : 'scroll',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {/* Timestamped Lyrics */}
              <Box sx={{ display: isTimestampLyric ? 'block' : 'none' }}>
                {playerLyricList.map((line, index) => (
                  <Typography
                    key={index}
                    ref={(el) => (lyricLineRef.current[index] = el)}
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

              {/* Non-timestamped Lyrics */}
              <Box sx={{ display: isTimestampLyric ? 'none' : 'block' }}>
                {playerLyricList.map((line, index) => (
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
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Controls Overlay */}
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
            {/* Volume Controls */}
            {/* Instrumental Volume */}
            <Box 
              sx={{ 
                position: 'absolute',
                left: '10px',
                height: {
                  xs: '40%',
                  sm: '55%',
                  md: '60%',
                  lg: '70%',
                },
                top: '5%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <PianoIcon sx={{ color: 'white' }} />
              </Box>
              <Slider
                value={instVolume}
                onChange={handleInstVolumeChange}
                orientation="vertical"
                sx={{
                  height: '100%',
                  color: 'white',
                }}
                step={1}
                min={0}
                max={100}
                onChangeCommitted={resetControlTimeout}
                onMouseDown={(event) => event.stopPropagation()}
              />
            </Box>

            {/* Vocal Volume */}
            <Box 
              sx={{ 
                position: 'absolute',
                right: '10px',
                height: {
                  xs: '40%',
                  sm: '55%',
                  md: '60%',
                  lg: '70%',
                },
                top: '5%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <MicIcon sx={{ color: 'white' }} />
              </Box>
              <Slider
                value={vocalVolume}
                onChange={handleVocalVolumeChange}
                orientation="vertical"
                sx={{
                  height: '100%',
                  color: 'white',
                }}
                step={1}
                min={0}
                max={100}
                onChangeCommitted={resetControlTimeout}
                onMouseDown={(event) => event.stopPropagation()}
              />
            </Box>

            {/* Play/Pause Button */}
            <Button
              onClick={handlePlayPause}
              sx={{
                position: 'absolute',
                bottom: '50px',
                left: '10px',
                color: 'white',
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </Button>

            {/* Seek Bar */}
            <Slider
              value={currentTime}
              min={0}
              max={duration}
              onChange={handleSeekChange}
              sx={{
                width: '95%',
                position: 'absolute',
                bottom: '10px',
                color: 'white',
              }}
              onChangeCommitted={resetControlTimeout}
              onMouseDown={(event) => event.stopPropagation()}
            />

            {/* Fullscreen Toggle */}
            <Button
              onClick={toggleFullScreen}
              sx={{
                position: 'absolute',
                bottom: '55px',
                right: '10px',
                color: 'white',
              }}
            >
              {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </Button>

            {/* Loop Toggle */}
            <Button
              onClick={toggleLoop}
              sx={{
                position: 'absolute',
                bottom: '55px',
                right: '60px',
                color: isLooping ? 'skyBlue' : 'white',
              }}
            >
              <LoopIcon />
            </Button>

            {/* Shuffle Toggle */}
            <Button
              onClick={toggleShuffle}
              sx={{
                position: 'absolute',
                bottom: '55px',
                right: '110px',
                color: isShuffling ? 'skyBlue' : 'white',
              }}
            >
              <ShuffleIcon />
            </Button>

            {/* Pitch Control */}
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: '55px', 
                left: '60px',
                display: 'flex', 
                alignItems: 'center', 
                color: 'white',
              }}
            >
              <Button 
                onClick={() => handlePitchChange(-1)} 
                sx={{ 
                  color: 'white', 
                  minWidth: '40px',
                  fontSize: '24px',
                  padding: '0px'
                }}
              >
                -
              </Button>
              <Typography 
                variant="body1" 
                sx={{ 
                  margin: '0 10px', 
                  fontSize: '18px'
                }}
              >
                {currentPitch}
              </Typography>
              <Button 
                onClick={() => handlePitchChange(1)} 
                sx={{ 
                  color: 'white', 
                  minWidth: '40px',
                  fontSize: '24px',
                  padding: '0px'
                }}
              >
                +
              </Button>
            </Box>
          </Box>
        )}
        {/* 透明なオーバーレイ */}
        <Box
          onClick={handleOverlayClick}
          sx={{
            position: 'absolute', // absoluteのままにする
            top: 0,
            left: 0,
            width: '100%',
            height: '100%', // 親要素の高さに基づいて高さを設定
            backgroundColor: 'rgba(0, 0, 0, 0.0)',
            zIndex: 1,
          }}
        >
        {isOnceKaraokeReady && !isKaraokeReady && (
          <Box
            sx={{
              position: 'absolute', // absoluteのままにする
              top: 0,
              left: 0,
              width: '100%',
              height: '100%', // 親要素の高さに基づいて高さを設定
              backgroundColor: 'rgba(0, 0, 0, 0.0)',
              zIndex: 1,
            }}
          />
        )}
          {/* <Box sx={{ position: 'absolute', width: '100%', height: '15%', top: '0' }}>
            <Waveform 
              ref={vocalWaveformRef} 
              audioUrl={vocalAudioUrl} 
              isPlaying={isPlaying} 
              barAlign='top' 
              onReady={() => setIsVocalWaveFormerReady(true)} 
            />
          </Box>
          <Box sx={{ position: 'absolute', width: '100%', height: '15%', top: '85%', backgroundColor: 'rgba(255,0,0,0)' }}>
            <Waveform 
              ref={instWaveformRef} 
              audioUrl={instAudioUrl} 
              isPlaying={isPlaying} 
              barAlign='bottom'
              onReady={() => setIsInstWaveFormerReady(true)} 
            />
          </Box> */}
        </Box>
      </Box>
    </Box>
  );
}
