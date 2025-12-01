import React, { useState } from 'react';
import { signInWithGoogle } from '../services/authService';
import { Loader2 } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Não foi possível conectar com o Google. Verifique se o pop-up foi bloqueado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl text-center">
        <div className="mb-6 flex justify-center">
             <span className="text-6xl">💸</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Baguncinha Salarial</h1>
        <p className="text-slate-500 mb-8">Organize sua vida financeira com inteligência artificial.</p>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
            </div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Entrar com Google
            </>
          )}
        </button>
        
        <p className="mt-8 text-xs text-slate-400">
            Seus dados são privados e vinculados à sua conta.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;