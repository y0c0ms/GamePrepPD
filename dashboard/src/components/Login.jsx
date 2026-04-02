import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const sanitizeInput = (val) => {
    // Basic protection (though SQLi is impossible on a static check)
    return val.replace(/['";\-]/g, '').trim();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPass = sanitizeInput(passcode);
    
    if (cleanPass === 'JERONIMO_2026') {
      localStorage.setItem('gp_auth', 'true');
      onLogin();
    } else {
      setError(true);
      setPasscode('');
    }
  };

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0c',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    },
    card: {
      width: '100%',
      maxWidth: '380px',
      padding: '40px',
      borderRadius: '32px',
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      textAlign: 'center',
      position: 'relative'
    },
    iconBox: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: 'rgba(124, 255, 1, 0.1)',
      marginBottom: '24px',
      color: '#7cff01'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff',
      margin: '0 0 8px 0',
      letterSpacing: '-0.02em'
    },
    subtitle: {
      fontSize: '14px',
      color: '#666666',
      margin: '0 0 32px 0'
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: '16px'
    },
    input: {
      width: '100%',
      padding: '16px 45px 16px 16px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: error ? '1px solid rgba(255, 59, 48, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '14px',
      color: '#ffffff',
      fontSize: '16px',
      textAlign: 'center',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
      letterSpacing: showPassword ? '0.1em' : '0.4em'
    },
    eyeBtn: {
      position: 'absolute',
      right: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#666666',
      cursor: 'pointer',
      padding: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    button: {
      width: '100%',
      padding: '16px',
      backgroundColor: '#7cff01',
      border: 'none',
      borderRadius: '14px',
      color: '#000000',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'transform 0.1s ease, background-color 0.2s ease'
    },
    footer: {
      marginTop: '40px',
      fontSize: '10px',
      color: '#333333',
      textTransform: 'uppercase',
      letterSpacing: '0.2em'
    },
    errorMsg: {
      color: '#ff3b30',
      fontSize: '12px',
      marginTop: '8px',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 style={styles.title}>GamePrep</h1>
        <p style={styles.subtitle}>Jerónimo Martins Security Gate</p>

        <form onSubmit={handleSubmit}>
          <div style={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="••••••••"
              style={styles.input}
              autoFocus
            />
            <button 
              type="button" 
              style={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round text-[#7cff01]">
                   <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                   <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              )}
            </button>
          </div>
          {error && <p style={styles.errorMsg}>Acesso negado</p>}

          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => e.target.style.backgroundColor = '#8aff20'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#7cff01'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Acessar
          </button>
        </form>

        <p style={styles.footer}>Jerónimo Martins Restricted</p>
      </div>
    </div>
  );
};

export default Login;
