# Reschedule Booking Flow - Complete Simulation

## Overview
This document explains what happens when a user reschedules a booking from the calendar page.

---

## Step-by-Step Flow

### **STEP 1: User Initiates Reschedule** (Frontend - Calendar Page)

1. **User clicks on a booking event** in the calendar (`Calendar.vue`)
   - FullCalendar triggers `handleEventClick()` 
   - Sets `selectedBooking.value = event.extendedProps`
   - Opens `BookingDetailsModal`

2. **User clicks "Reschedule" button** in `BookingDetailsModal.vue`
   - Checks `canReschedule` computed property:
     - Booking status must be "scheduled" or "confirmed"
     - User must be either the tutor OR student for this booking
   - Sets `showRescheduleModal.value = true`
   - Opens `RescheduleModal` component

---

### **STEP 2: User Fills Reschedule Form** (Frontend - RescheduleModal)

3. **RescheduleModal loads** with current booking details:
   - Shows current booking time/date
   - User enters:
     - **New Date** (date picker)
     - **New Start Time** (time picker)
     - **New End Time** (time picker)
     - **New Location** (optional, with Google Maps autocomplete)
     - **Reason** (required text field)

4. **Real-time credit calculation**:
   - Loads tutor's hourly rate from `/api/profiles/tutor/{tutorId}`
   - Calculates current session credits: `hourlyRate × currentDurationHours`
   - Calculates proposed session credits: `hourlyRate × newDurationHours`
   - Shows difference: `+$X more credits needed` or `-$X fewer credits needed`
   - Updates UI in real-time as user changes time

5. **Credit validation** (if user is a student):
   - Checks if student has sufficient credits for longer sessions
   - Shows error modal if insufficient credits
   - Prevents submission if credits insufficient

---

### **STEP 3: User Submits Reschedule Request** (Frontend)

6. **`handleSubmit()` function** in `RescheduleModal.vue`:
   ```javascript
   // Validation
   - Checks if all required fields are filled
   - Validates time range (end > start)
   - If student: validates credits using creditService

   // Payload creation
   const payload = {
     start_time: newStartDateTime.toISOString(),  // e.g., "2025-10-31T05:00:00Z"
     end_time: newEndDateTime.toISOString(),      // e.g., "2025-10-31T05:30:00Z"
     reschedule_reason: reason.value,             // e.g., "Test"
     new_location: newLocation.value || null      // e.g., "Woodlands MRT Station" or null
   }

   // API call
   POST /api/calendar/bookings/{bookingId}/reschedule
   Headers: {
     Authorization: "Bearer {jwt_token}",
     Content-Type: "application/json"
   }
   Body: payload
   ```

7. **Response handling**:
   - If successful: Shows success toast, emits `"rescheduled"` event
   - If failed: Shows error toast, keeps modal open

---

### **STEP 4: Backend Processes Reschedule Request** (Calendar Service)

8. **Endpoint**: `POST /bookings/:id/reschedule` in `services/calendar/src/index.js`

9. **Authentication & Authorization**:
   ```javascript
   verifyToken middleware extracts: req.user.userId
   - Verifies JWT token
   - Sets req.user = { userId, email, userType }
   
   // Permission check
   - Fetches booking from database
   - Verifies: booking.tutor_id === userId OR booking.student_id === userId
   - Returns 403 if user not involved in booking
   ```

10. **Validation**:
    ```javascript
    - Checks if reschedule_status === 'pending'
    - Returns 400 if already pending (prevents duplicate requests)
    
    // Determines requester type
    const requesterType = booking.tutor_id === req.user.userId ? 't imported' : 'student';
    // Example: If tutor clicked reschedule, requesterType = 'tutor'
    ```

11. **Database Update** (Supabase):
    ```javascript
    Updates booking record with:
    {
      pending_reschedule_start_time: start_time,        // NEW proposed time
      pending_reschedule_end_time: end_time,            // NEW proposed end time
      reschedule_requested_by: req.user.userId,         // WHO requested (tutor or student ID)
      reschedule_requester_type: requesterType,         // 'tutor' or 'student'
      reschedule_reason: reschedule_reason,             // User's reason
      reschedule_status: 'pending',                     // Request status
      reschedule_requested_at: new Date().toISOString(), // Timestamp
      reschedule_responded_at: null,                    // Will be set when accepted/rejected
      reschedule_response_message: null,                // Will be set when accepted/rejected
      pending_reschedule_location: new_location || null  // NEW location if provided
    }
    
    // Original booking times (start_time, end_time) remain UNCHANGED
    // They only change AFTER the other party accepts
    ```

12. **Response**: Returns `{ data: updatedBooking, message: 'Reschedule request sent successfully' }`

---

### **STEP 5: Notification System** (Calendar Service → Messaging Service)

13. **Find/Create Conversation**:
    ```javascript
    // Looks for existing conversation between tutor and student
    Query: conversations table
    WHERE (participant1_id = tutor_id AND participant2_id = student_id)
       OR (participant1_id = student_id AND participant2_id = tutor_id)
    
    // If no conversation exists:
    Creates new conversation:
    {
      participant1_id: booking.tutor_id,
      participant2_id: booking.student_id,
      booking_id: booking.id,
      created_at: timestamp
    }
    ```

14. **Create Reschedule Request Message**:
    ```javascript
    Message content (JSON stringified):
    {
      bookingId: "uuid-123",
      currentStartTime: "2025-10-30T05:30:00Z",      // ORIGINAL booking time
      currentEndTime: "2025-10-30T06:30:00Z",
      proposedStartTime: "2025-10-31T05:00:00Z",    // NEW proposed time
      proposedEndTime: "2025-10-31T05:30:00Z",
      reason: "Test",
      requesterType: "student",                      // Who requested the reschedule
      subject: "Tutoring Session",
      currentLocation: "Woodlands MRT Station",
      proposedLocation: "No location change"         // or new location if provided
    }
    
    Message type: 'reschedule_request'
    Sender ID: req.user.userId (the requester)
    ```

15. **Send via Messaging Service**:
    ```javascript
    POST {MESSAGING_SERVICE_URL}/messaging/system-message
    Headers: {
      Authorization: "Bearer {authToken}",
      Content-Type: "application/json"
    }
    Body: {
      conversationId: "conversation-uuid",
      content: JSON.stringify(messageData),
      messageType: "reschedule_request"
    }
    ```

16. **Messaging Service Processing** (`services/messaging/src/index.js`):
    ```javascript
    // Creates message in database
    INSERT INTO messages:
    {
      conversation_id: conversationId,
      sender_id: req.user.userId,        // The requester
      content: messageContent,            // JSON string with booking details
      message_type: 'reschedule_request',
      created_at: timestamp
    }
    
    // Broadcasts via Socket.IO
    io.to(`conversation_${conversationId}`).emit('new_message', message);
    
    // Updates conversation
    UPDATE conversations SET:
      last_message_at: timestamp
      last_message_content: 'Reschedule request sent'
    ```

---

### **STEP 6: Real-Time Notification** (Frontend - Socket.IO)

17. **Socket.IO Event Received**:
    - Both tutor's and student's clients receive `'new_message'` event
    - Event contains the reschedule request message

18. **Notification Logic** (in `App.vue` and `Messages.vue`):
    ```javascript
    // Checks if user should see notification
    const isSender = String(message.sender_id) === String(currentUserId);
    const isRescheduleMessage = message.message_type === 'reschedule_request';
    
    // Only show notification to RECEIVER (not the requester)
    const shouldShowNotification = !isSender;
    
    // Result:
    - Requester (who sent reschedule): NO notification popup
    - Recipient (other party): NO notification popup (popups disabled)
    - BOTH: Navbar notification badge updates (if implemented)
    ```

19. **Messages Page Update** (if user is on `/messages`):
    - If viewing the conversation: Message appears immediately
    - If NOT viewing conversation: Conversation list updates with new message preview
    - Unread count increments

20. **Navbar Notification Badge** (if implemented):
    - Unread count badge on bell icon updates
    - Dropdown shows new message preview

---

### **STEP 7: Recipient Sees Reschedule Request**

21. **Calendar View**:
    - Booking shows "Reschedule Request Pending" alert
    - User can click "View Request" to open `RescheduleRequestModal`

22. **Messages View** (`Messages.vue`):
    - Reschedule request appears as special message card
    - Shows:
      - Current time vs proposed time
      - Current location vs proposed location
      - Reason
      - Credits comparison
    - **Actions for RECIPIENT**:
      - "Accept" button → Calls `/api/calendar/bookings/{id}/reschedule/accept`
      - "Decline" button → Calls `/api/calendar/bookings/{id}/reschedule/reject`
      - "View in Calendar" button
    - **Actions for REQUESTER**:
      - "Awaiting response" status
      - "View in Calendar" button

---

### **STEP 8: Recipient Accepts/Rejects**

23. **If Accepted** (`/reschedule/accept` endpoint):
    ```javascript
    // Updates booking
    {
      start_time: pending_reschedule_start_time,    // NEW time becomes ACTUAL time
      end_time: pending_reschedule_end_time,
      location: pending_reschedule_location || location,  // NEW location if provided
      reschedule_status: 'accepted',
      reschedule_responded_at: timestamp,
      reschedule_response_message: response_message,
      // Clears pending fields
      pending_reschedule_start_time: null,
      pending_reschedule_end_time: null,
      pending_reschedule_location: null
    }
    
    // Credit transaction (if student accepted):
    - If new session costs MORE: Deducts difference from student
    - If new session costs LESS: Refunds difference to student
    - Updates tutor's earnings accordingly
    
    // Sends notification to requester
    - Creates 'reschedule_accepted' message
    - Broadcasts via Socket.IO
    ```

24. **If Rejected** (`/reschedule/reject` endpoint):
    ```javascript
    // Updates booking
    {
      reschedule_status: 'rejected',
      reschedule_responded_at: timestamp,
      reschedule_response_message: response_message,
      // Clears pending fields
      pending_reschedule_start_time: null,
      pending_reschedule_end_time: null,
      pending_reschedule_location: null
    }
    
    // Original booking times remain UNCHANGED
    
    // Sends notification to requester
    - Creates 'reschedule_rejected' message
    - Broadcasts via Socket.IO
    ```

---

### **STEP 9: Calendar Updates**

25. **Frontend Refresh**:
    - `BookingDetailsModal` emits `"updated"` event
    - `Calendar.vue` calls `handleBookingUpdated()`
    - Fetches fresh booking data from `/api/calendar`
    - Updates FullCalendar events
    - Calendar view refreshes to show new booking time (if accepted)

---

## Data Flow Summary

```
CLIENT ACTION                    BACKEND PROCESSING              DATABASE CHANGES
─────────────────────────────────────────────────────────────────────────────────────
User clicks Reschedule  →        Opens RescheduleModal          None
                                  (Frontend validation)
                                  
User submits form       →        POST /reschedule               Booking updated:
                                 - Verify permissions           - pending_* fields set
                                 - Check for duplicates         - reschedule_status='pending'
                                 - Update booking               - reschedule_requested_by set
                                                                
                                 → Find/Create conversation      Conversation created (if new)
                                 
                                 → POST to messaging service     Message created:
                                 - Create reschedule_request     - message_type='reschedule_request'
                                 - Broadcast Socket.IO           - content=JSON details
                                 
Socket.IO broadcast     →        Recipient receives event        None (already in DB)
                                 
                                 → Updates Navbar/Messages UI    None
                                 
Recipient clicks Accept →        POST /reschedule/accept         Booking updated:
                                 - Update booking times         - start_time=NEW time
                                 - Process credits              - end_time=NEW time
                                 - Send acceptance msg          - reschedule_status='accepted'
                                 - Clear pending fields         - pending_* = null
                                 
Socket.IO broadcast     →        Requester receives event        None (already in DB)
                                 
Calendar refreshes      →        GET /calendar                   None
                                  - Fetches updated bookings
                                  - Updates FullCalendar
```

---

## Key Points

1. **State Management**:
   - Original booking times remain unchanged until acceptance
   - Pending times stored in `pending_reschedule_*` fields
   - `reschedule_status` tracks: `null` → `'pending'` → `'accepted'` or `'rejected'`

2. **Notifications**:
   - **Toast popups**: DISABLED (user requested)
   - **Navbar badge**: Should update (if notifications loaded)
   - **Messages page**: Conversation updates in real-time via Socket.IO
   - **Calendar**: Shows "Reschedule Request Pending" alert

3. **Credit Handling**:
   - Students validated BEFORE sending request
   - Credit transaction happens ONLY when recipient ACCEPTS
   - If new session costs more → student pays difference
   - If new session costs less → student gets refund

4. **Conversation Creation**:
   - Conversation created automatically if doesn't exist
   - Linked to booking via `booking_id`
   - Used for all booking-related messages (reschedule, cancel, etc.)

5. **Error Scenarios**:
   - Already pending request → 400 error
   - User not involved → 403 error
   - Conversation creation fails → Request still succeeds, but no message sent
   - Message sending fails → Request succeeds, but recipient won't be notified

---

## Current Issues

Based on user report: "After clicking re-schedule, there's still no new messages sent and no notification"

**Possible causes**:
1. Conversation lookup/creation failing silently
2. `sendMessageViaMessagingService` returning false
3. Socket.IO broadcast not reaching recipients
4. Navbar notification system not loading the message

**Debug steps**:
- Check backend logs for conversation creation errors
- Check if `sendMessageViaMessagingService` succeeds
- Verify Socket.IO connection in browser console
- Check if message appears in database but not in UI

