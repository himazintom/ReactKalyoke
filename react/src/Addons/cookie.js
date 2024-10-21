import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

function Cookie() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUserName = Cookies.get('username');
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);

  const handleLogin = () => {
    const name = 'User123';
    setUserName(name);
    Cookies.set('username', name, { expires: 31 });//7日間クッキーを保存
  };

  const handleLogout = () => {
    setUserName('');
    Cookies.remove('username');
  };

  return null;
//   (
//     <div>
//       {userName ? (
//         <div>
//           <h1>Welcome, {userName}!</h1>
//           <button onClick={handleLogout}>Logout</button>
//         </div>
//       ) : (
//         <div>
//           <h1>Please log in</h1>
//           <button onClick={handleLogin}>Login</button>
//         </div>
//       )}
//     </div>
//   );
}

export default Cookie;