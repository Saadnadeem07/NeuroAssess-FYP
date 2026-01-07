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
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` folder with the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 3️⃣ Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` folder with the following:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing
- Manual testing completed and test cases available in documentation.
- Integrated AI models verified for handwriting analysis.

---

## 🤝 Contributors

| Name         | GitHub Username                                      |
|--------------|------------------------------------------------------|
| Saad Habib   | [@Saadidream](https://github.com/Saadidream)         |
| Abdul Basit  | [@theabdulbasitt](https://github.com/theabdulbasitt) |
| Saad Nadeem  | [@Saadnadeem07](https://github.com/Saadnadeem07)     |

---

## 📄 License
This project is protected under the intellectual property of **FAST-NUCES** and cannot be reused without explicit permission.

---

## 📬 Contact
For collaboration or research extensions, contact:  
**Saad Nadeem** - saadnadeem5509@gmail.com

---

> "Empowering neurodivergent students through technology."
