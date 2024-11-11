import axios from 'axios';

const apiUrl = "";// = process.env.REACT_APP_API_URL;//url
const googleAPIKey = process.env.REACT_GOOGLE_API_KEY;//url
const searchEngineID = process.env.REACT_SEARCH_ENGINE_ID;//url


export const checkVideoExist= async (videoid) => {
  try {
    // JSON データを作成して送信
    const response = await axios.post(`${apiUrl}/api/check_video_exist`, {
      videoid: videoid,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

export const Demucs = async (url, videoid, lyric) => {
  try {
    // JSON データを作成して送信
    const response = await axios.post(`${apiUrl}/api/demucs`, {
      url: url,
      videoid: videoid,
      lyric: lyric
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

export const fetchLyricFromDB = async (videoid) => {
  try {
    // JSON データを作成して送信
    const response = await axios.post(`${apiUrl}/api/fetch_lyric`, {
      videoid: videoid,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Lyric response',response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

export const updateLyricInDB = async (videoid, lyric) => {
  try {
    const response = await axios.post(`${apiUrl}/api/update_lyric`, {
      videoid: videoid,
      lyric: lyric,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating lyric in DB:', error);
    return null;
  }
};

export const fetchEveryoneHistory = async () => {

  try {
    const response = await axios.post(`${apiUrl}/api/fetch_everyone_history`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('No data or incorrect format received from the server');
    }
    // APIから返された配列を使って新しいデータ配列を作成
    let data = response.data.map(item => ({
      title: item.title,
      videoid: item.videoid
    }));
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

export const fetchRandomMusics = async (requestCount = 1) => {
  try {
    const response = await axios.get(`${apiUrl}/api/fetch_random_music/${requestCount}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('No data or incorrect format received from the server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

export const fetchTitleByVideoid = async (videoid) => {
  try {
    const response = await axios.post(`${apiUrl}/api/fetch_title`, {
      'videoid': videoid,
    },{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.data) {
      throw new Error('No data or incorrect format received from the server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return "Null";
  }
};

export const getLyricBySites = async (urls) => {
  console.log("歌詞取得します！");
  try {
    const response = await axios.post(`${apiUrl}/api/get_lyric_from_sites`, {
      'urls': urls,
    },{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.data) {
      throw new Error('No data or incorrect format received from the server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

export const getLyricByWeb = async (title, language) =>{//titleとlanguageをもとに該当する歌詞データを返す
  const fetchLyricSites = async (title, language) => {
    console.log("タイトルは...", title);
    const url = "https://www.googleapis.com/customsearch/v1";
    const apiKey = googleAPIKey;  // ここにあなたのGoogle APIキーを入れてください
    const cx = searchEngineID; // ここにあなたの検索エンジンIDを入れてください
    const languages = {'ja': '歌詞', 'en': 'Lyric'};
    const query = `${title} ${languages[language]}`;
  
    const queryString = new URLSearchParams({
      key: apiKey,
      cx: cx,
      q: query,
      num: 5,
    });
  
    try {
      let urls = [];
      const response = await fetch(`${url}?${queryString}`);
  
      if (response.status === 403) {
        console.error("利用回数上限に達しました。");
        return;
      }
  
      const data = await response.json();
  
      if (data.items) {
        urls = data.items.map(item => item.formattedUrl); // formattedUrlを抽出してリストに格納
        console.log('タイトルをもとに見つかったurls=', urls);
      } else {
        console.error('歌詞サイトが見つかりませんでした。');
      }
  
      return urls; // 結果としてURLリストを返す
  
    } catch (error) {
      console.error("Error fetching lyric sites:", error);
    }
  };
  
  const urls = await fetchLyricSites(title, language);
  if(!urls){//サイトが見つからなかったらNullを返す
    return 'Null';
  }
  const lyricData = await getLyricBySites(urls);
  // console.log("lyricData.lyric", lyricData.lyric);


  if(lyricData.lyric){
    return lyricData.lyric;
  }
  return 'Null'
}

export const fetchPlaylistDatas = async (url) => {
  try {
    const response = await axios.post(`${apiUrl}/api/fetch_playlist_datas`, {
      'url': url,
    },{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.data) {
      throw new Error('No data or incorrect format received from the server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return "Null";
  }
};

export const fetchViedoDatasByStr = async (searchedWord) => {//文字列をもとにビデオデータの検索を行う
  try {
    const response = await axios.post(`${apiUrl}/api/fetch_video_datas_by_str`, {
      'searchWord': searchedWord,
    },{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.data) {
      throw new Error('No data or incorrect format received from the server');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return "Null";
  }
};