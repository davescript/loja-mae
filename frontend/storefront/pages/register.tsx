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
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4e6,_#fff9f4_55%,_#ffffff)] px-4 py-12 flex items-center justify-center">
      <div className="pointer-events-none absolute -top-12 left-4 h-56 w-56 rounded-full bg-[#ffd4c1]/60 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-2 right-8 h-64 w-64 rounded-full bg-[#d2f2e9]/60 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.35),_rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-4xl grid gap-6 lg:grid-cols-2 items-center">
        <div className="hidden lg:flex flex-col justify-between rounded-[28px] bg-gradient-to-br from-[#f4d1a1] via-[#e6a870] to-[#c97b57] text-[#3c2a1c] min-h-[520px] p-9 shadow-[0_25px_70px_rgba(228,152,105,0.35)]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-[#6b4b34]/70 mb-3">
              vantagens exclusivas
            </p>
            <h2 className="text-3xl font-heading font-semibold leading-tight mb-4 text-[#24160b]">
              Conteúdo, perks e descontos antes de todo mundo.
            </h2>
            <p className="text-[#6b4b34] leading-relaxed text-sm">
              Cadastre-se e desbloqueie benefícios VIP, coleção limitada e eventos privados
              para clientes Leiasabores.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-[#4f3726]">
            <div className="rounded-2xl bg-white/60 p-4">
              Envio prioritário para Portugal continental e ilhas.
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              Cashback em compras e experiências exclusivas.
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white/95 backdrop-blur-xl border border-white shadow-[0_25px_70px_rgba(15,23,42,0.12)] p-8">
          <div className="flex flex-col gap-1 mb-8 text-center">
            <h1 className="text-3xl font-heading font-semibold text-[#24160b]">
              Criar conta
            </h1>
            <p className="text-sm text-[#6b4b34]">
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
                <label htmlFor="firstName" className="text-sm font-medium text-[#3c2a1c]">
                  Nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-[#3c2a1c]">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

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
                placeholder="seu@email.com"
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
                minLength={8}
                className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full rounded-2xl bg-[#24160b] text-white font-semibold py-3 transition hover:bg-[#3a2313] disabled:opacity-70"
            >
              {isRegistering ? 'Registrando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-center text-[#77543a] text-sm mb-4">Ou continue com</p>
            <OAuthButtons onSelect={handleOAuth} disabledProviders={['microsoft']} />
            <p className="text-xs text-[#a98367] mt-3 text-center">* Microsoft em breve</p>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-[#6b4b34]">
              Já tem uma conta?{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-[#24160b] font-semibold hover:underline"
              >
                Faça login
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

