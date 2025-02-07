import axios from "axios";

// 環境変数の検証
const apiUrl = process.env.REACT_APP_API_URL || "";
const googleAPIKey = process.env.REACT_APP_GOOGLE_API_KEY || "";
const searchEngineID = process.env.REACT_APP_SEARCH_ENGINE_ID || "";

// if (!apiUrl || !googleAPIKey || !searchEngineID) {
//   throw new Error("必要な環境変数が設定されていません。");
// }

// 言語設定
const languages: Record<string, string> = { ja: "歌詞", en: "Lyric" };

// キャッシュ設定
let apiCountCache = { count: 0, timestamp: 0 };

// 汎用的なAPIコール関数
const fetchData = async (
  url: string,
  data: object = {},
  method: "GET" | "POST" = "POST",
  headers: Record<string, string> = { "Content-Type": "application/json" }
) => {
  try {
    const response = await axios({
      url,
      method,
      headers,
      data,
    });
    if (!response.data) {
      throw new Error("No data or incorrect format received from the server");
    }
    return response.data;
  } catch (error) {
    console.error(`Error during API call to ${url}:`, error);
    throw error;
  }
};

// APIカウントの取得（キャッシュ付き）
const googleSearchApiCount = async (): Promise<number> => {
  const now = Date.now();
  if (now - apiCountCache.timestamp < 60000) { // 60秒キャッシュ
    return apiCountCache.count;
  }

  try {
    const data = await fetchData(`${apiUrl}/api/google_api/custom_search/count`);
    const count = data.count; // countプロパティを取得
    apiCountCache = { count, timestamp: now };
    return count;
  } catch (error) {
    console.error("Error fetching Google API count:", error);
    return 0; // エラー時は0を返すなどの処理を追加
  }
};

// 検索API構成
const searchApiConfig = {
  google: {
    url: "https://www.googleapis.com/customsearch/v1",
    headers: {},
    params: (title: string, language: string) => ({
      key: googleAPIKey,
      cx: searchEngineID,
      q: `${title} ${languages[language]}`,
      num: 5,
    }),
  }
};

const buildUrlWithParams = (url: string, params: Record<string, any>) => {
  const searchParams = new URLSearchParams(params);
  return `${url}?${searchParams.toString()}`;
};

const fetchSearchData = async (url: string, params: Record<string, any>, headers: Record<string, string> = {}) => {
  const fullUrl = buildUrlWithParams(url, params);
  const response = await fetch(fullUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch from API: ${response.statusText}`);
  }
  return response.json();
};

const fetchBraveSearchData = async (title: string, language: string) => {
  try {
    const response = await fetchData(`${apiUrl}/api/search_lyric_sites_by_brave`, { title,  language});
    return response;
  } catch (error) {
    console.error("Error fetching lyric from sites:", error);
    return null;
  }
};

const searchFromAPI = async (api: "google" | "brave", title: string, language: string): Promise<string[]> => {
  try {
    if (api === "google"){
      const { url, headers, params } = searchApiConfig[api];
      const data = await fetchSearchData(url, params(title, language), headers);
      return data.items?.map((item: any) => item.formattedUrl) || []
    }else{
      const data = await fetchBraveSearchData(title, language);
      return data || [];
    }
  } catch (error) {
    console.error(`Error fetching data from ${api} API:`, error);
    return [];
  }
};

// 歌詞検索メイン関数
export const searchLyricFromWeb = async (title: string, language: string): Promise<string | null> => {
  try {
    const apiCount = await googleSearchApiCount();
    const api = apiCount < 100 ? "google" : "brave";
    const urls = await searchFromAPI(api, title, language);

    if (!urls.length) {
      console.error("歌詞を含むサイトが見つかりませんでした。");
      return null;
    }

    const lyricData = await getLyricFromSites(urls);
    return lyricData?.lyric || null;
  } catch (error) {
    console.error("Error searching lyric from web:", error);
    return null;
  }
};

// サイトから歌詞を取得
export const getLyricFromSites = async (urls: string[]): Promise<{ lyric: string } | null> => {
  try {
    const response = await fetchData(`${apiUrl}/api/get_lyric_from_sites`, { urls });
    return response;
  } catch (error) {
    console.error("Error fetching lyric from sites:", error);
    return null;
  }
};

// 動画の存在確認
export const checkVideoExist = async (videoId: string): Promise<boolean> => {
  try {
    const response = await fetchData(`${apiUrl}/api/check_video_exist`, { videoId });
    return response.exist;
  } catch (error) {
    console.error("Error checking video existence:", error);
    return false;
  }
};

// 音楽の分離
export const separateMusic = async (
  url: string,
  videoId: string,
  lyric: string
): Promise<{ path: string; title: string; history: { title: string; videoId: string }[] } | null> => {
  try {
    const response = await fetchData(`${apiUrl}/api/separate_music`, { url, videoId, lyric });
    return {
      path: response.path,
      title: response.title,
      history: response.history.map((item: any) => ({
        title: item.title,
        videoId: item.video_id,
      })),
    };
  } catch (error) {
    console.error("Error separating music:", error);
    return null;
  }
};

// プレイリストデータの取得
export const fetchPlaylistData = async (url: string): Promise<any> => {
  try {
    const response = await fetchData(`${apiUrl}/api/fetch_playlist_data`, { url });
    return response;
  } catch (error) {
    console.error("Error fetching playlist data:", error);
    return null;
  }
};

// 歌詞の取得（DBから）
export const fetchLyricFromDB = async (videoId: string): Promise<string | null> => {
  try {
    const response = await fetchData(`${apiUrl}/api/fetch_lyric`, { videoId });
    return response.lyric || null;
  } catch (error) {
    console.error("Error fetching lyric from DB:", error);
    return null;
  }
};

export const fetchLyricUpdateDateFromDB = async (videoId: string): Promise<string | null> => {
  try {
    const response = await fetchData(`${apiUrl}/api/fetch_lyric_update_date`, { videoId });
    if (response && typeof response.lyricUpdateDate === "string") {
      return response.lyricUpdateDate;
    } else if (response.lyricUpdateDate == null) {//DBに記録が無かったら「2024-01-01 00:00:00」を返す
      return "2024-01-01 00:00:00";
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching lyricUpdateDate:", error);
    return null;
  }
};


export const updateLyricUpdateDate = async (videoId: string) => {
  try {
    const response = await fetchData(`${apiUrl}/api/update_lyric_update_date`, { videoId });
    return response.success || false;
  } catch (error) {
    console.error("Error fetching lyric from DB:", error);
  }
};

// 歌詞の更新（DBへ）
export const updateLyricInDB = async (videoId: string, lyric: string): Promise<boolean> => {
  try {
    const response = await fetchData(`${apiUrl}/api/update_lyric`, { videoId, lyric });
    return response.status === "success" || false
  } catch (error) {
    console.error("Error updating lyric in DB:", error);
    return false;
  }
};

// 全ユーザーの履歴データを取得
export const fetchEveryoneHistory = async (): Promise<{ title: string; videoId: string }[]> => {
  try {
    const response = await fetchData(`${apiUrl}/api/fetch_everyone_history`);
    if (!Array.isArray(response)) {
      throw new Error("Invalid response format from fetchEveryoneHistory API");
    }
    return response.map((item: any) => ({
      title: item.title,
      videoId: item.video_id,
    }));
  } catch (error) {
    console.error("Error fetching everyone history:", error);
    return [];
  }
};

// ランダムな音楽データの取得
export const fetchRandomMusics = async (
  requestCount: number = 1
): Promise<{ title: string; lyric: string; videoId: string }[]> => {
  try {
    const response = await fetchData(`${apiUrl}/api/fetch_random_music/${requestCount}`, {}, "GET");
    if (!Array.isArray(response)) {
      throw new Error("Invalid response format from fetchRandomMusics API");
    }
    return response.map((item: any) => ({
      title: item.title,
      lyric: item.lyric,
      videoId: item.video_id,
    }));
  } catch (error) {
    console.error("Error fetching random musics:", error);
    return [];
  }
};

// 動画IDからタイトルを取得
export const getTitleByVideoId = async (videoId: string): Promise<string | null> => {
  try {
    const response = await fetchData(`${apiUrl}/api/get_title`, { videoId });
    return response.title || null;
  } catch (error) {
    console.error("Error fetching title by video ID:", error);
    return null;
  }
};

// 動画データをDBから文字列検索で取得
export const fetchVideoDataByStr = async (
  searchedWord: string
): Promise<{ title: string; videoId: string }[]> => {
  try {
    const response = await fetchData(`${apiUrl}/api/fetch_video_data_by_str`, { searchWord: searchedWord });
    if (Array.isArray(response) && response.length === 0) {
      return [
        {
          title: "No Result",
          videoId: "ORK3BZ9baQo", // デフォルト値
        },
      ];
    }
    return response.map((item: any) => ({
      title: item.title,
      videoId: item.video_id,
    }));
  } catch (error) {
    console.error("Error fetching video data by search string:", error);
    return [];
  }
};
