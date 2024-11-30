import React from 'react';
import { Box } from '@mui/material';
import YouTube from 'react-youtube';

export const Usage = () => {
  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <Box sx={{
      maxWidth: '56rem',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      borderRadius: '0.75rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }}>
      <Box sx={{ padding: '2rem' }}>
        {/* Header - 修正したタイトル部分 */}
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
          padding: '0.5rem 1rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '0.5rem',
          backdropFilter: 'blur(4px)',
          width: 'fit-content'
        }}>
          <Box sx={{
            fontSize: '2.25rem',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            zIndex: 1
          }}>
            使い方(簡単3ステップ！)
          </Box>
        </Box>

        {/* YouTube Player */}
        <Box sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          marginBottom: '2rem',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          '& iframe': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }
        }}>
          <YouTube videoId="az5n7XAMYZE" opts={opts} />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Step 1 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{
              display: 'flex',
              height: '2rem',
              width: '2rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              1
            </Box>
            <Box>
              <Box component="h2" sx={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
              }}>
                URLを入力する
              </Box>
              <Box component="p" sx={{
                marginTop: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                YouTubeの動画URLを入力してください
              </Box>
            </Box>
          </Box>

          {/* Step 2 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{
              display: 'flex',
              height: '2rem',
              width: '2rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              2
            </Box>
            <Box>
              <Box component="h2" sx={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
              }}>
                歌詞を入力する（空白でも可）
              </Box>
              <Box component="p" sx={{
                marginTop: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                whiteSpace: 'pre-line'
              }}>
                {`自動入力というボタンを押してみて、歌詞が見つからなかったら、
                コピーしたり、手で打ち込んでください

                ※ サイトから歌詞をコピーしたい場合は、上のタブの「歌詞コピー」をクリックしてください`}
              </Box>
            </Box>
          </Box>

          {/* Step 3 */}
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.5rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(4px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-2px)'
            }
          }}>
            <Box sx={{
              display: 'flex',
              height: '2rem',
              width: '2rem',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
            }}>
              3
            </Box>
            <Box>
              <Box component="h2" sx={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.2)'
              }}>
                Singボタンを押す
              </Box>
              <Box component="p" sx={{
                marginTop: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                あとは音量を調整してカラオケを楽しむだけ！
                ※新規の曲の場合処理に時間がかかることがあります
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}