import { io } from 'socket.io-client'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

// Create a separate API client for messaging service
const messagingApi = axios.create({
  baseURL: 'http://localhost:3005',
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
    this.messageHandlers = new Map()
  }

  // Initialize Socket.io connection
  connect(token) {
    if (this.socket) {
      this.disconnect()
    }

          this.socket = io('http://localhost:3005', {
            auth: {
              token: token
            },
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
          })

          this.socket.on('connect', () => {
            console.log('Socket.io connected successfully')
            this.isConnected = true
          })

          this.socket.on('disconnect', () => {
            console.log('Socket.io disconnected')
            this.isConnected = false
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
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Set up Socket.io event handlers
  setupMessageHandlers() {
    this.socket.on('new_message', (message) => {
      console.log('Socket.io received new_message:', message)
      const handler = this.messageHandlers.get('new_message')
      if (handler) {
        console.log('Calling new_message handler')
        handler(message)
      } else {
        console.log('No new_message handler registered')
      }
    })

    this.socket.on('user_typing', (data) => {
      const handler = this.messageHandlers.get('user_typing')
      if (handler) {
        handler(data)
      }
    })

    this.socket.on('message_error', (error) => {
      const handler = this.messageHandlers.get('message_error')
      if (handler) {
        handler(error)
      }
    })
  }

  // Register event handlers
  on(event, handler) {
    this.messageHandlers.set(event, handler)
  }

  // Remove event handlers
  off(event) {
    this.messageHandlers.delete(event)
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
}

// Create and export a singleton instance
export const messagingService = new MessagingService()
export default messagingService
