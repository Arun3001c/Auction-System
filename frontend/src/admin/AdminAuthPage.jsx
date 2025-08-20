import React, { useState } from 'react';
import AdminRegister from './AdminRegister';
import AdminLogin from './AdminLogin';

const AdminAuthPage = ({ onLoggedIn }) => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#4f8cff,#7f53ac)' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 2px 16px #0002', minWidth: 350 }}>
        {showLogin ? (
          <>
            <AdminLogin onLoggedIn={onLoggedIn} />
            {/* Register button removed for admin login UI */}
          </>
        ) : (
          <>
            <AdminRegister onRegistered={() => setShowLogin(true)} />
            <p style={{ marginTop: 16 }}>
              Already registered? <button onClick={() => setShowLogin(true)}>Login</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAuthPage;
