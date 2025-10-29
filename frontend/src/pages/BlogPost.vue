<template>
  <article class="blog-post">
    <div class="container">
      <header class="post-header">
        <h1>{{ title }}</h1>
        <p class="meta">By {{ author }} • {{ date }} • {{ readingTime }}</p>
      </header>

      <img class="cover" src="https://picsum.photos/1200/480" alt="Post cover" />

      <section class="content">
        <p>
          This is a placeholder blog post for <strong>{{ slug }}</strong>. Replace this with
          your real content. You can render markdown here, add images, quotes, and more.
        </p>
        <h2>Subheading</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna,
          vel scelerisque nisl consectetur et. Vestibulum id ligula porta felis euismod semper.
        </p>
        <ul>
          <li>Key point one</li>
          <li>Key point two</li>
          <li>Key point three</li>
        </ul>
      </section>

      <footer class="post-footer">
        <router-link to="/">← Back to Home</router-link>
      </footer>
    </div>
  </article>
</template>

<script>
export default {
  name: 'BlogPost',
  data() {
    const slug = this.$route.params.slug
    return {
      slug,
      title: 'Sample Blog Post',
      author: 'Admin',
      date: new Date().toLocaleDateString(),
      readingTime: '4 min read',
    }
  },
  watch: {
    '$route.params.slug'(newSlug) {
      this.slug = newSlug
    }
  }
}
</script>

<style scoped>
.blog-post {
  padding: 48px 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.post-header {
  margin-bottom: 16px;
}

.post-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  line-height: 1.2;
}

.meta {
  margin: 0;
  color: #6b7280;
}

.cover {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0 24px 0;
}

.content h2 {
  font-size: 22px;
  margin: 16px 0 8px 0;
}

.content p {
  color: #4b5563;
  margin: 0 0 12px 0;
}

.content ul {
  padding-left: 20px;
}

.post-footer {
  margin-top: 24px;
}
</style>
