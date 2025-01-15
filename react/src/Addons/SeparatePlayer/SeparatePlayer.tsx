import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

import VideoData from './types/VideoData'
import { PlayerForm } from './Upper/PlayerForm';
import { HistorySection } from './Upper/HistorySection';
import { useHistoryLists } from './Upper/FetchHistory';
import * as FormPost from './FormPost';
import { MusicList } from './Upper/MusicList';
import TimestampAndLyric from './types/TimestampAndLyric';
import { KaraokePlayer, KaraokePlayerHandles } from './Lower/KaraokePlayer';
import { makeTimestampAndLyricList } from './Upper/TimeStamps';


export const SeparatePlayer: React.FC<{ path: string }> = ({ path }) => {
  const validPath = path === "" || path === "/pitch" ? path : "";//""か"/pitch"以外は""として扱うようにするため
  const isPitchMode: boolean = validPath === "/pitch";

  const karaokePlayerRef = useRef<KaraokePlayerHandles>(null);
  
  const [isTimestamped, setIsTimestamped] = useState<boolean>(false);
  const [isPlayerLyricReady, setIsPlayerLyricReady] = useState<boolean>(false);
  const [isYoutubeApiReady, setIsYoutubeApiReady] = useState<boolean>(false);
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);

  const [isKaraokeReady, setIsKaraokeReady] = useState<boolean>(false);
  const [isOnceKaraokeReady, setIsOnceKaraokeReady] = useState<boolean>(false);
  useEffect(() =>{
    setIsKaraokeReady(isPlayerLyricReady && isYoutubeApiReady && isAudioReady);
  },[isPlayerLyricReady, isYoutubeApiReady, isAudioReady])

  const {
    everyoneHistory,
    yourHistory,
    recommendation,
    setEveryoneHistory,
    setYourHistory,
  } = useHistoryLists();

  const shufflePrepareKaraoke = async (): Promise<boolean> => {//ControlPlayerから呼び出される関数
    const musicList = await FormPost.fetchRandomMusics(1);//音源をランダムに取得
    const [timestampAndLyricList, isTimestamped] = makeTimestampAndLyricList(musicList[0].lyric);//歌詞をタイムスタンプと歌詞に分割
    await prepareKaraoke(musicList[0].videoId, timestampAndLyricList, isTimestamped);//カラオケを準備
    return true;
  }

  //PlayerFormから必要な情報を引数として受け取り呼び出す関数：Lowerのコンポーネントたちと連携を取り、カラオケの準備をする関数②
  const prepareKaraoke = async (videoId: string, formTimestampAndLyric: TimestampAndLyric[], isTimestamped: boolean): Promise<void> => {
    const lyricStrings = formTimestampAndLyric
        .map(item => isTimestamped ? `${item.timestamp} ${item.lyric}` : `${item.lyric}`) // lyricが空でない場合のみ追加
    let data: VideoData;
    try {
      const youtubeUrl: string = `https://www.youtube.com/watch?v=${videoId}`;
      const separateData = await FormPost.separateMusic(youtubeUrl, videoId, lyricStrings.join('\n')); // 曲情報を取得
      console.log("separateData", separateData);
      if(separateData){//履歴を更新
        console.log("separateDataはあったようだな");
        data = ({
          videoId: videoId,
          title: separateData.title,
          timeStampAndLyricList: formTimestampAndLyric,
          path: separateData.path
        }) as VideoData;
        await karaokePlayerRef.current?.prepareKaraokePlayer(data);
        setEveryoneHistory(separateData.history);
        setYourHistory(separateData.history);
        console.log("finish prepareKaraoke");
      }
    } catch (error) {
      console.error("Error separating music:", error);
    }
  };

  return (
    <>
      <Box>
        <Box sx={{//Upper Component
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'center', md: 'flex-start' },
          padding: 2,
        }}>
          <Box sx={{ width: { xs: '100%', md: '25%' } }}>
            <HistorySection title='あなたへのオススメ！' history={recommendation} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <PlayerForm onPrepareKaraoke={prepareKaraoke} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '25%' } }}>
            <HistorySection title='あなたの履歴' history={yourHistory} />
            <HistorySection title='みんなの履歴' history={everyoneHistory} />
          </Box>
        </Box>
      </Box>
      <KaraokePlayer 
        ref={karaokePlayerRef}
        isPitchMode={isPitchMode}
        shufflePrepareKaraoke={shufflePrepareKaraoke}
      />
    </>
  );
};
