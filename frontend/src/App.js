import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AuctionDetails from './pages/AuctionDetails';
import EditAuction from './pages/EditAuction.jsx';
import AuctionEndedDetails from './pages/AuctionEndedDetails.jsx';
import CreateAuction from './pages/CreateAuction';
import Bid from './pages/Bid';
import Profile from './pages/Profile';
import MyAuctions from './pages/MyAuctions.jsx';
import MyBids from './pages/MyBids.jsx';
import MyContacts from './pages/MyContacts.jsx';

// Utils
import { AuthProvider } from './utils/AuthContext';

import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auction/:id" element={<AuctionDetails />} />
              <Route path="/create-auction" element={<CreateAuction />} />
              <Route path="/bid" element={<Bid />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-auctions" element={<MyAuctions />} />
              <Route path="/my-bids" element={<MyBids />} />
              <Route path="/my-contacts" element={<MyContacts />} />
                <Route path="/dashboard/edit-auction/:id" element={<EditAuction />} />
                <Route path="/dashboard/auction-ended-details/:id" element={<AuctionEndedDetails />} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
