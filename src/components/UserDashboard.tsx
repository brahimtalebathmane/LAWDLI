import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, Request, Response } from '../lib/supabase';
import Layout from './Layout';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';

const UserDashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user, logout } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (user) {
      loadUserRequests();
      loadUserResponses();
      
      // Set up real-time subscriptions for requests and request_groups
      const requestsSubscription = supabase
        .channel('requests-realtime')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'requests'
        }, () => {
          console.log('New request detected, reloading...');
          loadUserRequests();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'request_groups'
        }, () => {
          console.log('New request group assignment detected, reloading...');
          loadUserRequests();
        })
        .on('postgres_changes', {
  const loadUserRequests = async () => {
    if (!user) return;

    try {
      // Get user's groups first
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (groupError) throw groupError;

      const groupIds = groupMemberships?.map(gm => gm.group_id) || [];

      if (groupIds.length === 0) {
        setRequests([]);
        return;
      }

      // Get requests for user's groups
      const { data: requestGroups, error: requestError } = await supabase
        .from('request_groups')
        .select(`
          request_id,
          requests(
            *,
            creator:users(full_name)
          )
        `)
        .in('group_id', groupIds);

      if (requestError) throw requestError;

      const uniqueRequests = requestGroups?.reduce((acc: Request[], rg: any) => {
        if (rg.requests && !acc.find(r => r.id === rg.requests.id)) {
          acc.push(rg.requests);
        }
        return acc;
      }, []) || [];

      setRequests(uniqueRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  };

  const loadUserResponses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error loading user responses:', error);
    }
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
      loadUserResponses();

    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Error sending response');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPushNotificationToAdmin = async (request: Request, responseChoice: string) => {
    try {
      // Get all admin users
      const { data: admins, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin');

      if (error) throw error;

      const adminIds = admins?.map(admin => admin.id) || [];

      if (adminIds.length > 0) {
        const title = t('push.new_response.title');
        const bodyTemplate = t('push.new_response.body');
        
        const body = bodyTemplate
          .replace('{{full_name}}', user?.full_name || 'User')
          .replace('{{choice}}', responseChoice);

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

        if (!response.ok) {
          console.error('Failed to send push notification to admin');
        }
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

        {/* Requests List */}
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
      </div>
    </Layout>
  );
};

export default UserDashboard;