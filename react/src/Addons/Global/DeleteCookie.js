import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

export const DeleteCookie = () => {
  const navigate = useNavigate();

  const deleteAllCookies = () => {
    // すべてのクッキーの名前を取得
    const allCookies = Cookies.get();
  
    // すべてのクッキーを削除
    for (let cookieName in allCookies) {
      Cookies.remove(cookieName);
    }
  };

    useEffect(() => {
    // すべてのクッキーを削除
    deleteAllCookies();
    
    // 必要に応じてリダイレクトなどの処理を行う
    navigate('/');
  }, [navigate]);

  return (
    <div>
      <h2>すべてのクッキーを削除しています...</h2>
    </div>
  );
};