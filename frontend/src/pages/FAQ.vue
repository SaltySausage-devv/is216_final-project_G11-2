<template>
  <section class="faq">
    <div class="container">
      <header class="page-header">
        <h1>Frequently Asked Questions</h1>
        <p class="subtitle">For more detailed questions, please contact us at (insert number)</p>
      </header>

      <ul class="faq-list">
        <li v-for="(item, index) in items" :key="index" class="faq-item">
          <button class="faq-question" @click="toggle(index)" :aria-expanded="openIndex === index">
            <span>{{ item.q }}</span>
            <span class="chevron" :class="{ open: openIndex === index }">⌄</span>
          </button>
          <div v-show="openIndex === index" class="faq-answer">
            <p>{{ item.a }}</p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
export default {
  name: 'FAQ',
  data() {
    return {
      openIndex: 0,
      items: [
        { q: 'How do I sign up?', a: 'Click Register in the top navigation and follow the steps.' },
        { q: 'Is there a free trial?', a: 'Yes, you can try basic features for 14 days.' },
        { q: 'How do I contact support?', a: 'Use the Contact form or email support@example.com.' },
        { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel from your account settings.' },
      ],
    }
  },
  methods: {
    toggle(index) {
      this.openIndex = this.openIndex === index ? -1 : index
    },
  },
}
</script>

<style scoped>
.faq {
  padding: 48px 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  line-height: 1.2;
}

.subtitle {
  margin: 0;
  color: #6b7280;
}

.faq-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.faq-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  margin-bottom: 12px;
  overflow: hidden;
}

.faq-question {
  width: 100%;
  text-align: left;
  background: #f9fafb;
  border: 0;
  padding: 16px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.faq-answer {
  padding: 16px;
  color: #4b5563;
  background: #ffffff;
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}
</style>
