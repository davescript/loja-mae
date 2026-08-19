import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OAuthButtons, { OAuthProvider } from '../../components/OAuthButtons';
import { API_BASE_URL } from '../../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoggingIn, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    login(
      { email, password },
      {
        onSuccess: () => navigate(redirect),
        onError: (err: Error) => setError(err.message),
      }
    );
  };

  const handleOAuth = (provider: OAuthProvider) => {
    if (provider === 'microsoft') {
      setError('Integração com Microsoft em breve.');
      return;
    }
    window.location.href = `${API_BASE_URL}/api/auth/oauth/${provider}?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-lg font-semibold tracking-tight text-[#1a0f0a]">
            Leia Sabores
          </span>
        </Link>
        <p className="text-sm text-[#9c8070]">
          Não tem conta?{' '}
          <Link
            to={`/register?redirect=${encodeURIComponent(redirect)}`}
            className="font-medium text-[#1a0f0a] hover:underline underline-offset-2"
          >
            Registre-se
          </Link>
        </p>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1a0f0a] mb-5">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[#1a0f0a] tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-1.5 text-sm text-[#9c8070]">
              Aceda à sua conta Leia Sabores
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#e8e0d9] shadow-sm p-7 sm:p-8">

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#3c2a1c] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  className="w-full rounded-xl border border-[#e2d6cc] bg-[#faf9f7] px-4 py-2.5 text-sm text-[#1a0f0a] placeholder:text-[#bba898] transition focus:outline-none focus:border-[#1a0f0a] focus:ring-2 focus:ring-[#1a0f0a]/10"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-[#3c2a1c]">
                    Senha
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#9c8070] hover:text-[#1a0f0a] transition"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#e2d6cc] bg-[#faf9f7] px-4 py-2.5 pr-10 text-sm text-[#1a0f0a] placeholder:text-[#bba898] transition focus:outline-none focus:border-[#1a0f0a] focus:ring-2 focus:ring-[#1a0f0a]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bba898] hover:text-[#1a0f0a] transition"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-1 rounded-xl bg-[#1a0f0a] text-white text-sm font-semibold py-2.5 transition hover:bg-[#2e1a10] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    A entrar...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#ede6df]" />
              <span className="text-xs text-[#bba898] font-medium">ou continue com</span>
              <div className="flex-1 h-px bg-[#ede6df]" />
            </div>

            {/* OAuth */}
            <OAuthButtons onSelect={handleOAuth} disabledProviders={['microsoft']} />
            <p className="text-xs text-[#bba898] mt-2 text-center">* Microsoft em breve</p>
          </div>

          {/* Footer link */}
          <p className="mt-6 text-center text-sm text-[#9c8070]">
            <Link to="/" className="hover:text-[#1a0f0a] transition">
              ← Voltar para a loja
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
