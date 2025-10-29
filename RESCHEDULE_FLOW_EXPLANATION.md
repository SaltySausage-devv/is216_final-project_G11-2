# Reschedule Booking Flow - Complete Explanation

## Overview
When a user reschedules a booking from the calendar page, here's what happens step-by-step:

---

## Step 1: User Initiates Reschedule (Frontend - Calendar Page)

**Location:** `frontend/src/components/calendar/RescheduleModal.vue`

1. User clicks "Reschedule" button on a booking in the calendar
2. `RescheduleModal` component opens
3. User fills in:
   - New Date
   - New Start Time
   - New End Time
   - New Location (optional)
   - Reason for Rescheduling

---

## Step 2: Frontend Validation & Submission

**Location:** `frontend/src/components/calendar/RescheduleModal.vue` → `handleSubmit()` function

### Validation Checks:
- ✅ Form validation (`isValidForm` computed property)
- ✅ Time range validation (end time must be after start time)
- ✅ If user is a **student**: Credit validation using `creditService.validateRescheduleCredits()`
  - Calculates credit difference between current and proposed session
  - Checks if student has sufficient credits if new session costs more
  - Shows error modal if insufficient credits

### API Call:
```javascript
POST /api/calendar/bookings/:bookingId/reschedule
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: {
  start_time: "2025-10-31T21:00:00.000Z",
  end_time: "2025-10-31T21:30:00.000Z",
  reschedule_reason: "Test",
  new_location: "Woodlands MRT" (optional)
}
```

---

## Step 3: Backend Processing (Calendar Service)

**Location:** `services/calendar/src/index.js` → `POST /bookings/:id/reschedule`

### What Happens:
1. **Authentication**: Verifies JWT token using `verifyToken` middleware
2. **Authorization**: Checks if user is either the tutor OR student for this booking
3. **Duplicate Check**: Ensures no pending reschedule request already exists
4. **Determine Requester**: Identifies if requester is tutor or student

### Database Update:
```sql
UPDATE bookings SET
  pending_reschedule_start_time = '2025-10-31T21:00:00.000Z',
  pending_reschedule_end_time = '2025-10-31T21:30:00.000Z',
  reschedule_requested_by = 'd9e621ab-d0d8-46f3-86a4-8eb55c434be8',
  reschedule_requester_type = 'student', -- or 'tutor'
  reschedule_reason = 'Test',
  reschedule_status = 'pending',
  reschedule_requested_at = '2025-10-30T21:29:00.000Z',
  pending_reschedule_location = 'Woodlands MRT' (if provided)
WHERE id = :bookingId
```

---

## Step 4: Create/Find Conversation

**Location:** `services/calendar/src/index.js` (in reschedule endpoint)

### Conversation Lookup:
```javascript
// Search for existing conversation between tutor and student
SELECT id FROM conversations
WHERE (participant1_id = tutor_id AND participant2_id = student_id)
   OR (participant1_id = student_id AND participant2_id = tutor_id)
LIMIT 1
```

### If No Conversation Exists:
```javascript
// Create new conversation
INSERT INTO conversations (
  participant1_id,  // tutor_id
  participant2_id,  // student_id
  booking_id,
  created_at
) VALUES (...)
```

---

## Step 5: Create Reschedule Request Message

**Location:** `services/calendar/src/index.js` → `sendMessageViaMessagingService()`

### Message Content:
```json
{
  "bookingId": "259aa8a0-4214-4d41-9faa-e478d0dc37bb",
  "currentStartTime": "2025-10-30T20:30:00.000Z",
  "currentEndTime": "2025-10-30T21:30:00.000Z",
  "proposedStartTime": "2025-10-31T21:00:00.000Z",
  "proposedEndTime": "2025-10-31T21:30:00.000Z",
  "reason": "Test",
  "requesterType": "student",
  "subject": "Math Tutoring",
  "currentLocation": "Woodlands MRT Station",
  "proposedLocation": "Woodlands MRT" (if provided)
}
```

### Message Creation API Call:
```
POST https://messaging-service/messaging/system-message
Headers: {
  Authorization: Bearer <authToken>
}
Body: {
  conversationId: "d464d1f8-cdaf-48b9-b461-231c7964a11d",
  content: <JSON stringified messageData above>,
  messageType: "reschedule_request"
}
```

---

## Step 6: Messaging Service Processes Message

**Location:** `services/messaging/src/index.js` → `POST /messaging/system-message`

### Database Insert:
```sql
INSERT INTO messages (
  conversation_id,
  sender_id,           -- ID of user who initiated reschedule
  content,             -- JSON string of messageData
  message_type,        -- 'reschedule_request'
  created_at
) VALUES (...)
```

### Socket.IO Broadcast:
```javascript
// Broadcast to all users in the conversation room
io.to(`conversation_${conversationId}`).emit('new_message', message);
```

### Conversation Update:
```sql
UPDATE conversations SET
  last_message_at = NOW(),
  last_message_content = 'Reschedule request sent'
WHERE id = conversationId
```

---

## Step 7: Frontend Receives Message via Socket.IO

**Location:** `frontend/src/pages/Messages.vue` → `messageHandlers.newMessage()`

### Socket.IO Handler:
1. Receives `new_message` event with message data
2. Checks if message is for current conversation
3. Validates message data (has ID, has content for non-image messages)
4. Checks for duplicates (prevents processing same message twice)

### For Reschedule Request Messages:
- **If viewing the conversation**: Message is added to `messages.value` array
- **If NOT viewing the conversation**: 
  - Notification badge count updates (via Navbar notification system)
  - Message appears in conversation list with preview text

---

## Step 8: UI Updates

### In Messages Page:
**Location:** `frontend/src/pages/Messages.vue` template

1. **Message Display**:
   - Shows as a "Reschedule Request" card with booking details
   - Displays current time vs proposed new time
   - Shows location comparison
   - Shows reason

2. **Action Buttons** (for recipient only):
   - **Accept** button → Calls `handleAcceptReschedule()`
   - **Decline** button → Calls `handleRejectReschedule()`
   - **View in Calendar** button → Navigates to calendar page

3. **For Sender**:
   - Shows "Awaiting response" status
   - View in Calendar button

### In Calendar Page:
**Location:** `frontend/src/pages/Calendar.vue`

- Booking card shows reschedule status badge
- Clicking booking shows "Reschedule Request Pending" alert
- "View Request" button opens `RescheduleRequestModal`

### In Navbar:
**Location:** `frontend/src/components/Navbar.vue`

- Notification badge count increases
- Dropdown shows "Reschedule booking request" notification
- Clicking notification navigates to messages page with conversation open

---

## Step 9: Recipient Responds (Accept/Reject)

### If Accepting:
**Location:** `frontend/src/pages/Messages.vue` → `handleAcceptReschedule()`

1. API Call:
   ```
   POST /api/calendar/bookings/:bookingId/reschedule/accept
   Body: { response_message: "Accepted via messages" }
   ```

2. Backend Processing (`services/calendar/src/index.js`):
   - Updates booking:
     ```sql
     UPDATE bookings SET
       start_time = pending_reschedule_start_time,
       end_time = pending_reschedule_end_time,
       location = pending_reschedule_location (if provided),
       reschedule_status = 'accepted',
       reschedule_responded_at = NOW(),
       reschedule_response_message = 'Accepted via messages',
       pending_reschedule_start_time = NULL,
       pending_reschedule_end_time = NULL,
       pending_reschedule_location = NULL
     WHERE id = :bookingId
     ```
   - **Credit Transaction** (if student accepts):
     - Calculates credit difference
     - If new session costs more: Deducts extra credits from student
     - If new session costs less: Refunds credits to student
   - Creates `reschedule_accepted` message
   - Broadcasts via Socket.IO

### If Rejecting:
**Location:** `frontend/src/pages/Messages.vue` → `handleRejectReschedule()`

1. API Call:
   ```
   POST /api/calendar/bookings/:bookingId/reschedule/reject
   Body: { response_message: "Declined" }
   ```

2. Backend Processing:
   - Updates booking:
     ```sql
     UPDATE bookings SET
       reschedule_status = 'rejected',
       reschedule_responded_at = NOW(),
       reschedule_response_message = 'Declined',
       pending_reschedule_start_time = NULL,
       pending_reschedule_end_time = NULL,
       pending_reschedule_location = NULL
     WHERE id = :bookingId
     ```
   - **Original booking times remain unchanged**
   - Creates `reschedule_rejected` message
   - Broadcasts via Socket.IO

---

## Step 10: Response Message Received

When recipient accepts/rejects:

1. **Message Creation**: Backend creates `reschedule_accepted` or `reschedule_rejected` message
2. **Socket.IO Broadcast**: All conversation participants receive the message
3. **UI Updates**:
   - Message appears in conversation
   - Requester sees status update (accepted/rejected)
   - Calendar refreshes to show updated booking times (if accepted)
   - Notification appears in navbar for requester

---

## Key Points:

### 🔑 Notification Flow:
- **Reschedule request message**: Only RECEIVER gets notification badge
- **Reschedule response message**: Only REQUESTER gets notification badge
- Uses `String()` conversion for UUID comparison to prevent type mismatches

### 🔑 Credit Handling:
- **Tutors**: Can reschedule without credit validation
- **Students**: Credit validation happens:
  - On reschedule request (frontend check)
  - On accept (backend validation + transaction)

### 🔑 Message Types:
- `reschedule_request` - Initial request
- `reschedule_accepted` - Request accepted
- `reschedule_rejected` - Request declined

### 🔑 Socket.IO Rooms:
- Messages broadcast to `conversation_${conversationId}` room
- All participants in conversation receive messages in real-time
- Prevents duplicate processing with `processedNotifications` Set

---

## Current Issues:

1. **No notification for reschedule request** - The Socket.IO broadcast happens, but recipient may not receive notification if:
   - Conversation doesn't exist (creation might fail silently)
   - Messaging service call fails
   - Socket.IO connection not established for recipient

2. **Message creation may fail** if:
   - `conversationId` is null/undefined (conversation creation fails)
   - `authToken` is missing
   - Messaging service is down

