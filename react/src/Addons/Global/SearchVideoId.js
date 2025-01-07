import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
const hostUrl = process.env.REACT_APP_HOST_URL;

export const SearchVideoId = ({ path }) => { // pathを受け取るように変更
  let { videoId } = useParams();
  let navigate = useNavigate();

  useEffect(() => {
    try {
      // API呼び出し
      axios.get(`${apiUrl}/api/search_video_id/${videoId}`)
        .then(response => {
          const videoData = response.data;
          navigate(path+'/', { state: { videoData: videoData } });
        })
        .catch(error => {
          console.error("There was an error fetching the data!", error);
        });
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }, [videoId, navigate]);

  return (
    <div>
      <h2>Loading...</h2>
    </div>
  );
}
