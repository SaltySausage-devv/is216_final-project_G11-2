<template>
  <footer class="cyberpunk-footer text-light py-5 mt-3">
    <div class="container">
      <div class="row">
        <div class="col-lg-4 mb-4">
          <div class="d-flex align-items-center mb-3">
            <i class="fas fa-graduation-cap text-primary me-2 fs-4"></i>
            <span class="fw-bold fs-4">OnlyTutor</span>
          </div>
          <p class="text-muted">
            Connecting students with the best tutors and tuition centres in Singapore. 
            Find your perfect match for academic success.
          </p>
          <div class="d-flex gap-3">
            <a href="#" class="text-light">
              <i class="fab fa-facebook-f"></i>
            </a>
            <a href="#" class="text-light">
              <i class="fab fa-twitter"></i>
            </a>
            <a href="#" class="text-light">
              <i class="fab fa-instagram"></i>
            </a>
            <a href="#" class="text-light">
              <i class="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>
        
        <div class="col-lg-2 col-md-6 mb-4">
          <h5 class="fw-bold mb-3">For Students</h5>
          <ul class="list-unstyled">
            <li class="mb-2">
              <router-link to="/search" class="text-muted text-decoration-none">
                Find Tutors
              </router-link>
            </li>
          </ul>
        </div>
        
        <div class="col-lg-2 col-md-6 mb-4">
          <h5 class="fw-bold mb-3">For Tutors</h5>
          <ul class="list-unstyled">
            <li class="mb-2">
              <router-link to="/register" class="text-muted text-decoration-none">Become a Tutor
              </router-link>
            </li>
            <li class="mb-2">
              <a href="#" class="text-muted text-decoration-none">Success Stories</a>
            </li>
          </ul>
        </div>
        
        <div class="col-lg-2 col-md-6 mb-4">
          <h5 class="fw-bold mb-3">Company</h5>
          <ul class="list-unstyled">
            <li class="mb-2">
              <router-link to="/Home" class="text-muted text-decoration-none">About Us</router-link>
            </li>
            <li class="mb-2">
              <a href="#" class="text-muted text-decoration-none">Blog</a>
            </li>
          </ul>
        </div>
        
        <div class="col-lg-2 col-md-6 mb-4">
          <h5 class="fw-bold mb-3">Support</h5>
          <ul class="list-unstyled">
            <li class="mb-2">
              <a href="#" class="text-muted text-decoration-none">Help Center</a>
            </li>
            <li class="mb-2">
              <a href="#" class="text-muted text-decoration-none">Contact Us</a>
            </li>
            <li class="mb-2">
              <a href="#" class="text-muted text-decoration-none">Privacy Policy</a>
            </li>
            <li class="mb-2">
              <a href="#" class="text-muted text-decoration-none">Terms of Service</a>
            </li>
          </ul>
        </div>
      </div>
      
      <hr class="my-4">
      
      <div class="row align-items-center">
        <div class="col-md-6">
          <p class="text-muted mb-0">
            &copy; 2024 OnlyTutor. All rights reserved.
          </p>
        </div>
        <div class="col-md-6 text-md-end">
          <p class="text-muted mb-0">
            Made with <i class="fas fa-heart text-danger"></i> in Singapore
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
footer a:hover {
  color: var(--primary-color) !important;
  transition: color 0.3s ease;
}

.fab {
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.fab:hover {
  transform: translateY(-2px);
  color: var(--primary-color) !important;
}
</style>
