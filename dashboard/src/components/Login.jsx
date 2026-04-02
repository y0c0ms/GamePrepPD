import React, { useState } from 'react';
import { Lock } from 'lucide-react';

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0c] p-6 font-sans">
      <div className="w-full max-w-[400px] p-10 rounded-[40px] bg-[#111114] border border-white/5 shadow-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#7cff01]/10 text-[#7cff01] mb-6">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">GamePrep</h1>
          <p className="text-gray-500 text-sm">Insira o código de acesso (JERONIMO_2026)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(false);
              }}
              placeholder="Código de Acesso"
              className={`w-full px-5 py-4 bg-white/5 border ${error ? 'border-red-500/30' : 'border-white/5'} rounded-2xl text-white placeholder-gray-600 outline-none transition-all focus:border-[#7cff01]/30 focus:ring-1 focus:ring-[#7cff01]/30 text-center tracking-widest`}
            />
            {error && (
              <p className="mt-3 text-xs text-red-500/80 text-center uppercase tracking-tighter">Erro de autenticação</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-[#7cff01] hover:bg-[#8aff20] text-[#0a0a0c] font-bold rounded-2xl transition-all active:scale-[0.98] mt-2"
          >
            Acessar
          </button>
        </form>

        <p className="mt-12 text-center text-[10px] text-gray-700 uppercase tracking-[0.2em] font-medium">
          Privado: Jerónimo Martins
        </p>
      </div>
    </div>
  );
};

export default Login;
