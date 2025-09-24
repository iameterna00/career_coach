// src/App.jsx
import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import ChatBot from './bot.jsx';
import './App.css';
import Leads from './leads.jsx';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>

      <Routes>
        <Route path="/" element={<ChatBot />} />
        <Route path="/leads" element={<Leads />} />
      </Routes>
    </>
  );
}

export default App;
