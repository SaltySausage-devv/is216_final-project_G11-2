<template>
  <div class="chat-page">
    <!-- Floating Background Elements -->
    <div class="floating-elements">
      <div class="floating-icon" ref="floatingIcon1">
        <i class="fas fa-comments"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon2">
        <i class="fas fa-paper-plane"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon3">
        <i class="fas fa-heart"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon4">
        <i class="fas fa-smile"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon5">
        <i class="fas fa-lightbulb"></i>
      </div>
      <div class="floating-icon" ref="floatingIcon6">
        <i class="fas fa-star"></i>
      </div>
    </div>

    <!-- Chat Header -->
    <div class="cyberpunk-chat-header" ref="chatHeader">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-auto">
            <button class="cyberpunk-back-btn" @click="goBack" ref="backButton">
              <i class="fas fa-arrow-left"></i>
            </button>
          </div>
          <div class="col">
            <div class="cyberpunk-chat-tutor-info">
              <div class="cyberpunk-tutor-avatar-small">
                <img :src="tutor.avatar" :alt="tutor.name" class="cyberpunk-avatar-img">
              </div>
              <div class="cyberpunk-tutor-details">
                <h5 class="cyberpunk-tutor-name">{{ tutor.name }}</h5>
                <p class="cyberpunk-tutor-status">
                  <i class="fas fa-circle cyberpunk-online"></i> Online
                </p>
              </div>
            </div>
          </div>
          <div class="col-auto">
            <button class="cyberpunk-menu-btn" ref="menuButton">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Messages -->
    <div class="cyberpunk-chat-messages" ref="chatMessages">
      <div class="container">
        <div class="cyberpunk-messages-container">
          <!-- Welcome Message -->
          <div class="cyberpunk-message cyberpunk-message-tutor" ref="welcomeMessage">
            <div class="cyberpunk-message-avatar">
              <img :src="tutor.avatar" :alt="tutor.name" class="cyberpunk-avatar-img">
            </div>
            <div class="cyberpunk-message-content">
              <div class="cyberpunk-message-bubble">
                <p>Hello! I'm {{ tutor.name }}. I'm excited to help you with {{ tutor.subject }}! How can I assist you today?</p>
              </div>
              <div class="cyberpunk-message-time">Just now</div>
            </div>
          </div>

          <!-- Sample Messages -->
          <div class="cyberpunk-message cyberpunk-message-user" ref="userMessage1">
            <div class="cyberpunk-message-content">
              <div class="cyberpunk-message-bubble">
                <p>Hi! I'm interested in booking a session for {{ tutor.subject }}. What times are you available?</p>
              </div>
              <div class="cyberpunk-message-time">2 minutes ago</div>
            </div>
          </div>

          <div class="cyberpunk-message cyberpunk-message-tutor" ref="tutorMessage1">
            <div class="cyberpunk-message-avatar">
              <img :src="tutor.avatar" :alt="tutor.name" class="cyberpunk-avatar-img">
            </div>
            <div class="cyberpunk-message-content">
              <div class="cyberpunk-message-bubble">
                <p>Great! I'm available Monday to Friday from 9 AM to 6 PM. I charge ${{ tutor.hourlyRate }}/hour. Would you like to schedule a session?</p>
              </div>
              <div class="cyberpunk-message-time">1 minute ago</div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div class="cyberpunk-typing-indicator" ref="typingIndicator" v-if="isTyping">
            <div class="cyberpunk-message-avatar">
              <img :src="tutor.avatar" :alt="tutor.name" class="cyberpunk-avatar-img">
            </div>
            <div class="cyberpunk-message-content">
              <div class="cyberpunk-message-bubble cyberpunk-typing-bubble">
                <div class="cyberpunk-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Input -->
    <div class="cyberpunk-chat-input" ref="chatInput">
      <div class="container">
        <div class="cyberpunk-input-container">
          <div class="cyberpunk-input-wrapper">
            <input 
              type="text" 
              v-model="newMessage" 
              @keypress.enter="sendMessage"
              placeholder="Type your message..."
              class="cyberpunk-message-input"
              ref="messageInput"
            >
            <button class="cyberpunk-send-btn" @click="sendMessage" :disabled="!newMessage.trim()" ref="sendButton">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createTimeline, animate } from 'animejs'

export default {
  name: 'Chat',
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // Tutor data (in real app, this would come from API)
    const tutor = ref({
      id: route.params.tutorId || 1,
      name: 'Dr. Sarah Chen',
      subject: 'Mathematics',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
      hourlyRate: 80
    })

    // Chat state
    const newMessage = ref('')
    const isTyping = ref(false)
    const messages = ref([])

    // Refs for animations
    const chatHeader = ref(null)
    const chatMessages = ref(null)
    const chatInput = ref(null)
    const backButton = ref(null)
    const menuButton = ref(null)
    const sendButton = ref(null)
    const messageInput = ref(null)
    const welcomeMessage = ref(null)
    const userMessage1 = ref(null)
    const tutorMessage1 = ref(null)
    const typingIndicator = ref(null)
    const floatingIcon1 = ref(null)
    const floatingIcon2 = ref(null)
    const floatingIcon3 = ref(null)
    const floatingIcon4 = ref(null)
    const floatingIcon5 = ref(null)
    const floatingIcon6 = ref(null)

    const goBack = () => {
      router.back()
    }

    const sendMessage = () => {
      if (!newMessage.value.trim()) return
      
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        text: newMessage.value,
        sender: 'user',
        timestamp: new Date()
      }
      messages.value.push(userMessage)
      
      // Clear input
      newMessage.value = ''
      
      // Show typing indicator
      isTyping.value = true
      
      // Simulate tutor response after delay
      setTimeout(() => {
        isTyping.value = false
        
        const tutorResponse = {
          id: Date.now() + 1,
          text: "Thanks for your message! I'll get back to you soon.",
          sender: 'tutor',
          timestamp: new Date()
        }
        messages.value.push(tutorResponse)
      }, 2000)
    }

    const initChatAnimations = () => {
      // Chat entrance animation
      const chatTimeline = createTimeline({
        duration: 800,
        ease: 'easeOutExpo'
      })

      // Header animation
      chatTimeline.add({
        targets: chatHeader.value,
        translateY: [-50, 0],
        opacity: [0, 1],
        duration: 400
      })

      // Messages animation
      chatTimeline.add({
        targets: chatMessages.value,
        translateY: [30, 0],
        opacity: [0, 1],
        duration: 400
      }, '-=200')

      // Input animation
      chatTimeline.add({
        targets: chatInput.value,
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 400
      }, '-=200')

      // Stagger message animations
      const messageElements = [welcomeMessage.value, userMessage1.value, tutorMessage1.value].filter(Boolean)
      messageElements.forEach((message, index) => {
        if (message) {
          animate(message, {
            translateX: [index % 2 === 0 ? -30 : 30, 0],
            opacity: [0, 1],
            duration: 300,
            delay: 500 + (index * 200),
            ease: 'easeOutExpo'
          })
        }
      })

      // Floating elements animation
      const floatingElements = [floatingIcon1.value, floatingIcon2.value, floatingIcon3.value, floatingIcon4.value, floatingIcon5.value, floatingIcon6.value].filter(Boolean)
      floatingElements.forEach((element, index) => {
        if (element) {
          animate(element, {
            translateY: [0, -20, 0],
            opacity: [0.1, 0.3, 0.1],
            duration: 3000,
            delay: index * 500,
            loop: true,
            ease: 'easeInOutSine'
          })
        }
      })
    }

    const animateNewMessage = (messageElement) => {
      if (messageElement) {
        animate(messageElement, {
          scale: [0, 1],
          opacity: [0, 1],
          duration: 300,
          ease: 'easeOutBack'
        })
      }
    }

    onMounted(() => {
      setTimeout(() => {
        initChatAnimations()
      }, 100)
    })

    return {
      tutor,
      newMessage,
      isTyping,
      messages,
      chatHeader,
      chatMessages,
      chatInput,
      backButton,
      menuButton,
      sendButton,
      messageInput,
      welcomeMessage,
      userMessage1,
      tutorMessage1,
      typingIndicator,
      floatingIcon1,
      floatingIcon2,
      floatingIcon3,
      floatingIcon4,
      floatingIcon5,
      floatingIcon6,
      goBack,
      sendMessage,
      animateNewMessage
    }
  }
}
</script>

<style scoped>
/* Chat Page */
.chat-page {
  background: var(--cyber-bg);
  color: var(--cyber-text);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* Floating Background Elements */
.floating-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-icon {
  position: absolute;
  color: var(--cyber-orange);
  opacity: 0.1;
  font-size: 2rem;
}

.floating-icon:nth-child(1) { top: 10%; left: 10%; }
.floating-icon:nth-child(2) { top: 20%; right: 15%; }
.floating-icon:nth-child(3) { top: 60%; left: 5%; }
.floating-icon:nth-child(4) { top: 70%; right: 10%; }
.floating-icon:nth-child(5) { top: 30%; left: 50%; }
.floating-icon:nth-child(6) { top: 80%; right: 30%; }

/* Chat Header */
.cyberpunk-chat-header {
  background: rgba(26, 26, 26, 0.95);
  border-bottom: 2px solid var(--cyber-orange);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(15px);
}

.cyberpunk-back-btn {
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid var(--cyber-orange);
  color: var(--cyber-orange);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cyberpunk-back-btn:hover {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.3);
}

.cyberpunk-chat-tutor-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cyberpunk-tutor-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--cyber-orange);
  overflow: hidden;
  flex-shrink: 0;
}

.cyberpunk-tutor-avatar-small .cyberpunk-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cyberpunk-tutor-name {
  color: var(--cyber-text);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.cyberpunk-tutor-status {
  color: var(--cyber-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.cyberpunk-online {
  color: var(--cyber-green);
  font-size: 0.8rem;
  margin-right: 0.5rem;
}

.cyberpunk-menu-btn {
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid var(--cyber-orange);
  color: var(--cyber-orange);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cyberpunk-menu-btn:hover {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.3);
}

/* Chat Messages */
.cyberpunk-chat-messages {
  flex: 1;
  padding: 2rem 0;
  overflow-y: auto;
  z-index: 2;
}

.cyberpunk-messages-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.cyberpunk-message {
  display: flex;
  margin-bottom: 1.5rem;
  align-items: flex-end;
}

.cyberpunk-message-user {
  justify-content: flex-end;
}

.cyberpunk-message-tutor {
  justify-content: flex-start;
}

.cyberpunk-message-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid var(--cyber-orange);
  overflow: hidden;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.cyberpunk-message-avatar .cyberpunk-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cyberpunk-message-content {
  max-width: 70%;
}

.cyberpunk-message-bubble {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid var(--cyber-grey);
  border-radius: 18px;
  padding: 1rem 1.25rem;
  position: relative;
  backdrop-filter: blur(10px);
}

.cyberpunk-message-user .cyberpunk-message-bubble {
  background: var(--cyber-orange);
  color: var(--cyber-dark);
  border-color: var(--cyber-orange);
}

.cyberpunk-message-tutor .cyberpunk-message-bubble {
  background: rgba(26, 26, 26, 0.8);
  color: var(--cyber-text);
  border-color: var(--cyber-grey);
}

.cyberpunk-message-bubble p {
  margin: 0;
  line-height: 1.4;
}

.cyberpunk-message-time {
  color: var(--cyber-text-muted);
  font-size: 0.8rem;
  margin-top: 0.5rem;
  text-align: right;
}

.cyberpunk-message-tutor .cyberpunk-message-time {
  text-align: left;
}

/* Typing Indicator */
.cyberpunk-typing-indicator {
  display: flex;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}

.cyberpunk-typing-bubble {
  background: rgba(26, 26, 26, 0.8);
  border: 1px solid var(--cyber-grey);
  border-radius: 18px;
  padding: 1rem 1.25rem;
  backdrop-filter: blur(10px);
}

.cyberpunk-typing-dots {
  display: flex;
  gap: 4px;
}

.cyberpunk-typing-dots span {
  width: 8px;
  height: 8px;
  background: var(--cyber-orange);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.cyberpunk-typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.cyberpunk-typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Chat Input */
.cyberpunk-chat-input {
  background: rgba(26, 26, 26, 0.95);
  border-top: 2px solid var(--cyber-orange);
  padding: 1.5rem 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
  backdrop-filter: blur(15px);
}

.cyberpunk-input-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.cyberpunk-input-wrapper {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.cyberpunk-message-input {
  flex: 1;
  background: rgba(26, 26, 26, 0.8);
  border: 2px solid var(--cyber-grey);
  border-radius: 25px;
  padding: 1rem 1.5rem;
  color: var(--cyber-text);
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.cyberpunk-message-input:focus {
  outline: none;
  border-color: var(--cyber-orange);
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.2);
}

.cyberpunk-message-input::placeholder {
  color: var(--cyber-text-muted);
}

.cyberpunk-send-btn {
  background: var(--cyber-orange);
  border: none;
  color: var(--cyber-dark);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
}

.cyberpunk-send-btn:hover:not(:disabled) {
  background: var(--cyber-yellow);
  box-shadow: 0 0 20px rgba(255, 165, 0, 0.4);
  transform: scale(1.05);
}

.cyberpunk-send-btn:disabled {
  background: var(--cyber-grey);
  color: var(--cyber-text-muted);
  cursor: not-allowed;
  opacity: 0.5;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cyberpunk-messages-container {
    padding: 0 0.5rem;
  }
  
  .cyberpunk-message-content {
    max-width: 85%;
  }
  
  .cyberpunk-message-bubble {
    padding: 0.75rem 1rem;
  }
  
  .cyberpunk-input-wrapper {
    gap: 0.5rem;
  }
  
  .cyberpunk-message-input {
    padding: 0.75rem 1rem;
  }
  
  .cyberpunk-send-btn {
    width: 45px;
    height: 45px;
  }
}
</style>
