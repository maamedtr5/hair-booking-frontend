import { useEffect, useState } from 'react';

/**
 * Custom hook to fetch unread notifications count for a user.
 * @param userId number - the current user's ID
 * @returns number - unread notifications count
 */
export function useUnreadCount(userId: number) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If no userId, just leave count at 0
    if (!userId) return;

    let cancelled = false;

    async function fetchUnread() {
      try {
        // Replace with your actual API endpoint
        const res = await fetch(`/api/notifications/unread-count?userId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch unread count');
        const data = await res.json();

        if (!cancelled) {
          setCount(data.count ?? 0);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
        if (!cancelled) {
          setCount(0);
        }
      }
    }

    fetchUnread();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return count;
}
