import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Slider, Button, Typography, Checkbox, TextField, FormControlLabel, Link } from '@mui/material';
import { useLocation } from 'react-router-dom';
import YouTube from 'react-youtube';
// import Waveform from './Waveform';
import Cookies from 'js-cookie';
import CircularProgress from '@mui/material/CircularProgress';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import LoopIcon from '@mui/icons-material/Loop';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import PianoIcon from '@mui/icons-material/Piano'; // 仮の例
import MicIcon from '@mui/icons-material/Mic';

import * as FormPost from '../Global/FormPost';

export const Player = () => {
  const hostUrl = process.env.REACT_APP_HOST_URL;

  const [yourHistory, setYourHistory] = useState([]);
  useEffect(() => {
    const yourHistory = JSON.parse(Cookies.get('yourHistory') || '[]');
    if (yourHistory.length > 0) {
      setYourHistory(yourHistory);
      if(!videoData){//もしsearch_idからページに入らなかったら、以前最後に歌った曲を記入しておく
        const videoId = yourHistory[0]['videoId']
        const url='https://www.youtube.com/watch?v=' + videoId;
        setYoutubeUrl(url);
        setLyricByCookie(videoId);
      }
    }
  }, []);
  
  const setLyricByCookie = async(videoId) => {
    const lyric = await FormPost.fetchLyricFromDB(videoId);
    setLyric(lyric);
  }

  const [everyoneHistory, setEveryoneHistory] = useState([]);
  const [recommendation, setRecommendations] = useState([]);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [beforeYoutubeUrlFormVideoId, setBeforeYoutubeUrlFormVideoId] = useState('');

  const [lyric, setLyric] = useState('');
  const [beforeAutoLyric, setBeforeAutoLyric] = useState(null);
  const [isAutoSearchLyric, setIsAutoSearchLyric] = useState(false)
  const [isOverseas, setIsOverseas] = useState(false);
  const [youtubeUrlErrorMessage, setYoutubeUrlErrorMessage] = useState(''); // エラーメッセージ用の状態
  const [lyricFormErrorMessage, setLyricFormUrlErrorMessage] = useState(''); // エラーメッセージ用の状態
  const [lyricFormWarningMessage, setLyricFormUrlWarningMessage] = useState(''); // エラーメッセージ用の状態
  const [isChangeLyricForm, setIsChangeLyricForm]= useState(true);
  const [prepareKaraokeStatus, setPrepareKaraokeStatus] = useState(0);

  const location = useLocation();
  const videoData = location.state?.videoData;

  const [beforeVideoId, setBeforeVideoId] = useState('');

  useEffect(() => {//searchIdでページ推移されたときにformを記入済みにしておく
    const setUrlAndLyricInForm = async () => {
      if(videoData){
        const videoId = videoData.videoId;
        setYoutubeUrl(`https://www.youtube.com/watch?v=${videoId}`);
        setLyric(await FormPost.fetchLyricFromDB(videoId));//videoIdをもとに最新の歌詞を入力
      }
    }
    setUrlAndLyricInForm();
  }, []);  // 空の依存配列にすることで、初回マウント時にのみ実行される

  const fetchHistoryData = useCallback(async () => {
    const history = await FormPost.fetchEveryoneHistory();
    setEveryoneHistory(history);
  }, []);

  const fetchRecommendData = useCallback(async () => {
    const recommends = await FormPost.fetchRandomMusics(5);
    console.log("recommends", recommends);
    setRecommendations(recommends);
  },[]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);//関数を依存関係に入れるとループが防げるらしい

  useEffect(() => {
    fetchRecommendData();
  }, [fetchRecommendData]);
  
  const resetForms = () => {
    setYoutubeUrl('');
    setLyric('');
  }
  const extractVideoId = (youtubeUrl) => {
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:\S+)?$/;
    const match = youtubeUrl.match(regex);
    return match ? match[1] : null;
  }

  const handleUrlChange = async (event) => {
    const url = event.target.value;
    setYoutubeUrl(url);
  
    let videoId = extractVideoId(url);
    if (videoId) {
      if(videoId!=beforeYoutubeUrlFormVideoId){//今までと違うvideoIdが入力されたら
        setBeforeYoutubeUrlFormVideoId(videoId);
        setLyric('');
        try {
          const lyric = await FormPost.fetchLyricFromDB(videoId);
          if(lyric!='Null'){
            setLyric(lyric);
          }
        } catch (error) {
          console.error('Error fetching lyric:', error);
        }
        setIsChangeLyricForm(true);
      }
    }
  };

  const timestampExistCheck = (text) =>{
    if (!text) {
      return false;  // 文字列が空または未定義の場合
    }
  
    // 歌詞を行ごとに分割
    const lines = text.split('\n');
    const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/;
    let warnings = [];
    
    // いずれかの行にタイムスタンプが存在するかチェック
    let timestampExist = lines.some(line => timestampRegex.test(line));
    if (!timestampExist) {
      return false;  // タイムスタンプが一つもない場合、falseを返す
    }
  
    // 全ての行をチェックして、タイムスタンプがない場合は警告をリストに追加
    lines.forEach((line, index) => {
      if (!timestampRegex.test(line)) {
        warnings.push(`${index + 1}行目: 「${line}」にタイムスタンプがありません`);
      }
    });
    if(warnings.length > 0){//もしタイムスタンプ抜けがあったら警告文だけ出しておく
      setLyricFormUrlWarningMessage(warnings);
      return false;
    }
    return true; // タイムスタンプの問題がある行があれば警告のリストを、なければ true を返す
  }

  const timestampChronologyCheck = (text) => {
    if (text) {
      const lines = text.split('\n');
      const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/; // 1から3桁の小数点部分に対応
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
  
  const timestampize = (text) => {
    try {
      const playerLyricList = [];
  
      //最初の歌詞を真ん中に表示させるための空の要素2個をリストに追加
      playerLyricList.push({ timestamp: 0.0, lyric: '' });
      playerLyricList.push({ timestamp: 0.0, lyric: '' });
  
      if (text) {
        const lines = text.split('\n');
        const timestampRegex = /\[\d{2}:\d{2}(?:\.\d{1,3})?\]/; // 1から3桁の小数点部分に対応
  
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
      return playerLyricList; // return文を正しい位置に配置
    } catch (error) {
      console.error('Error processing text:', error);  // エラーをコンソールに表示
      return [];  // 空の配列を返すか、別の適切なエラーハンドリングを行う
    }
  };  

  const handleLyricChange = (event) => {
    setLyricFormUrlErrorMessage('')
    if(!isChangeLyricForm){
      setIsChangeLyricForm('true');
    }
    setLyric(event.target.value);
  };

  const handleOverseasChange = (event) => {
    setIsOverseas(event.target.checked);
  };

  const handleSearchLyric = async() => {//現在のvideoIdの曲の歌詞をwebから検索して返す
    const videoId = extractVideoId(youtubeUrl);//youtubeのurlの形式か確認
    if (!videoId) {
      setYoutubeUrlErrorMessage('入力されたURLはYouTubeのURLの形式ではありません'); // エラーメッセージを設定
      return; // ここで終了して戻る
    } else {
      setYoutubeUrlErrorMessage(''); // エラーメッセージをクリア
    }
    setIsAutoSearchLyric(true);
    const language = isOverseas ? 'en' : 'ja'
    const title = await FormPost.fetchTitleByVideoId(videoId)
    if(title=='Null'){
      setLyricFormUrlErrorMessage('歌詞は見つかりませんでした: title missing'); // エラーメッセージを設定\
    }
    const searchedLyric = await FormPost.searchLyricFromWeb(title, language);
    // console.log('searchedLyric',searchedLyric);
    if(searchedLyric=='Null' || searchedLyric==''){
      setLyricFormUrlErrorMessage('歌詞は見つかりませんでした'); // エラーメッセージを設定
    }else{
      setBeforeAutoLyric(lyric);//自動検索前の歌詞を保存
      setLyric(searchedLyric);
    }
    setIsChangeLyricForm(true);
    setIsAutoSearchLyric(false);

  };

  const handleUndoAutoLyric = () =>{
    setLyric(beforeAutoLyric);
    setBeforeAutoLyric(null);
  }

  const setHistoryData = (title, videoId) => {//クッキーに追加で履歴を残す
    const historyData = { 
      title: title,
      videoId: videoId
    };
    // 同じvideoIdの履歴があれば削除
    const updateYourHistory = yourHistory.filter(item => item.videoId !== videoId);
    updateYourHistory.unshift(historyData);
    if (updateYourHistory.length > 5) {
      updateYourHistory.pop();
    }
    setYourHistory(updateYourHistory);
    Cookies.set('yourHistory', JSON.stringify(updateYourHistory), { path: '/', expires: 31 });
  }

  useEffect(() => {
    const prepareKaraoke = async () => {
      let videoId;
      if (prepareKaraokeStatus > 0) {
        videoId = extractVideoId(youtubeUrl);
      }
      switch (prepareKaraokeStatus) {
        case 0: // 初期状態
          break;
        case 1:
          setIsTimestampLyric(false);
          setPrepareKaraokeStatus(2);

          break;
        case 2: // フォームにミスがないか確認
          if (!videoId) {
            setYoutubeUrlErrorMessage('入力されたURLはYouTubeのURLの形式ではありません'); // エラーメッセージを設定
            return; // ここで終了して戻る
          } else {
            setYoutubeUrlErrorMessage(''); // エラーメッセージをクリア
          }
          if (timestampExistCheck(lyric)) { // すべての行にタイムスタンプがあったら
            if (timestampChronologyCheck(lyric)) { // 時系列があっているかを最終チェック
              return; // 時系列が崩れてたらエラー文を出して無効にする
            }
            setIsPlayerLyricReady(false);
            if(isChangeLyricForm){//歌詞欄に変化があったら歌詞を代入する
              const timestampedLyric = timestampize(lyric);
              setPlayerLyricList(timestampedLyric);
            }
            setIsTimestampLyric(true);
          }
          setPrepareKaraokeStatus(3);
          break;
  
        case 3:
          if (isTimestampLyric) { // タイムスタンプ付きの歌詞だった場合
            if (beforeVideoId !== videoId) { // videoIdが変わったとき
              setCurrentLyricIndex(2);//1行目の歌詞を真ん中に来るように
            }
            setIsPlayerLyricReady(true);//これでtimestamp付きの歌詞の場合の準備は完了
          }else{
            setCurrentLyricIndex(-1);//文字が大きくなったり、透明になったりしないように
          }
          setPrepareKaraokeStatus(4);
          break;
  
        case 4: // videoIdをもとにPlayerや歌詞の準備をする
          if (beforeVideoId === videoId) { // videoIdが変わってないとき
            if (isShufflePlaying) { // もしシャッフル再生中に同じvideoIdになったら
              seekChange(0);
              setIsPlaying(true);
              playerRef.current.playVideo();
              instAudioRef.current.play();
              vocalAudioRef.current.play();
              syncSeekOfMusicAndYoutubeApi();
              setIsShufflePlaying(false);
            }

            if (isChangeLyricForm) { // 歌詞に変更があった時
              try {
                const result = await FormPost.updateLyricInDB(videoId, lyric);
              
                if (result.error) { // エラーがあればエラーメッセージをセット
                  setLyricFormUrlErrorMessage('歌詞の更新中にエラーが発生したようです: ' + result.error);
                } else {
                  setLyricFormUrlErrorMessage('');
              
                  // timestampが無かったら、プレイヤーの歌詞リストを更新
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
          } else { // 新しく入力されたvideoIdのurlだったら
            setBeforeVideoId(videoId);
            try {
              const data = await FormPost.separateMusic(youtubeUrl, videoId, lyric); // 曲情報を取得
              setIsInstWaveFormerReady(false);
              setIsVocalWaveFormerReady(false);
              setIsYoutubeApiReady(false);
              setIsMusicsReady(false);
  
              setYoutubeApiVideoId(videoId);
              initializeAudio(data['path']);
              setEveryoneHistory(data['history']);
              if (!isTimestampLyric) { // もし歌詞がタイムスタンプ式で事前処理がなされてなかったら
                setPlayerLyricList(
                  lyric.split('\n').map(line => ({ lyric: line }))
                ); // 表示する歌詞を変更
                setIsPlayerLyricReady(true);
              }
              if (!isShufflePlaying) { // シャフル再生中じゃなかったら初期オーバーレイを再表示
                setShowInitialOverlay(true);
              }
              if (lyricScrollBoxRef.current) {//歌詞のスクロールを一番上にする
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
  //player
  const [youtubeApiVideoId, setYoutubeApiVideoId] = useState(''); // Initial videoId
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [instVolume, setInstVolume] = useState(100);
  const [vocalVolume, setVocalVolume] = useState(10);
  useEffect(() => {
    const instVolume = JSON.parse(Cookies.get('instVolume') || 100);
    if (instVolume) {
      setInstVolume(instVolume);
    }
    const vocalVolume = JSON.parse(Cookies.get('vocalVolume') || 30);
    if (vocalVolume) {
      setVocalVolume(vocalVolume);
    }
  }, []);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showInitialOverlay, setShowInitialOverlay] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playerLyricList, setPlayerLyricList] = useState([]);//リストとしての歌詞(timestamp用)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [vocalAudioUrl, setVocalAudioUrl] = useState('');
  const [instAudioUrl, setInstAudioUrl] = useState('');
  const [isTimestampLyric, setIsTimestampLyric] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isShufflePlaying, setIsShufflePlaying] = useState(false)
  useEffect(() => {
    
    const loopValue = Cookies.get('loop');
    const isLooping = loopValue === 'true'; // 文字列をBooleanに変換
    if (isLooping) {
      setIsLooping(isLooping);
    }
    
    const shuffleValue = Cookies.get('shuffle');
    const isShuffling = shuffleValue === 'true'; // 文字列をBooleanに変換
    if (isShuffling) {
      setIsShuffling(isShuffling);
    }
  }, []);

  const controlTimeoutRef = useRef(null);

  const playerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const instGainNodeRef = useRef(null);
  const vocalGainNodeRef = useRef(null);
  const instAudioRef = useRef(null);
  const vocalAudioRef = useRef(null);

  const instWaveformRef = useRef(null);
  const vocalWaveformRef = useRef(null);
  const lyricScrollBoxRef = useRef(null);
  const lyricLineRef = useRef([]); // 各歌詞行の ref を保持

  // function useLoggedState(initialValue, name) {
  //   const [state, setState] = useState(initialValue);
  
  //   const setLoggedState = useCallback((value) => {
  //     console.log(`ready is ${isKaraokeReady} and ${name} set to:`, value);
  //     setState(value);
  //   }, [name]);
  
  //   return [state, setLoggedState];
  // }
  // const [isPlayerLyricReady, setIsPlayerLyricReady] = useLoggedState(false, 'isPlayerLyricReady');
  // const [isInstWaveFormerReady, setIsInstWaveFormerReady] = useLoggedState(false, 'isInstWaveFormerReady');
  // const [isVocalWaveFormerReady, setIsVocalWaveFormerReady] = useLoggedState(false, 'isVocalWaveFormerReady');
  // const [isYoutubeApiReady, setIsYoutubeApiReady] = useLoggedState(false, 'isYoutubeApiReady');
  // const [isMusicsReady, setIsMusicsReady] = useLoggedState(false, 'isMusicsReady');

  const [isPlayerLyricReady, setIsPlayerLyricReady] = useState(false);
  const [isInstWaveFormerReady, setIsInstWaveFormerReady] = useState(false);
  const [isVocalWaveFormerReady, setIsVocalWaveFormerReady] = useState(false);
  const [isYoutubeApiReady, setIsYoutubeApiReady] = useState(false);
  const [isMusicsReady, setIsMusicsReady] = useState(false);
  // const isKaraokeReady = isPlayerLyricReady && isInstWaveFormerReady && isVocalWaveFormerReady && isYoutubeApiReady && isMusicsReady;
  // const isKaraokeReady = isPlayerLyricReady && isYoutubeApiReady && isMusicsReady;
  const [isKaraokeReady, setIsKaraokeReady] = useState(false);
  const [isOnceKaraokeReady, setIsOnceKaraokeReady] = useState(false);


  const initializeAudio = async (path) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (isPlaying) {//再生中だったら止める
      playerRef.current.pauseVideo();
      instAudioRef.current.pause();
      vocalAudioRef.current.pause();
      setIsPlaying(false);
    }

    const folderpath = hostUrl + path;
    // Waveform コンポーネント用のオーディオURLを更新
    setVocalAudioUrl(`${folderpath}/vocals.mp3`);
    setInstAudioUrl(`${folderpath}/no_vocals.mp3`);

    // オーディオファイルをロード
    const instAudio = new Audio(`${folderpath}/no_vocals.mp3`);
    const vocalAudio = new Audio(`${folderpath}/vocals.mp3`);

    // 音声が完全に読み込まれるのを待つ
    await Promise.all([
      new Promise((resolve) => { instAudio.addEventListener('canplaythrough', resolve, { once: true }); }),
      new Promise((resolve) => { vocalAudio.addEventListener('canplaythrough', resolve, { once: true }); }),
    ]);

    // インストルメンタルのオーディオ設定
    const instSource = audioContextRef.current.createMediaElementSource(instAudio);
    const instGainNode = audioContextRef.current.createGain();
    instSource.connect(instGainNode).connect(audioContextRef.current.destination);

    instGainNode.gain.value = calculateVolume(instVolume);
    instAudio.loop = false;

    // console.log("loop",isLooping, 'shuffle',isShuffling);
    instAudio.addEventListener('ended', handleEndedMusic);

    instAudioRef.current = instAudio;
    instGainNodeRef.current = instGainNode;

    // ボーカルのオーディオ設定
    const vocalSource = audioContextRef.current.createMediaElementSource(vocalAudio);
    const vocalGainNode = audioContextRef.current.createGain();
    vocalSource.connect(vocalGainNode).connect(audioContextRef.current.destination);

    vocalGainNode.gain.value = calculateVolume(vocalVolume);
    vocalAudio.loop = false;

    vocalAudioRef.current = vocalAudio;
    vocalGainNodeRef.current = vocalGainNode;
    setIsMusicsReady(true);

  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      clearTimeout(controlTimeoutRef.current);
    };
  }, []);

  const resetControlTimeout = () => {//時間経過でオーバーレイを消す
    clearTimeout(controlTimeoutRef.current);
    controlTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handlePlayerReady = (event) => {//youtubeAPIの準備が完了したら呼ばれる関数
    playerRef.current = event.target;
    setIsYoutubeApiReady(true);
    setDuration(event.target.getDuration());
  };

  const handlePlayPause = (event) => {//再生・一時停止ボタンが押されたら...
    event.stopPropagation();
    if (isPlaying) {//再生中だったら止める
      playerRef.current.pauseVideo();
      instAudioRef.current.pause();
      vocalAudioRef.current.pause();
    } else {//停止中だったら再生する
      playerRef.current.playVideo();
      instAudioRef.current.play();
      vocalAudioRef.current.play();
      syncSeekOfMusicAndYoutubeApi();
    }
    setIsPlaying(!isPlaying);
    resetControlTimeout();
  };

  const handleInstVolumeChange = (event, newValue) => {//instのボリュームバーが変更されたら
    setInstVolume(newValue);
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = newValue / 100;
    }
    resetControlTimeout();
  };

  const handleVocalVolumeChange = (event, newValue) => {//vocalのボリュームバーが変更されたら
    setVocalVolume(newValue);
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = newValue / 100;
    }
    resetControlTimeout();
  };

  const calculateVolume = (value) => {//value(0~100)
    const calculatedVolume = (value/100)**0.8;// value を 0.0 と 100.0 の範囲にクランプ
    const clampedVolume = Math.max(0.0, Math.min(calculatedVolume, 100.0));// log₁₀₀(clampedVolume + 1) を計算
    return clampedVolume;
  };

  const handleOverlayClick = () => {//オーバーレイがクリックされたときに呼ばれる関数
    setShowControls(true);
    resetControlTimeout();
  };

  const seekChange = (value) =>{//特定の位置にシークさせる
    playerRef.current.seekTo(value);
    instAudioRef.current.currentTime = value;
    vocalAudioRef.current.currentTime = value;

    if (instWaveformRef.current) {
      instWaveformRef.current.handleSeekTo(value);
    }
    if (vocalWaveformRef.current) {
      vocalWaveformRef.current.handleSeekTo(value);
    }
    setCurrentTime(value);
    updatePlayerLyric();//instAudioRefをもとに歌詞を移動

  }

  const handleSeekChange = (event, newValue) => {//シークバーが変更されたら呼ばれる関数
    seekChange(newValue);
    resetControlTimeout();
  };

  const handleInitialOverlayClick = () => {//最初に表示される再生マークだけのオーバーレイがクリックされたら呼ばれる関数
    resetControlTimeout();
    setShowInitialOverlay(false);
    setShowControls(true);

    if (playerRef.current) {
      setIsPlaying(true);
      playerRef.current.playVideo();
      instAudioRef.current.play();
      vocalAudioRef.current.play();

      syncSeekOfMusicAndYoutubeApi();
      
    } else {
      console.error('YouTube player is not ready');
    }
  };

  const syncSeekOfMusicAndYoutubeApi = () => {
    setTimeout(() => {
      // instAudioRefとplayerRefのcurrentTimeがどれだけずれているかを計算
      const timeDifference = Math.abs(instAudioRef.current.currentTime - playerRef.current.getCurrentTime());
    
      // ずれが0.1秒以上あれば修正
      if (timeDifference > 0.1) {
        playerRef.current.seekTo(instAudioRef.current.currentTime);
        // console.log('Time discrepancy adjusted.');
      }
    }, 1000);  // 1秒後にチェック
  }

  useEffect(() => {//ボリュームの値が変更されたら音量を変更する
    if (instGainNodeRef.current) {
      instGainNodeRef.current.gain.value = calculateVolume(instVolume);

      // クッキーに配列を保存する
      Cookies.set('instVolume', instVolume, { path: '/', expires: 31 });
    }
    if (vocalGainNodeRef.current) {
      vocalGainNodeRef.current.gain.value = calculateVolume(vocalVolume);
      Cookies.set('vocalVolume', vocalVolume, { path: '/', expires: 31 });

    }
  }, [instVolume, vocalVolume]);



  useEffect(() => {
    const handleFocus = () => {
      // console.log('isKaraokeReady', isKaraokeReady, 'isPlaying', isPlaying);
      setTimeout(() => {
        // console.log('遅れてisPlayerReady', isKaraokeReady, 'isPlaying', isPlaying);

        if (isKaraokeReady && isPlaying) { // 音楽を流していたら
          // console.log('動画動いた!');
          playerRef.current.seekTo(instAudioRef.current.currentTime); // youtubeAPI(映像)の位置を現在音が再生されているところにする
        }
      }, 500); // 500ms遅延
    };
  
    const handleBlur = () => {
      // ブラウザタブが非アクティブになったときの処理
      // console.log('ブラウザタブが非アクティブになりました');
    };
  
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
  
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }); // 依存配列に状態とリファレンスを追加
  

  // 全画面モードのトグル関数を useCallback でメモ化
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

  // EscやF11で全画面解除
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isFullScreen) {
          toggleFullScreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen, toggleFullScreen]);  // toggleFullScreenを依存配列に追加

  const handleEndedMusic = useCallback(async () => {//一度しか関数が生成できないようにする
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
      // console.log("videoData",videoData);
      if (videoData && videoData.length > 0) {
        setIsShufflePlaying(true);
  
        const data = videoData[0];// 配列の最初の要素にアクセス
        const url = 'https://www.youtube.com/watch?v=' + data['videoId'];
        setYoutubeUrl(url);
        setLyric(data['lyric']);
        setIsChangeLyricForm(true);
      }
    }
  }, [isLooping, isShuffling]);

  useEffect(() => {//音量が変更されて、関数が更新されてからイベントを登録しなおし
    if(instAudioRef.current){
      instAudioRef.current.removeEventListener('ended', handleEndedMusic);
      instAudioRef.current.addEventListener('ended', handleEndedMusic);
    }
    Cookies.set('loop', isLooping, { path: '/', expires: 31 });
    Cookies.set('shuffle', isShuffling, { path: '/', expires: 31 });

    // クリーンアップでイベントリスナーを削除
    return () => {
      if (instAudioRef.current) {
        instAudioRef.current.removeEventListener('ended', handleEndedMusic);
      }
    };
  }, [handleEndedMusic]);

  useEffect(() => {
    const fetchData = async () => {
      if(isShufflePlaying){
        setPrepareKaraokeStatus(1);
      }
    };
    
    fetchData();
  }, [isShufflePlaying]);

  useEffect(() => {
    if(isKaraokeReady){//カラオケの準備完了!
      if(!isOnceKaraokeReady){
        setIsOnceKaraokeReady(true);
      }
      if(isShufflePlaying){//シャッフル再生での音楽の切り替わりだったら、準備完了後に再生させる！
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
    
  }, [isKaraokeReady]); // isKaraokeReadyが変化したときに実行される

  const toggleLoop = () => {//ループ機能のみオンにする
    setIsLooping(!isLooping);
    if(isShuffling){
      setIsShuffling(false);
    }
  };

  const toggleShuffle = () => {//シャッフル機能のみオンにする
    setIsShuffling(!isShuffling);
    if(isLooping){
      setIsLooping(false);
    }
  };

  const updatePlayerLyric = () =>{//歌詞の位置を更新
    const time = instAudioRef.current.currentTime;
    setCurrentTime(time);

    const currentIndex = playerLyricList.findIndex(
      (lyric, index) =>
        time >= lyric.timestamp &&
        (index === playerLyricList.length - 1 || time < playerLyricList[index + 1].timestamp)
    );
    setCurrentLyricIndex(currentIndex);
  }

  // currentLyricIndex の変更時に該当行をスクロール
  useEffect(() => {
    if (lyricLineRef.current[currentLyricIndex]) {
      lyricLineRef.current[currentLyricIndex].scrollIntoView({
        behavior: 'smooth',  // スムーズにスクロール
        block: 'center',     // 中央に表示
      });
    }
  }, [currentLyricIndex]);

  useEffect(() => {//タイムスタンプに沿って歌詞を動かす。また、シークバーを動かす
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying && playerLyricList.length > 0) {
        updatePlayerLyric();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playerLyricList]);

  useEffect(() =>{
    setIsKaraokeReady(isPlayerLyricReady && isYoutubeApiReady && isMusicsReady);
    // console.log('after_L',isPlayerLyricReady, 'Y',isYoutubeApiReady, 'M',isMusicsReady, 'K',isKaraokeReady);

  // },[isPlayerLyricReady, isInstWaveFormerReady, isVocalWaveFormerReady, isYoutubeApiReady, isMusicsReady])
  },[isPlayerLyricReady, isYoutubeApiReady, isMusicsReady])

  // useEffect(() =>{
  //   console.log('playerLyricList', playerLyricList);
  // },[playerLyricList])

  // useEffect(() =>{
  //   console.log('prepareKaraokeStatus', prepareKaraokeStatus);
  // },[prepareKaraokeStatus])

  // useEffect(() =>{
  //   console.log('isTimestampLyric', isTimestampLyric);
  // },[isTimestampLyric])

  return (
    <Box>
      {/* formの表示 */}
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
          <Typography variant='h5' sx={{ marginBottom: 2 }}>あなたへのオススメ！</Typography>
            {recommendation.map((song, index) => (
              <Typography key={index} sx={{ marginBottom: 1 }}>
                <Link href={`${hostUrl}/search_id/${song.videoId}`} sx={{ color: 'inherit', textDecoration: 'underline' }}>
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
            <Typography color='error' sx={{ width: '100%', textAlign: 'center' }}>
              {youtubeUrlErrorMessage}
            </Typography>
          )}
          {lyricFormErrorMessage && (
            <Typography color='error' sx={{ width: '100%', textAlign: 'center' }}>
              {lyricFormErrorMessage}
            </Typography>
          )}
          {lyricFormWarningMessage && (//リストを１行ごと表示
            <Box sx={{ width: '100%', textAlign: 'center', color: 'yellow' }}>
              {lyricFormWarningMessage.map((message, index) => (
                <Typography key={index} variant='body2'>
                  {message}
                </Typography>
              ))}
            </Box>
          )}
          <Box sx={{ marginBottom: 2 }}>
            <Box sx={{display:'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <h3>YoutubeURL</h3>
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
              value={youtubeUrl}
              onChange={handleUrlChange}
              placeholder='https://www.youtube.com/watch?v=...'
              InputProps={{
                style: { backgroundColor: 'white', color: 'black' },
              }}
            />
          </Box>
          <Box sx={{ marginBottom: 2 }}>
            <Box sx={{display:'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
              <h3>歌詞</h3>
              <Box sx={{ display:'flex', flexDirection: 'row',  justifyContent: 'flex-end'}}>
                <Box sx={{ display: 'flex', alignItems: 'center'}}>
                  {beforeAutoLyric!= null &&(//検索後に歌詞を元に戻す場合
                    <Button
                      variant='contained'
                      onClick={handleUndoAutoLyric}
                      sx={{ backgroundColor: '#555', color: 'white', '&:hover': { backgroundColor: '#333' } }}
                    >
                      戻す
                    </Button>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
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
                        label='海外の曲か？'
                        sx={{ margin: 0 }}
                      />
                      <Button
                        variant='contained'
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
                variant='outlined'
                value={lyric}
                onChange={handleLyricChange}
                placeholder='歌詞をここに入力してください'
                InputProps={{
                  style: { backgroundColor: 'white', color: 'black' },
                }}
            />
          </Box>
          
          
          <Box sx={{ textAlign: 'center' }}>
            {prepareKaraokeStatus === 0 ? (
              <Button
                variant='contained'
                onClick={() => {
                  setPrepareKaraokeStatus(1);
                }}
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
            <Typography variant='h5' sx={{ marginBottom: 2 }}>あなたの履歴</Typography>
            {yourHistory.map((song, index) => (
              <Typography key={index} sx={{ marginBottom: 1 }}>
                <Link href={`${hostUrl}/search_id/${song.videoId}`} sx={{ color: 'inherit', textDecoration: 'underline' }}>
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
            <Typography variant='h5' sx={{ marginBottom: 2 }}>みんなの履歴</Typography>
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
      { /* youtubeの動画 */ }
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
          display: (isKaraokeReady || isOnceKaraokeReady) ? 'block' : 'none', // ここで表示・非表示を切り替える
          
        }}
      >
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
            position: 'absolute', // Ensure the positioning works correctly
            left: '0', // Align horizontally
            right: '0', // Align horizontally
          }}
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
              zIndex: isTimestampLyric ? 1 : 3, // タイムスタンプモードではクリック不可
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
                overflowY: isTimestampLyric ? 'hidden' : 'scroll', // タイムスタンプがないときにスクロール可能
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {/* タイムスタンプ有りの歌詞表示 */}
              <Box sx={{ display: isTimestampLyric ? 'block' : 'none' }}>
                {playerLyricList.map((line, index) => (
                  <Typography
                    key={index}
                    ref={(el) => (lyricLineRef.current[index] = el)}  // 各行に ref を追加
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
                      opacity: index === currentLyricIndex ? 1 : 0.6, // 中央の行は不透明
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
                    {line.lyric || ''} {/* 空白の行を処理 */}
                  </Typography>
                ))}
              </Box>
              {/* タイムスタンプがない場合の歌詞表示 */}
              <Box
                sx={{
                  display: isTimestampLyric ? 'none' : 'block', // タイムスタンプがない場合に表示
                }}
              >
                {playerLyricList.map((line, index) => {
                  // console.log("01lyric",line.lyric);
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
                      {line.lyric || ''} {/* 空の文字列の場合にもスペースを表示 */}
                    </Typography>
                  );
                })}
              </Box>
            </Box>
          </Box>
        )}

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
            {/* inst音量調整バー */}
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
                <PianoIcon sx={{ color: 'white' }} /> {/* 🎹の代わりにアイコンを使用 */}
              </Box>
              <Slider
                value={instVolume}
                onChange={handleInstVolumeChange}
                orientation='vertical'
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
            {/* vocal音量調整バー */}
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
                <MicIcon sx={{ color: 'white' }} /> {/* 🎤の代わりにアイコンを使用 */}
              </Box>
              <Slider
                value={vocalVolume}
                onChange={handleVocalVolumeChange}
                orientation='vertical'
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

            {/* 再生・一時停止ボタン */}
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

            {/* シークバー */}
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

            {/* 全画面モードトグルボタン */}
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
            {/* ループ再生トグルボタン */}
            <Button
              onClick={toggleLoop}
              sx={{
                position: 'absolute',
                bottom: '55px',
                right: '60px', // 右から60pxに配置（FullScreenボタンとの間隔を確保）
                color: isLooping ? 'skyBlue' : 'white', // ループ中は色を変える
              }}
            >
              <LoopIcon />
            </Button>

            {/* ランダム再生トグルボタン */}
            <Button
              onClick={toggleShuffle}
              sx={{
                position: 'absolute',
                bottom: '55px',
                right: '110px', // 右から110pxに配置（他のボタンとの間隔を確保）
                color: isShuffling ? 'skyBlue' : 'white', // シャッフル中は色を変える
              }}
            >
              <ShuffleIcon />
            </Button>
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
