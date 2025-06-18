# 🧠 NeuroAssess - Dyslexia & Dysgraphia Support System

NeuroAssess is an AI-powered web platform developed to assist in the **early detection and personalized support** for students with **dyslexia** and **dysgraphia**. Built using the **MERN stack (MongoDB, Express.js, React.js, Node.js)**, this system features AI-based handwriting analysis, customizable learning paths, role-based dashboards, and professional consultation support.

---

## 🌟 Key Features

- ✍️ **AI Handwriting Analysis** for early detection of dyslexia/dysgraphia
- 📚 **Personalized Learning Plans** powered by ML models
- 📈 **Progress Tracking** with detailed reports and analytics
- 👨‍⚕️ **Psychiatrist Consultation System** with appointment scheduling
- 🧑‍🎓 Role-based access for **Students**, **Parents**, **Psychiatrists**, and **Admins**
- 🔒 JWT-based **secure authentication & authorization**

---

## 🚀 Getting Started
Follow these steps to set up the project on your local machine.

### 📦 Prerequisites
Ensure you have the following installed:
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)
- Git

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Saadnadeem07/NeuroAssess-FYP.git
cd NeuroAssess-FYP
```

### 2️⃣ Backend Setup
```bash
cd server
npm install
# Configure your .env file here if required (e.g., DB_URI, JWT_SECRET, etc.)
npm start
```

### 3️⃣ Frontend Setup
```bash
cd ../client
npm install
# Create a .env file and add the API URL (example below)
# VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## 🗂️ Folder Structure
```
NeuroAssess-FYP/
├── server/       # Node.js + Express + MongoDB APIs
├── client/      # React.js (Vite) client with routing and UI
└── README.md      # Project documentation
```

---

## 🔐 Environment Variables
Make sure to add a `.env` file in both server (backend) and client (frontend) as needed.

### Backend `.env`
```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Testing
- Functional and unit testing is planned via Jest / Mocha (to be added in future versions)
- Manual testing completed and test cases available in documentation

---

## 🤝 Contributors

| Name         | GitHub Username                                      |
|--------------|------------------------------------------------------|
| Saad Habib   | [@Saadidream](https://github.com/Saadidream)        |
| Abdul Basit  | [@theabdulbasitt](https://github.com/theabdulbasitt)|
| Saad Nadeem  | [@Saadnadeem07](https://github.com/Saadnadeem07)    |


---

## 📄 License
This project is protected under the intellectual property of **FAST-NUCES** and cannot be reused without explicit permission.

---

## 📬 Contact
For collaboration or research extensions, contact:
**Saad Nadeem** - saadnadeem5509@gmail.com

---

> "Empowering neurodivergent students through technology."
