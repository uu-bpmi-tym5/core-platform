# Days Left Feature - Implementation

## Issue
The campaign detail page was showing "0 days left" as a hardcoded placeholder instead of calculating the actual days remaining until the campaign ends.

## Root Cause
The Campaign entity didn't have an `endDate` field to track when campaigns should end.

## Solution

### Backend Changes

#### 1. Added `endDate` Field to Campaign Entity
**File:** `apps/backend/src/campaigns/entities/campaign.entity.ts`

```typescript
@Column({ type: 'timestamp', nullable: true })
@Field(() => Date, { nullable: true, description: 'Campaign end date' })
endDate?: Date;
```

#### 2. Updated DTOs
**File:** `apps/backend/src/campaigns/dto/create-campaign.input.ts`

```typescript
@Field(() => Date, { nullable: true })
endDate?: Date;
```

The `UpdateCampaignInput` automatically inherits this field since it extends `CreateCampaignInput`.

#### 3. Created Database Migration
**File:** `apps/backend/src/campaigns/migrations/1735577400000-AddEndDateToCampaign.ts`

Adds the `endDate` column to the `campaign` table.

### Frontend Changes

#### 1. Updated Campaign Interface
**File:** `apps/frontend/src/lib/graphql.ts`

```typescript
export interface Campaign {
  // ...existing fields
  endDate?: string | null;
  // ...existing fields
}
```

#### 2. Updated GraphQL Query
**File:** `apps/frontend/src/lib/graphql.ts`

Added `endDate` to the `getCampaignById` query:

```typescript
query GetCampaignById($id: String!) {
  campaign(id: $id) {
    // ...existing fields
    endDate
    // ...existing fields
  }
}
```

#### 3. Added Days Calculation Logic
**File:** `apps/frontend/src/app/campaigns/[id]/page.tsx`

```typescript
const calculateDaysLeft = (endDate?: string | null): number | null => {
  if (!endDate) return null;
  
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};
```

#### 4. Updated Display
**File:** `apps/frontend/src/app/campaigns/[id]/page.tsx`

```typescript
<span>
  {(() => {
    const daysLeft = calculateDaysLeft(campaign.endDate);
    if (daysLeft === null) return 'No deadline';
    if (daysLeft === 0) return 'Ended';
    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
  })()}
</span>
```

## Behavior

The display now shows:
- **"X days left"** - When campaign has an end date in the future
- **"1 day left"** - Proper singular form when only one day remains
- **"Ended"** - When the end date has passed
- **"No deadline"** - When no end date is set (endDate is null)

## Database Migration

The migration will automatically run when the backend starts (if `synchronize: true`), or can be run manually:

```bash
# Tables will auto-sync on backend restart
# Or run migrations manually if needed
```

## Usage

### Creating a Campaign with End Date

Campaign owners can now set an end date when creating or editing a campaign:

```typescript
// Frontend - when creating/editing campaign
{
  name: "My Campaign",
  description: "...",
  goal: 10000,
  category: "Technology",
  endDate: "2025-12-31T23:59:59Z" // ISO 8601 format
}
```

### Example Scenarios

1. **Campaign ending in 30 days:** Shows "30 days left"
2. **Campaign ending today:** Shows "1 day left" or "Ended" depending on time
3. **Campaign with no end date:** Shows "No deadline"
4. **Campaign past end date:** Shows "Ended"

## Files Modified

### Backend
- `apps/backend/src/campaigns/entities/campaign.entity.ts` - Added endDate field
- `apps/backend/src/campaigns/dto/create-campaign.input.ts` - Added endDate input
- `apps/backend/src/campaigns/migrations/1735577400000-AddEndDateToCampaign.ts` - New migration

### Frontend
- `apps/frontend/src/lib/graphql.ts` - Added endDate to interface and query
- `apps/frontend/src/app/campaigns/[id]/page.tsx` - Added calculation and display logic

## Testing

1. Create a campaign with an end date (e.g., 30 days from now)
2. Visit the campaign page
3. Verify "30 days left" (or appropriate number) is displayed
4. Set end date to tomorrow - verify shows "1 day left"
5. Set end date to past - verify shows "Ended"
6. Leave end date empty - verify shows "No deadline"

## Next Steps

- Campaign owners can set end date when creating campaigns
- End date can be edited in campaign settings
- Days left automatically updates based on current time
- No manual calculation needed

---

**Status:** ✅ IMPLEMENTED
**Impact:** Campaigns now display accurate countdown to end date
**Note:** Restart backend server for migration to take effect

