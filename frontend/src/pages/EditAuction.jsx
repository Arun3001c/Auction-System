import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './EditAuction.css';

const EditAuction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', category: '', startingPrice: '' });
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchAuction = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/auctions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuction(res.data);
        setForm({
          title: res.data.title,
          category: res.data.category,
          startingPrice: res.data.startingPrice
        });
        setCanEdit(res.data.status === 'upcoming');
      } catch (err) {
        setError('Failed to load auction');
      } finally {
        setLoading(false);
      }
    };
    fetchAuction();
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/auctions/${id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/my-auctions');
    } catch (err) {
      setError('Failed to update auction');
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/my-auctions');
    } catch (err) {
      setError('Failed to delete auction');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!auction) return null;

  return (
    <div className="edit-auction-container">
      <h2>Edit Auction</h2>
      {canEdit ? (
        <form onSubmit={handleSubmit} className="edit-auction-form">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
          <label>Category</label>
          <input name="category" value={form.category} onChange={handleChange} required />
          <label>Starting Price</label>
          <input name="startingPrice" type="number" value={form.startingPrice} onChange={handleChange} required />
          <button type="submit">Update Auction</button>
          <button type="button" onClick={handleDelete} className="delete-btn">Delete Auction</button>
        </form>
      ) : auction.status === 'active' ? (
        <div>
          <p>You cannot edit an active auction, but you can delete it.</p>
          <button type="button" onClick={handleDelete} className="delete-btn">Delete Auction</button>
        </div>
      ) : (
        <div>
          <p>This auction has ended. You cannot edit or delete it.</p>
        </div>
      )}
    </div>
  );
};

export default EditAuction;
