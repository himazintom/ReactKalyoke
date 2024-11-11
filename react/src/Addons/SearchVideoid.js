import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
const hostUrl = process.env.REACT_APP_HOST_URL;

function SearchVideoid() {
  let { videoid } = useParams();
  let navigate = useNavigate();

  useEffect(() => {
    try {
      // API呼び出し
      axios.get(`${apiUrl}/api/search_videoid/${videoid}`)
        .then(response => {
          const videoDatas = response.data;
  
          // // 取得したデータに基づいて処理を行う
          // console.log("new_page", videoDatas);  // デバッグ用
  
          // // 10秒後にリダイレクト
          // const timer = setTimeout(() => {
          //   navigate('/', { state: { videoDatas: videoDatas } });
          // }, 10000); // 10000ミリ秒 = 10秒
  
          // // クリーンアップ関数
          // return () => clearTimeout(timer);
        })
        .catch(error => {
          console.error("There was an error fetching the data!", error);
        });
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }, [videoid, navigate]);

  return (
    <div>
      <h2>Loading...</h2>
    </div>
  );
}

export default SearchVideoid;
