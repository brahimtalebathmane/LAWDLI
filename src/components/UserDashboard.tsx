import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Request, Response } from '../lib/supabase';
import { useRealtimeData } from '../hooks/useRealtimeData';
import Layout from './Layout';
import RefreshButton from './RefreshButton';
import LoadingSpinner from './LoadingSpinner';
import { MessageSquare, Clock, CheckCircle, LogOut } from 'lucide-react';

const UserDashboard: React.FC = () => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user, logout } = useAuth();
  const { t, language } = useLanguage();

  // Get user's group IDs for filtering requests
  useEffect(() => {
    if (user) {
      loadUserGroups();
    }
  }, [user]);

  const loadUserGroups = async () => {
    if (!user) return;

    try {
      const { data: groupMemberships, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserGroupIds(groupMemberships?.map(gm => gm.group_id) || []);
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  };

  // Use real-time data hook for requests
  const {
    data: requestGroups,
    isLoading: requestsLoading,
    isRefreshing: requestsRefreshing,
    refresh: refreshRequests,
    lastUpdated: requestsLastUpdated
  } = useRealtimeData({
    table: 'request_groups',
    select: `
      request_id,
      requests(
        *,
        creator:users(full_name)
      )
    `,
    filter: userGroupIds.length > 0 ? { group_id: userGroupIds } : {},
    cacheKey: `user-requests-${user?.id}`,
    cacheDuration: 15000, // 15 seconds
    enableRealtime: true
  });

  // Process requests from request_groups data
  const requests = React.useMemo(() => {
    if (!requestGroups) return [];
    
    const uniqueRequests = requestGroups.reduce((acc: Request[], rg: any) => {
      if (rg.requests && !acc.find(r => r.id === rg.requests.id)) {
        acc.push(rg.requests);
      }
      return acc;
    }, []);

    return uniqueRequests.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [requestGroups]);

  // Use real-time data hook for user responses
  const {
    data: responsesData,
    isRefreshing: responsesRefreshing,
    refresh: refreshResponses
  } = useRealtimeData({
    table: 'responses',
    filter: { user_id: user?.id },
    cacheKey: `user-responses-${user?.id}`,
    cacheDuration: 10000, // 10 seconds
    enableRealtime: true
  });

  useEffect(() => {
    setResponses(responsesData || []);
  }, [responsesData]);

  // Manual refresh all data
  const refreshAllData = () => {
    refreshRequests();
    refreshResponses();
    loadUserGroups();
  };

  const respondToRequest = async (requestId: string, response: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if user already responded
      const existingResponse = responses.find(r => r.request_id === requestId);
      if (existingResponse) {
        alert('You have already responded to this request');
        return;
      }

      // Create response
      const { error: responseError } = await supabase
        .from('responses')
        .insert({
          request_id: requestId,
          user_id: user.id,
          response: response
        });

      if (responseError) throw responseError;

      // Send notification to admin
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.created_by,
            title: 'New Response',
            message: `${user.full_name} responded "${response}" to "${request.title}"`,
            link: `/admin/requests/${requestId}`
          });
        
        // Send push notification to admin
        await sendPushNotificationToAdmin(request, response);
      }

      // Reload data
      refreshResponses();
      refreshRequests();

    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Error sending response');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPushNotificationToAdmin = async (request: Request, responseChoice: string) => {
    try {
      console.log('Sending push notification to admin for response:', responseChoice);
      
      // Get all admin users
      const { data: admins, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const adminIds = admins?.map(admin => admin.id) || [];
      console.log('Admin IDs for notification:', adminIds);

      if (adminIds.length > 0) {
        const title = t('push.new_response.title');
        const bodyTemplate = t('push.new_response.body');
        
        const body = bodyTemplate
          .replace('{{full_name}}', user?.full_name || 'User')
          .replace('{{choice}}', responseChoice);

        console.log('Sending admin notification:', { title, body, adminIds });

        // Call push notification edge function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userIds: adminIds,
            title,
            body,
            data: {
              request_id: request.id,
              user_id: user?.id,
              deepLink: `/admin/requests/${request.id}`
            }
          })
        });

        const result = await response.json();
        console.log('Admin notification response:', result);
        
        if (!response.ok) {
          console.error('Failed to send push notification to admin:', result);
        } else {
          console.log('Admin notification sent successfully:', result);
        }
      } else {
        console.log('No admin users found for notification');
      }
    } catch (error) {
      console.error('Error sending push notification to admin:', error);
    }
  };

  const getResponseButtons = (requestId: string) => {
    const userResponse = responses.find(r => r.request_id === requestId);
    
    if (userResponse) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Responded: {userResponse.response}</span>
        </div>
      );
    }

    const responseOptions = language === 'ar' 
      ? ['موجود', 'غير موجود', 'بديل']
      : ['Disponible', 'Indisponible', 'Alternative'];

    const responseColors = ['bg-green-600', 'bg-red-600', 'bg-orange-600'];

    return (
      <div className="flex gap-2 flex-wrap">
        {responseOptions.map((option, index) => (
          <button
            key={option}
            onClick={() => respondToRequest(requestId, option)}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 transform hover:scale-105 ${responseColors[index]}`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {t('welcome')}, {user?.full_name}
              </h1>
              <p className="text-gray-600">
                {requests.length} active requests available
              </p>
              {requestsLastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('lastUpdated')}: {requestsLastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton
                onRefresh={refreshAllData}
                isRefreshing={requestsRefreshing || responsesRefreshing}
                size="md"
                variant="ghost"
              />
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
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
          <div className="space-y-6">
            {requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No requests available
              </h3>
              <p className="text-gray-600">
                You will see new requests here when they are sent to your groups.
              </p>
            </div>
            ) : (
            requests.map((request) => (
              <div 
                key={request.id} 
                className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {request.title}
                    </h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {request.description}
                    </p>
                    
                    {request.image_url && (
                      <div className="mb-4">
                        <img 
                          src={request.image_url} 
                          alt={request.title}
                          className="rounded-lg shadow-sm max-w-sm w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>By: {request.creator?.full_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      {getResponseButtons(request.id)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;