import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || 'Erro ao enviar email');
      }
      setStatus('sent');
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Tente novamente.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf6f0] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#24160b] mb-2">Recuperar senha</h1>
          <p className="text-sm text-[#a98367]">
            Informe o email cadastrado e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📧</div>
            <p className="text-[#3c2a1c] font-semibold">Email enviado!</p>
            <p className="text-sm text-[#a98367]">
              Se <strong>{email}</strong> estiver cadastrado, você receberá um link em instantes.
              Verifique também a caixa de spam.
            </p>
            <Link
              to="/login"
              className="inline-block mt-4 text-sm text-[#24160b] font-semibold hover:underline"
            >
              ← Voltar para o login
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
              <label htmlFor="email" className="text-sm font-medium text-[#3c2a1c]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-2xl border border-[#edd9c9] bg-white px-4 py-3 text-[#24160b] placeholder:text-[#a58a75] focus:outline-none focus:ring-2 focus:ring-[#f0cdae]"
                placeholder="voce@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-2xl bg-[#24160b] text-white font-semibold py-3 transition hover:bg-[#3a2313] disabled:opacity-70"
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>

            <div className="text-center space-y-2 pt-2">
              <Link to="/login" className="text-sm text-[#a98367] hover:text-[#24160b]">
                ← Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
