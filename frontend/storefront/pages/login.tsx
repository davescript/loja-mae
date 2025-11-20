import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OAuthButtons, { OAuthProvider } from '../../components/OAuthButtons';
import { API_BASE_URL } from '../../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4e6,_#fff9f4_55%,_#ffffff)] px-4 py-12 flex items-center justify-center">
      <div className="pointer-events-none absolute -top-16 right-0 h-56 w-56 rounded-full bg-[#ffe0c7]/60 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-4 left-8 h-64 w-64 rounded-full bg-[#d2f2e9]/70 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.35),_rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-4xl grid gap-6 lg:grid-cols-2 items-center">
        <div className="hidden lg:flex flex-col justify-between rounded-[28px] bg-gradient-to-br from-[#f4b985] via-[#e29b66] to-[#c97b57] text-white min-h-[520px] p-9 shadow-[0_25px_70px_rgba(201,123,87,0.35)]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/80 mb-3">
              leia sabores
            </p>
            <h2 className="text-3xl font-heading font-semibold leading-tight mb-4">
              Experiência premium em alimentação saudável de Portugal.
            </h2>
            <p className="text-white/80 leading-relaxed text-sm">
              Salve seus pedidos, acompanhe entregas e receba recomendações personalizadas
              para uma rotina equilibrada em Portugal.
            </p>
          </div>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-white/15 text-white flex items-center justify-center text-base font-semibold">
                24h
              </span>
              <p>Suporte dedicado para clientes cadastrados.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-white/15 text-white flex items-center justify-center text-base font-semibold">
                +
              </span>
              <p>Benefícios exclusivos, lançamentos e perks do clube.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white/95 backdrop-blur-xl border border-white shadow-[0_25px_70px_rgba(15,23,42,0.12)] p-8">
          <div className="flex flex-col gap-1 mb-8 text-center">
            <h1 className="text-3xl font-heading font-semibold text-[#24160b]">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-[#6b4b34]">
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
              <label htmlFor="email" className="text-sm font-medium text-[#3c2a1c]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#3c2a1c]">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-2xl bg-[#24160b] text-white font-semibold py-3 transition hover:bg-[#3a2313] disabled:opacity-70"
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-center text-[#77543a] text-sm mb-4">Ou continue com</p>
            <OAuthButtons onSelect={handleOAuth} disabledProviders={['microsoft']} />
            <p className="text-xs text-[#a98367] mt-3 text-center">* Microsoft em breve</p>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-[#6b4b34]">
              Não tem uma conta?{' '}
              <Link
                to={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="text-[#24160b] font-semibold hover:underline"
              >
                Registre-se
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/" className="text-[#a98367] hover:text-[#24160b]">
                ← Voltar para a loja
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

