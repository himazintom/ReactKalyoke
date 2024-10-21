import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Slider, Button, Typography, Checkbox, TextField, FormControlLabel, Link } from '@mui/material';

import * as FormPost from './FormPost';

function RLCMaker() {

  return(
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
                color: isLooping ? 'skyblue' : 'white', // ループ中は色を変える
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
                color: isShuffling ? 'skyblue' : 'white', // シャッフル中は色を変える
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
  );
}