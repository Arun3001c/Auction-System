// ...existing code from dashboard/MyAuctions.jsx...
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyAuctions.css';
import { Link } from 'react-router-dom';
import { Gavel, Edit, Trash2, Plus } from 'lucide-react';

const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/my-auctions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuctions(res.data);
      } catch (err) {
        setError('Failed to load auctions');
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  return (
    <div className="dashboard-my-auctions">
      <div className="dashboard-header">
        <h2><Gavel /> My Auctions</h2>
        <Link to="/dashboard/create-auction" className="add-auction-btn"><Plus /> Add Auction</Link>
      </div>
      {loading ? <div className="loading">Loading...</div> : error ? <div className="error">{error}</div> : (
        <div className="auction-table-wrapper">
          <table className="auction-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Starting Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map(auction => (
                <tr key={auction._id}>
                  <td>{auction.title}</td>
                  <td>{auction.category}</td>
                  <td>{auction.startingPrice}</td>
                  <td>{auction.status}</td>
                  <td>
                    <Link to={`/dashboard/edit-auction/${auction._id}`} className="edit-btn"><Edit /></Link>
                    <button className="delete-btn"><Trash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyAuctions;
