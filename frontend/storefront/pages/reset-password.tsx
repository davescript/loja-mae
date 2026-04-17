import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const isInvalidLink = !token || !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any)?.error || 'Erro ao redefinir senha');
      }
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Tente novamente.');
      setStatus('error');
    }
  };

  if (isInvalidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdf6f0] px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-[#3c2a1c] font-semibold">Link inválido</p>
          <p className="text-sm text-[#a98367]">
            Este link de recuperação é inválido ou está incompleto.
          </p>
          <Link to="/forgot-password" className="inline-block text-sm text-[#24160b] font-semibold hover:underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6f0] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#24160b] mb-2">Nova senha</h1>
          <p className="text-sm text-[#a98367]">
            Escolha uma senha segura para a sua conta.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <p className="text-[#3c2a1c] font-semibold">Senha atualizada!</p>
            <p className="text-sm text-[#a98367]">
              Redirecionando para o login em instantes...
            </p>
            <Link to="/login" className="inline-block text-sm text-[#24160b] font-semibold hover:underline">
              Ir para o login agora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#3c2a1c]">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
                className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm" className="text-sm font-medium text-[#3c2a1c]">
                Confirmar senha
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                placeholder="Repita a nova senha"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-2xl bg-[#24160b] text-white font-semibold py-3 transition hover:bg-[#3a2313] disabled:opacity-70"
            >
              {status === 'loading' ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
