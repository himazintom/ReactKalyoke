import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Cookies from 'js-cookie';
import { AnimatedBackground } from '../Global/Background/AnimatedBackground';

import VideoData from './types/VideoData'
import { PlayerForm } from './Upper/PlayerForm';
import { HistorySection } from './Upper/HistorySection';
import { useHistoryLists } from './Upper/FetchHistory';
import * as FormPost from './FormPost';
import { KaraokePlayer, KaraokePlayerHandles } from './Lower/KaraokePlayer';
import { makeTimestampAndLyricList } from './Upper/TimeStamps';

export const SeparatePlayer: React.FC<{ path: string }> = ({ path }) => {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'));

  const validPath = path === "" || path === "/pitch" ? path : "";//""か"/pitch"以外は""として扱うようにするため
  const isPitchMode: boolean = validPath === "/pitch";

  const karaokePlayerRef = useRef<KaraokePlayerHandles>(null);

  const {
    everyoneHistory,
    yourHistory,
    recommendation,
    updateHistory
  } = useHistoryLists();

  const shufflePrepareKaraoke = async (): Promise<boolean> => {//ControlPlayerから呼び出される関数
    const musicList = await FormPost.fetchRandomMusics(1);//音源をランダムに取得
    await prepareKaraoke(musicList[0].videoId, musicList[0].lyric);//カラオケを準備
    return true;

  }

  //PlayerFormから必要な情報を引数として受け取り呼び出す関数：Lowerのコンポーネントたちと連携を取り、カラオケの準備をする関数②
  const prepareKaraoke = async (videoId: string, lyric: string): Promise<void> => {
    const [timestampAndLyricList, isTimestamped] = makeTimestampAndLyricList(lyric);//歌詞をタイムスタンプと歌詞に分割
    try {
      const youtubeUrl: string = `https://www.youtube.com/watch?v=${videoId}`;
      const separateData = await FormPost.separateMusic(youtubeUrl, videoId, lyric); // 曲情報を取得
      if(separateData){//履歴を更新
        const data = ({
          videoId: videoId,
          title: separateData.title,
          timeStampAndLyricList: timestampAndLyricList,
          path: separateData.path
        }) as VideoData;
        await karaokePlayerRef.current?.prepareKaraokePlayer(data, isTimestamped);

        updateHistory(separateData.title, separateData.history[0].videoId);
      }
    } catch (error) {
      console.error("Error separating music:", error);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      position: 'relative',
      padding: { xs: 1, md: 3 },
    }}>
      <AnimatedBackground />
      <Box sx={{
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
        {/* Upper Component */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: 3,
          mb: 4,
        }}>
          {/* おすすめセクション */}
          <Box sx={{
            width: { xs: '100%', md: '25%' }
          }}>
            <HistorySection title='あなたへのオススメ！' history={recommendation} />
          </Box>

          {/* メインフォーム */}
          <Box sx={{
            width: { xs: '100%', md: '50%' },
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'transform 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 40px 0 rgba(31, 38, 135, 0.37)',
            },
          }}>
            <PlayerForm onPrepareKaraoke={prepareKaraoke} />
          </Box>

          {/* 履歴セクション（PC表示） */}
          {isMd && (
            <Box sx={{
              width: '25%',
            }}>
              <Box sx={{ mb: 3 }}>

                <HistorySection title='あなたの履歴' history={yourHistory} />
              </Box>
              <Box>
                <HistorySection title='みんなの履歴' history={everyoneHistory} />
              </Box>
            </Box>
          )}
        </Box>

        {/* カラオケプレイヤー */}
        <Box sx={{
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <KaraokePlayer
            ref={karaokePlayerRef}
            isPitchMode={isPitchMode}
            shufflePrepareKaraoke={shufflePrepareKaraoke}
          />
        </Box>

        {/* 履歴セクション（モバイル表示） */}
        {!isMd && (
          <Box sx={{
            width: '100%',
            mt: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
            <HistorySection title='あなたの履歴' history={yourHistory} />
            <HistorySection title='みんなの履歴' history={everyoneHistory} />
          </Box>
        )}
      </Box>
    </Box>
  );
};
