import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import Layout from './Layout';
import { Phone, Lock, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate input format
      if (phoneNumber.length !== 8 || !/^\d{8}$/.test(phoneNumber)) {
        setError('Phone number must be exactly 8 digits');
        return;
      }

      if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
        setError('PIN code must be exactly 4 digits');
        return;
      }

      // Query user from database
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('pin_code', pinCode);

      if (error) throw error;

      if (!users || users.length === 0) {
        setError(t('invalidCredentials'));
        return;
      }

      // Login successful
      login(users[0]);
    } catch (err) {
      console.error('Login error:', err);
      setError(t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showNavigation={false}>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img 
              src="https://i.postimg.cc/rygydTNp/9.png" 
              alt="LAWDLI Logo" 
              className="mx-auto h-20 w-auto mb-6"
            />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">لودلي | LAWDLI</h2>
            <p className="text-gray-600">{t('login')}</p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="12345678"
                    maxLength={8}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pinCode')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="pin"
                    type="password"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="1234"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    {t('loginButton')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;