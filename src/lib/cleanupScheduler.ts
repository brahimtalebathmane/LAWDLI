// Automatic cleanup scheduler for client-side initialization
// This runs in the browser to schedule cleanup operations

let cleanupInterval: NodeJS.Timeout | null = null;
let isCleanupRunning = false;

export const initializeCleanupScheduler = () => {
  console.log('Cleanup now handled automatically by Supabase - no client-side scheduling needed');
};

export const stopCleanupScheduler = () => {
  console.log('Cleanup handled by Supabase - no client-side cleanup to stop');
};

// Export for manual cleanup if needed
export const runManualCleanup = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-old-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('Manual cleanup result:', result);
    return result;
  } catch (error) {
    console.error('Manual cleanup error:', error);
    throw error;
  }
};