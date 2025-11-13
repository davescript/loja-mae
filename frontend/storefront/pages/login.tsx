import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      login(
        { email, password },
        {
          onSuccess: () => {
            navigate('/account');
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

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-heading font-bold mb-2 text-center">Login</h1>
        <p className="text-muted-foreground text-center mb-8">Entre na sua conta</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input w-full"
              placeholder="seu@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input w-full"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoggingIn}
            className="btn btn-primary w-full"
          >
            {isLoggingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Registre-se
            </Link>
          </p>
          <p className="text-sm">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              ← Voltar para a loja
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

