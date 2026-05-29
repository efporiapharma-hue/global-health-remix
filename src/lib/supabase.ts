import { createClient } from '@supabase/supabase-js';

const supabaseUrl = localStorage.getItem('hms_supabase_url') || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = localStorage.getItem('hms_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. Persistent database features will be disabled. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, or configure them in Settings > Database Setup.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Setup dynamic real-time synchronization between devices (mobile, desktop, multiple tabs)
const SYNC_CHANNEL_NAME = 'hospital-db-sync';

// Initialize a shared broadcast channel
export const syncChannel = supabase.channel(SYNC_CHANNEL_NAME);

// Function to notify other devices/tabs of a data mutation
export function broadcastDataMutation(table: string, action: 'insert' | 'update' | 'delete' | 'sync') {
  try {
    syncChannel.send({
      type: 'broadcast',
      event: 'data-changed',
      payload: { table, action, senderId: window.name || 'device-' + Math.random().toString(36).substring(2, 11), timestamp: Date.now() }
    });
    // Trigger a local storage/custom event so the originating device updates immediately too
    window.dispatchEvent(new CustomEvent('supabase-data-sync', { detail: { table, action, local: true } }));
  } catch (err) {
    console.warn('Failed to broadcast sync mutation:', err);
  }
}

// Subscribe to real-time client-to-client sync signals
syncChannel
  .on('broadcast', { event: 'data-changed' }, (payload) => {
    console.log('Realtime broadcast synchronization signal received:', payload);
    // Notify React components locally
    window.dispatchEvent(new CustomEvent('supabase-data-sync', { detail: payload }));
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to client-to-client real-time synchronization channel.');
    }
  });

// Also attempt to listen to real-time Postgres DB Changes directly from Supabase (server-authoritative backup)
supabase
  .channel('postgres-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    console.log('Realtime DB event received from Postgres:', payload);
    window.dispatchEvent(new CustomEvent('supabase-data-sync', { detail: payload }));
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to Postgres database real-time replication changes.');
    }
  });
