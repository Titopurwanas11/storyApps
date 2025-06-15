export const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });

  images.forEach(img => observer.observe(img));
};

export const optimizeStoryImages = () => {
  document.querySelectorAll('.story-image').forEach(img => {
    const src = img.getAttribute('src');
    if (src) {
      img.setAttribute('src', `${src}?w=400&h=300&format=webp&quality=80`);
    }
  });
};