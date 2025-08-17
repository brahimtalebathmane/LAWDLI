import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Image URL helper function
export const getOptimizedImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return '';
  
  try {
    // Handle Supabase storage URLs
    if (url.includes('supabase') && url.includes('/storage/v1/object/public/')) {
      const urlObj = new URL(url);
      if (width) urlObj.searchParams.set('width', width.toString());
      if (height) urlObj.searchParams.set('height', height.toString());
      urlObj.searchParams.set('quality', '85');
      urlObj.searchParams.set('format', 'webp');
      return urlObj.toString();
    }
    
    // Handle relative URLs
    if (url.startsWith('/') && !url.startsWith('//')) {
      return `${window.location.origin}${url}`;
    }
    
    return url;
  } catch (error) {
    console.warn('Error optimizing image URL:', error);
    return url;
  }
};

// Database types
export interface User {
  id: string;
  full_name: string;
  phone_number: string;
  pin_code: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  creator?: User;
  groups?: Group[];
}

export interface Response {
  id: string;
  request_id: string;
  user_id: string;
  response: string;
  created_at: string;
  user?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  group?: Group;
  user?: User;
}