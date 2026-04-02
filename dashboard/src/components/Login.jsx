import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple hardcoded key for basic security
    if (passcode === 'JERONIMO_2026') {
      localStorage.setItem('gp_auth', 'true');
      onLogin();
    } else {
      setError(true);
      setPasscode('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c] p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7cff01] to-[#b4ff01] mb-6 shadow-lg shadow-[#7cff01]/20">
            <svg className="w-8 h-8 text-[#0a0a0c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">GamePrep</h1>
          <p className="text-gray-400">Insira o código de acesso para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="Código de Acesso"
              className={`w-full px-5 py-4 bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 outline-none transition-all focus:border-[#7cff01]/50 focus:ring-1 focus:ring-[#7cff01]/50`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500 text-center animate-pulse">Código incorreto. Tente novamente.</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#7cff01] hover:bg-[#8aff20] text-[#0a0a0c] font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#7cff01]/20"
          >
            Acessar Dashboard
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-600 uppercase tracking-widest">
          Reserved for Jerónimo Martins Teams
        </p>
      </div>
    </div>
  );
};

export default Login;
