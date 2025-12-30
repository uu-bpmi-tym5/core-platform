# Notifications Dropdown - Implementation

## Overview
Added a notifications dropdown to the navbar that displays all user notifications next to the profile link. The dropdown shows real-time notifications with badge counter for unread items.

## Features Implemented

### Notification Dropdown Component
✅ Bell icon with unread count badge  
✅ Dropdown menu with list of notifications  
✅ Real-time polling (updates every 30 seconds)  
✅ Mark notifications as read  
✅ Delete notifications  
✅ Click notification to navigate to action URL  
✅ Color-coded by notification type  
✅ Time ago formatting  
✅ Scrollable list (max 400px height)  
✅ Mobile responsive  

### Features

1. **Visual Indicators**
   - Unread count badge on bell icon
   - Blue dot for unread notifications
   - Color-coded notification titles:
     - Success: Green
     - Warning: Amber
     - Error: Red
     - Info: Blue

2. **Interactions**
   - Click notification to navigate to action URL
   - Hover to show action buttons (mark as read, delete)
   - Automatic mark as read when clicking notification
   - Delete notifications
   - Auto-refresh every 30 seconds

3. **Responsive Design**
   - Desktop: Bell icon in navbar
   - Mobile: Included in mobile menu

## Files Created

### Frontend Components
- `apps/frontend/src/components/notifications-dropdown.tsx` - Main notification dropdown
- `apps/frontend/src/components/ui/dropdown-menu.tsx` - Dropdown menu primitive
- `apps/frontend/src/components/ui/scroll-area.tsx` - Scroll area primitive

### Files Modified
- `apps/frontend/src/components/navigation.tsx` - Added notifications to navbar
- `apps/frontend/src/lib/graphql.ts` - Added notification types and functions

## GraphQL Functions Added

```typescript
// Get all notifications for current user
getMyNotifications(token: string)

// Get unread notifications only
getMyUnreadNotifications(token: string)

// Get notification count (total and unread)
getNotificationCount(token: string)

// Mark notification as read
markNotificationAsRead(token: string, notificationId: string)

// Delete notification
deleteNotification(token: string, id: string)
```

## Notification Types

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  status: 'unread' | 'read' | 'archived';
  userId: string;
  actionUrl?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  readAt?: string | null;
}
```

## UI/UX Features

### Desktop View
- Bell icon in navbar between nav links and profile
- Badge shows unread count (9+ if more than 9)
- Dropdown opens on click
- 400px max height with scrolling

### Mobile View
- Notifications section in mobile menu
- Bell icon with badge
- Same dropdown functionality

### Notification Item
- Title with color based on type
- Message (max 2 lines, truncated)
- Time ago (e.g., "5m ago", "2h ago", "3d ago")
- External link icon if has action URL
- Unread indicator (blue dot)
- Hover actions:
  - Check icon (mark as read) - only for unread
  - Trash icon (delete)

## Behavior

### Auto-Refresh
Notifications automatically refresh every 30 seconds while the dropdown is mounted.

### Mark as Read
- Manual: Click check icon on unread notification
- Automatic: Click notification body to navigate

### Navigation
If notification has an `actionUrl`, clicking it will:
1. Mark as read (if unread)
2. Close dropdown
3. Navigate to the URL

### Empty State
Shows bell icon with message "No notifications yet" when no notifications exist.

## Integration with Existing Features

The notification dropdown integrates seamlessly with:
- Survey creation notifications
- Campaign status change notifications  
- Contribution notifications
- Any other notification sent via NotificationsClient

## Backend Requirements

The backend already has the necessary GraphQL queries and mutations:
- ✅ `getMyNotifications` - Get all notifications
- ✅ `getMyUnreadNotifications` - Get unread only
- ✅ `getNotificationCount` - Get counts
- ✅ `markNotificationAsRead` - Mark as read
- ✅ `deleteNotification` - Delete notification

## Testing

### Test Scenarios
1. **View Notifications**
   - Log in
   - Check bell icon shows unread count
   - Click bell to open dropdown
   - Verify notifications display correctly

2. **Mark as Read**
   - Click check icon on unread notification
   - Verify badge count decreases
   - Verify blue dot disappears

3. **Delete Notification**
   - Click trash icon
   - Verify notification removed
   - Verify count updates

4. **Navigate via Notification**
   - Click notification with action URL
   - Verify navigates to correct page
   - Verify marked as read

5. **Auto-Refresh**
   - Keep dropdown open
   - Create notification (e.g., via survey)
   - Wait 30 seconds
   - Verify new notification appears

6. **Mobile View**
   - Open on mobile device
   - Check mobile menu
   - Verify notifications section visible
   - Test dropdown functionality

## Styling

Uses Tailwind CSS and shadcn/ui design system for consistency with the rest of the app:
- Border radius: `rounded-md`
- Colors: Uses theme colors (primary, muted, destructive)
- Spacing: Consistent padding and gaps
- Typography: Text sizes and weights match app

## Performance

- **Polling**: 30-second intervals (not too aggressive)
- **Scroll Area**: Virtualized scrolling for many notifications
- **Badge Update**: Only updates when count changes
- **Memoization**: Uses React.useCallback for loadNotifications

## Dependencies

Required npm packages (should already be installed):
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-scroll-area`
- `lucide-react` (for icons)

If missing, install:
```bash
npm install @radix-ui/react-dropdown-menu @radix-ui/react-scroll-area
```

## Future Enhancements (Optional)

- [ ] Real-time updates via WebSocket/Pusher
- [ ] Filter by notification type
- [ ] Notification preferences/settings
- [ ] Batch actions (mark all as read)
- [ ] Archive functionality
- [ ] Sound/desktop notifications
- [ ] Search/filter notifications
- [ ] Notification categories

---

**Status:** ✅ COMPLETE
**Location:** Navbar (next to Profile link)
**Mobile:** Included in mobile menu

