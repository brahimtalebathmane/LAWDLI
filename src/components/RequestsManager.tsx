import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Request, Group, Response } from '../lib/supabase';
import { useRealtimeData } from '../hooks/useRealtimeData';
import RefreshButton from './RefreshButton';
import LoadingSpinner from './LoadingSpinner';
import { Plus, Send, Upload, Eye, Trash2, Edit } from 'lucide-react';

interface RequestsManagerProps {
  onStatsUpdate: () => void;
}

const RequestsManager: React.FC<RequestsManagerProps> = ({ onStatsUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedGroups: [] as string[],
    image: null as File | null
  });

  const { t } = useLanguage();
  const { user } = useAuth();

  // Use real-time data hooks
  const {
    data: requests,
    isLoading: requestsLoading,
    isRefreshing: requestsRefreshing,
    refresh: refreshRequests
  } = useRealtimeData({
    table: 'requests',
    select: `
      *,
      creator:users(full_name),
      request_groups(group_id, groups(name))
    `,
    orderBy: { column: 'created_at', ascending: false },
    cacheKey: 'admin-requests',
    cacheDuration: 20000,
    enableRealtime: true
  });

  const {
    data: groups,
    refresh: refreshGroups
  } = useRealtimeData({
    table: 'groups',
    orderBy: { column: 'name', ascending: true },
    cacheKey: 'admin-groups',
    cacheDuration: 60000,
    enableRealtime: true
  });

  const {
    data: responses,
    isRefreshing: responsesRefreshing,
    refresh: refreshResponses
  } = useRealtimeData({
    table: 'responses',
    select: `
      *,
      user:users(full_name, phone_number)
    `,
    orderBy: { column: 'created_at', ascending: false },
    cacheKey: 'admin-responses',
    cacheDuration: 15000,
    enableRealtime: true
  });

  const refreshAllData = () => {
    refreshRequests();
    refreshGroups();
    refreshResponses();
    onStatsUpdate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate that at least one image is provided
      if (!formData.image) {
        alert('At least one image is required');
        return;
      }

      let imageUrl = '';

      // Upload image if provided
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('request-images')
          .upload(fileName, formData.image);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('request-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Create request
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .insert({
          title: formData.title || null,
          description: formData.description || null,
          image_url: imageUrl || null,
          created_by: user?.id
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Link request to groups
      if (formData.selectedGroups.length > 0) {
        const requestGroups = formData.selectedGroups.map(groupId => ({
          request_id: requestData.id,
          group_id: groupId
        }));

        await supabase
          .from('request_groups')
          .insert(requestGroups);

        // Send notifications to group members
        await sendNotificationsToGroups(requestData, formData.selectedGroups);
        
        // Send push notifications
        await sendPushNotificationsToGroups(requestData, formData.selectedGroups);
      }

      // Reset form and reload data
      setFormData({
        title: '',
        description: '',
        selectedGroups: [],
        image: null
      });
      setIsModalOpen(false);
      refreshRequests();
      onStatsUpdate();

    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPushNotificationsToGroups = async (request: Request, groupIds: string[]) => {
    try {
      console.log('Sending push notifications to groups:', groupIds);
      
      // Get all users in the selected groups
      const { data: groupMembers, error } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds);

      if (error) throw error;

      const userIds = [...new Set(groupMembers?.map(m => m.user_id) || [])];
      console.log('Target user IDs for notifications:', userIds);

      if (userIds.length > 0) {
        const title = t('push.new_request.title');
        const bodyTemplate = t('push.new_request.body');
        
        const body = request.title 
          ? bodyTemplate.replace('{{title}}', `: ${request.title}`)
          : bodyTemplate.replace('{{title}}', '');

        console.log('Sending push notification:', { title, body, userIds });

        // Call push notification edge function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userIds,
            title,
            body,
            data: {
              request_id: request.id,
              deepLink: `/request/${request.id}`
            }
          })
        });

        const result = await response.json();
        console.log('Push notification response:', result);
        
        if (!response.ok) {
          console.error('Failed to send push notifications:', result);
        } else {
          console.log('Push notifications sent successfully:', result);
        }
      } else {
        console.log('No users found in selected groups for notifications');
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  };

  const sendNotificationsToGroups = async (request: Request, groupIds: string[]) => {
    try {
      // Get all users in the selected groups
      const { data: groupMembers, error } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds);

      if (error) throw error;

      const userIds = [...new Set(groupMembers?.map(m => m.user_id) || [])];

      if (userIds.length > 0) {
        const notifications = userIds.map(userId => ({
          user_id: userId,
          title: t('requests'),
          message: `${t('createRequest')}: ${request.title}`,
          link: `/request/${request.id}`
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const viewRequestResponses = async (request: Request) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm(t('confirm'))) return;

    try {
      await supabase
        .from('requests')
        .delete()
        .eq('id', requestId);

      refreshRequests();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const getRequestResponses = (requestId: string) => {
    return responses.filter(r => r.request_id === requestId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('requests')}</h2>
        <div className="flex items-center gap-2">
          <RefreshButton
            onRefresh={refreshAllData}
            isRefreshing={requestsRefreshing || responsesRefreshing}
            size="md"
            variant="ghost"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('createRequest')}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {requestsLoading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <LoadingSpinner size="lg" text={t('loading')} />
        </div>
      )}

      {/* Requests List */}
      {!requestsLoading && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {(requests || []).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('noData')}
            </div>
          ) : (
            (requests || []).map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {request.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    {request.image_url && (
                      <img 
                        src={request.image_url} 
                        alt={request.title}
                        className="w-24 h-24 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      <span>{getRequestResponses(request.id).length} responses</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => viewRequestResponses(request)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRequest(request.id)}
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
      )}

      {/* Create Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('createRequest')}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('requestTitle')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('optional')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('requestDescription')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={t('optional')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('uploadImage')} *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({...formData, image: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('imageRequired')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('selectGroups')}
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(groups || []).map((group) => (
                      <label key={group.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedGroups.includes(group.id)}
                          onChange={(e) => {
                            const groupId = group.id;
                            setFormData({
                              ...formData,
                              selectedGroups: e.target.checked
                                ? [...formData.selectedGroups, groupId]
                                : formData.selectedGroups.filter(id => id !== groupId)
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{group.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? t('loading') : t('sendRequest')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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

      {/* View Responses Modal */}
      {isViewModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedRequest.title} - Responses
              </h3>

              <div className="space-y-4">
                {getRequestResponses(selectedRequest.id).map((response) => (
                  <div key={response.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {response.user?.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {response.user?.phone_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          response.response === 'موجود' || response.response === 'Disponible' ? 'text-green-600' :
                          response.response === 'غير موجود' || response.response === 'Indisponible' ? 'text-red-600' :
                          'text-orange-600'
                        }`}>
                          {response.response}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(response.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {getRequestResponses(selectedRequest.id).length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No responses yet
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsViewModalOpen(false)}
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

export default RequestsManager;