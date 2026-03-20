import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Bell, 
  Lock, 
  LogOut, 
  ChevronRight, 
  Shield, 
  Trash2, 
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subscription: 'Free' | 'Premium';
  joinedDate: string;
  notifications: {
    picks: boolean;
    wins: boolean;
    news: boolean;
    offers: boolean;
  };
  language: string;
}

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const [user, setUser] = useState<UserProfile>({
    firstName: 'Edgar',
    lastName: 'Vale',
    email: 'edgarvalepaypal@gmail.com',
    phone: '+1 (555) 000-0000',
    subscription: 'Premium',
    joinedDate: '2024-01-15',
    notifications: {
      picks: true,
      wins: true,
      news: false,
      offers: true,
    },
    language: 'Español',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleNotification = (key: keyof UserProfile['notifications']) => {
    setUser(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleLogout = () => {
    // In a real app, this would clear tokens and redirect
    console.log('Logging out...');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white font-sans pb-24">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0b0e14]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-xl font-bold">Mi Perfil</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff8c00] flex items-center justify-center font-bold text-lg shadow-lg shadow-[#ff6600]/20">
          {user.firstName[0]}{user.lastName[0]}
        </div>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {/* User Info Card */}
        <section className="bg-[#1a1f29] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            {user.subscription === 'Premium' ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#ff6600]/10 text-[#ff6600] rounded-full text-[10px] font-bold border border-[#ff6600]/20">
                <Shield className="w-3 h-3" />
                PREMIUM
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-white/5 text-neutral-400 rounded-full text-[10px] font-bold border border-white/10">
                FREE
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0b0e14] flex items-center justify-center border border-white/5">
                <User className="w-8 h-8 text-[#ff6600]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
                <p className="text-sm text-neutral-500">Miembro desde {new Date(user.joinedDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="grid gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-neutral-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400">
                <Globe className="w-4 h-4" />
                <span className="text-sm">{user.language}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription & Billing */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">Suscripción y Pagos</h3>
          <div className="bg-[#1a1f29] rounded-3xl overflow-hidden border border-white/5">
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Gestionar Suscripción</p>
                  <p className="text-[10px] text-neutral-500">Plan {user.subscription} activo</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">Notificaciones</h3>
          <div className="bg-[#1a1f29] rounded-3xl p-2 border border-white/5 space-y-1">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff6600]/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#ff6600]" />
                </div>
                <div>
                  <p className="text-sm font-bold">Nuevos Picks</p>
                  <p className="text-[10px] text-neutral-500">Recibe alertas cuando subamos picks</p>
                </div>
              </div>
              <button 
                onClick={() => toggleNotification('picks')}
                className={`w-12 h-6 rounded-full transition-all relative ${user.notifications.picks ? 'bg-[#ff6600]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.notifications.picks ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Picks Ganados</p>
                  <p className="text-[10px] text-neutral-500">Notificaciones de resultados positivos</p>
                </div>
              </div>
              <button 
                onClick={() => toggleNotification('wins')}
                className={`w-12 h-6 rounded-full transition-all relative ${user.notifications.wins ? 'bg-[#ff6600]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${user.notifications.wins ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-2">Seguridad</h3>
          <div className="bg-[#1a1f29] rounded-3xl overflow-hidden border border-white/5">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold">Cambiar Contraseña</p>
                  <p className="text-[10px] text-neutral-500">Actualiza tus credenciales</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-red-500/50 uppercase tracking-wider px-2">Zona de Peligro</h3>
          <div className="bg-[#1a1f29] rounded-3xl overflow-hidden border border-white/5">
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-500/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-500">Cerrar Sesión</p>
                  <p className="text-[10px] text-red-500/50">Salir de tu cuenta actual</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500/30" />
            </button>
            <div className="h-[1px] bg-white/5 mx-6" />
            <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-500/5 transition-colors text-left group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-500">Eliminar Cuenta</p>
                  <p className="text-[10px] text-red-500/50">Esta acción es irreversible</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-500/30" />
            </button>
          </div>
        </section>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1f29] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">Cambiar Contraseña</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Contraseña Actual</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#ff6600] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Nueva Contraseña</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#ff6600] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Confirmar Nueva Contraseña</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-[#ff6600] outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-[#ff6600] text-sm font-bold hover:bg-[#ff8c00] transition-all shadow-lg shadow-[#ff6600]/20">
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1f29] w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">¿Cerrar Sesión?</h2>
              <p className="text-sm text-neutral-500 mb-8">Tendrás que volver a ingresar tus credenciales para acceder.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
