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
    <div className="min-h-screen bg-gradient-to-br from-golden-50 via-white to-golden-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center fade-in">
          <div className="mx-auto mb-6">
            <LoginLogo size="xl" showText={true} className="justify-center" />
          </div>
          <h2 className="text-display mb-4">
            الحصان الذهبي لخدمات الشحن
          </h2>
          <p className="text-body text-golden-700">
            <span className="inline-block w-2 h-2 bg-success-500 rounded-full ml-2"></span>
            تسجيل الدخول إلى النظام
          </p>
        </div>

        <form className="space-y-6 slide-in" onSubmit={handleSubmit}>
          <div className="card-professional">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                اسم المستخدم
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  className="form-input pr-12"
                  placeholder="أدخل اسم المستخدم"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-golden-500" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="form-input pr-12 pl-12"
                  placeholder="أدخل كلمة المرور"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="w-5 h-5 bg-golden-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-golden-600 hover:text-golden-700 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-danger">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-5 h-5 ml-2"></div>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <Truck className="h-5 w-5 ml-2" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
