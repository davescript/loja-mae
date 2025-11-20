import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import OAuthButtons, { OAuthProvider } from '../../components/OAuthButtons';
import { API_BASE_URL } from '../../utils/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      register(
        { email, password, first_name: firstName, last_name: lastName },
        {
          onSuccess: () => {
            navigate(redirect);
          },
          onError: (err: Error) => {
            setError(err.message || 'Erro ao registrar');
          },
        }
      );
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar');
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
      setError(`Erro ao iniciar registro com ${provider === 'google' ? 'Google' : 'Apple'}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-[radial-gradient(circle_at_top,_#fdf2ff,_#f3f4ff_55%,_#ffffff)] px-4 py-16 flex items-center justify-center">
      <div className="pointer-events-none absolute -top-16 left-0 h-64 w-64 rounded-full bg-emerald-200/40 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.6),_rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-5xl grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-center">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#f7b977] via-[#f48fb1] to-[#c084fc] text-slate-900 h-full p-10 shadow-[0_30px_80px_rgba(244,143,177,0.35)]">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-900/70 mb-4">
              vantagens exclusivas
            </p>
            <h2 className="text-4xl font-heading font-semibold leading-tight mb-6">
              Conteúdo, perks e descontos antes de todo mundo.
            </h2>
            <p className="text-slate-900/70 leading-relaxed">
              Cadastre-se e desbloqueie benefícios VIP, coleção limitada e eventos privados
              para clientes Leiasabores.
            </p>
          </div>
          <div className="grid gap-4 text-sm text-slate-900/80">
            <div className="rounded-2xl bg-white/40 p-4">
              Envio prioritário para Portugal continental e ilhas.
            </div>
            <div className="rounded-2xl bg-white/40 p-4">
              Cashback em compras e experiências exclusivas.
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] p-10">
          <div className="flex flex-col gap-1 mb-8 text-center">
            <h1 className="text-3xl font-heading font-semibold text-slate-900">
              Criar conta
            </h1>
            <p className="text-sm text-slate-500">
              Registre-se para desbloquear benefícios exclusivos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                  Nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

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
                placeholder="seu@email.com"
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
                minLength={8}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full rounded-2xl bg-slate-900 text-white font-semibold py-3 transition hover:bg-slate-800 disabled:opacity-70"
            >
              {isRegistering ? 'Registrando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-center text-slate-500 text-sm mb-4">Ou continue com</p>
            <OAuthButtons onSelect={handleOAuth} disabledProviders={['microsoft']} />
            <p className="text-xs text-slate-400 mt-3 text-center">* Microsoft em breve</p>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-slate-600">
              Já tem uma conta?{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-slate-900 font-semibold hover:underline"
              >
                Faça login
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

