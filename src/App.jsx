import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Inbox from './pages/Inbox.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/token" element={<Inbox />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
