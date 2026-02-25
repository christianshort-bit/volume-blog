document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('postsContainer');

    if (window.location.protocol === 'file:') {
        container.innerHTML = '<div class="loading">Error: You are viewing this file directly. Please open it via the server (http://localhost:3000).</div>';
        return;
    }

    fetch('blog-data.json')
        .then(response => response.json())
        .then(posts => {
            if (posts.length === 0) {
                container.innerHTML = '<div class="loading">No posts found.</div>';
                return;
            }

            // Sort by Date Descending
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            container.innerHTML = posts.map(createPostHTML).join('');
        })
        .catch(err => {
            console.error('Error loading posts:', err);
            container.innerHTML = `<div class="loading">Error loading blog entries: ${err.message}</div>`;
        });
});

function createPostHTML(post) {
    // Format Date
    const dateObj = new Date(post.date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Gallery - Carousel
    let galleryHTML = '';
    if (post.gallery && post.gallery.length > 0) {
        galleryHTML = `
            <div class="gallery-carousel" id="carousel-${post.date}">
                <button class="carousel-btn prev" onclick="moveCarousel('${post.date}', -1)">&#10094;</button>
                <div class="gallery-track-container">
                    <div class="gallery-track" id="track-${post.date}" data-index="0">
                        ${post.gallery.map(img => `
                            <div class="gallery-item">
                                <img src="${img}" loading="lazy" onclick="openLightbox('${img}')">
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button class="carousel-btn next" onclick="moveCarousel('${post.date}', 1)">&#10095;</button>
            </div>
        `;
    }

    const carouselPosition = post.carouselPosition || 'bottom';

    return `
        <article class="blog-post">
            <header class="post-header">
                <span class="post-date">${dateStr}</span>
                <h2 class="post-title">${post.title}</h2>
            </header>
            
            ${carouselPosition === 'top' ? galleryHTML : ''}

            <div class="post-content">
                ${formatContent(post.content)}
            </div>

            ${carouselPosition === 'bottom' ? galleryHTML : ''}
        </article>
    `;
}

// Global function to handle carousel movement
window.moveCarousel = function (id, direction) {
    const track = document.getElementById(`track-${id}`);
    if (!track) return;

    const items = track.children;
    const totalItems = items.length;
    const itemsVisible = 3; // We show 3 at a time

    // Logic: ensure index stays within bounds
    // Max index = totalItems - itemsVisible
    // If totalItems < itemsVisible, we don't need to scroll really, or index is just 0

    let currentIndex = parseInt(track.dataset.index || '0');
    const maxIndex = Math.max(0, totalItems - itemsVisible);

    let newIndex = currentIndex + direction;

    // Loop or Clamp? "cycle through images" suggests looping, or just stopping at ends.
    // Let's stop at ends for now for simplicity, or cycle if requested. 
    // "cycle through any images" -> suggests looping.

    if (newIndex < 0) newIndex = maxIndex;
    if (newIndex > maxIndex) newIndex = 0;

    track.dataset.index = newIndex;

    // Percentage to move: 100% / 3 = 33.33% per item
    const movePercent = newIndex * (100 / itemsVisible);
    track.style.transform = `translateX(-${movePercent}%)`;
};

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

window.openLightbox = function (src) {
    if (!lightbox || !lightboxImg) return; // Guard for Admin page which uses script.js
    lightboxImg.src = src;
    lightbox.classList.add('active');
};

if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
}

if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

function formatContent(content) {
    if (!content) return '';
    // Simple safety check or auto-paragraphing could go here
    // For now, assume content is safe HTML or text
    // Convert newlines to breaks if it doesn't look like HTML
    if (!content.includes('<p>') && !content.includes('<div>')) {
        return content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
    }
    return content;
}
