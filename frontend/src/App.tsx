import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import ScheduledPosts from './pages/ScheduledPosts';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/scheduled" element={<ScheduledPosts />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;