// FetchHistory.tsx

import { useState, useEffect } from 'react';
import * as FormPost from '../FormPost';
import Cookies from 'js-cookie';

export interface HistoryList {
  videoId: string;
  title: string;
}

export const useHistoryLists = () => {
  const [everyoneHistory, setEveryoneHistory] = useState<HistoryList[]>([]);
  const [yourHistory, setYourHistory] = useState<HistoryList[]>([]);
  const [recommendation, setRecommendation] = useState<HistoryList[]>([]);

  const reloadHistory = () => {
    fetchYourHistory();
    fetchEveryoneHistory();
  };

  const fetchRecommendations = async (): Promise<void> => {
    try {
      const recommends = await FormPost.fetchRandomMusics(5);//データからlyricをなくしてHistoryListに合うようにして返す
      const historyListRecommendation = recommends.map(({ videoId, title }) => ({ videoId, title }));
      setRecommendation(historyListRecommendation);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendation([]);
    }
  };

  const fetchYourHistory = async (): Promise<void> => {
    try {
      const history = JSON.parse(Cookies.get('yourHistory') || '[]');
      setYourHistory(history.length > 0 ? history : []);
    } catch (error) {
      console.error('Error fetching your history:', error);
      setYourHistory([]);
    }
  };

  const fetchEveryoneHistory = async (): Promise<void> => {
    try {
      const history = await FormPost.fetchEveryoneHistory();
      setEveryoneHistory(history);
    } catch (error) {
      console.error('Error fetching everyone history:', error);
      setEveryoneHistory([]);
    }
  };

  useEffect(() => {//ページが読み込まれたら最新の履歴とおすすめの曲を取得する
    fetchRecommendations();
    fetchYourHistory();
    fetchEveryoneHistory();
  }, []);

  return { 
    everyoneHistory,
    yourHistory,
    recommendation,
    setYourHistory,
    setEveryoneHistory,
    setRecommendation,
    reloadHistory
  };
};
