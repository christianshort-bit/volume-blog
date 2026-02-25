# Project Handover Documentation

## Overview
This project is a JSON-driven blog with a dedicated Node.js editor backend.

## File Structure
- **`public/`**: Contains the frontend application.
    - `index.html`: The main blog feed.
    - `admin/`: The content editor interface.
    - `style.css`: Core styles (includes the "Century Gothic" typography and "builders blog" aesthetics).
    - `app.js`: Logic for fetching and rendering posts from `blog-data.json`.
    - `data/blog-data.json`: The database of posts.
- **`server.js`**: Express.js server. **Required** for the editor to function (handles image uploads and file writing).
- **`run_editor.bat`**: Windows startup script (auto-launches Chrome).

## Integration Notes for the Next Agent

### Frontend Integration
If you are moving the blog to another site, you primarily need the contents of `public/`.
- Ensure `style.css` is linked.
- Ensure `app.js` is loaded.
- Ensure the `assets/` folder is copied.

### Backend Requirements
The **Editor** (`/admin`) requires the Node.js server to be running because it needs to write to `blog-data.json` and save uploaded images to disk.
- If the target website is static (e.g., GitHub Pages), the *editor* will not work directly. You would need to run this local environment to author content, committing the generated `blog-data.json` and images to the repo.
- If the target website allows a Node.js backend, you can migrate `server.js` logic there.

### Design Specs
- **Font**: Century Gothic (Normal weight).
- **Colors**: White boxes on `#f2f2f2` background.
- **Shadows**: Heavy soft shadow (`box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15)`).
- **Layout**: Justified text boxes aligned with full-width carousels.
