import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OAuthButtons, { OAuthProvider } from '../../components/OAuthButtons';
import { API_BASE_URL } from '../../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      login(
        { email, password },
        {
          onSuccess: () => {
            navigate(redirect);
          },
          onError: (err: Error) => {
            setError(err.message);
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  const handleOAuth = (provider: OAuthProvider) => {
    if (provider === 'microsoft') {
      setError('Integração com Microsoft em breve.');
      return;
    }

    try {
      window.location.href = `${API_BASE_URL}/api/auth/oauth/${provider}?redirect=${encodeURIComponent(
        redirect
      )}`;
    } catch (err: any) {
      setError(`Erro ao iniciar login com ${provider === 'google' ? 'Google' : 'Apple'}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[radial-gradient(circle_at_top,_#fdf2ff,_#f3f4ff_55%,_#ffffff)] px-4 py-16 flex items-center justify-center">
      <div className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-pink-200/50 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.6),_rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-5xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#1f1144] via-[#311d73] to-[#452b7f] text-white h-full p-10 shadow-[0_30px_80px_rgba(49,29,115,0.35)]">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/70 mb-4">
              leia sabores
            </p>
            <h2 className="text-4xl font-heading font-semibold leading-tight mb-6">
              Experiência premium em alimentação saudável.
            </h2>
            <p className="text-white/70 leading-relaxed">
              Salve seus pedidos, acompanhe entregas e receba recomendações personalizadas
              para uma rotina equilibrada em Portugal.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-white/15 text-white flex items-center justify-center text-lg font-semibold">
                24h
              </span>
              <p className="text-sm text-white/80">
                Suporte dedicado para clientes cadastrados.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-white/15 text-white flex items-center justify-center text-lg font-semibold">
                +
              </span>
              <p className="text-sm text-white/80">
                Benefícios exclusivos, lançamentos e perks do clube.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10">
          <div className="flex flex-col gap-1 mb-8 text-center">
            <h1 className="text-3xl font-heading font-semibold text-slate-900">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-slate-500">
              Faça login para continuar sua experiência na Leiasabores.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-2xl bg-slate-900 text-white font-semibold py-3 transition hover:bg-slate-800 disabled:opacity-70"
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-center text-slate-500 text-sm mb-4">Ou continue com</p>
            <OAuthButtons onSelect={handleOAuth} disabledProviders={['microsoft']} />
            <p className="text-xs text-slate-400 mt-3 text-center">* Microsoft em breve</p>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-slate-600">
              Não tem uma conta?{' '}
              <Link
                to={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-slate-900 font-semibold hover:underline"
              >
                Registre-se
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/" className="text-slate-500 hover:text-slate-900">
                ← Voltar para a loja
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

