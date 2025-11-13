import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      register(
        { email, password, first_name: firstName, last_name: lastName },
        {
          onSuccess: () => {
            navigate('/account');
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

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-heading font-bold mb-2 text-center">Criar Conta</h1>
        <p className="text-muted-foreground text-center mb-8">Registre-se para começar a comprar</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                Nome
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input w-full"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                Sobrenome
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input w-full"
                placeholder="Seu sobrenome"
              />
            </div>
          </div>
          
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
              minLength={8}
              className="input w-full"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={isRegistering}
            className="btn btn-primary w-full"
          >
            {isRegistering ? 'Registrando...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Faça login
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

