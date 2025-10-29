<template>
  <section class="success-stories">
    <div class="container">
      <header class="page-header">
        <h1>Success Stories</h1>
        <p class="subtitle">Over the years, Tutor Connect has allowed students to find appropriate tutors. Let's hear some of them!</p>
      </header>

      <div class="stories-grid">
        <article class="story-card" v-for="(story, index) in scriptData" :key="index">
          <div class="image-skeleton" aria-hidden="true" />
          <div class="story-content">
            <h2>{{ story.title }}</h2>
            <p>
             {{story.content}}
            </p>
            <div class="meta">
              <span class="tag">Category</span>
              <span class="date">2025-01-0{{ story.date }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";

export default {
  name: 'SuccessStories',
  setup () {
    const scriptData = ref([]);
    scriptData.value = [
      {title: "She's such a great person.", content: "yaperoni yaperoni", date: "2025-01-24"},
      {title: "She's such a great person.", content: "yaperoni yaperoni", date: "2025-01-24"},
      {title: "She's such a great person.", content: "yaperoni yaperoni", date: "2025-01-24"},
    ];
  return{
    scriptData
  }
  }
  
};

</script>

<style scoped>
.success-stories {
  padding: 48px 0;
}

.container {
  max-width: 1120px;
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

h2{
  color:grey
}

.subtitle {
  margin: 0;
  color: #6b7280; /* gray-500 */
}

.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.story-card {
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.image-skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  height: 140px;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.story-content {
  padding: 16px;
}

.story-content h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.story-content p {
  margin: 0 0 12px 0;
  color: #4b5563; /* gray-600 */
}

.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280; /* gray-500 */
}

.tag {
  background: #eef2ff; /* indigo-50 */
  color: #4338ca; /* indigo-700 */
  padding: 2px 8px;
  border-radius: 9999px;
}
</style>
