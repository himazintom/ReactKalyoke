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
          navigate('/', { state: { videoDatas: videoDatas } });
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
