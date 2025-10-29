<template>
  <section class="blog-index">
    <div class="container">
      <header class="page-header">
        <h1>Blog</h1>
        <p class="subtitle">Latest articles and updates. Placeholder content.</p>
      </header>

      <div class="posts-grid">
        <article v-for="post in posts" :key="post.slug" class="post-card">
          <img class="thumb" :src="post.image" :alt="post.title" />
          <div class="content">
            <h2>
              <router-link :to="`/blog/${post.slug}`">{{ post.title }}</router-link>
            </h2>
            <p class="excerpt">{{ post.excerpt }}</p>
            <p class="meta">By {{ post.author }} • {{ post.date }} • {{ post.readingTime }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'BlogIndex',
  data() {
    return {
      posts: [
        {
          slug: 'hello-world',
          title: 'Hello World',
          excerpt: 'Welcome to our new blog. Here is what to expect... ',
          author: 'Admin',
          date: new Date().toLocaleDateString(),
          readingTime: '3 min read',
          image: 'https://picsum.photos/seed/hello/640/360',
        },
        {
          slug: 'tips-for-students',
          title: 'Top Study Tips for Students',
          excerpt: 'Boost your productivity with these proven study techniques.',
          author: 'Team',
          date: new Date().toLocaleDateString(),
          readingTime: '5 min read',
          image: 'https://picsum.photos/seed/tips/640/360',
        },
        {
          slug: 'platform-updates',
          title: 'Platform Updates – What’s New',
          excerpt: 'A quick rundown of the latest improvements and features.',
          author: 'Product',
          date: new Date().toLocaleDateString(),
          readingTime: '4 min read',
          image: 'https://picsum.photos/seed/updates/640/360',
        },
      ],
    }
  },
}
</script>

<style scoped>
.blog-index {
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

.subtitle {
  margin: 0;
  color: #ffffff;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  color: var(--cyber-orange)
}

.post-card {
  border: 1px solid var(--cyber-orange);
  border-radius: 8px;
  background: var(--cyber-grey-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.thumb {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.content {
  padding: 16px;
}

.content h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.excerpt {
  margin: 0 0 12px 0;
  color: #ffffff;
}

.meta {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}
</style>
