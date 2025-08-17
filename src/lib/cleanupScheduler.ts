// Automatic cleanup scheduler for client-side initialization
// This runs in the browser to schedule cleanup operations

let cleanupInterval: NodeJS.Timeout | null = null;
let isCleanupRunning = false;

export const initializeCleanupScheduler = () => {
  // Only run cleanup scheduler for admin users
  const user = JSON.parse(localStorage.getItem('lawdli_user') || 'null');
  if (!user || user.role !== 'admin') {
    return;
  }

  // Clear any existing interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  console.log('Initializing automatic cleanup scheduler...');

  // Run cleanup immediately if it hasn't run in the last 24 hours
  const lastCleanup = localStorage.getItem('lawdli_last_cleanup');
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  if (!lastCleanup || (now - parseInt(lastCleanup)) > twentyFourHours) {
    // Run cleanup after a short delay to avoid blocking app startup
    setTimeout(() => {
      runCleanup();
    }, 5000); // 5 second delay
  }

  // Schedule cleanup to run every 24 hours
  cleanupInterval = setInterval(() => {
    runCleanup();
  }, twentyFourHours);

  console.log('Cleanup scheduler initialized - will run every 24 hours');
};

export const stopCleanupScheduler = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Cleanup scheduler stopped');
  }
};

const runCleanup = async () => {
  if (isCleanupRunning) {
    console.log('Cleanup already running, skipping...');
    return;
  }

  isCleanupRunning = true;
  console.log('Starting automatic cleanup process...');

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-old-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'automatic_scheduler',
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Automatic cleanup completed successfully:', result);
      
      // Update last cleanup timestamp
      localStorage.setItem('lawdli_last_cleanup', Date.now().toString());
      
      // Show subtle notification to admin (optional)
      if (result.totalDeleted > 0) {
        console.log(`Cleanup removed ${result.totalDeleted} old items (${result.deletedRequests} requests, ${result.deletedNotifications} notifications)`);
      }
    } else {
      console.error('Cleanup failed:', result);
    }

  } catch (error) {
    console.error('Error running automatic cleanup:', error);
  } finally {
    isCleanupRunning = false;
  }
};

// Export for manual cleanup if needed
export const runManualCleanup = () => {
  return runCleanup();
};