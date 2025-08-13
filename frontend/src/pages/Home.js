import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import AuctionCard from '../components/AuctionCard';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Home = () => {
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
    status: 'active'
  });

  useEffect(() => {
    fetchAuctions();
    fetchCategories();
  }, [filters]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const endpoint = filters.search 
        ? `/auctions/search/${encodeURIComponent(filters.search)}?${params.toString()}`
        : `/auctions?${params.toString()}`;

      const response = await api.get(endpoint);
      
      if (filters.search) {
        setAuctions(response.data.auctions || []);
      } else {
        setAuctions(response.data.auctions || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast.error('Failed to fetch auctions');
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/auctions/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAuctions();
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      status: 'active'
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Amazing Auctions
          </h1>
          <p className="hero-subtitle">
            Bid on unique items, discover great deals, and connect with sellers worldwide
          </p>
          
          {/* Search Bar */}
          <form className="hero-search" onSubmit={handleSearchSubmit}>
            <div className="search-input-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search for auctions with titles..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="container">
          <div className="filters-header">
            <h2 className="filters-title">
              <Filter className="filter-icon" />
              Filter Auctions
            </h2>
            <button className="reset-filters-btn" onClick={resetFilters}>
              <RefreshCw className="reset-icon" />
              Reset Filters
            </button>
          </div>

          <div className="filters-container">
            {/* Category Filter */}
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select 
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select 
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Auctions Grid */}
      <section className="auctions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {filters.search ? `Search Results for "${filters.search}"` : 'Live Auctions'}
            </h2>
            <p className="section-subtitle">
              {loading ? 'Loading...' : `${auctions.length} auctions found`}
            </p>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading auctions...</p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="no-auctions">
              <h3>No auctions found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button className="reset-filters-btn" onClick={resetFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="auctions-grid">
              {auctions.map(auction => (
                <AuctionCard key={auction._id} auction={auction} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-number">1000+</h3>
              <p className="stat-label">Active Auctions</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">50K+</h3>
              <p className="stat-label">Happy Bidders</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">$2M+</h3>
              <p className="stat-label">Total Sales</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-number">99.8%</h3>
              <p className="stat-label">Success Rate</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
