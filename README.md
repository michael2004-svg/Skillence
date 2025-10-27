# 🌟 Skillence

**Skillence** is a modern career-building web application designed to empower job seekers, students, and professionals to grow their skills, showcase achievements, and connect with career opportunities.

---

## 🚀 Overview

Skillence brings together everything you need to manage your career journey — all in one place.  
It’s built with a clean, social-style interface and powered by cloud tools for a seamless experience.

### ✨ Key Features

#### 🏠 Home Feed
- A social-style dashboard where users can post updates, share experiences, and interact with others.  
- Supports text, image, video, document, and poll posts.  
- Like, comment, and follow features make networking easy.

#### 👤 Profile
- Personalized professional profile with experience, skills, goals, and CV-based “Skill Score”.  
- Displays followers, following, and performance metrics.  
- View and manage posts and profile details through intuitive tabs.

#### 💼 Career Hub
A one-stop section for professional growth tools:
- **CV Analyzer**: Upload your CV (PDF/DOC/DOCX) to get instant AI-powered feedback and optimization tips.
- **Jobs**: Search for global or local job opportunities by title and location.
- **Courses**: Browse, search, and enroll in curated learning programs.
- **Mentorship**: Connect with industry mentors for personalized career guidance.

#### 🔔 Notifications
- Real-time updates on likes, comments, and follows.  
- Filter notifications by type and mark all as read easily.

#### ➕ Create Posts
- Share ideas, projects, or milestones with rich media options.
- Control privacy settings for each post (public, connections, or private).

---

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend & Database**: [Supabase](https://supabase.com/) (for auth, storage, and data)
- **PDF Handling**: [PDF.js](https://mozilla.github.io/pdf.js/) and [jsPDF](https://github.com/parallax/jsPDF)
- **Hosting**: Any modern web hosting platform (e.g., Netlify, Vercel, Firebase, etc.)

---

## ⚙️ Project Structure
/root ├── home.html                  # Main user interface ├── /styles                    # CSS files for different modules │     ├── style.css │     ├── profile.css │     ├── cv.css │     ├── notification.css │     └── courses.css ├── /scripts                   # JavaScript logic │     ├── core.js │     ├── feed.js │     ├── cv_analyzer.js │     ├── jobs.js │     ├── posts.js │     ├── notification.js │     ├── courses.js │     └── mentors.js ├── /images                    # Profile and UI images └── README.md

---

## 🧠 How It Works

1. **User Authentication** – Powered by Supabase for secure signup/login.  
2. **Dynamic Tabs** – Single-page navigation across Home, Career, Notifications, and Profile.  
3. **CV Analysis** – Upload your CV for AI-driven review and insights on skills & relevance.  
4. **Data Storage** – User posts, notifications, and course data are synced in real-time.  
5. **Responsive Design** – Fully optimized for desktop and mobile use.