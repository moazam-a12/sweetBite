// Landing Page - Redirect to unified login
document.addEventListener("DOMContentLoaded", () => {
  const roleCards = document.querySelectorAll('.role-card');
  
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
    
    const btn = card.querySelector('.btn-apple');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = 'login.html';
      });
    }
  });

  // Smooth fade-in animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  roleCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(card);
  });
});