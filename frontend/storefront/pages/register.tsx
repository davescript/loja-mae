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
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#050505] via-[#0b0b0b] to-[#050505] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-[#111217] border border-white/5 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
          <h1 className="text-3xl font-heading font-semibold text-white text-center mb-2">
            Criar conta
          </h1>
          <p className="text-sm text-white/60 text-center mb-8">
            Registre-se para desbloquear benefícios exclusivos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-100 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-white/80">
                  Nome
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-white/80">
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full rounded-2xl bg-white text-black font-semibold py-3 transition hover:bg-gray-100 disabled:opacity-70"
            >
              {isRegistering ? 'Registrando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-10">
            <p className="text-center text-white/60 text-sm mb-4">Ou continue com</p>
            <OAuthButtons onSelect={handleOAuth} disabledProviders={['microsoft']} />
            <p className="text-xs text-white/40 mt-3 text-center">* Microsoft em breve</p>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-white/70">
              Já tem uma conta?{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="text-white font-semibold hover:underline"
              >
                Faça login
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/" className="text-white/50 hover:text-white">
                ← Voltar para a loja
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

