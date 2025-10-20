import { io } from 'socket.io-client'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Create a separate API client for messaging service
const messagingApi = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Add auth interceptor for messaging API
messagingApi.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

class MessagingService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.messageHandlers = new Map() // Each event can have multiple handlers (array)
  }

  // Initialize Socket.io connection
  connect(token) {
    console.log('🔌 MESSAGING SERVICE: connect() called');
    console.log('🔌 MESSAGING SERVICE: Token provided:', !!token);
    console.log('🔌 MESSAGING SERVICE: Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('🔌 MESSAGING SERVICE: Has existing socket?', !!this.socket);
    console.log('🔌 MESSAGING SERVICE: Current isConnected?', this.isConnected);
    
    if (this.socket) {
      console.log('🔌 MESSAGING SERVICE: Disconnecting existing socket');
      this.disconnect()
    }

    console.log('🔌 MESSAGING SERVICE: Creating new socket connection to http://localhost:3005');
    
    this.socket = io('http://localhost:3005', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    })

    this.socket.on('connect', () => {
      console.log('🔌 MESSAGING SERVICE: Socket.io connected successfully')
      this.isConnected = true
    })

    this.socket.on('disconnect', () => {
      console.log('🔌 MESSAGING SERVICE: Socket.io disconnected')
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 MESSAGING SERVICE: Socket.io connection error:', error)
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('🔌 MESSAGING SERVICE: Socket.io error:', error)
    })

          this.socket.on('reconnect', () => {
            this.isConnected = true
          })

          this.socket.on('reconnect_attempt', () => {
            // Reconnection attempt in progress
          })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      this.isConnected = false
    })

    // Set up message handlers
    this.setupMessageHandlers()
  }

  // Disconnect from Socket.io
  disconnect() {
    console.log('🔌 MESSAGING SERVICE: disconnect() called');
    if (this.socket) {
      console.log('🔌 MESSAGING SERVICE: Disconnecting socket');
      console.log('🔌 MESSAGING SERVICE: Handlers will be preserved:', Array.from(this.messageHandlers.keys()));
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      // DON'T clear handlers - they should persist across reconnections
    }
  }

  // Set up Socket.io event handlers
  setupMessageHandlers() {
    this.socket.on('new_message', (message) => {
      console.log('Socket.io received new_message:', message)
      const handlers = this.messageHandlers.get('new_message') || []
      if (handlers.length > 0) {
        console.log(`Calling ${handlers.length} new_message handler(s)`)
        handlers.forEach(handler => handler(message))
      } else {
        console.log('No new_message handler registered')
      }
    })

    this.socket.on('user_typing', (data) => {
      const handlers = this.messageHandlers.get('user_typing') || []
      handlers.forEach(handler => handler(data))
    })

    this.socket.on('message_error', (error) => {
      const handlers = this.messageHandlers.get('message_error') || []
      handlers.forEach(handler => handler(error))
    })

    this.socket.on('message_deleted', (data) => {
      console.log('Socket.io received message_deleted:', data)
      const handlers = this.messageHandlers.get('message_deleted') || []
      handlers.forEach(handler => handler(data))
    })

    this.socket.on('messages_read', (data) => {
      console.log('Socket.io received messages_read:', data)
      const handlers = this.messageHandlers.get('messages_read') || []
      handlers.forEach(handler => handler(data))
    })
  }

  // Register event handlers (supports multiple handlers per event)
  on(event, handler) {
    console.log(`🔌 MESSAGING SERVICE: Registering handler for event: ${event}`);
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, [])
    }
    this.messageHandlers.get(event).push(handler)
    console.log(`🔌 MESSAGING SERVICE: Total handlers for ${event}: ${this.messageHandlers.get(event).length}`);
  }

  // Remove specific event handler
  off(event, handler) {
    if (!handler) {
      // If no handler specified, remove all handlers for this event
      this.messageHandlers.delete(event)
    } else {
      // Remove specific handler
      const handlers = this.messageHandlers.get(event) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket && this.isConnected) {
      console.log('Joining conversation room:', conversationId)
      this.socket.emit('join_conversation', { conversationId })
    } else {
      console.log('Cannot join room - socket not connected:', { socket: !!this.socket, connected: this.isConnected })
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_conversation', { conversationId })
    }
  }

  // Send a message via Socket.io
  sendMessage(conversationId, content, messageType = 'text') {
    if (this.socket && this.isConnected) {
      console.log('Sending message via Socket.io:', { conversationId, content, messageType })
      this.socket.emit('send_message', {
        conversationId,
        content,
        messageType
      })
    } else {
      console.log('Cannot send message - socket not connected:', { socket: !!this.socket, connected: this.isConnected })
    }
  }

  // Start typing indicator
  startTyping(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { conversationId })
    }
  }

  // Stop typing indicator
  stopTyping(conversationId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { conversationId })
    }
  }

  // HTTP API Methods

  // Get all conversations for the current user
  async getConversations(page = 1, limit = 20) {
    try {
      const response = await messagingApi.get(`/messaging/conversations?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

        // Get available participants based on user type
        async getAvailableParticipants() {
          try {
            const response = await messagingApi.get('/messaging/participants')
            return response.data
          } catch (error) {
            console.error('Error fetching participants:', error)
            throw error
          }
        }

        // Create a new conversation
        async createConversation(participantId, bookingId = null) {
          try {
            const response = await messagingApi.post('/messaging/conversations', {
              participantId,
              bookingId
            })
            return response.data
          } catch (error) {
            console.error('Error creating conversation:', error)
            throw error
          }
        }

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await messagingApi.get(`/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  // Send a message via HTTP API (fallback)
  async sendMessageHTTP(conversationId, content, messageType = 'text') {
    try {
      const response = await messagingApi.post(`/messaging/conversations/${conversationId}/messages`, {
        content,
        messageType
      })
      return response.data
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Upload a file
  async uploadFile(conversationId, file, messageType = 'file') {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('messageType', messageType)

      const response = await messagingApi.post(`/messaging/conversations/${conversationId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // Mark messages as read
  async markAsRead(conversationId) {
    try {
      const response = await messagingApi.put(`/messaging/conversations/${conversationId}/read`)
      return response.data
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  // Get unread message count for a conversation
  async getUnreadCount(conversationId) {
    try {
      const response = await messagingApi.get(`/messaging/conversations/${conversationId}/unread-count`)
      return response.data
    } catch (error) {
      console.error('Error getting unread count:', error)
      throw error
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await messagingApi.delete(`/messaging/messages/${messageId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  // Archive a conversation
  async archiveConversation(conversationId) {
    try {
      const response = await messagingApi.put(`/messaging/conversations/${conversationId}/archive`)
      return response.data
    } catch (error) {
      console.error('Error archiving conversation:', error)
      throw error
    }
  }

  // Mark attendance for a booking
  async markAttendance(bookingId, attendanceData) {
    try {
      const formData = new FormData()
      formData.append('attendance_status', attendanceData.attendance_status)
      formData.append('session_notes', attendanceData.session_notes || '')
      formData.append('proof_photo', attendanceData.proof_photo)

      const response = await fetch(`/api/bookings/${bookingId}/mark-attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to mark attendance')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  // Send attendance marked message
  async sendAttendanceMessage(conversationId, bookingId, attendanceData) {
    try {
      const response = await messagingApi.post(`/messaging/conversations/${conversationId}/messages`, {
        content: `Attendance marked: Student ${attendanceData.attendance_status === 'attended' ? 'attended' : 'did not attend'} the session`,
        messageType: 'attendance_marked',
        bookingId: bookingId,
        attendanceData: {
          status: attendanceData.attendance_status,
          notes: attendanceData.session_notes,
          proof_photo_url: attendanceData.proof_photo_url
        }
      })
      return response.data
    } catch (error) {
      console.error('Error sending attendance message:', error)
      throw error
    }
  }
}

// Create and export a singleton instance
export const messagingService = new MessagingService()
export default messagingService
