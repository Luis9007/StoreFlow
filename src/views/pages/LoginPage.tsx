import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { Button } from '@/views/components/ui/Button';
import { Input } from '@/views/components/ui/Input';

const demoAccounts = [
  { role: 'Supervisor', email: 'supervisor@storeflow.com', password: 'super123', color: 'from-info to-blue-600' },
  { role: 'Cajero', email: 'cajero@storeflow.com', password: 'cajero123', color: 'from-accent to-orange-500' },
];

export function LoginPage() {
  const { login, currentUser } = useStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (currentUser) return <Navigate to="/app" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (ok) {
        toast.success('Bienvenido a StoreFlow', 'Sesión iniciada correctamente');
        navigate('/app');
      } else {
        setError('Correo o contraseña incorrectos');
        toast.error('Error de acceso', 'Verifica tus credenciales');
      }
    }, 600);
  };

  const fillDemo = (acc: typeof demoAccounts[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 sf-gradient-brand opacity-50" />
        {/* Animated blobs */}
        <motion.div
          className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
              <span className="font-display font-bold text-white text-xl">S</span>
            </div>
            <div>
              <p className="font-display font-bold text-xl">StoreFlow</p>
              <p className="text-xs text-white/60">POS & Gestión de Tiendas</p>
            </div>
          </div>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display font-bold text-4xl leading-tight"
            >
              Gestiona tu tienda con <span className="text-primary">fluidez</span> y control total.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-white/70 mt-4 text-lg"
            >
              Punto de venta, inventario, compras, caja y reportes en una sola plataforma profesional.
            </motion.p>

            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                { icon: Zap, label: 'Rápido' },
                { icon: ShieldCheck, label: 'Seguro' },
                { icon: Sparkles, label: 'Premium' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="sf-glass rounded-2xl p-4 border border-white/10"
                >
                  <f.icon className="h-6 w-6 text-primary mb-2" />
                  <p className="text-sm font-medium">{f.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">© 2025 StoreFlow. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl">
              <span className="font-display font-bold text-white text-xl">S</span>
            </div>
            <p className="font-display font-bold text-2xl text-text">StoreFlow</p>
          </div>

          <h2 className="font-display font-bold text-2xl text-text">Iniciar sesión</h2>
          <p className="text-muted text-sm mt-1">Accede a tu panel de gestión</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-[38px] h-4 w-4 text-muted pointer-events-none z-10" />
              <Input
                type="email"
                label="Correo electrónico"
                placeholder="supervisor@storeflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-[38px] h-4 w-4 text-muted pointer-events-none z-10" />
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-[38px] text-muted hover:text-text"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Ingresar
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-border" />
              <p className="text-xs text-muted">Cuentas de demostración</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-surface-2 transition-all group"
                >
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {acc.role.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text">{acc.role}</p>
                    <p className="text-xs text-muted">{acc.email}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
