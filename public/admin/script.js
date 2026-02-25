const API_URL = '/api';

// Protocol Check
if (window.location.protocol === 'file:') {
    alert("CRITICAL ERROR: You are opening this file directly.\n\nYou MUST run the 'run_editor.bat' file to start the server. The editor cannot save posts or upload images without the server running.");
    document.body.innerHTML = '<div style="padding: 50px; text-align: center;"><h1>Error</h1><p>Please run <b>run_editor.bat</b> to use the editor.</p></div>';
    throw new Error("File protocol detected");
}

const form = document.getElementById('postForm');
const postsList = document.getElementById('postsList');
// const uploadBtn removed
const galleryUploadBtn = document.getElementById('galleryUploadBtn');
let posts = [];
let editingIndex = -1;
let galleryImages = [];

async function fetchPosts() {
    try {
        const res = await fetch(`${API_URL}/posts`);
        posts = await res.json();
        renderPosts();
    } catch (err) {
        console.error('Error fetching posts:', err);
    }
}

function renderPosts() {
    postsList.innerHTML = '';
    // Sort logic here if needed, but assuming api returns them or we sort them
    // Let's sort newest date first
    const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedPosts.forEach((post) => {
        // Find original index
        const originalIndex = posts.indexOf(post);

        const div = document.createElement('div');
        div.className = 'post-item';
        div.innerHTML = `
            <h3>${post.title}</h3>
            <div class="date">${post.date}</div>
            <div class="post-actions">
                <button onclick="editPost(${originalIndex})" class="secondary-btn">Edit</button>
                <button onclick="deletePost(${originalIndex})" class="danger-btn">Delete</button>
            </div>
        `;
        postsList.appendChild(div);
    });
}

function editPost(index) {
    editingIndex = index;
    const post = posts[index];

    document.getElementById('title').value = post.title;
    document.getElementById('date').value = post.date;
    document.getElementById('content').value = post.content || '';
    document.getElementById('carouselPosition').value = post.carouselPosition || 'bottom';

    // Handle gallery
    galleryImages = post.gallery || [];
    renderGalleryPreview();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deletePost(index) {
    if (confirm('Are you sure you want to delete this post?')) {
        posts.splice(index, 1);
        savePosts();
    }
}

async function savePosts() {
    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(posts)
        });
        if (res.ok) {
            alert('Saved successfully!');
            fetchPosts(); // Reload to refresh list and order
            resetForm();
        } else {
            alert('Error saving data.');
        }
    } catch (err) {
        console.error('Error saving:', err);
        alert('Error saving data.');
    }
}

document.getElementById('cancelBtn').addEventListener('click', resetForm);

function resetForm() {
    form.reset();
    editingIndex = -1;
    galleryImages = [];
    renderGalleryPreview();
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newPost = {
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        content: document.getElementById('content').value,
        carouselPosition: document.getElementById('carouselPosition').value,
        gallery: galleryImages
    };

    if (editingIndex >= 0) {
        posts[editingIndex] = newPost;
    } else {
        posts.unshift(newPost); // Add to beginning
    }

    savePosts();
});

// Gallery Upload Logic
// ... (rest is the same)

// Gallery Upload Logic
galleryUploadBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('galleryUpload');
    const files = fileInput.files;
    if (files.length === 0) return alert('Please select files.');

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                galleryImages.push(data.url);
            }
        } catch (err) {
            console.error('Upload error', err);
        }
    }
    renderGalleryPreview();
});

function renderGalleryPreview() {
    const container = document.getElementById('galleryList');
    container.innerHTML = '';
    galleryImages.forEach((url, idx) => {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'gallery-thumb';
        img.onclick = () => {
            // Simple remove on click preference
            if (confirm('Remove this image from gallery?')) {
                galleryImages.splice(idx, 1);
                renderGalleryPreview();
            }
        };
        container.appendChild(img);
    });
}

// Set today's date default
document.getElementById('date').valueAsDate = new Date();

// Init
fetchPosts();
