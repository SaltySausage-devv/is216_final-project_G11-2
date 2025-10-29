<template>
  <section class="tos">
    <div class="container">
      <header class="page-header">
        <h1>Terms of Service</h1>
        <p class="subtitle">This is placeholder legal text. Replace with your actual terms.</p>
      </header>

      <article class="section">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using our services, you agree to be bound by these Terms.</p>
      </article>

      <article class="section">
        <h2>2. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
      </article>

      <article class="section">
        <h2>3. Usage Guidelines</h2>
        <p>Do not misuse the service. Respect applicable laws and other users.</p>
      </article>

      <article class="section">
        <h2>4. Termination</h2>
        <p>We may suspend or terminate accounts that violate these Terms.</p>
      </article>

      <article class="section">
        <h2>5. Contact</h2>
        <p>Questions? Contact us at support@example.com.</p>
      </article>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TermsOfService',
}
</script>

<style scoped>
.tos {
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

.section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.section h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.section p {
  margin: 0;
  color: #4b5563;
}
</style>
