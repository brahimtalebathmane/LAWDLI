import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Group, User } from '../lib/supabase';
import { Plus, Users, Trash2, Edit, UserPlus, UserMinus } from 'lucide-react';

interface GroupsManagerProps {
  onStatsUpdate: () => void;
}

const GroupsManager: React.FC<GroupsManagerProps> = ({ onStatsUpdate }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const { t } = useLanguage();

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:users(id, full_name, phone_number),
          group:groups(id, name)
        `);

      if (error) throw error;
      setGroupMembers(data || []);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  useEffect(() => {
    loadGroups();
    loadUsers();
    loadGroupMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditMode && selectedGroup) {
        await supabase
          .from('groups')
          .update({
            name: formData.name,
            description: formData.description
          })
          .eq('id', selectedGroup.id);
      } else {
        await supabase
          .from('groups')
          .insert({
            name: formData.name,
            description: formData.description
          });
      }

      setFormData({ name: '', description: '' });
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedGroup(null);
      loadGroups();
      onStatsUpdate();

    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const editGroup = (group: Group) => {
    setFormData({
      name: group.name,
      description: group.description || ''
    });
    setSelectedGroup(group);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm(t('confirm'))) return;

    try {
      await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      loadGroups();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const openMemberModal = (group: Group) => {
    setSelectedGroup(group);
    setIsMemberModalOpen(true);
  };

  const addMemberToGroup = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await supabase
        .from('group_members')
        .insert({
          group_id: selectedGroup.id,
          user_id: userId
        });

      loadGroupMembers();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const removeMemberFromGroup = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', selectedGroup.id)
        .eq('user_id', userId);

      loadGroupMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const getGroupMembers = (groupId: string) => {
    return groupMembers.filter(m => m.group_id === groupId);
  };

  const isUserInGroup = (groupId: string, userId: string) => {
    return groupMembers.some(m => m.group_id === groupId && m.user_id === userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('groups')}</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('createGroup')}
        </button>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const members = getGroupMembers(group.id);
          return (
            <div key={group.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{members.length} {t('members')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openMemberModal(group)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Manage Members"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => editGroup(group)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {members.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Recent Members:</p>
                  <div className="space-y-1">
                    {members.slice(0, 3).map((member) => (
                      <div key={member.id} className="text-xs text-gray-600">
                        {member.user?.full_name}
                      </div>
                    ))}
                    {members.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{members.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">
            {t('noData')}
          </div>
        )}
      </div>

      {/* Create/Edit Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditMode ? t('edit') : t('createGroup')}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('groupName')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('groupDescription')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
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
                      setSelectedGroup(null);
                      setFormData({ name: '', description: '' });
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

      {/* Manage Members Modal */}
      {isMemberModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Manage Members - {selectedGroup.name}
              </h3>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Available Users</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.phone_number}</p>
                      </div>
                      <button
                        onClick={() => 
                          isUserInGroup(selectedGroup.id, user.id) 
                            ? removeMemberFromGroup(user.id)
                            : addMemberToGroup(user.id)
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          isUserInGroup(selectedGroup.id, user.id)
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {isUserInGroup(selectedGroup.id, user.id) ? (
                          <UserMinus className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}

                  {users.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No users available
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    setIsMemberModalOpen(false);
                    setSelectedGroup(null);
                  }}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsManager;