import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;//url
console.log("SearchVideoApiUrl ",apiUrl );

const hostUrl = process.env.REACT_APP_HOST_URL;//url
  console.log("hostUrl ",hostUrl );

function SearchVideoid() {
  let { videoid } = useParams();
  let navigate = useNavigate();

  useEffect(() => {
    // API呼び出し
    axios.get(`${apiUrl}/api/search_videoid/${videoid}`)
      .then(response => {
        const videoDatas = response.data;

        // 取得したデータに基づいて処理を行う
        // console.log("new_page",videoDatas);  // デバッグ用

        // '/'にリダイレクトする場合
        navigate('/', { state: { videoDatas: videoDatas } });
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error);
      });
  }, [videoid, navigate]);

  return (
    <div>
      <h2>Loading...</h2>
      {/* videoidに基づく処理が完了するまでの表示 */}
    </div>
  );
}

export default SearchVideoid;
