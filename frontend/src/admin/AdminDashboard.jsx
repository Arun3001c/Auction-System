import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Gavel,
  Crown,
  CreditCard,
  Menu,
  ChevronLeft,
  TrendingUp,
  Activity,
  DollarSign,
  UserCheck,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react";

import AdminHandleUsers from "./AdminHandleUsers";
import AdminHandleAuctions from "./AdminHandleAuctions";
import AdminHandleCrownScore from "./AdminHandleCrownScore";
import AdminPaymentRequests from "./AdminPaymentRequests";

import "./admin.css";

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { key: "users", label: "Handle Users", icon: <Users size={20} /> },
  { key: "auctions", label: "Handle Auctions", icon: <Gavel size={20} /> },
  { key: "crown", label: "Handle Crown Score", icon: <Crown size={20} /> },
  { key: "payment", label: "Payment Details", icon: <CreditCard size={20} /> },
];

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAuctions: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch total users count
      const usersResponse = await axios.get('http://localhost:5001/api/admin/users/count');
      
      // Fetch active auctions count
      const auctionsResponse = await axios.get('http://localhost:5001/api/admin/auctions/active-count');
      
      // You can add more API calls for revenue and payments later
      setStats({
        totalUsers: usersResponse.data.count || 0,
        activeAuctions: auctionsResponse.data.count || 0,
        totalRevenue: 45678.90, // Keep static for now, can be updated later
        pendingPayments: 12 // Keep static for now, can be updated later
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to default values if API fails
      setStats({
        totalUsers: 0,
        activeAuctions: 0,
        totalRevenue: 0,
        pendingPayments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const DashboardOverview = () => (
    <div className="dashboard-overview">
      <div className="dashboard-header">
        <h1>🎯 Admin Dashboard</h1>
        <p>Manage your auction platform with powerful admin tools</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{loading ? 'Loading...' : stats.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
            <span className="trend positive">
              <TrendingUp size={16} />
              {loading ? 'Fetching data...' : 'Registered users'}
            </span>
          </div>
        </div>

        <div className="stat-card auctions">
          <div className="stat-icon">
            <Gavel size={24} />
          </div>
          <div className="stat-content">
            <h3>{loading ? 'Loading...' : stats.activeAuctions}</h3>
            <p>Active Auctions</p>
            <span className="trend positive">
              <Activity size={16} />
              {loading ? 'Fetching data...' : 'Currently running'}
            </span>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>${stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
            <span className="trend positive">
              <TrendingUp size={16} />
              +8.5% this week
            </span>
          </div>
        </div>

        <div className="stat-card payments">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingPayments}</h3>
            <p>Pending Payments</p>
            <span className="trend warning">
              <Clock size={16} />
              Needs attention
            </span>
          </div>
        </div>
      </div>

      {/* Admin Components Grid */}
      <div className="admin-components">
        <h2>🛠️ Admin Tools & Components</h2>
        <div className="components-grid">
          
          <div className="component-card" onClick={() => setActive("users")}>
            <div className="component-header">
              <Users className="component-icon" size={32} />
              <h3>Handle Users</h3>
            </div>
            <div className="component-content">
              <p>Manage user accounts, permissions, and verification status</p>
              <div className="component-features">
                <span className="feature">
                  <UserCheck size={16} />
                  User Verification
                </span>
                <span className="feature">
                  <AlertCircle size={16} />
                  Account Suspension
                </span>
                <span className="feature">
                  <Activity size={16} />
                  Activity Monitoring
                </span>
              </div>
            </div>
            <div className="component-footer">
              <span className="action-text">Click to manage users</span>
              <Zap size={16} />
            </div>
          </div>

          <div className="component-card" onClick={() => setActive("auctions")}>
            <div className="component-header">
              <Gavel className="component-icon" size={32} />
              <h3>Handle Auctions</h3>
            </div>
            <div className="component-content">
              <p>Monitor and control auction processes, bidding, and outcomes</p>
              <div className="component-features">
                <span className="feature">
                  <CheckCircle size={16} />
                  Auction Approval
                </span>
                <span className="feature">
                  <Clock size={16} />
                  Time Management
                </span>
                <span className="feature">
                  <DollarSign size={16} />
                  Bid Monitoring
                </span>
              </div>
            </div>
            <div className="component-footer">
              <span className="action-text">Click to manage auctions</span>
              <Zap size={16} />
            </div>
          </div>

          <div className="component-card" onClick={() => setActive("crown")}>
            <div className="component-header">
              <Crown className="component-icon" size={32} />
              <h3>Crown Score System</h3>
            </div>
            <div className="component-content">
              <p>Manage user reputation, scoring algorithms, and reward systems</p>
              <div className="component-features">
                <span className="feature">
                  <Award size={16} />
                  Score Calculation
                </span>
                <span className="feature">
                  <TrendingUp size={16} />
                  Ranking System
                </span>
                <span className="feature">
                  <Users size={16} />
                  User Leaderboard
                </span>
              </div>
            </div>
            <div className="component-footer">
              <span className="action-text">Click to manage crown scores</span>
              <Zap size={16} />
            </div>
          </div>

          <div className="component-card" onClick={() => setActive("payment")}>
            <div className="component-header">
              <CreditCard className="component-icon" size={32} />
              <h3>Payment Management</h3>
            </div>
            <div className="component-content">
              <p>Process payments, handle transactions, and manage financial data</p>
              <div className="component-features">
                <span className="feature">
                  <DollarSign size={16} />
                  Transaction Processing
                </span>
                <span className="feature">
                  <AlertCircle size={16} />
                  Dispute Resolution
                </span>
                <span className="feature">
                  <CheckCircle size={16} />
                  Payment Verification
                </span>
              </div>
            </div>
            <div className="component-footer">
              <span className="action-text">Click to manage payments</span>
              <Zap size={16} />
            </div>
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="actions-grid">
          <button className="quick-action-btn primary" onClick={() => setActive("users")}>
            <Users size={20} />
            View All Users
          </button>
          <button className="quick-action-btn secondary" onClick={() => setActive("auctions")}>
            <Gavel size={20} />
            Monitor Auctions
          </button>
          <button className="quick-action-btn success" onClick={() => setActive("payment")}>
            <CreditCard size={20} />
            Process Payments
          </button>
          <button className="quick-action-btn warning" onClick={() => setActive("crown")}>
            <Crown size={20} />
            Update Scores
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`admin-dashboard ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu size={20} /> : 
              <span>
                🧑‍💼 Auction Admin
                <ChevronLeft size={20} />
              </span>
            }
          </button>
        </div>

        <nav>
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.key}
                className={active === item.key ? "active" : ""}
                onClick={() => setActive(item.key)}
                style={{ flexDirection: "column", alignItems: "center", justifyContent: "center" }}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="label">{item.label}</span>}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {active === "dashboard" && <DashboardOverview />}
        {active === "users" && <AdminHandleUsers />}
        {active === "auctions" && <AdminHandleAuctions />}
        {active === "crown" && <AdminHandleCrownScore />}
        {active === "payment" && <AdminPaymentRequests />}
      </main>
    </div>
  );
};

export default AdminDashboard;
