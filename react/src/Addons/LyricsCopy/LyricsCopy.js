import React, { useState } from 'react';
import * as FormPost from '../PlayerPage/FormPost';
import { Box } from '@mui/material';

function LyricsCopy() {
  const [url, setUrl] = useState('');
  const [annotation, setAnnotation] = useState('');

  const handleLyricCopy = async () => {
    try {
      const postUrl=[url];
      const result = await FormPost.getLyricBySites(postUrl)
      let lyric="";
      if (result['lyric']) { // 修正箇所
        lyric = result['lyric']
      }
      if (lyric === '') {
        setAnnotation('自動で歌詞が見つかりませんでした');
      } else if (lyric === 'fail') {
        setAnnotation('そのサイトは対応していません');
      } else {
        setUrl('');
        await navigator.clipboard.writeText(lyric);
        alert('歌詞をコピーしました');
      }
    } catch (error) {
      console.error('歌詞の取得中にエラーが発生しました:', error);
    }
  };

  return (
    <Box sx={{ backgroundColor: 'rgba(0,0,0,0.5)', fontSize: 30, padding: 2, color: 'rgb(255,255,255)'}}>
      <h1>歌詞コピー</h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="対応サイトのURLを入力してください"
        style={{ fontSize: '40px', height: '50px', width: '400px' }}
      />
      <input
        type="button"
        value="コピー"
        onClick={handleLyricCopy}
        style={{ fontSize: '20px', marginLeft: '10px' }}
      />
      <p>{annotation}</p>
      <p>対応サイト</p>
      <ul>
        <li>j-lyric.net</li>
        <li>uta-net.com</li>
        <li>utaten.com</li>
        <li>vocaloidlyrics.fandom.com</li>
        <li>genius.com</li>
        <li>kkbox.com</li>
        <li>hmiku.atwiki.jp</li>
        <li>touhoukashi.atwiki.jp</li>
      </ul>
    </Box>
  );
}

export default LyricsCopy;
