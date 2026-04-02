import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passcode === 'JERONIMO_2026') {
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
      textAlign: 'center'
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
    input: {
      width: '100%',
      padding: '16px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: error ? '1px solid rgba(255, 59, 48, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '14px',
      color: '#ffffff',
      fontSize: '16px',
      textAlign: 'center',
      outline: 'none',
      marginBottom: '16px',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease'
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
      transition: 'transform 0.2s ease, background-color 0.2s ease'
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
      marginTop: '-8px',
      marginBottom: '16px'
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
        <p style={styles.subtitle}>Acesso restrito Jerónimo Martins</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setError(false);
            }}
            placeholder="Código de Acesso"
            style={styles.input}
            autoFocus
          />
          {error && <p style={styles.errorMsg}>Acesso negado</p>}

          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => e.target.style.backgroundColor = '#8aff20'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#7cff01'}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            Entrar
          </button>
        </form>

        <p style={styles.footer}>Private System</p>
      </div>
    </div>
  );
};

export default Login;
