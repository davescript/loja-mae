import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, Eye, EyeOff, UserPlus, KeyRound } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();
  const { login, isLoggingIn, loginError, isAuthenticated } = useAdminAuth();
  const [submitting, setSubmitting] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await login({ email, password });
      return;
    }
    if (mode === 'register') {
      try {
        setSubmitting(true);
        const response = await fetch('/api/auth/admin/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
          credentials: 'include',
        });
        const data: any = await response.json();
        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || 'Falha ao registrar');
        }
        if (data?.data?.token) {
          localStorage.setItem('admin_token', data.data.token);
        }
        navigate('/admin/dashboard');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (mode === 'forgot') {
      try {
        setSubmitting(true);
        if (!forgotCode) {
          const res = await fetch('/api/auth/admin/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail }),
            credentials: 'include',
          });
          const json: any = await res.json();
          if (!res.ok || json?.success === false) {
            throw new Error(json?.error || 'Falha ao enviar código');
          }
          return;
        }
        const res2 = await fetch('/api/auth/admin/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, code: forgotCode, new_password: newPassword }),
          credentials: 'include',
        });
        const json2: any = await res2.json();
        if (!res2.ok || json2?.success === false) {
          throw new Error(json2?.error || 'Falha ao resetar senha');
        }
        setMode('login');
        setEmail(forgotEmail);
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{mode === 'login' ? 'Admin Login' : mode === 'register' ? 'Criar Admin' : 'Recuperar Senha'}</h1>
            <p className="text-gray-600">{mode === 'login' ? 'Acesse o painel administrativo' : mode === 'register' ? 'Crie um administrador' : 'Receba um código por email'}</p>
          </div>

          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                Email ou senha inválidos. Verifique suas credenciais.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode !== 'forgot' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="admin@loja-mae.com" />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Seu nome" />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="admin@loja-mae.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código de verificação</label>
                  <input type="text" value={forgotCode} onChange={(e) => setForgotCode(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Seis dígitos" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova senha</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="••••••••" />
                </div>
              </div>
            )}

            <motion.button type="submit" disabled={isLoggingIn || submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {mode === 'login' ? (isLoggingIn ? 'Entrando...' : 'Entrar') : submitting ? 'Enviando...' : mode === 'register' ? 'Registrar' : forgotCode ? 'Resetar Senha' : 'Enviar Código'}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 flex items-center justify-center gap-4">
            <button onClick={() => setMode('forgot')} className="inline-flex items-center gap-2 hover:text-primary">
              <KeyRound className="w-4 h-4" />
              Esqueci a senha
            </button>
            <span>•</span>
            <button onClick={() => setMode((m) => (m === 'register' ? 'login' : 'register'))} className="inline-flex items-center gap-2 hover:text-primary">
              <UserPlus className="w-4 h-4" />
              {mode === 'register' ? 'Voltar ao login' : 'Criar novo registro'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
