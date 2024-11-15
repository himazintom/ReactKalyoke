import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './Addons/Global/Header/Header';
import { Footer } from './Addons/Global/Footer/Footer';
import './Addons/PlayerPage/MainBackground.scss';

import { Player } from './Addons/PlayerPage/Player';
import { SearchVideoId } from './Addons/Global/SearchVideoId';
import { Usage } from './Addons/Usage/Usage';
import { LyricsCopy } from './Addons/LyricsCopy/LyricsCopy';
import { Playlist } from './Addons/Playlist/Playlist';
import { Register } from './Addons/Register/Register';
import { DeleteCookie } from './Addons/Global/DeleteCookie';

export const App = () => {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-background">
          <Routes>
            <Route path='/' element={<Player />} />
            <Route path="/search_id/:videoId" element={<SearchVideoId />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/lyrics_copy" element={<LyricsCopy />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/register" element={<Register />} />
            <Route path="/delete_cookie" element={<DeleteCookie />} />
          </Routes>
        </div>
        <Footer/>
      </div>
    </Router>
  );
}
