import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Truck, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginLogo from './LoginLogo';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(credentials);
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-golden-50 via-white to-golden-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-golden-300/20 to-golden-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-golden-400/20 to-golden-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-white/30 to-golden-100/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center fade-in">
          <div className="mx-auto mb-8 transform hover:scale-105 transition-transform duration-300">
            <LoginLogo size="xl" showText={true} className="justify-center" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            الحصان الذهبي لخدمات الشحن
          </h2>
          <p className="text-lg text-golden-700 font-medium">
            <span className="inline-block w-2 h-2 bg-success-500 rounded-full ml-2 animate-pulse"></span>
            تسجيل الدخول إلى النظام
          </p>
        </div>

        <form className="space-y-6 slide-in" onSubmit={handleSubmit}>
          <div className="card border-0 shadow-2xl bg-white/80 backdrop-blur-sm p-8 rounded-2xl border-r-4 border-golden-500 hover:shadow-3xl transition-all duration-500">
            <div className="form-group">
              <label htmlFor="username" className="form-label text-gray-700 font-semibold mb-2 block">
                اسم المستخدم
              </label>
              <div className="relative group">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  className="form-input pr-12 py-4 text-lg border-2 border-golden-200 focus:border-golden-500 focus:ring-4 focus:ring-golden-100 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm group-hover:bg-white/90"
                  placeholder="أدخل اسم المستخدم"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none group-hover:scale-110 transition-transform duration-200">
                  <User className="h-6 w-6 text-golden-500" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label text-gray-700 font-semibold mb-2 block">
                كلمة المرور
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="form-input pr-12 pl-12 py-4 text-lg border-2 border-golden-200 focus:border-golden-500 focus:ring-4 focus:ring-golden-100 rounded-xl transition-all duration-300 bg-white/70 backdrop-blur-sm group-hover:bg-white/90"
                  placeholder="أدخل كلمة المرور"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none group-hover:scale-110 transition-transform duration-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-golden-400 to-golden-600 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-golden-600 hover:text-golden-700 transition-all duration-200 hover:scale-110"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-6 w-6" />
                  ) : (
                    <Eye className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-danger-50 to-danger-100 border border-danger-300 text-danger-800 px-4 py-3 rounded-xl mb-4 shadow-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-golden-500 to-golden-600 hover:from-golden-600 hover:to-golden-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center golden-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-8"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-6 h-6 ml-2"></div>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <Truck className="h-6 w-6 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Footer with additional visual elements */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-golden-400"></div>
            <div className="w-2 h-2 bg-golden-500 rounded-full animate-pulse"></div>
            <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-golden-400"></div>
          </div>
          <p className="text-sm text-golden-600 font-medium">
            مرحباً بك في منظومة إدارة الشحن
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
