import React, { useState, useEffect } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Addons/PlayerPage/Header';
import Footer from './Addons/PlayerPage/Footer';
import './Addons/PlayerPage/MainBackground.scss';  // Import the SCSS file

import Player from './Addons/PlayerPage/Player';
// import TimestampPlayer from './Addons/PlayerPage/TimestampPlayer';


import SearchVideoid from './Addons/SearchVideoid';
import Usage from './Addons/Usage/Usage';
import LyricsCopy from './Addons/LyricsCopy/LyricsCopy';
import Playlist from './Addons/Playlist/Playlist';
import Register from './Addons/Register/Register';
import DeleteCookie from './Addons/DeleteCookie';
// import LRCMaker from './Addons/LRCMaker';



function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-background">
          <Routes>
            <Route path='/' element={<Player />} />
            {/* <Route path='/' element={<TimestampPlayer />} /> */}
            <Route path="/search_id/:videoid" element={<SearchVideoid />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/lyrics-copy" element={<LyricsCopy />} />
            <Route path="/playlist" element={<Playlist />} />
            <Route path="/register" element={<Register />} />
            <Route path="/delete-cookie" element={<DeleteCookie />} />
            {/* <Route path="/lrcmaker" element={<LRCMaker />} /> */}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
