<template>
  <div class="messages-page">
    <div class="container-fluid py-4 px-3 px-lg-5">
      <div class="row g-3 g-lg-4 messages-row">
        <!-- Conversations Sidebar -->
        <div class="col-12 col-lg-4 conversations-col" :class="{ 'hide-on-mobile': showMobileChat }">
          <div class="card border-0 shadow-sm w-100 d-flex flex-column">
            <div class="card-header bg-white border-bottom">
              <div class="d-flex align-items-center justify-content-between">
                <h5 class="fw-bold mb-0">
                  <i class="fas fa-comments me-2 text-primary"></i>
                  Messages
                </h5>
                <button
                  class="btn btn-primary btn-sm"
                  @click="startNewConversation"
                >
                  <i class="fas fa-plus me-1"></i>
                  New
                </button>
              </div>
            </div>
            <div class="card-body p-0 d-flex flex-column flex-grow-1">
              <!-- Search -->
              <div class="p-3 border-bottom">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    v-model="searchQuery"
                    class="form-control"
                    placeholder="Search conversations..."
                  />
                </div>
              </div>

              <!-- Conversations List -->
              <div class="conversations-list flex-grow-1 overflow-auto">
                <div
                  v-if="filteredConversations.length === 0"
                  class="text-center py-4"
                >
                  <i class="fas fa-inbox text-muted fs-1 mb-3"></i>
                  <p class="text-muted">No conversations yet</p>
                </div>
                <div v-else>
                  <div
                    v-for="(conversation, index) in filteredConversations"
                    :key="conversation.id"
                    class="conversation-item p-3 border-bottom cursor-pointer"
                    :class="{
                      active: selectedConversation?.id === conversation.id,
                    }"
                    @click="selectConversation(conversation)"
                  >
                    <div>
                      <div class="d-flex align-items-start">
                        <div
                          class="conversation-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3 spring-smooth"
                          style="width: 45px; height: 45px"
                        >
                          <i class="fas fa-user text-primary"></i>
                        </div>
                        <div class="flex-grow-1 d-flex flex-column">
                          <!-- Top row: Name and Time -->
                          <div
                            class="d-flex justify-content-between align-items-center"
                          >
                            <h6 class="fw-bold mb-0">
                              {{ conversation.participant.name }}
                            </h6>
                            <small class="text-muted">{{
                              formatTime(conversation.lastMessageAt)
                            }}</small>
                          </div>
                          <!-- Bottom row: Last Message and Unread Count -->
                          <div
                            class="d-flex justify-content-between align-items-center mt-1"
                          >
                            <div
                              class="d-flex align-items-center"
                              style="max-width: 70%"
                            >
                              <div
                                v-if="isImageMessage(conversation.lastMessage)"
                                class="d-flex align-items-center"
                              >
                                <img
                                  :src="conversation.lastMessage"
                                  alt="Image"
                                  style="
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 4px;
                                    margin-right: 6px;
                                    object-fit: cover;
                                  "
                                />
                                <span
                                  class="text-muted small"
                                  :class="{
                                    'fw-bold': conversation.unreadCount > 0,
                                  }"
                                  >Image</span
                                >
                              </div>
                              <p
                                v-else
                                class="text-muted mb-0 small text-truncate"
                                :class="{
                                  'fw-bold': conversation.unreadCount > 0,
                                }"
                              >
                                {{ conversation.lastMessage }}
                              </p>
                            </div>
                            <div
                              v-if="conversation.unreadCount > 0"
                              class="badge bg-danger rounded-pill"
                              style="font-size: 0.7rem"
                            >
                              {{ conversation.unreadCount }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="col-12 col-lg-8 chat-col" :class="{ 'show-on-mobile': showMobileChat }">
          <div
            :initial="{ opacity: 0, x: 30 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.6, delay: 0.1 }"
            class="card border-0 shadow-sm w-100 d-flex flex-column chat-card"
          >
            <!-- Chat Header -->
            <div
              class="card-header bg-white border-bottom"
              v-if="selectedConversation"
            >
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <!-- Back button for mobile -->
                  <button
                    class="btn btn-link text-decoration-none me-2 back-btn-mobile"
                    @click="backToConversations"
                  >
                    <i class="fas fa-arrow-left text-primary"></i>
                  </button>
                  <div
                    class="chat-avatar bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3"
                    style="width: 40px; height: 40px"
                  >
                    <i class="fas fa-user text-primary"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0">
                      {{ selectedConversation.participant.name }}
                    </h6>
                    <small class="text-muted">{{
                      selectedConversation.participant.type
                    }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div class="card-body p-0 d-flex flex-column flex-grow-1">
              <div
                v-if="!selectedConversation"
                class="d-flex align-items-center justify-content-center h-100"
              >
                <div class="text-center">
                  <i class="fas fa-comments text-muted fs-1 mb-3"></i>
                  <h5 class="text-muted">Select a conversation</h5>
                  <p class="text-muted">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </div>

              <div
                v-else
                class="messages-container flex-grow-1 p-3 overflow-auto"
              >
                <div v-if="messages.length === 0" class="text-center py-4">
                  <i class="fas fa-comment-dots text-muted fs-1 mb-3"></i>
                  <p class="text-muted">No messages yet</p>
                  <p class="text-muted small">
                    Start the conversation by sending a message
                  </p>
                </div>
                <div v-else>
                  <div
                    v-for="(message, index) in messages"
                    :key="message.id"
                    :initial="{ opacity: 0, y: 20 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :transition="{ duration: 0.4, delay: index * 0.05 }"
                    class="message-item mb-3"
                    :class="{
                      sent: message.senderId === currentUserId,
                      received: message.senderId !== currentUserId,
                    }"
                  >
                    <div
                      class="d-flex"
                      :class="{
                        'justify-content-end':
                          message.senderId === currentUserId,
                      }"
                    >
                      <div
                        class="message-bubble"
                        :class="{
                          sent: message.senderId === currentUserId,
                          received: message.senderId !== currentUserId,
                          'image-message-bubble':
                            message.messageType === 'image',
                        }"
                        :style="{
                          cursor:
                            message.senderId === currentUserId
                              ? 'context-menu'
                              : 'default',
                        }"
                        @contextmenu.prevent="
                          message.senderId === currentUserId
                            ? showMessageContextMenu($event, message)
                            : null
                        "
                      >
                        <!-- Booking Offer Message -->
                        <div
                          v-if="message.messageType === 'booking_offer'"
                          class="message-content booking-message booking-offer"
                        >
                          <div class="booking-header">
                            <i class="fas fa-calendar-plus me-2"></i>
                            <span class="booking-title">Booking Request</span>
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2">
                                <strong>Session Type:</strong>
                                {{
                                  getBookingData(message).isOnline
                                    ? "Online Session"
                                    : "On-site Session"
                                }}
                              </p>
                              <p
                                v-if="
                                  !getBookingData(message).isOnline &&
                                  getBookingData(message).tuteeLocation
                                "
                                class="mb-2"
                              >
                                <strong>Location:</strong>
                                {{ getBookingData(message).tuteeLocation }}
                              </p>
                              <p
                                v-if="getBookingData(message).notes"
                                class="mb-2"
                              >
                                <strong>Notes:</strong>
                                {{ getBookingData(message).notes }}
                              </p>
                            </div>
                            <div class="booking-actions">
                              <button
                                v-if="
                                  message.senderId !== currentUserId &&
                                  authStore.user?.user_type === 'tutor' &&
                                  getBookingStatusValue(message) === 'awaiting_response'
                                "
                                class="btn btn-primary btn-sm me-2"
                                @click="handleBookingOffer(message)"
                              >
                                <i class="fas fa-calendar-check me-1"></i>
                                View & Respond
                              </button>
                              <span
                                :class="['booking-status', getBookingStatusClass(message)]"
                              >
                                <i
                                  :class="['fas', getBookingStatusIcon(message), 'me-1']"
                                ></i>
                                {{ getBookingStatusText(message) }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Booking Proposal Message -->
                        <div
                          v-else-if="message.messageType === 'booking_proposal'"
                          class="message-content booking-message booking-proposal"
                        >
                          <div class="booking-header">
                            <i class="fas fa-calendar-check me-2"></i>
                            <span class="booking-title">Booking Proposal</span>
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2">
                                <strong>Proposed Time:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).proposedTime
                                  )
                                }}
                              </p>
                              <p
                                v-if="getBookingData(message).finalLocation"
                                class="mb-2"
                              >
                                <strong>Location:</strong>
                                {{ getBookingData(message).finalLocation }}
                              </p>
                            </div>
                            <div class="booking-actions">
                              <button
                                v-if="
                                  message.senderId !== currentUserId &&
                                  (authStore.user?.user_type === 'student' ||
                                    authStore.user?.user_type === 'parent') &&
                                  getBookingStatusValue(message) === 'pending_acceptance'
                                "
                                class="btn btn-success btn-sm me-2"
                                @click="confirmBooking(message)"
                              >
                                <i class="fas fa-check me-1"></i>
                                Accept & Book
                              </button>
                              <span
                                :class="['booking-status', getBookingStatusClass(message)]"
                              >
                                <i
                                  :class="['fas', getBookingStatusIcon(message), 'me-1']"
                                ></i>
                                {{ getBookingStatusText(message) }}
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Booking Confirmation Message -->
                        <div
                          v-else-if="
                            message.messageType === 'booking_confirmation'
                          "
                          class="message-content booking-message booking-confirmation"
                        >
                          <div class="booking-header">
                            <i class="fas fa-check-circle me-2"></i>
                            <span class="booking-title"
                              >Booking Confirmed!</span
                            >
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2">
                                <strong>Time:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).confirmedTime
                                  )
                                }}
                              </p>
                              <p
                                v-if="getBookingData(message).location"
                                class="mb-2"
                              >
                                <strong>Location:</strong>
                                {{ getBookingData(message).location }}
                              </p>
                              <p class="mb-0 text-success">
                                <i class="fas fa-check-circle me-1"></i>
                                Session has been booked and added to calendar
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Booking Rejection Message -->
                        <div
                          v-else-if="
                            message.messageType === 'booking_rejection'
                          "
                          class="message-content booking-message booking-rejection"
                        >
                          <div class="booking-header">
                            <i class="fas fa-times-circle me-2"></i>
                            <span class="booking-title"
                              >Booking Proposal Rejected</span
                            >
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2 text-danger">
                                <i class="fas fa-times-circle me-1"></i>
                                Booking proposal has been rejected
                              </p>
                              <p class="mb-2">
                                <strong>Proposed Time:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).proposedTime
                                  )
                                }}
                              </p>
                              <p
                                v-if="getBookingData(message).finalLocation"
                                class="mb-2"
                              >
                                <strong>Location:</strong>
                                {{ getBookingData(message).finalLocation }}
                              </p>
                              <p
                                v-if="getBookingData(message).rejectionReason"
                                class="mb-0"
                              >
                                <strong>Reason:</strong>
                                {{ getBookingData(message).rejectionReason }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- Reschedule Request Message -->
                        <div
                          v-else-if="
                            message.messageType === 'reschedule_request'
                          "
                          class="message-content booking-message reschedule-request"
                        >
                          <div class="booking-header">
                            <i class="fas fa-calendar-alt me-2"></i>
                            <span class="booking-title"
                              >Reschedule Request</span
                            >
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2">
                                <strong>Subject:</strong>
                                {{ getBookingData(message).subject }}
                              </p>
                              <p class="mb-2">
                                <strong>Current Time:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).currentStartTime
                                  )
                                }}
                                -
                                {{
                                  formatTime(
                                    getBookingData(message).currentEndTime
                                  )
                                }}
                              </p>
                              <p class="mb-2 text-primary">
                                <strong>Proposed New Time:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).proposedStartTime
                                  )
                                }}
                                -
                                {{
                                  formatTime(
                                    getBookingData(message).proposedEndTime
                                  )
                                }}
                              </p>
                              <p
                                v-if="getBookingData(message).reason"
                                class="mb-2"
                              >
                                <strong>Reason:</strong>
                                {{ getBookingData(message).reason }}
                              </p>
                            </div>
                            <div class="booking-actions">
                              <button
                                v-if="message.senderId !== currentUserId"
                                class="btn btn-primary btn-sm me-2"
                                @click="$router.push('/calendar')"
                              >
                                <i class="fas fa-calendar-check me-1"></i>
                                View in Calendar
                              </button>
                              <span v-else class="booking-status text-warning">
                                <i class="fas fa-clock me-1"></i>
                                Awaiting response
                              </span>
                            </div>
                          </div>
                        </div>

                        <!-- Reschedule Accepted Message -->
                        <div
                          v-else-if="
                            message.messageType === 'reschedule_accepted'
                          "
                          class="message-content booking-message reschedule-accepted"
                        >
                          <div class="booking-header">
                            <i class="fas fa-check-circle me-2"></i>
                            <span class="booking-title"
                              >Reschedule Accepted</span
                            >
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2 text-success">
                                <i class="fas fa-check-circle me-1"></i>
                                Your reschedule request has been accepted!
                              </p>
                              <p class="mb-2">
                                <strong>New Time:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).newStartTime
                                  )
                                }}
                                -
                                {{
                                  formatTime(getBookingData(message).newEndTime)
                                }}
                              </p>
                              <p
                                v-if="getBookingData(message).responseMessage"
                                class="mb-2"
                              >
                                <strong>Message:</strong>
                                {{ getBookingData(message).responseMessage }}
                              </p>
                            </div>
                            <div class="booking-actions">
                              <button
                                class="btn btn-outline-primary btn-sm"
                                @click="$router.push('/calendar')"
                              >
                                <i class="fas fa-calendar me-1"></i>
                                View Calendar
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Reschedule Rejected Message -->
                        <div
                          v-else-if="
                            message.messageType === 'reschedule_rejected'
                          "
                          class="message-content booking-message reschedule-rejected"
                        >
                          <div class="booking-header">
                            <i class="fas fa-times-circle me-2"></i>
                            <span class="booking-title"
                              >Reschedule Declined</span
                            >
                          </div>
                          <div class="booking-details">
                            <div v-if="getBookingData(message)">
                              <p class="mb-2 text-danger">
                                <i class="fas fa-times-circle me-1"></i>
                                Your reschedule request was declined
                              </p>
                              <p class="mb-2">
                                <strong>Original Time Remains:</strong>
                                {{
                                  formatDateTime(
                                    getBookingData(message).originalStartTime
                                  )
                                }}
                                -
                                {{
                                  formatTime(
                                    getBookingData(message).originalEndTime
                                  )
                                }}
                              </p>
                              <p
                                v-if="getBookingData(message).responseMessage"
                                class="mb-2"
                              >
                                <strong>Message:</strong>
                                {{ getBookingData(message).responseMessage }}
                              </p>
                            </div>
                            <div class="booking-actions">
                              <button
                                class="btn btn-primary btn-sm"
                                @click="$router.push('/calendar')"
                              >
                                <i class="fas fa-calendar me-1"></i>
                                View Calendar
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Regular Text Message -->
                        <div
                          v-else-if="message.messageType === 'text'"
                          class="message-content"
                        >
                          {{ message.content || "Empty message" }}
                        </div>
                        <div
                          v-else-if="message.messageType === 'image'"
                          class="message-content image-message"
                        >
                          <img
                            v-if="message.content"
                            :src="message.content"
                            :alt="message.fileName || 'Image'"
                            style="
                              max-width: 300px;
                              max-height: 300px;
                              border-radius: 8px;
                              cursor: pointer;
                            "
                            @click.stop="
                              handleImageClick(message.content, $event)
                            "
                          />
                          <div v-else class="text-muted">Loading image...</div>
                        </div>
                        <div
                          v-else-if="message.messageType === 'file'"
                          class="message-content"
                        >
                          <div class="d-flex align-items-center">
                            <i class="fas fa-file me-2"></i>
                            <span>{{ message.fileName }}</span>
                          </div>
                        </div>
                        <div class="message-footer">
                          <div class="message-time">
                            {{ formatTime(message.createdAt) }}
                          </div>
                          <div
                            class="message-status"
                            v-if="message.senderId === currentUserId"
                          >
                            <span
                              v-if="message.readAt"
                              class="status-read"
                              title="Read"
                              >✓✓</span
                            >
                            <span
                              v-else-if="message.deliveredAt"
                              class="status-delivered"
                              title="Delivered"
                              >✓✓</span
                            >
                            <span v-else class="status-sent" title="Sent"
                              >✓</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Message Input -->
              <div
                v-if="selectedConversation"
                class="message-input p-3 border-top"
              >
                <form @submit.prevent="sendMessage" class="d-flex gap-2">
                  <div class="flex-grow-1">
                    <input
                      type="text"
                      v-model="newMessage"
                      class="form-control"
                      placeholder="Type a message..."
                      :disabled="isLoading"
                    />
                  </div>
                  <!-- Hidden file input for images only -->
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="handleFileSelect"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="attachFile"
                    :disabled="isLoading"
                  >
                    <i class="fas fa-paperclip"></i>
                  </button>

                  <!-- Booking Offer Button (only for tutees/parents talking to tutors) -->
                  <button
                    v-if="canBookSession"
                    type="button"
                    class="btn btn-outline-warning"
                    @click="showBookingOfferModal = true"
                    :disabled="isLoading"
                    title="Send Booking Request"
                  >
                    <i class="fas fa-calendar-plus"></i>
                  </button>

                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="!newMessage.trim() || isLoading"
                  >
                    <span v-if="isLoading" class="spinner me-1"></span>
                    <i v-else class="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Participant Selection Modal -->
    <div
      v-if="showParticipantSelection"
      class="modal-overlay"
      @click="showParticipantSelection = false"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            {{
              authStore.userType === "student"
                ? "Select a Tutor"
                : "Select a Student"
            }}
          </h3>
          <button @click="showParticipantSelection = false" class="close-btn">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <!-- Search input for participants -->
          <div class="participant-search">
            <input
              v-model="participantSearchQuery"
              type="text"
              :placeholder="`Search ${
                authStore.userType === 'student' ? 'tutors' : 'students'
              }...`"
              class="search-input"
            />
          </div>

          <div v-if="availableParticipants.length === 0" class="no-tutors">
            <p>
              No available
              {{ authStore.userType === "student" ? "tutors" : "students" }}
              found.
            </p>
          </div>
          <div v-else-if="filteredParticipants.length === 0" class="no-tutors">
            <p>
              No
              {{ authStore.userType === "student" ? "tutors" : "students" }}
              match your search.
            </p>
          </div>
          <div v-else class="tutor-list">
            <div
              v-for="participant in filteredParticipants"
              :key="participant.id"
              class="tutor-item"
              @click="createConversationWithParticipant(participant.id)"
            >
              <div class="tutor-info">
                <h4>
                  {{ participant.first_name }} {{ participant.last_name }}
                </h4>
                <p>{{ participant.email }}</p>
              </div>
              <div class="tutor-actions">
                <button class="btn btn-primary">Start Chat</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Message Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-exclamation-triangle text-warning me-2"></i>
            Delete Message
          </h3>
          <button @click="cancelDelete" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="mb-3 text-white">
            Are you sure you want to delete this message?
          </p>
          <div
            class="message-preview p-3 mb-3"
            style="
              background: rgba(255, 140, 66, 0.1);
              border: 1px solid var(--cyber-orange);
              border-radius: 8px;
            "
          >
            <div class="text-muted small mb-1">Message preview:</div>
            <div class="text-white">{{ messageToDelete?.content }}</div>
          </div>
          <div
            class="alert-warning p-3"
            style="
              background: rgba(255, 193, 7, 0.1);
              border: 1px solid #ffc107;
              border-radius: 8px;
              color: #ffc107;
            "
          >
            <i class="fas fa-info-circle me-2"></i>
            This action cannot be undone. The message will be removed for both
            you and the recipient.
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="cancelDelete"
          >
            <i class="fas fa-times me-2"></i>Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger"
            @click="confirmDelete"
            :disabled="isDeleting"
          >
            <i class="fas fa-trash me-2" v-if="!isDeleting"></i>
            <i class="fas fa-spinner fa-spin me-2" v-if="isDeleting"></i>
            {{ isDeleting ? "Deleting..." : "Delete Message" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Booking Offer Modal -->
    <div
      v-if="showBookingOfferModal"
      class="modal-overlay"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-calendar-plus me-2 text-primary"></i>
            Book a Session
          </h3>
          <button @click="showBookingOfferModal = false" class="close-btn">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createBookingOffer">
            <!-- Session Type -->
            <div class="mb-3">
              <label class="form-label fw-bold">Session Type</label>
              <div class="btn-group w-100" role="group">
                <input
                  type="radio"
                  class="btn-check"
                  name="sessionType"
                  id="online"
                  v-model="bookingOffer.isOnline"
                  :value="true"
                />
                <label class="btn btn-outline-primary" for="online">
                  <i class="fas fa-video me-2"></i>Online Session
                </label>
                <input
                  type="radio"
                  class="btn-check"
                  name="sessionType"
                  id="onsite"
                  v-model="bookingOffer.isOnline"
                  :value="false"
                />
                <label class="btn btn-outline-primary" for="onsite">
                  <i class="fas fa-map-marker-alt me-2"></i>On-site Session
                </label>
              </div>
            </div>

            <!-- Location (for on-site) -->
            <div v-if="!bookingOffer.isOnline" class="mb-3">
              <label class="form-label fw-bold">Preferred Location</label>
              <div class="position-relative">
                <input
                  type="text"
                  class="form-control location-autocomplete-input"
                  ref="tuteeLocationInput"
                  v-model="bookingOffer.tuteeLocation"
                  placeholder="Start typing an address in Singapore..."
                  required
                  @input="handleLocationInput('tutee', $event)"
                  @keydown="handleKeyDown('tutee', $event)"
                  @focus="handleInputFocus('tutee')"
                  @blur="handleInputBlur('tutee')"
                />
                <div
                  v-if="showDropdown.tutee && predictions.tutee.length > 0"
                  ref="tuteeDropdown"
                  class="custom-autocomplete-dropdown"
                >
                  <div
                    v-for="(prediction, index) in predictions.tutee"
                    :key="prediction.place_id"
                    class="autocomplete-item"
                    :class="{ 'active': selectedIndex.tutee === index }"
                    @mousedown.prevent="selectPrediction('tutee', prediction)"
                    @mouseenter="selectedIndex.tutee = index"
                  >
                    <div class="place-name">{{ prediction.structured_formatting.main_text }}</div>
                    <div class="place-address">{{ prediction.structured_formatting.secondary_text }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-3">
              <label class="form-label fw-bold">Additional Notes</label>
              <textarea
                class="form-control"
                v-model="bookingOffer.notes"
                rows="3"
                placeholder="Any specific requirements, preferred timings, or questions..."
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="showBookingOfferModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="createBookingOffer"
            :disabled="isCreatingBooking"
          >
            <span v-if="isCreatingBooking" class="spinner me-2"></span>
            <i class="fas fa-paper-plane me-2"></i>
            Send Booking Request
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar Modal -->
    <div
      v-if="showCalendarModal"
      class="modal-overlay"
    >
      <div class="modal-content calendar-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-calendar me-2 text-primary"></i>
            Availability Calendar
          </h3>
          <button @click="showCalendarModal = false" class="close-btn">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="calendar-container">
            <div class="calendar-header">
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="previousMonth"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              <h5 class="mb-0">{{ currentMonthYear }}</h5>
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="nextMonth"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                <div
                  v-for="day in [
                    'Sun',
                    'Mon',
                    'Tue',
                    'Wed',
                    'Thu',
                    'Fri',
                    'Sat',
                  ]"
                  :key="day"
                  class="calendar-weekday"
                >
                  {{ day }}
                </div>
              </div>
              <div class="calendar-days">
                <div
                  v-for="day in calendarDays"
                  :key="day.date"
                  class="calendar-day"
                  :class="{
                    'other-month': !day.currentMonth,
                    today: day.isToday,
                    'has-availability': day.hasAvailability,
                  }"
                  @click="selectDate(day)"
                >
                  {{ day.day }}
                </div>
              </div>
            </div>
            <div v-if="selectedDate" class="time-slots mt-3">
              <h6>Available Time Slots for {{ selectedDateFormatted }}</h6>
              <div class="time-slots-grid">
                <button
                  v-for="slot in timeSlots"
                  :key="slot.time"
                  class="btn btn-outline-primary btn-sm m-1"
                  :class="{ active: selectedTimeSlot === slot.time }"
                  @click="selectedTimeSlot = slot.time"
                  :disabled="!slot.available"
                >
                  {{ slot.time }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="showCalendarModal = false"
          >
            Close
          </button>
          <button
            v-if="canSendProposal"
            type="button"
            class="btn btn-primary"
            @click="sendBookingProposal"
            :disabled="!selectedTimeSlot || isSendingProposal"
          >
            <span v-if="isSendingProposal" class="spinner me-2"></span>
            <i class="fas fa-paper-plane me-2"></i>
            Send Proposal
          </button>
        </div>
      </div>
    </div>

    <!-- Booking Proposal Modal -->
    <div
      v-if="showBookingProposalModal"
      class="modal-overlay"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-calendar-check me-2 text-primary"></i>
            Respond to Booking Request
          </h3>
          <button @click="showBookingProposalModal = false" class="close-btn">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedBookingOffer" class="booking-request-summary mb-3">
            <div class="summary-header">
              <i class="fas fa-info-circle me-2"></i>
              <span>Student Request</span>
            </div>
            <div class="summary-content">
              <span class="summary-item">
                <i class="fas fa-laptop me-1"></i>
                {{
                  selectedBookingOffer.isOnline
                    ? "Online"
                    : "On-site"
                }}
              </span>
              <span v-if="selectedBookingOffer.tuteeLocation" class="summary-item">
                <i class="fas fa-map-marker-alt me-1"></i>
                {{ selectedBookingOffer.tuteeLocation }}
              </span>
              <span v-if="selectedBookingOffer.notes" class="summary-item notes-item">
                <i class="fas fa-sticky-note me-1"></i>
                {{ selectedBookingOffer.notes }}
              </span>
            </div>
          </div>

          <form @submit.prevent="createBookingProposal">
            <!-- Date & Time Selection -->
            <div class="mb-3">
              <label class="form-label fw-bold">Proposed Date & Time</label>
              <div class="row">
                <div class="col-md-6">
                  <input
                    type="date"
                    class="form-control"
                    v-model="bookingProposal.proposedDate"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <input
                    type="time"
                    class="form-control"
                    v-model="bookingProposal.proposedTime"
                    required
                  />
                </div>
              </div>
            </div>

            <!-- Duration Selection -->
            <div class="mb-3">
              <label class="form-label fw-bold">Session Duration</label>
              <div class="duration-buttons mb-2">
                <button
                  type="button"
                  class="btn btn-sm duration-btn"
                  :class="{ active: bookingProposal.duration === 30 }"
                  @click="bookingProposal.duration = 30; bookingProposal.customDuration = ''"
                >
                  30 min
                </button>
                <button
                  type="button"
                  class="btn btn-sm duration-btn"
                  :class="{ active: bookingProposal.duration === 60 }"
                  @click="bookingProposal.duration = 60; bookingProposal.customDuration = ''"
                >
                  60 min
                </button>
                <button
                  type="button"
                  class="btn btn-sm duration-btn"
                  :class="{ active: bookingProposal.duration === 90 }"
                  @click="bookingProposal.duration = 90; bookingProposal.customDuration = ''"
                >
                  90 min
                </button>
                <button
                  type="button"
                  class="btn btn-sm duration-btn"
                  :class="{ active: bookingProposal.duration === 120 }"
                  @click="bookingProposal.duration = 120; bookingProposal.customDuration = ''"
                >
                  120 min
                </button>
                <button
                  type="button"
                  class="btn btn-sm duration-btn"
                  :class="{ active: bookingProposal.customDuration !== '' }"
                  @click="bookingProposal.duration = 0; bookingProposal.customDuration = '60'"
                >
                  Custom
                </button>
              </div>
              <div v-if="bookingProposal.customDuration !== ''" class="mt-2">
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control"
                    v-model.number="bookingProposal.customDuration"
                    placeholder="Enter duration"
                    min="15"
                    max="480"
                    step="15"
                  />
                  <span class="input-group-text">minutes</span>
                </div>
                <small class="text-muted">Min: 15 minutes, Max: 480 minutes (8 hours)</small>
              </div>
              <div v-if="bookingProposal.proposedDate && bookingProposal.proposedTime" class="mt-2">
                <small class="text-muted">
                  <i class="fas fa-clock me-1"></i>
                  End time: {{ calculateEndTime() }}
                </small>
              </div>
            </div>

            <!-- Location Choice -->
            <div v-if="!selectedBookingOffer.isOnline" class="mb-3">
              <label class="form-label fw-bold">Session Location</label>
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="radio"
                  name="locationChoice"
                  id="useTuteeLocation"
                  v-model="bookingProposal.locationChoice"
                  value="tutee"
                />
                <label class="form-check-label" for="useTuteeLocation">
                  Use tutee's suggested location:
                  {{ selectedBookingOffer.tuteeLocation }}
                </label>
              </div>
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="radio"
                  name="locationChoice"
                  id="useTutorLocation"
                  v-model="bookingProposal.locationChoice"
                  value="tutor"
                />
                <label class="form-check-label" for="useTutorLocation">
                  Use my location
                </label>
              </div>
              <div
                v-if="bookingProposal.locationChoice === 'tutor'"
                class="mt-2 position-relative"
              >
                <input
                  type="text"
                  class="form-control location-autocomplete-input"
                  ref="tutorLocationInput"
                  v-model="bookingProposal.tutorLocation"
                  placeholder="Start typing an address in Singapore..."
                  @input="handleLocationInput('tutor', $event)"
                  @keydown="handleKeyDown('tutor', $event)"
                  @focus="handleInputFocus('tutor')"
                  @blur="handleInputBlur('tutor')"
                />
                <div
                  v-if="showDropdown.tutor && predictions.tutor.length > 0"
                  ref="tutorDropdown"
                  class="custom-autocomplete-dropdown"
                >
                  <div
                    v-for="(prediction, index) in predictions.tutor"
                    :key="prediction.place_id"
                    class="autocomplete-item"
                    :class="{ 'active': selectedIndex.tutor === index }"
                    @mousedown.prevent="selectPrediction('tutor', prediction)"
                    @mouseenter="selectedIndex.tutor = index"
                  >
                    <div class="place-name">{{ prediction.structured_formatting.main_text }}</div>
                    <div class="place-address">{{ prediction.structured_formatting.secondary_text }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Notes -->
            <div class="mb-3">
              <label class="form-label fw-bold"
                >Additional Notes (Optional)</label
              >
              <textarea
                class="form-control"
                v-model="bookingProposal.notes"
                rows="2"
                placeholder="Any additional information for the tutee..."
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary me-2"
            @click="showBookingProposalModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="createBookingProposal"
            :disabled="isCreatingProposal"
          >
            <span v-if="isCreatingProposal" class="spinner me-2"></span>
            <i class="fas fa-paper-plane me-2"></i>
            Send Proposal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import messagingService from "../services/messaging.js";
import { useNotifications } from "../composables/useNotifications";
import axios from "axios";

export default {
  name: "Messages",
  setup() {
    const authStore = useAuthStore();
    const { showMessageNotification } = useNotifications();

    const currentUserId = computed(() => authStore.user?.id);
    const searchQuery = ref("");
    const selectedConversation = ref(null);
    const conversations = ref([]);
    const messages = ref([]);
    const newMessage = ref("");
    const isLoading = ref(false);
    const showMobileChat = ref(false); // Toggle for mobile view

    // Delete modal variables
    const showDeleteModal = ref(false);
    const messageToDelete = ref(null);
    const isDeleting = ref(false);

    // Booking variables
    const showBookingOfferModal = ref(false);
    const showCalendarModal = ref(false);
    const showBookingProposalModal = ref(false);
    const isCreatingBooking = ref(false);
    const isCreatingProposal = ref(false);
    const isSendingProposal = ref(false);
    const selectedBookingOffer = ref(null);
    const confirmedBookings = ref(new Set()); // Track confirmed booking IDs
    const bookingOfferStatuses = ref(new Map()); // Track booking proposal statuses

    // Booking offer form data
    const bookingOffer = ref({
      isOnline: true,
      tuteeLocation: "",
      notes: "",
    });

    // Booking proposal form data
    const bookingProposal = ref({
      proposedDate: "",
      proposedTime: "",
      duration: 60, // Default to 60 minutes
      customDuration: "",
      locationChoice: "tutee",
      tutorLocation: "",
      notes: "",
    });

    // Calendar variables
    const currentMonth = ref(new Date().getMonth());
    const currentYear = ref(new Date().getFullYear());
    const selectedDate = ref(null);
    const selectedTimeSlot = ref(null);

    const tuteeLocationInput = ref(null);
    const tutorLocationInput = ref(null);
    const tuteeDropdown = ref(null);
    const tutorDropdown = ref(null);

    const googleMaps = ref(null);
    const googleMapsReady = ref(false);
    const googleMapsError = ref(null);

    // Custom autocomplete state
    const predictions = ref({
      tutee: [],
      tutor: [],
    });
    const showDropdown = ref({
      tutee: false,
      tutor: false,
    });
    const selectedIndex = ref({
      tutee: -1,
      tutor: -1,
    });
    const autocompleteService = ref(null);
    const placesService = ref(null);
    let inputTimeout = null;

    watch(
      () => showBookingOfferModal.value,
      async (modalOpen) => {
        if (!modalOpen) {
          // Clear predictions and hide dropdown
          predictions.value.tutee = [];
          showDropdown.value.tutee = false;
          selectedIndex.value.tutee = -1;
        }
      }
    );

    watch(
      () => showBookingProposalModal.value,
      async (modalOpen) => {
        if (!modalOpen) {
          // Clear predictions and hide dropdown
          predictions.value.tutor = [];
          showDropdown.value.tutor = false;
          selectedIndex.value.tutor = -1;
        }
      }
    );

    watch(
      () => [bookingProposal.value.locationChoice, selectedBookingOffer.value?.isOnline],
      async ([locationChoice, isOnline]) => {
        if (showBookingProposalModal.value && locationChoice === "tutor" && isOnline === false) {
          await setupAutocomplete("tutor");
        }
      }
    );


    const ensureGoogleMapsLoaded = async () => {
      if (googleMapsReady.value) {
        return googleMaps.value;
      }

      if (googleMapsError.value) {
        return null;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn(
          "VITE_GOOGLE_MAPS_API_KEY is not set. Location autocomplete will fall back to manual input."
        );
        googleMapsError.value = new Error("Missing Google Maps API key");
        return null;
      }

      try {
        // Set the API key globally for the loader
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          // Remove any existing script tags to avoid conflicts
          const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
          if (existingScript) {
            existingScript.remove();
          }

          // Create callback function that will be called when Google Maps loads
          window.initGoogleMaps = () => {
            console.log('Google Maps loaded successfully');
          };

          // Load Google Maps with Places library
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
          script.async = true;
          script.defer = true;

          await new Promise((resolve, reject) => {
            script.onload = () => {
              // Wait a bit for the libraries to fully initialize
              setTimeout(() => {
                if (window.google && window.google.maps && window.google.maps.places) {
                  resolve();
                } else {
                  reject(new Error('Google Maps Places library failed to load'));
                }
              }, 100);
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        googleMaps.value = window.google;
        googleMapsReady.value = true;
        return googleMaps.value;
      } catch (error) {
        googleMapsError.value = error;
        console.error("Failed to load Google Maps:", error);
        return null;
      }
    };

    // Initialize Google Maps services
    const initializeGoogleServices = async () => {
      const google = await ensureGoogleMapsLoaded();
      if (!google) return false;

      if (!autocompleteService.value) {
        autocompleteService.value = new google.maps.places.AutocompleteService();
        console.log('✅ AutocompleteService initialized');
      }

      if (!placesService.value) {
        // PlacesService needs a DOM element, using a hidden div
        const div = document.createElement('div');
        placesService.value = new google.maps.places.PlacesService(div);
        console.log('✅ PlacesService initialized');
      }

      return true;
    };

    // Handle input changes and fetch predictions
    const handleLocationInput = async (type, event) => {
      const query = event.target.value;

      if (!query || query.length < 3) {
        predictions.value[type] = [];
        showDropdown.value[type] = false;
        return;
      }

      // Debounce the API calls
      clearTimeout(inputTimeout);
      inputTimeout = setTimeout(async () => {
        const initialized = await initializeGoogleServices();
        if (!initialized) return;

        const request = {
          input: query,
          componentRestrictions: { country: 'sg' },
        };

        autocompleteService.value.getPlacePredictions(request, (results, status) => {
          console.log(`📍 Predictions for ${type}:`, results, status);

          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            predictions.value[type] = results;
            showDropdown.value[type] = true;
            selectedIndex.value[type] = -1;
          } else {
            predictions.value[type] = [];
            showDropdown.value[type] = false;
          }
        });
      }, 300);
    };

    // Handle keyboard navigation
    const handleKeyDown = (type, event) => {
      if (!showDropdown.value[type] || predictions.value[type].length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          selectedIndex.value[type] = Math.min(
            selectedIndex.value[type] + 1,
            predictions.value[type].length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          selectedIndex.value[type] = Math.max(selectedIndex.value[type] - 1, -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex.value[type] >= 0) {
            selectPrediction(type, predictions.value[type][selectedIndex.value[type]]);
          }
          break;
        case 'Escape':
          showDropdown.value[type] = false;
          selectedIndex.value[type] = -1;
          break;
      }
    };

    // Select a prediction and get detailed place info
    const selectPrediction = async (type, prediction) => {
      console.log(`📍 Selected prediction for ${type}:`, prediction);

      const initialized = await initializeGoogleServices();
      if (!initialized) return;

      const request = {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'address_components', 'geometry'],
      };

      placesService.value.getDetails(request, (place, status) => {
        console.log(`📍 Place details for ${type}:`, place, status);

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let address = '';

          // Combine name with formatted address
          if (place.name && place.formatted_address) {
            if (place.formatted_address.includes(place.name)) {
              address = place.formatted_address;
            } else {
              address = `${place.name}, ${place.formatted_address}`;
            }
          } else if (place.formatted_address) {
            address = place.formatted_address;
          } else if (place.name) {
            address = place.name;
          }

          console.log(`📍 Final address for ${type}:`, address);

          // Update the input
          if (type === 'tutee') {
            bookingOffer.value.tuteeLocation = address;
          } else {
            bookingProposal.value.tutorLocation = address;
          }
        }

        // Hide dropdown
        showDropdown.value[type] = false;
        selectedIndex.value[type] = -1;
        predictions.value[type] = [];
      });
    };

    // Handle input focus
    const handleInputFocus = (type) => {
      const query = type === 'tutee'
        ? bookingOffer.value.tuteeLocation
        : bookingProposal.value.tutorLocation;

      if (query && query.length >= 3 && predictions.value[type].length > 0) {
        showDropdown.value[type] = true;
      }
    };

    // Handle input blur
    const handleInputBlur = (type) => {
      // Delay to allow click events on dropdown items
      setTimeout(() => {
        showDropdown.value[type] = false;
        selectedIndex.value[type] = -1;
      }, 200);
    };

    const filteredConversations = computed(() => {
      if (!searchQuery.value) return conversations.value;
      return conversations.value.filter((conv) =>
        conv.participant.name
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase())
      );
    });

    const filteredParticipants = computed(() => {
      if (!participantSearchQuery.value) return availableParticipants.value;
      return availableParticipants.value.filter(
        (participant) =>
          `${participant.first_name} ${participant.last_name}`
            .toLowerCase()
            .includes(participantSearchQuery.value.toLowerCase()) ||
          participant.email
            .toLowerCase()
            .includes(participantSearchQuery.value.toLowerCase())
      );
    });

    // Check if current user can book sessions (student/parent talking to tutor)
    const canBookSession = computed(() => {
      if (!selectedConversation.value || !authStore.user) return false;

      const currentUserType = authStore.user.user_type;
      const participantType = selectedConversation.value.participant.type;

      // Students and parents can book sessions with tutors
      return (
        (currentUserType === "student" || currentUserType === "parent") &&
        participantType === "tutor"
      );
    });

    // Calendar computed properties
    const currentMonthYear = computed(() => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${months[currentMonth.value]} ${currentYear.value}`;
    });

    const selectedDateFormatted = computed(() => {
      if (!selectedDate.value) return "";
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return selectedDate.value.toLocaleDateString(undefined, options);
    });

    const calendarDays = computed(() => {
      const firstDay = new Date(
        currentYear.value,
        currentMonth.value,
        1
      ).getDay();
      const daysInMonth = new Date(
        currentYear.value,
        currentMonth.value + 1,
        0
      ).getDate();
      const daysInPrevMonth = new Date(
        currentYear.value,
        currentMonth.value,
        0
      ).getDate();

      const days = [];
      const today = new Date();

      // Previous month days
      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({
          day: daysInPrevMonth - i,
          date: new Date(
            currentYear.value,
            currentMonth.value - 1,
            daysInPrevMonth - i
          ),
          currentMonth: false,
          isToday: false,
          hasAvailability: false,
        });
      }

      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear.value, currentMonth.value, day);
        days.push({
          day,
          date,
          currentMonth: true,
          isToday: date.toDateString() === today.toDateString(),
          hasAvailability: Math.random() > 0.3, // Simulate some availability
        });
      }

      // Next month days
      const remainingDays = 42 - days.length; // 6 weeks
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          day,
          date: new Date(currentYear.value, currentMonth.value + 1, day),
          currentMonth: false,
          isToday: false,
          hasAvailability: false,
        });
      }

      return days;
    });

    const timeSlots = computed(() => {
      const slots = [];
      for (let hour = 9; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
          slots.push({
            time,
            available: Math.random() > 0.4, // Simulate availability
          });
        }
      }
      return slots;
    });

    const canSendProposal = computed(() => {
      return (
        authStore.user?.user_type === "tutor" && selectedBookingOffer.value
      );
    });

    const formatTime = (dateString) => {
      if (!dateString) return "Just now";

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Just now";

      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return "Just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString();
    };

    const scrollToBottom = () => {
      const messagesContainer = document.querySelector(".messages-container");
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    };

    const isImageMessage = (messageContent) => {
      if (!messageContent) return false;
      // Check if it's a Supabase storage URL or any image URL
      return (
        messageContent.includes("supabase.co/storage") ||
        messageContent.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i)
      );
    };

    const loadConversations = async () => {
      try {
        isLoading.value = true;
        const response = await messagingService.getConversations();

        conversations.value = response.conversations.map((conv) => {
          // Determine the other participant
          const otherParticipant =
            conv.participant1_id === currentUserId.value
              ? conv.participant2
              : conv.participant1;

          return {
            id: conv.id,
            participant: {
              id: otherParticipant.id,
              name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
              type: otherParticipant.user_type,
            },
            lastMessage: conv.last_message_content || "No messages yet",
            lastMessageAt: conv.last_message_at || conv.created_at,
            unreadCount: conv.unreadCount || 0,
          };
        });
      } catch (error) {
        console.error("Error loading conversations:", error);
        conversations.value = [];

        // Handle different error types
        if (error.response?.status === 429) {
          alert("Too many requests. Please wait a moment and try again.");
        } else if (error.response?.status === 401) {
          alert("Authentication error. Please log in again.");
        } else {
          alert(
            "Failed to load conversations. Please refresh the page and try again."
          );
        }
      } finally {
        isLoading.value = false;
      }
    };

    const selectConversation = async (conversation) => {
      selectedConversation.value = conversation;
      showMobileChat.value = true; // Show chat on mobile
      await loadMessages(conversation.id);
    };

    const backToConversations = () => {
      showMobileChat.value = false;
      // Don't clear selectedConversation to maintain state
    };

    const loadMessages = async (conversationId) => {
      try {
        isLoading.value = true;
        const response = await messagingService.getMessages(conversationId);
        messages.value = response.messages.map((msg) => ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          messageType: msg.message_type,
          createdAt: msg.created_at,
          readAt: msg.read_at,
          deliveredAt: msg.delivered_at,
          sender: msg.sender
            ? {
                name: `${msg.sender.first_name} ${msg.sender.last_name}`,
                type: msg.sender.user_type,
              }
            : null,
        }));

        resetBookingStatusState();
        messages.value.forEach((msg) => {
          inferBookingStatusFromMessage(msg);
        });

        await nextTick();
        scrollToBottom();

        // Mark messages as read and update status
        await messagingService.markAsRead(conversationId);

        // Update message status in local state
        messages.value.forEach((msg) => {
          if (msg.senderId !== currentUserId.value && !msg.readAt) {
            msg.readAt = new Date().toISOString();
          }
        });

        // Clear unread count for this conversation
        const conversationIndex = conversations.value.findIndex(
          (conv) => conv.id === conversationId
        );
        if (conversationIndex !== -1) {
          conversations.value[conversationIndex].unreadCount = 0;
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        messages.value = [];
        resetBookingStatusState();
        alert("Failed to load messages. Please try again.");
      } finally {
        isLoading.value = false;
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedConversation.value) {
        return;
      }

      const messageContent = newMessage.value.trim();
      const conversationId = selectedConversation.value.id;

      console.log("Sending message to conversation:", conversationId);
      console.log("Selected conversation:", selectedConversation.value);

      isLoading.value = true;

      try {
        // Check if this is the first message in this conversation
        const isFirstMessage = messages.value.length === 0;

        // Add message to local state immediately for better UX
        const tempMessage = {
          id: `temp_${Date.now()}`,
          senderId: currentUserId.value,
          content: messageContent,
          messageType: "text",
          createdAt: new Date().toISOString(),
          sender: {
            name: `${authStore.user?.first_name} ${authStore.user?.last_name}`,
            type: authStore.user?.user_type,
          },
        };

        messages.value.push(tempMessage);
        await nextTick();
        scrollToBottom();

        // Update conversation in the list immediately
        const conversationIndex = conversations.value.findIndex(
          (conv) => conv.id === conversationId
        );
        console.log("Looking for conversation in list:", conversationId);
        console.log(
          "Current conversations:",
          conversations.value.map((c) => ({
            id: c.id,
            participant: c.participant.name,
          }))
        );
        console.log("Found conversation index:", conversationIndex);

        if (conversationIndex !== -1) {
          // Update existing conversation with proper reactivity
          const updatedConversations = [...conversations.value];
          const conversation = updatedConversations[conversationIndex];

          conversation.lastMessage = messageContent;
          conversation.lastMessageAt = new Date().toISOString();

          // Move to top of list
          updatedConversations.splice(conversationIndex, 1);
          updatedConversations.unshift(conversation);

          conversations.value = updatedConversations;

          // Force Vue to update the UI
          await nextTick();
        } else {
          // Add new conversation to the list (first message)
          console.log(
            "Conversation not found in list, adding new conversation"
          );
          const conversationToAdd = {
            id: selectedConversation.value.id,
            participant: selectedConversation.value.participant,
            lastMessage: messageContent,
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
          };

          console.log("Adding conversation to list:", conversationToAdd);

          // Create new array to trigger Vue reactivity
          const updatedConversations = [...conversations.value];
          updatedConversations.unshift(conversationToAdd);
          conversations.value = updatedConversations;

          console.log(
            "Updated conversations list:",
            conversations.value.length
          );

          // Force Vue to update the UI
          await nextTick();
        }

        // Clear input immediately
        newMessage.value = "";

        // Send message via Socket.io (real-time)
        messagingService.sendMessage(conversationId, messageContent, "text");
      } catch (error) {
        console.error("Send message error:", error);
        // Remove the temp message if sending failed
        messages.value = messages.value.filter(
          (msg) => msg.id !== `temp_${Date.now()}`
        );
        alert("Failed to send message. Please try again.");
      } finally {
        isLoading.value = false;
      }
    };

    const availableParticipants = ref([]);
    const showParticipantSelection = ref(false);
    const selectedParticipantId = ref(null);
    const participantSearchQuery = ref("");

    const loadAvailableParticipants = async () => {
      try {
        const response = await messagingService.getAvailableParticipants();
        availableParticipants.value = response.participants || [];
      } catch (error) {
        console.error("Error loading participants:", error);
        availableParticipants.value = [];
      }
    };

    const startNewConversation = async () => {
      try {
        // Clear search query
        participantSearchQuery.value = "";
        // Load available participants first
        await loadAvailableParticipants();
        showParticipantSelection.value = true;
      } catch (error) {
        console.error("Error loading participants:", error);
        alert("Failed to load available participants: " + error.message);
      }
    };

    const createConversationWithParticipant = async (participantId) => {
      try {
        showParticipantSelection.value = false;

        // First try to find existing conversation in current list
        const existingConversation = conversations.value.find(
          (conv) => conv.participant.id === participantId
        );

        if (existingConversation) {
          // Use existing conversation
          await selectConversationWithRoom(existingConversation);
          return;
        }

        // Create or get existing conversation via API
        console.log("Creating conversation with participant:", participantId);
        const response = await messagingService.createConversation(
          participantId
        );
        console.log("Conversation creation response:", response);

        // Check if it's an existing conversation or new one
        if (response.message === "Using existing conversation") {
          // Use the conversation directly from the backend response
          const backendConversation = response.conversation;

          // Determine the other participant
          const otherParticipant =
            backendConversation.participant1_id === currentUserId.value
              ? backendConversation.participant2
              : backendConversation.participant1;

          // Map it to the frontend format
          const mappedConversation = {
            id: backendConversation.id,
            participant: {
              id: otherParticipant.id,
              name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
              type: otherParticipant.user_type,
            },
            lastMessage:
              backendConversation.last_message_content || "No messages yet",
            lastMessageAt:
              backendConversation.last_message_at ||
              backendConversation.created_at,
            unreadCount: 0,
          };

          await selectConversationWithRoom(mappedConversation);
        } else {
          // New conversation created, but don't add to list until first message is sent
          const backendConversation = response.conversation;

          // Determine the other participant
          const otherParticipant =
            backendConversation.participant1_id === currentUserId.value
              ? backendConversation.participant2
              : backendConversation.participant1;

          // Map it to the frontend format
          const mappedConversation = {
            id: backendConversation.id,
            participant: {
              id: otherParticipant.id,
              name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
              type: otherParticipant.user_type,
            },
            lastMessage: "No messages yet",
            lastMessageAt: backendConversation.created_at,
            unreadCount: 0,
          };

          // DON'T add conversation to list yet - only add when first message is sent
          console.log(
            "Conversation created but NOT added to list yet:",
            mappedConversation.id
          );

          // Select the conversation immediately (this will show the chat interface)
          await selectConversationWithRoom(mappedConversation);

          // Join the new conversation room for real-time updates
          messagingService.joinConversation(mappedConversation.id);
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        alert("Failed to create conversation: " + error.message);
      }
    };

    const fileInput = ref(null);

    const attachFile = () => {
      // Trigger file input click
      if (fileInput.value) {
        fileInput.value.click();
      }
    };

    const handleFileSelect = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type - only images
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validImageTypes.includes(file.type)) {
        // Show themed error message
        showImageErrorModal();
        // Reset file input
        event.target.value = "";
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Maximum size is 5MB.");
        event.target.value = "";
        return;
      }

      // Upload the image
      await uploadImage(file);

      // Reset file input
      event.target.value = "";
    };

    const showImageErrorModal = () => {
      // Create themed modal overlay
      const modal = document.createElement("div");
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
      `;

      const modalContent = document.createElement("div");
      modalContent.style.cssText = `
        background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
        border: 2px solid #ff8c42;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(255, 140, 66, 0.3);
        text-align: center;
      `;

      modalContent.innerHTML = `
        <div style="color: #ff8c42; font-size: 48px; margin-bottom: 16px;">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 style="color: #ffffff; margin-bottom: 16px; font-weight: bold;">
          Only Images Allowed
        </h3>
        <p style="color: #cccccc; margin-bottom: 24px; line-height: 1.6;">
          Please upload an image file (JPEG, PNG, GIF, or WebP).<br>
          <strong>Videos are not supported.</strong>
        </p>
        <button id="closeModal" style="
          background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          Got It
        </button>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Add hover effect to button
      const closeButton = modalContent.querySelector("#closeModal");
      closeButton.addEventListener("mouseenter", () => {
        closeButton.style.transform = "scale(1.05)";
      });
      closeButton.addEventListener("mouseleave", () => {
        closeButton.style.transform = "scale(1)";
      });

      // Close modal on button click
      closeButton.addEventListener("click", () => {
        modal.remove();
      });

      // Close modal on overlay click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    };

    const uploadImage = async (file) => {
      if (!selectedConversation.value) return;

      console.log("Starting image upload:", {
        conversationId: selectedConversation.value.id,
        fileName: file.name,
        fileSize: file.size,
        hasToken: !!authStore.token,
      });

      isLoading.value = true;
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("messageType", "image");

        console.log(
          "Making upload request to:",
          `/api/messaging/conversations/${selectedConversation.value.id}/upload`
        );

        const response = await axios.post(
          `/api/messaging/conversations/${selectedConversation.value.id}/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log("Upload response:", response.data);

        if (response.data && response.data.data) {
          // Don't add the message here - it will be added via Socket.io
          console.log("✅ Upload successful, waiting for Socket.io message");

          // Scroll to bottom
          nextTick(() => {
            scrollToBottom();
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        console.error("Error details:", {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          },
        });

        if (error.response?.data?.message) {
          alert(error.response.data.message);
        } else if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          alert("Failed to upload image. Please try again.");
        }
      } finally {
        isLoading.value = false;
      }
    };

    const handleImageClick = (imageUrl, event) => {
      console.log("🖼️ handleImageClick called with:", imageUrl);
      console.log("🖼️ Event details:", event);

      // Call the fullscreen function
      openImageFullscreen(imageUrl, event);
    };

    const openImageFullscreen = (imageUrl, event) => {
      console.log("🖼️ openImageFullscreen called with:", imageUrl);
      console.log("🖼️ Event:", event);

      // Prevent any default behavior and stop propagation
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        console.log("🖼️ Event prevented and stopped");
      }

      // Validate image URL
      if (!imageUrl || typeof imageUrl !== "string") {
        console.error("❌ Invalid image URL:", imageUrl);
        alert("Invalid image URL");
        return;
      }

      console.log("✅ Image URL is valid, creating overlay...");

      // Create fullscreen overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        cursor: zoom-out;
      `;

      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.cssText = `
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      `;

      // Add error handling for image loading
      img.onerror = () => {
        console.error("❌ Failed to load image:", imageUrl);
        overlay.innerHTML = `
          <div style="color: white; text-align: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
            <h3>Failed to load image</h3>
            <p>URL: ${imageUrl}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 16px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
          </div>
        `;
      };

      img.onload = () => {
        console.log("✅ Image loaded successfully:", imageUrl);
      };

      console.log("🖼️ Setting image src and adding to DOM...");

      overlay.appendChild(img);
      document.body.appendChild(overlay);

      // Close on click
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });

      // Close on ESC key
      const closeOnEsc = (e) => {
        if (e.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", closeOnEsc);
        }
      };
      document.addEventListener("keydown", closeOnEsc);
    };

    // Message context menu
    const showMessageContextMenu = (event, message) => {
      // Remove any existing context menu
      const existingMenu = document.querySelector(".context-menu");
      if (existingMenu) {
        existingMenu.remove();
      }

      // Create context menu
      const contextMenu = document.createElement("div");
      contextMenu.className = "context-menu";
      contextMenu.style.cssText = `
        position: fixed;
        left: ${event.clientX}px;
        top: ${event.clientY}px;
        z-index: 9999;
        background: rgba(26, 26, 26, 0.95);
        border: 2px solid var(--cyber-orange);
        border-radius: 8px;
        padding: 8px 0;
        min-width: 150px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
      `;

      // Create delete option
      const deleteOption = document.createElement("div");
      deleteOption.className = "context-menu-item";
      deleteOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.2s;
      `;
      deleteOption.innerHTML = '<i class="fas fa-trash"></i> Delete Message';
      deleteOption.addEventListener("click", () => {
        deleteMessage(message.id);
        contextMenu.remove();
      });
      deleteOption.addEventListener("mouseenter", () => {
        deleteOption.style.backgroundColor = "rgba(255, 140, 66, 0.2)";
      });
      deleteOption.addEventListener("mouseleave", () => {
        deleteOption.style.backgroundColor = "transparent";
      });

      // Create copy option
      const copyOption = document.createElement("div");
      copyOption.className = "context-menu-item";
      copyOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.2s;
      `;
      copyOption.innerHTML = '<i class="fas fa-copy"></i> Copy Text';
      copyOption.addEventListener("click", () => {
        copyMessage(message.content);
        contextMenu.remove();
      });
      copyOption.addEventListener("mouseenter", () => {
        copyOption.style.backgroundColor = "rgba(255, 140, 66, 0.2)";
      });
      copyOption.addEventListener("mouseleave", () => {
        copyOption.style.backgroundColor = "transparent";
      });

      contextMenu.appendChild(deleteOption);
      contextMenu.appendChild(copyOption);

      // Add to DOM
      document.body.appendChild(contextMenu);

      // Remove on click outside
      const removeMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
          contextMenu.remove();
          document.removeEventListener("click", removeMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener("click", removeMenu);
      }, 100);
    };

    // Delete message function - shows modal instead of browser confirm
    const deleteMessage = (messageId) => {
      const message = messages.value.find((msg) => msg.id === messageId);
      if (message) {
        messageToDelete.value = message;
        showDeleteModal.value = true;
      }
    };

    // Confirm delete function
    const confirmDelete = async () => {
      if (!messageToDelete.value) return;

      isDeleting.value = true;
      try {
        await messagingService.deleteMessage(messageToDelete.value.id);
        // Remove from local state
        messages.value = messages.value.filter(
          (msg) => msg.id !== messageToDelete.value.id
        );
        // Close modal
        showDeleteModal.value = false;
        messageToDelete.value = null;
      } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message");
      } finally {
        isDeleting.value = false;
      }
    };

    // Cancel delete function
    const cancelDelete = () => {
      showDeleteModal.value = false;
      messageToDelete.value = null;
      isDeleting.value = false;
    };

    // Copy message function
    const copyMessage = (content) => {
      navigator.clipboard.writeText(content).then(() => {
        // Show brief feedback
        const toast = document.createElement("div");
        toast.textContent = "Message copied!";
        toast.className = "copy-toast";
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 2000);
      });
    };

    // Booking methods
    const createBookingOffer = async () => {
      if (!selectedConversation.value) return;

      isCreatingBooking.value = true;
      try {
        const response = await fetch("/api/messaging/booking-offers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            conversationId: selectedConversation.value.id,
            isOnline: bookingOffer.value.isOnline,
            tuteeLocation: bookingOffer.value.tuteeLocation,
            notes: bookingOffer.value.notes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create booking offer");
        }

        const data = await response.json();
        console.log("Booking offer created:", data);

        // Reset form and close modal
        bookingOffer.value = {
          isOnline: true,
          tuteeLocation: "",
          notes: "",
        };
        showBookingOfferModal.value = false;

        // Show success message
        alert("Booking request sent successfully!");
      } catch (error) {
        console.error("Error creating booking offer:", error);
        alert("Failed to send booking request. Please try again.");
      } finally {
        isCreatingBooking.value = false;
      }
    };

    const createBookingProposal = async () => {
      if (!selectedBookingOffer.value) return;

      // Validate required fields
      if (!bookingProposal.value.proposedDate) {
        alert("Please select a date for the booking");
        return;
      }
      if (!bookingProposal.value.proposedTime) {
        alert("Please select a time for the booking");
        return;
      }

      // Validate duration
      const effectiveDuration = bookingProposal.value.customDuration !== ''
        ? bookingProposal.value.customDuration
        : bookingProposal.value.duration;

      if (!effectiveDuration || effectiveDuration < 15) {
        alert("Please select a valid duration (minimum 15 minutes)");
        return;
      }

      isCreatingProposal.value = true;
      try {
        const proposedDateTime = new Date(
          `${bookingProposal.value.proposedDate}T${bookingProposal.value.proposedTime}`
        );

        // Check if the date is valid
        if (isNaN(proposedDateTime.getTime())) {
          throw new Error("Invalid date or time selected");
        }

        // Calculate end time
        const endDateTime = new Date(proposedDateTime.getTime() + effectiveDuration * 60000);

        let finalLocation = "";
        if (selectedBookingOffer.value.isOnline) {
          finalLocation = "Online Session";
        } else if (bookingProposal.value.locationChoice === "tutee") {
          finalLocation = selectedBookingOffer.value.tuteeLocation;
        } else {
          finalLocation = bookingProposal.value.tutorLocation;
          if (!finalLocation) {
            alert("Please enter a location for the session");
            isCreatingProposal.value = false;
            return;
          }
        }

        const response = await fetch("/api/messaging/booking-proposals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            bookingOfferId: selectedBookingOffer.value.id,
            proposedTime: proposedDateTime.toISOString(),
            proposedEndTime: endDateTime.toISOString(),
            duration: effectiveDuration,
            tutorLocation: bookingProposal.value.tutorLocation,
            finalLocation: finalLocation,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Backend error:", errorData);
          throw new Error(
            errorData.error || "Failed to create booking proposal"
          );
        }

        const data = await response.json();
        console.log("Booking proposal created:", data);

        // Reset form and close modal
        bookingProposal.value = {
          proposedDate: "",
          proposedTime: "",
          duration: 60,
          customDuration: "",
          locationChoice: "tutee",
          tutorLocation: "",
          notes: "",
        };
        showBookingProposalModal.value = false;
        selectedBookingOffer.value = null;

        // Show success message
        alert("Booking proposal sent successfully!");
      } catch (error) {
        console.error("Error creating booking proposal:", error);
        alert("Failed to send booking proposal. Please try again.");
      } finally {
        isCreatingProposal.value = false;
      }
    };

    // Calendar methods
    const previousMonth = () => {
      if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
      } else {
        currentMonth.value--;
      }
    };

    const nextMonth = () => {
      if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
      } else {
        currentMonth.value++;
      }
    };

    const selectDate = (day) => {
      if (day.hasAvailability) {
        selectedDate.value = day.date;
        selectedTimeSlot.value = null;
      }
    };

    const sendBookingProposal = async () => {
      if (!selectedDate.value || !selectedTimeSlot.value) return;

      isSendingProposal.value = true;
      try {
        const proposedDateTime = new Date(selectedDate.value);
        const [hours, minutes] = selectedTimeSlot.value.split(":");
        proposedDateTime.setHours(parseInt(hours), parseInt(minutes));

        const response = await fetch("/api/messaging/booking-proposals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            bookingOfferId: selectedBookingOffer.value?.id,
            proposedTime: proposedDateTime.toISOString(),
            tutorLocation: "",
            finalLocation: "Tutor Location",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create booking proposal");
        }

        showCalendarModal.value = false;
        selectedDate.value = null;
        selectedTimeSlot.value = null;

        alert("Booking proposal sent successfully!");
      } catch (error) {
        console.error("Error sending booking proposal:", error);
        alert("Failed to send booking proposal. Please try again.");
      } finally {
        isSendingProposal.value = false;
      }
    };

    // Helper methods for booking messages
    const getBookingData = (message) => {
      try {
        return JSON.parse(message.content);
      } catch (error) {
        console.error("Error parsing booking data:", error);
        return null;
      }
    };

    const resetBookingStatusState = () => {
      bookingOfferStatuses.value = new Map();
      confirmedBookings.value = new Set();
    };

    const updateBookingStatus = (bookingOfferId, status) => {
      if (!bookingOfferId) return;
      const updatedStatuses = new Map(bookingOfferStatuses.value);
      updatedStatuses.set(bookingOfferId, status);
      bookingOfferStatuses.value = updatedStatuses;
    };

    const setConfirmedBooking = (bookingOfferId) => {
      if (!bookingOfferId) return;
      const updatedConfirmed = new Set(confirmedBookings.value);
      updatedConfirmed.add(bookingOfferId);
      confirmedBookings.value = updatedConfirmed;
    };

    const isBookingConfirmed = (bookingOfferId) => {
      if (!bookingOfferId) return false;
      return confirmedBookings.value.has(bookingOfferId);
    };

    const inferBookingStatusFromMessage = (message) => {
      const bookingData = getBookingData(message);
      if (!bookingData?.bookingOfferId) return;

      switch (message.messageType) {
        case "booking_offer":
          if (!bookingOfferStatuses.value.has(bookingData.bookingOfferId)) {
            updateBookingStatus(
              bookingData.bookingOfferId,
              "awaiting_response"
            );
          }
          break;
        case "booking_proposal":
          updateBookingStatus(bookingData.bookingOfferId, "pending_acceptance");
          break;
        case "booking_confirmation":
          updateBookingStatus(bookingData.bookingOfferId, "accepted");
          setConfirmedBooking(bookingData.bookingOfferId);
          break;
        case "booking_rejection":
          updateBookingStatus(bookingData.bookingOfferId, "rejected");
          break;
        default:
          break;
      }
    };

    const getBookingStatusValue = (message) => {
      const bookingData = getBookingData(message);
      if (!bookingData?.bookingOfferId) {
        return "awaiting_response";
      }
      return (
        bookingOfferStatuses.value.get(bookingData.bookingOfferId) ||
        "awaiting_response"
      );
    };

    const getBookingStatusText = (message) => {
      const status = getBookingStatusValue(message);
      if (status === "accepted") return "Accepted";
      if (status === "rejected") return "Rejected";
      if (status === "pending_acceptance") return "Pending acceptance";
      return "Awaiting response";
    };

    const getBookingStatusClass = (message) => {
      const status = getBookingStatusValue(message);
      if (status === "accepted") return "text-success";
      if (status === "rejected") return "text-danger";
      return "text-warning";
    };

    const getBookingStatusIcon = (message) => {
      const status = getBookingStatusValue(message);
      if (status === "accepted") return "fa-check-circle";
      if (status === "rejected") return "fa-times-circle";
      return "fa-clock";
    };

    const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return "";
      const date = new Date(dateTimeString);
      return date.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const handleBookingOffer = (message) => {
      const bookingData = getBookingData(message);
      if (bookingData) {
        selectedBookingOffer.value = {
          id: bookingData.bookingOfferId,
          isOnline: bookingData.isOnline,
          tuteeLocation: bookingData.tuteeLocation,
          notes: bookingData.notes,
        };
        showBookingProposalModal.value = true;
      }
    };

    const confirmBooking = async (message) => {
      const bookingData = getBookingData(message);
      if (!bookingData) return;

      try {
        const response = await fetch("/api/messaging/booking-confirmations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            bookingOfferId: bookingData.bookingOfferId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to confirm booking");
        }

        const data = await response.json();
        console.log("Booking confirmed:", data);

        // Add to confirmed bookings set and update status
        if (bookingData.bookingOfferId) {
          setConfirmedBooking(bookingData.bookingOfferId);
          updateBookingStatus(bookingData.bookingOfferId, "accepted");
        }

        // Show success message
        alert(
          "Booking confirmed successfully! The session has been added to your calendar."
        );
      } catch (error) {
        console.error("Error confirming booking:", error);
        alert("Failed to confirm booking. Please try again.");
      }
    };

  
    // Make functions globally available for context menu
    window.deleteMessage = deleteMessage;
    window.copyMessage = copyMessage;

    // Store handler references for cleanup
    const messageHandlers = {
      newMessage: null,
      userTyping: null,
      messageError: null,
      messageDeleted: null,
      messagesRead: null,
      reconnect: null,
    };

    // Set up Socket.io connection and message handling
    const setupMessaging = () => {
      if (authStore.session?.access_token) {
        console.log(
          "🔌 RECEIVER: Setting up messaging with token:",
          authStore.session.access_token.substring(0, 20) + "..."
        );
        console.log("🔌 RECEIVER: Current user ID:", currentUserId.value);
        // Connect to messaging service only if not already connected
        if (!messagingService.isConnected) {
          console.log("🔌 RECEIVER: Connecting to messaging service...");
          messagingService.connect(authStore.session.access_token);
        } else {
          console.log("🔌 RECEIVER: Already connected to messaging service");
        }

        // Handle new messages - store reference
        messageHandlers.newMessage = async (message) => {
          console.log(
            "🔔 RECEIVER: Received new message via Socket.io:",
            message
          );
          console.log("🔔 RECEIVER: Message content:", message.content);
          console.log("🔔 RECEIVER: Message type:", message.message_type);
          console.log("🔔 RECEIVER: Message created_at:", message.created_at);
          console.log(
            "🔔 RECEIVER: Current selected conversation:",
            selectedConversation.value?.id
          );
          console.log(
            "🔔 RECEIVER: Message conversation ID:",
            message.conversation_id
          );
          console.log("🔔 RECEIVER: Current user ID:", currentUserId.value);
          console.log("🔔 RECEIVER: Message sender ID:", message.sender_id);

          // Add message to current conversation if it's the one being viewed
          if (
            selectedConversation.value &&
            message.conversation_id === selectedConversation.value.id
          ) {
            console.log("Adding message to current conversation");

            // Validate message data
            if (!message.content && message.message_type !== "image") {
              console.warn(
                "⚠️ RECEIVER: Received message with empty content:",
                message
              );
              return;
            }

            if (!message.id) {
              console.warn(
                "⚠️ RECEIVER: Received message without ID:",
                message
              );
              return;
            }
            // Check if this message already exists (prevent duplicates)
            const existingMessageIndex = messages.value.findIndex(
              (msg) => msg.id === message.id
            );
            if (existingMessageIndex !== -1) {
              console.log(
                "⚠️ RECEIVER: Message already exists, skipping duplicate:",
                message.id
              );
              return;
            }

            // Check if this is replacing a temporary message
            const tempMessageIndex = messages.value.findIndex(
              (msg) =>
                msg.id.startsWith("temp_") &&
                msg.senderId === message.sender_id &&
                msg.content === message.content
            );

            const newMessage = {
              id: message.id,
              senderId: message.sender_id,
              content: message.content,
              messageType: message.message_type,
              createdAt: message.created_at,
              readAt: message.read_at,
              deliveredAt: message.delivered_at,
              sender: message.sender
                ? {
                    name: `${message.sender.first_name} ${message.sender.last_name}`,
                    type: message.sender.user_type,
                  }
                : null,
            };

            console.log(
              "🔔 RECEIVER: Creating new message object:",
              newMessage
            );
            console.log("🔔 RECEIVER: Message type check:", {
              messageType: newMessage.messageType,
              isImage: newMessage.messageType === "image",
              content: newMessage.content,
            });

            if (tempMessageIndex !== -1) {
              // Replace temporary message with real one
              messages.value[tempMessageIndex] = newMessage;
            } else {
              // Add new message
              messages.value.push(newMessage);
            }

            inferBookingStatusFromMessage(newMessage);
            await nextTick();
            scrollToBottom();

            // Auto-mark messages as read when user is actively viewing the conversation
            if (message.sender_id !== currentUserId.value) {
              console.log(
                "🔔 RECEIVER: Auto-marking messages as read since user is viewing conversation"
              );
              try {
                await messagingService.markAsRead(message.conversation_id);
                console.log(
                  "✅ RECEIVER: Messages marked as read successfully"
                );
              } catch (error) {
                console.error(
                  "❌ RECEIVER: Error auto-marking messages as read:",
                  error
                );
              }
            }
          } else {
            // Show notification if message is not in the currently viewed conversation
            // and message is from another user
            if (message.sender_id !== currentUserId.value && message.sender) {
              const senderName = `${message.sender.first_name} ${message.sender.last_name}`;

              // Generate user-friendly message preview based on message type
              let messagePreview;
              if (message.message_type === "image") {
                messagePreview = "📷 Sent an image";
              } else if (message.message_type === "reschedule_request") {
                messagePreview = "📅 Reschedule booking request";
              } else if (message.message_type === "reschedule_accepted") {
                messagePreview = "✅ Reschedule request accepted";
              } else if (message.message_type === "reschedule_rejected") {
                messagePreview = "❌ Reschedule request rejected";
              } else if (message.message_type === "booking_offer") {
                messagePreview = "📋 Booking offer";
              } else if (message.message_type === "booking_proposal") {
                messagePreview = "📝 Booking proposal";
              } else if (message.message_type === "booking_confirmation") {
                messagePreview = "✅ Booking confirmed";
              } else {
                messagePreview = message.content;
              }

              showMessageNotification({
                senderName,
                message: messagePreview,
                conversationId: message.conversation_id,
              });
            }
          }

          // ALWAYS update conversation list for ALL messages (this is the key fix!)
          console.log("🔔 RECEIVER: Updating conversation list for message");
          console.log(
            "🔔 RECEIVER: Current conversations list:",
            conversations.value.map((c) => ({
              id: c.id,
              participant: c.participant.name,
            }))
          );
          const conversationIndex = conversations.value.findIndex(
            (conv) => conv.id === message.conversation_id
          );
          console.log(
            "🔔 RECEIVER: Found conversation index:",
            conversationIndex
          );

          if (conversationIndex !== -1) {
            console.log("Updating existing conversation in list");

            // Create a new array to trigger Vue reactivity
            const updatedConversations = [...conversations.value];
            const conversation = updatedConversations[conversationIndex];

            // Update conversation properties
            conversation.lastMessage = message.content;
            conversation.lastMessageAt = message.created_at;

            // If message is from someone else and not in current conversation, increment unread count
            if (
              message.sender_id !== currentUserId.value &&
              (!selectedConversation.value ||
                selectedConversation.value.id !== message.conversation_id)
            ) {
              conversation.unreadCount = (conversation.unreadCount || 0) + 1;
            }

            // Remove from current position and add to top
            updatedConversations.splice(conversationIndex, 1);
            updatedConversations.unshift(conversation);

            // Update the reactive array
            conversations.value = updatedConversations;

            // Force Vue to update the UI
            await nextTick();

            console.log(
              "Conversation list updated:",
              conversations.value.length
            );
          } else {
            // This is a new conversation that needs to be added to the list
            // This happens when someone else sends the first message to you
            console.log(
              "🔔 RECEIVER: Conversation not found in list, adding new conversation"
            );
            const otherParticipant = message.sender;
            const conversationToAdd = {
              id: message.conversation_id,
              participant: {
                id: otherParticipant.id,
                name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
                type: otherParticipant.user_type,
              },
              lastMessage: message.content,
              lastMessageAt: message.created_at,
              unreadCount: message.sender_id !== currentUserId.value ? 1 : 0,
            };
            // Create new array to trigger Vue reactivity
            const updatedConversations = [...conversations.value];
            updatedConversations.unshift(conversationToAdd);
            conversations.value = updatedConversations;

            // Force Vue to update the UI
            await nextTick();

            console.log(
              "New conversation added to list:",
              conversationToAdd.id
            );

            // Join the new conversation room for real-time updates
            messagingService.joinConversation(conversationToAdd.id);
          }
        };

        // Register the new_message handler
        messagingService.on("new_message", messageHandlers.newMessage);

        // Handle reconnection - rejoin all conversation rooms
        messageHandlers.reconnect = () => {
          console.log("Socket.io reconnected, rejoining conversation rooms");
          // Rejoin all existing conversation rooms
          conversations.value.forEach((conv) => {
            messagingService.joinConversation(conv.id);
          });
          // Also rejoin current conversation if selected
          if (selectedConversation.value) {
            messagingService.joinConversation(selectedConversation.value.id);
          }
        };
        messagingService.on("connect", messageHandlers.reconnect);

        // Handle typing indicators
        messageHandlers.userTyping = (data) => {
          // TODO: Implement typing indicator UI
        };
        messagingService.on("user_typing", messageHandlers.userTyping);

        // Handle message errors
        messageHandlers.messageError = (error) => {
          console.error("Message error:", error);
          alert(`Failed to send message: ${error.error || "Unknown error"}`);
        };
        messagingService.on("message_error", messageHandlers.messageError);

        // Handle message deletion
        messageHandlers.messageDeleted = (data) => {
          console.log("🗑️ RECEIVER: Message deleted via Socket.io:", data);
          // Remove the deleted message from the local messages array
          messages.value = messages.value.filter(
            (msg) => msg.id !== data.messageId
          );
        };
        messagingService.on("message_deleted", messageHandlers.messageDeleted);

        // Handle messages read status update
        messageHandlers.messagesRead = (data) => {
          console.log("✅ RECEIVER: Messages read via Socket.io:", data);
          // Update read status for messages in the current conversation
          if (
            selectedConversation.value &&
            selectedConversation.value.id === data.conversationId
          ) {
            messages.value = messages.value.map((msg) => {
              // Update read status for messages sent by current user that were read by the other person
              if (msg.senderId === currentUserId.value && !msg.readAt) {
                return { ...msg, readAt: data.readAt };
              }
              return msg;
            });
          }
        };
        messagingService.on("messages_read", messageHandlers.messagesRead);
      }
    };

    // Join conversation room when conversation is selected
    const joinConversationRoom = (conversationId) => {
      if (conversationId) {
        messagingService.joinConversation(conversationId);
      }
    };

    // Update selectConversation to join room
    const selectConversationWithRoom = async (conversation) => {
      selectedConversation.value = conversation;
      showMobileChat.value = true; // Show chat on mobile

      if (conversation?.id) {
        joinConversationRoom(conversation.id);
        await loadMessages(conversation.id);
      }
    };

    onMounted(async () => {
      // Initialize auth store first
      await authStore.initializeAuth();

      // Wait a moment for auth to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // CRITICAL FIX: Load conversations FIRST, then setup messaging
      console.log("🔄 Loading conversations first...");
      await loadConversations();
      console.log("✅ Conversations loaded:", conversations.value.length);
      console.log("🔌 Setting up messaging...");
      setupMessaging();

      // Join all existing conversation rooms for real-time updates
      setTimeout(() => {
        conversations.value.forEach((conv) => {
          messagingService.joinConversation(conv.id);
        });
      }, 1000);
    });

    onUnmounted(() => {
      // Clean up event listeners specific to Messages page
      // Remove only the handlers registered by this component
      if (messageHandlers.newMessage) {
        messagingService.off("new_message", messageHandlers.newMessage);
      }
      if (messageHandlers.userTyping) {
        messagingService.off("user_typing", messageHandlers.userTyping);
      }
      if (messageHandlers.messageError) {
        messagingService.off("message_error", messageHandlers.messageError);
      }
      if (messageHandlers.messageDeleted) {
        messagingService.off("message_deleted", messageHandlers.messageDeleted);
      }
      if (messageHandlers.messagesRead) {
        messagingService.off("messages_read", messageHandlers.messagesRead);
      }
      if (messageHandlers.reconnect) {
        messagingService.off("connect", messageHandlers.reconnect);
      }

      // Don't disconnect here - let App.vue manage the global connection
      // This allows notifications to continue working on other pages
    });

    // Calculate end time based on start time and duration
    const calculateEndTime = () => {
      if (!bookingProposal.value.proposedDate || !bookingProposal.value.proposedTime) {
        return "N/A";
      }

      try {
        const startDateTime = new Date(
          `${bookingProposal.value.proposedDate}T${bookingProposal.value.proposedTime}`
        );

        // Get the effective duration (either from quick buttons or custom input)
        const effectiveDuration = bookingProposal.value.customDuration !== ''
          ? bookingProposal.value.customDuration
          : bookingProposal.value.duration;

        // Add duration in minutes
        const endDateTime = new Date(startDateTime.getTime() + effectiveDuration * 60000);

        // Format as HH:MM
        const hours = String(endDateTime.getHours()).padStart(2, '0');
        const minutes = String(endDateTime.getMinutes()).padStart(2, '0');

        return `${hours}:${minutes}`;
      } catch (error) {
        console.error("Error calculating end time:", error);
        return "N/A";
      }
    };

    return {
      authStore,
      currentUserId,
      searchQuery,
      selectedConversation,
      conversations,
      messages,
      newMessage,
      isLoading,
      showMobileChat,
      backToConversations,
      filteredConversations,
      formatTime,
      scrollToBottom,
      isImageMessage,
      selectConversation: selectConversationWithRoom,
      sendMessage,
      startNewConversation,
      fileInput,
      attachFile,
      handleFileSelect,
      uploadImage,
      handleImageClick,
      openImageFullscreen,
      availableParticipants,
      showParticipantSelection,
      selectedParticipantId,
      participantSearchQuery,
      filteredParticipants,
      createConversationWithParticipant,
      showMessageContextMenu,
      deleteMessage,
      copyMessage,
      showDeleteModal,
      messageToDelete,
      isDeleting,
      confirmDelete,
      cancelDelete,
      // Booking related
      canBookSession,
      showBookingOfferModal,
      showCalendarModal,
      showBookingProposalModal,
      isCreatingBooking,
      isCreatingProposal,
      isSendingProposal,
      selectedBookingOffer,
      confirmedBookings,
      tuteeLocationInput,
      tutorLocationInput,
      tuteeDropdown,
      tutorDropdown,
      bookingOffer,
      bookingProposal,
      createBookingOffer,
      createBookingProposal,
      calculateEndTime,
      // Custom autocomplete
      predictions,
      showDropdown,
      selectedIndex,
      handleLocationInput,
      handleKeyDown,
      selectPrediction,
      handleInputFocus,
      handleInputBlur,
      // Calendar related
      currentMonthYear,
      calendarDays,
      selectedDate,
      selectedDateFormatted,
      timeSlots,
      selectedTimeSlot,
      canSendProposal,
      previousMonth,
      nextMonth,
      selectDate,
      sendBookingProposal,
      // Booking message helpers
      getBookingData,
      getBookingStatusValue,
      isBookingConfirmed,
      getBookingStatusText,
      getBookingStatusClass,
      getBookingStatusIcon,
      formatDateTime,
      handleBookingOffer,
      confirmBooking,
    };
  },
};
</script>

<style scoped>
/* Cyberpunk Messages Page */
.messages-page {
  background: #1a1a1a !important;
  min-height: 100vh;
  color: var(--cyber-text, #ffffff);
}

/* Cards */
.card {
  background: rgba(26, 26, 26, 0.85) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  border-radius: 15px;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.1),
    0 0 30px rgba(255, 140, 66, 0.05) !important;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  color: var(--cyber-text, #ffffff) !important;
}

.card:hover {
  border-color: var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 25px rgba(255, 140, 66, 0.3) !important;
}

.card-header {
  background: rgba(255, 140, 66, 0.1) !important;
  border-bottom: 1px solid var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-text, #ffffff) !important;
}

.card-body {
  color: var(--cyber-text, #ffffff) !important;
}

/* Headings and Text */
h5,
h6 {
  color: var(--cyber-text, #ffffff) !important;
  text-shadow: 0 0 5px rgba(255, 140, 66, 0.3);
}

.text-muted {
  color: var(--cyber-text-muted, #cccccc) !important;
}

.fw-bold {
  color: var(--cyber-text, #ffffff) !important;
}

/* Layout improvements */
.messages-row {
  min-height: calc(100vh - 200px);
}

.conversations-col,
.chat-col {
  display: flex;
  flex-direction: column;
}

/* Conversation Items */
.conversations-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 !important;
  padding: 0 !important;
}

.conversation-item {
  transition: all 0.3s ease;
  cursor: pointer;
  border-bottom: 1px solid var(--cyber-grey-light, #4a4a4a) !important;
}

.conversation-item:hover {
  background: rgba(255, 140, 66, 0.1) !important;
}

.conversation-item.active {
  background: linear-gradient(
    90deg,
    rgba(255, 140, 66, 0.2),
    rgba(255, 210, 63, 0.1)
  ) !important;
  border-left: 3px solid var(--cyber-orange, #ff8c42);
}

.conversation-item.active .text-muted {
  color: var(--cyber-text-muted, #cccccc) !important;
}

/* Avatars */
.conversation-avatar,
.chat-avatar {
  background: rgba(255, 140, 66, 0.2) !important;
  border: 2px solid var(--cyber-orange, #ff8c42);
  transition: all 0.3s ease;
}

.conversation-avatar i,
.chat-avatar i {
  color: var(--cyber-orange, #ff8c42) !important;
}

.conversation-item:hover .conversation-avatar {
  transform: scale(1.1);
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.5);
}

.conversation-item:hover .conversation-avatar i {
  color: white !important;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* Messages Container */
.messages-container {
  background: transparent !important;
  backdrop-filter: none !important;
  flex: 1 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  margin: 0 !important;
  padding: 15px 15px 80px 15px !important;
  border-bottom: none !important;
  margin-bottom: 0px !important;
}

.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(74, 74, 74, 0.3);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--cyber-orange, #ff8c42);
  border-radius: 4px;
}

/* Message Bubbles */
.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: context-menu;
}

.message-bubble.sent {
  background: linear-gradient(
    135deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  );
  color: white;
  margin-left: auto;
  border: 1px solid var(--cyber-orange, #ff8c42);
}

/* Remove orange styling for image messages */
.message-bubble.sent.image-message-bubble {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.message-bubble.sent .image-message {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.message-bubble.sent .image-message img {
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  background: transparent !important;
}

/* Remove outline for received image messages too */
.message-bubble.received.image-message-bubble {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.message-bubble.received .image-message {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.message-bubble.received .image-message img {
  border: 2px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  background: transparent !important;
}

.message-bubble.received {
  background: rgba(42, 42, 42, 0.8);
  color: var(--cyber-text, #ffffff);
  border: 1px solid var(--cyber-grey-light, #4a4a4a);
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.8;
}

.message-status {
  font-size: 0.75rem;
  margin-left: 8px;
}

.status-sent {
  color: rgba(255, 255, 255, 0.7);
}

.status-delivered {
  color: rgba(255, 255, 255, 0.8);
}

.status-read {
  color: #4caf50;
}

/* Message Input */
.message-input {
  background: rgba(26, 26, 26, 0.9) !important;
  border-top: 1px solid var(--cyber-orange, #ff8c42) !important;
  flex-shrink: 0 !important;
  margin: 0 !important;
  padding: 10px 15px !important;
  margin-top: auto !important;
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
}

/* Form Controls */
.form-control {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.form-control:focus {
  background: rgba(42, 42, 42, 0.95) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.3) !important;
  color: var(--cyber-text, #ffffff) !important;
}

.form-control::placeholder {
  color: var(--cyber-text-dim, #888888) !important;
}

.input-group-text {
  background: rgba(42, 42, 42, 0.8) !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  border: 2px solid var(--cyber-orange, #ff8c42) !important;
  color: white !important;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(255, 140, 66, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(255, 140, 66, 0.5) !important;
}

.btn-primary:disabled {
  opacity: 0.7;
  transform: none;
  cursor: not-allowed;
}

.btn-outline-secondary {
  background: transparent !important;
  border: 2px solid var(--cyber-grey-light, #4a4a4a) !important;
  color: var(--cyber-text, #ffffff) !important;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-weight: 600;
}

.btn-outline-secondary:hover {
  background: rgba(74, 74, 74, 0.3) !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  color: var(--cyber-orange, #ff8c42) !important;
  transform: translateY(-2px);
}

/* Badge */
.badge {
  border: 1px solid var(--cyber-orange, #ff8c42);
  font-weight: 600;
  padding: 0.4em 0.7em;
  border-radius: 6px;
}

.badge.bg-primary {
  background: linear-gradient(
    45deg,
    var(--cyber-orange, #ff8c42),
    var(--cyber-yellow, #ffd23f)
  ) !important;
  color: white !important;
  border-color: var(--cyber-orange, #ff8c42) !important;
  box-shadow: 0 0 10px rgba(255, 140, 66, 0.5);
}

/* Icons */
i.text-primary {
  color: var(--cyber-orange, #ff8c42) !important;
}

/* Border */
.border-bottom {
  border-color: var(--cyber-grey-light, #4a4a4a) !important;
}

.border-top {
  border-color: var(--cyber-orange, #ff8c42) !important;
}

/* Background Elements */
.bg-white {
  background: rgba(26, 26, 26, 0.5) !important;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Context Menu */
.context-menu {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.context-menu-item:hover {
  background: #f5f5f5;
}

.context-menu-item i {
  width: 16px;
  text-align: center;
}

/* Copy Toast */
.copy-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #4caf50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Back button - only show on mobile */
.back-btn-mobile {
  display: none;
  padding: 0.25rem 0.5rem;
  font-size: 1.25rem;
}

/* Desktop view - side by side ALWAYS */
@media (min-width: 992px) {
  /* Force both columns to always display on desktop */
  .conversations-col,
  .chat-col {
    display: flex !important;
    position: relative !important;
    flex-direction: column !important;
  }

  /* Override mobile toggle classes on desktop */
  .conversations-col.hide-on-mobile {
    display: flex !important;
  }

  .chat-col.show-on-mobile,
  .chat-col {
    display: flex !important;
    position: relative !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    z-index: auto !important;
  }

  .back-btn-mobile {
    display: none !important;
  }

  .conversations-col .card {
    height: 750px !important;
    max-height: 750px !important;
  }

  .chat-card {
    height: 750px !important;
    max-height: 750px !important;
    min-height: 600px;
  }

  .conversations-list {
    max-height: calc(750px - 180px) !important;
    overflow-y: auto;
  }

  .messages-container {
    max-height: calc(750px - 150px) !important;
    overflow-y: auto;
  }

  /* Ensure booking actions don't appear when no conversation selected */
  .booking-actions {
    display: flex;
  }
}

/* Responsive - Telegram-style Mobile View */
@media (max-width: 991px) {
  .messages-row {
    min-height: calc(100vh - 150px);
    position: relative;
  }

  /* Show back button on mobile */
  .back-btn-mobile {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
  }

  .back-btn-mobile:hover {
    background: rgba(255, 140, 66, 0.1);
    border-radius: 8px;
  }

  /* FORCE TOGGLE BEHAVIOR - Only one visible at a time */
  .row.messages-row .conversations-col,
  .row.messages-row .chat-col {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  /* DEFAULT: Show conversations, hide chat */
  .row.messages-row .conversations-col {
    display: flex !important;
    z-index: 1 !important;
    position: relative !important;
    height: calc(100vh - 150px);
  }

  .row.messages-row .conversations-col .card {
    height: 100%;
  }

  .row.messages-row .chat-col {
    display: none !important;
    z-index: 0 !important;
  }

  /* WHEN CHAT IS ACTIVE: Hide conversations, show chat full screen */
  .row.messages-row .conversations-col.hide-on-mobile {
    display: none !important;
    z-index: 0 !important;
  }

  .row.messages-row .chat-col.show-on-mobile {
    display: flex !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 10000 !important;
    padding: 1rem !important;
    background: #1a1a1a !important;
    margin: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }

  .row.messages-row .chat-col.show-on-mobile .chat-card {
    height: 100% !important;
    max-height: 100vh !important;
    margin: 0 !important;
  }

  .conversations-list {
    flex: 1;
    max-height: none;
    overflow-y: auto;
  }

  .messages-container {
    flex: 1;
    min-height: 400px !important;
    max-height: none !important;
    height: auto !important;
  }

  /* Make empty states more visible on mobile */
  .text-center {
    color: #ffffff !important;
  }

  .text-center .text-muted {
    color: #ffffff !important;
    opacity: 0.9;
  }

  .text-center i {
    color: #ff8c42 !important;
  }
}

@media (max-width: 768px) {
  .message-bubble {
    max-width: 90%;
  }

  /* Reduce header sizes for mobile */
  .card-header h5 {
    font-size: 1rem;
  }

  .card-header h6 {
    font-size: 0.9rem;
  }

  .chat-col.show-on-mobile {
    padding: 0.5rem;
  }
}

@media (max-width: 576px) {
  .message-bubble {
    max-width: 95%;
  }

  /* Smaller padding on very small screens */
  .messages-container {
    padding: 10px 10px 70px 10px !important;
  }

  .message-input {
    padding: 8px 10px !important;
  }

  .chat-col.show-on-mobile {
    padding: 0.25rem;
  }

  .back-btn-mobile {
    font-size: 1.1rem;
  }
}

/* Mobile Modal Improvements */
@media (max-width: 991px) {
  .modal-overlay {
    z-index: 99999 !important;
    padding: 10px;
  }

  .modal-content {
    width: 95% !important;
    max-width: none !important;
    max-height: 90vh !important;
    margin: 0 !important;
  }

  .modal-header {
    padding: 15px !important;
  }

  .modal-header h3 {
    font-size: 18px !important;
  }

  .modal-body {
    padding: 15px !important;
  }

  .modal-footer {
    padding: 15px !important;
  }

  /* Ensure modal is above all mobile elements */
  .modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.modal-content {
  background: #242424;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid #424242;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #424242;
  background: #2c2c2c;
}

.modal-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.5px;
}

.modal-header h3 .text-primary {
  color: #ff8c42 !important;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #a0aec0;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #ffffff;
  background: #424242;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  background: #242424;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #424242;
  background: #242424;
  border-radius: 0 0 12px 12px;
}

.modal-footer .btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-footer .btn-secondary {
  background: #6c757d;
  border: 1px solid #6c757d;
  color: white;
}

.modal-footer .btn-secondary:hover {
  background: #5a6268;
  border-color: #545b62;
}

.modal-footer .btn-danger {
  background: #dc3545;
  border: 1px solid #dc3545;
  color: white;
}

.modal-footer .btn-danger:hover:not(:disabled) {
  background: #c82333;
  border-color: #bd2130;
}

.modal-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.participant-search {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  background: #2c2c2c;
  border: 1px solid #424242;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b35;
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
}

.search-input::placeholder {
  color: #a0aec0;
}

.no-tutors {
  text-align: center;
  padding: 40px 20px;
  color: #a0aec0;
}

.tutor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tutor-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #424242;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #2c2c2c;
}

.tutor-item:hover {
  border-color: #ff6b35;
  background: #242424;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
}

.tutor-info h4 {
  margin: 0 0 4px 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
}

.tutor-info p {
  margin: 0;
  color: #a0aec0;
  font-size: 14px;
}

.tutor-actions .btn {
  padding: 8px 16px;
  font-size: 14px;
  background: #ff6b35;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tutor-actions .btn:hover {
  background: #e55a2b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

/* Equal height panels */
.messages-page .row {
  align-items: stretch;
}

.messages-page .col-lg-4,
.messages-page .col-lg-8 {
  display: flex;
  flex-direction: column;
}

.messages-page .card {
  height: 100%;
  min-height: 600px;
}

/* Ensure conversations list takes full height */
.conversations-list {
  min-height: 0;
}

/* Ensure messages container takes full height */
.messages-container {
  min-height: 0;
}

/* Fix the main chat card height */
.card.d-flex.flex-column {
  height: 800px !important;
  max-height: 800px !important;
}

.card-body.d-flex.flex-column {
  flex: 1 !important;
  min-height: 0 !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
}


/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #242424;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid #424242;
}

.modal-content.calendar-modal {
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #424242;
  background: #2c2c2c;
}

.modal-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.5px;
}

.modal-header h3 .text-primary {
  color: #ff8c42 !important;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #a0aec0;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #ffffff;
  background: #424242;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
  background: #242424;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 20px;
  border-top: 1px solid #424242;
  background: #242424;
  border-radius: 0 0 12px 12px;
}

.modal-footer .btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.modal-footer .btn-secondary {
  background: #6c757d;
  border: 1px solid #6c757d;
  color: white;
}

.modal-footer .btn-secondary:hover {
  background: #5a6268;
  border-color: #545b62;
}

.modal-footer .btn-primary {
  background: linear-gradient(45deg, #ff8c42, #ffd23f);
  border: 2px solid #ff8c42;
  color: white;
}

.modal-footer .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.4);
}

/* Calendar Styles */
.calendar-container {
  color: #ffffff;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-header h5 {
  margin: 0;
  color: #ffd23f;
  font-weight: 600;
}

.calendar-grid {
  display: grid;
  gap: 2px;
  background: #424242;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #2c2c2c;
}

.calendar-weekday {
  padding: 10px 5px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  color: #a0aec0;
  border-right: 1px solid #424242;
}

.calendar-weekday:last-child {
  border-right: none;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  padding: 15px 5px;
  text-align: center;
  cursor: pointer;
  background: #242424;
  border-right: 1px solid #424242;
  transition: all 0.2s ease;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-day:last-child {
  border-right: none;
}

.calendar-day:hover {
  background: #2c2c2c;
}

.calendar-day.other-month {
  color: #666;
  background: #1a1a1a;
}

.calendar-day.today {
  background: rgba(255, 140, 66, 0.2);
  color: #ff8c42;
  font-weight: 600;
}

.calendar-day.has-availability {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.calendar-day.has-availability:hover {
  background: rgba(76, 175, 80, 0.2);
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.time-slots-grid .btn {
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 6px;
}

.time-slots-grid .btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.time-slots-grid .btn.active {
  background: linear-gradient(45deg, #ff8c42, #ffd23f) !important;
  border-color: #ff8c42 !important;
  color: white !important;
}

/* Duration Selection Buttons */
.duration-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.duration-btn {
  background: rgba(255, 140, 66, 0.1) !important;
  border: 2px solid rgba(255, 140, 66, 0.3) !important;
  color: #ff8c42 !important;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 80px;
}

.duration-btn:hover {
  background: rgba(255, 140, 66, 0.2) !important;
  border-color: #ff8c42 !important;
  transform: translateY(-2px);
}

.duration-btn.active {
  background: linear-gradient(45deg, #ff8c42, #ffd23f) !important;
  border-color: #ff8c42 !important;
  color: white !important;
  box-shadow: 0 0 15px rgba(255, 140, 66, 0.4);
}

/* Booking Request Summary - Compact Design */
.booking-request-summary {
  background: rgba(255, 140, 66, 0.08);
  border: 1px solid rgba(255, 140, 66, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.booking-request-summary .summary-header {
  background: rgba(255, 140, 66, 0.12);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #ff8c42;
  border-bottom: 1px solid rgba(255, 140, 66, 0.2);
}

.booking-request-summary .summary-content {
  padding: 10px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.booking-request-summary .summary-item {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 140, 66, 0.2);
}

.booking-request-summary .summary-item i {
  color: #ff8c42;
  font-size: 11px;
}

.booking-request-summary .notes-item {
  flex: 1 1 100%;
  background: rgba(255, 140, 66, 0.1);
  border-color: rgba(255, 140, 66, 0.3);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking-request-summary .notes-item i {
  color: #ffd23f;
}

/* Form Controls in Modal */
.form-label {
  color: #ffffff;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.3px;
  font-size: 14px;
}

.form-control,
.form-select {
  background: #2c2c2c;
  border: 1px solid #424242;
  color: #ffffff;
  border-radius: 6px;
}

.form-control:focus,
.form-select:focus {
  background: #2c2c2c;
  border-color: #ff8c42;
  box-shadow: 0 0 0 2px rgba(255, 140, 66, 0.2);
  color: #ffffff;
}

.form-control::placeholder {
  color: #a0aec0;
}

.form-check-input {
  background-color: #2c2c2c;
  border-color: #424242;
}

.form-check-input:checked {
  background-color: #ff8c42;
  border-color: #ff8c42;
}

.form-check-label {
  color: #ffffff;
}

.btn-group .btn-check:checked + .btn {
  background: linear-gradient(45deg, #ff8c42, #ffd23f) !important;
  border-color: #ff8c42 !important;
  color: white !important;
}

/* Session Type Buttons */
.btn-outline-primary {
  background: transparent;
  border: 2px solid #424242 !important;
  color: #ffffff !important;
  font-weight: 600;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
}

.btn-outline-primary:hover {
  background: rgba(255, 140, 66, 0.1);
  border-color: #ff8c42 !important;
  color: #ff8c42 !important;
}

.btn-outline-primary:focus {
  box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.2);
  border-color: #ff8c42 !important;
}

/* Remove Bootstrap blue outline */
.btn-check:focus + .btn-outline-primary,
.btn-outline-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.2) !important;
  border-color: #ff8c42 !important;
}

/* Booking Message Styles */
.booking-message {
  background: #2c2c2c !important;
  border: 1px solid #424242 !important;
  border-radius: 12px !important;
  padding: 0 !important;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  max-width: 380px;
}

/* Wider reschedule cards */
.reschedule-request,
.reschedule-accepted,
.reschedule-rejected {
  max-width: 450px !important;
}

.booking-header {
  background: rgba(255, 140, 66, 0.12);
  padding: 12px 16px;
  border-bottom: 1px solid rgba(66, 66, 66, 0.6);
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #ffffff;
}

.booking-header i {
  font-size: 14px;
  color: #ff8c42;
}

.booking-offer .booking-header {
  background: rgba(255, 140, 66, 0.12);
  border-bottom: 1px solid rgba(255, 140, 66, 0.3);
}

.booking-offer .booking-header i {
  color: #ff8c42;
}

.booking-proposal .booking-header {
  background: rgba(40, 167, 69, 0.12);
  border-bottom: 1px solid rgba(40, 167, 69, 0.3);
}

.booking-proposal .booking-header i {
  color: #28a745;
}

.booking-confirmation .booking-header {
  background: rgba(40, 167, 69, 0.12);
  border-bottom: 1px solid rgba(40, 167, 69, 0.3);
}

.booking-confirmation .booking-header i {
  color: #28a745;
}

.reschedule-request .booking-header {
  background: rgba(13, 110, 253, 0.12);
  border-bottom: 1px solid rgba(13, 110, 253, 0.3);
}

.reschedule-request .booking-header i {
  color: #0d6efd;
}

.reschedule-accepted .booking-header {
  background: rgba(40, 167, 69, 0.12);
  border-bottom: 1px solid rgba(40, 167, 69, 0.3);
}

.reschedule-accepted .booking-header i {
  color: #28a745;
}

.booking-rejection .booking-header {
  background: rgba(220, 53, 69, 0.12);
  border-bottom: 1px solid rgba(220, 53, 69, 0.3);
}

.booking-rejection .booking-header i {
  color: #dc3545;
}

.reschedule-rejected .booking-header {
  background: rgba(220, 53, 69, 0.12);
  border-bottom: 1px solid rgba(220, 53, 69, 0.3);
}

.reschedule-rejected .booking-header i {
  color: #dc3545;
}

.booking-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.booking-details {
  padding: 14px 16px 16px 16px;
  color: #ffffff;
  background: #2c2c2c;
}

.booking-details p {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.4;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.booking-details p:last-of-type:not(:has(button)) {
  margin-bottom: 0;
}

.booking-details strong {
  color: #aaaaaa;
  font-weight: 600;
  min-width: fit-content;
}

.booking-actions {
  margin-top: 12px;
  padding-top: 0;
  border-top: none;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.booking-status {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.booking-status.text-warning {
  color: #ffc107 !important;
}

.booking-status.text-success {
  color: #28a745 !important;
  background: rgba(40, 167, 69, 0.1);
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.booking-status.text-danger {
  color: #dc3545 !important;
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.booking-actions .btn {
  padding: 6px 16px;
  font-size: 12px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: none;
}

.booking-actions .btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.booking-actions .btn-primary {
  background: linear-gradient(135deg, #ff8c42, #ffd23f) !important;
  border: none !important;
  color: white !important;
}

.booking-actions .btn-primary:hover {
  background: linear-gradient(135deg, #ffd23f, #ff8c42) !important;
}

.booking-actions .btn-success {
  background: linear-gradient(135deg, #28a745, #20c997) !important;
  border: none !important;
  color: white !important;
}

.booking-actions .btn-success:hover {
  background: linear-gradient(135deg, #20c997, #28a745) !important;
}

.booking-actions .btn-danger {
  background: linear-gradient(135deg, #dc3545, #c82333) !important;
  border: none !important;
  color: white !important;
}

.booking-actions .btn-danger:hover {
  background: linear-gradient(135deg, #c82333, #bd2130) !important;
}

.booking-actions .btn-outline-primary,
.booking-actions .btn-outline-secondary {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.booking-actions .btn-outline-primary:hover,
.booking-actions .btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: #ff8c42 !important;
  color: #ff8c42 !important;
}

/* Message bubble adjustments for booking messages */
.message-bubble:has(.booking-message) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.message-bubble .booking-message {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.message-bubble .booking-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* Responsive booking messages */
@media (max-width: 768px) {
  .booking-message {
    max-width: 100%;
  }

  .booking-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .booking-actions .btn {
    width: 100%;
  }
}
</style>

<style>
/* Google Maps Autocomplete Dropdown - Global styles (not scoped) */
/* Remove blue glow from location inputs */
.location-autocomplete-input:focus {
  outline: none !important;
  box-shadow: none !important;
  border-color: #4a4a4a !important;
}

/* Custom autocomplete dropdown styling */
.custom-autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a1a1a;
  border: 1px solid #4a4a4a;
  border-radius: 4px;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #2a2a2a;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background-color: #2a2a2a;
}

.place-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.place-address {
  color: #999999;
  font-size: 13px;
  line-height: 1.4;
}

/* Custom scrollbar for dropdown */
.custom-autocomplete-dropdown::-webkit-scrollbar {
  width: 8px;
}

.custom-autocomplete-dropdown::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.custom-autocomplete-dropdown::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.custom-autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
</style>
