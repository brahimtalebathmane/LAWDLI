import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, User } from '../lib/supabase';
import { Plus, Trash2, Edit, Phone, Shield } from 'lucide-react';

interface UsersManagerProps {
  onStatsUpdate: () => void;
}

const UsersManager: React.FC<UsersManagerProps> = ({ onStatsUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    pin_code: '',
    role: 'user' as 'admin' | 'user'
  });

  const { t } = useLanguage();

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate phone number and pin
      if (formData.phone_number.length !== 8 || !/^\d{8}$/.test(formData.phone_number)) {
        alert('Phone number must be exactly 8 digits');
        return;
      }

      if (formData.pin_code.length !== 4 || !/^\d{4}$/.test(formData.pin_code)) {
        alert('PIN code must be exactly 4 digits');
        return;
      }

      if (isEditMode && selectedUser) {
        await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            pin_code: formData.pin_code,
            role: formData.role
          })
          .eq('id', selectedUser.id);
      } else {
        await supabase
          .from('users')
          .insert({
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            pin_code: formData.pin_code,
            role: formData.role
          });
      }

      setFormData({
        full_name: '',
        phone_number: '',
        pin_code: '',
        role: 'user'
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedUser(null);
      loadUsers();
      onStatsUpdate();

    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error.message?.includes('unique')) {
        alert('Phone number already exists');
      } else {
        alert('Error saving user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const editUser = (user: User) => {
    setFormData({
      full_name: user.full_name,
      phone_number: user.phone_number,
      pin_code: user.pin_code,
      role: user.role
    });
    setSelectedUser(user);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(t('confirm'))) return;

    try {
      await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      loadUsers();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('users')}</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('createUser')}
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('noData')}
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.full_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Phone className="h-4 w-4" />
                          {user.phone_number}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? t('admin') : t('user')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('pinCode')}: {user.pin_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editUser(user)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditMode ? t('edit') : t('createUser')}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value.replace(/\D/g, '').slice(0, 8)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12345678"
                    maxLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pinCode')}
                  </label>
                  <input
                    type="password"
                    value={formData.pin_code}
                    onChange={(e) => setFormData({...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234"
                    maxLength={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('role')}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'user'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">{t('user')}</option>
                    <option value="admin">{t('admin')}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? t('loading') : t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsEditMode(false);
                      setSelectedUser(null);
                      setFormData({
                        full_name: '',
                        phone_number: '',
                        pin_code: '',
                        role: 'user'
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;