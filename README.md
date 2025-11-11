<h1 align="center">🩺 SuLife</h1>
<p align="center">
<b>A MERN-based Organ and Blood Donation Management System</b>  
<br/>
Connecting donors, hospitals, and administrators to streamline and manage organ & blood donations effectively.
</p>

---

## 🚀 Features

### 👨‍💼 Admin
- ✅ Verify new donor and hospital registrations  
- 📋 View all registered donors, hospitals & organ requests  
- 📊 View donation statistics and overall system activity  
- 👁️ Monitor and manage the entire platform  

### 🏥 Hospital
- 📬 View and manage donor responses  
- 💌 Accept or reject organ requests  
- 🧠 Request organs for specific patients  
- 👀 View donor details and match status  

### 💉 Donor
- 🧾 Register as a donor with complete details  
- 📥 View incoming organ requests from hospitals  
- 🤝 Accept or decline donation requests  
- 🔍 Track request and donation status  

---

## 🤖 Machine Learning Integration
- 🧬 Built-in ML model (in `ml_training/`) predicts compatibility between donors and patients.  
- ⚙️ The Python API (`model_api.py`) integrates seamlessly with the Node.js backend to suggest suitable donor-recipient matches.

---

## 🗂️ Project Structure
SuLife/
│
├── client/ # React frontend
├── server/ # Express + Node.js backend
├── ml_training/ # Machine Learning model and API
├── .gitignore
└── README.md


## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, Axios, Plain CSS |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **ML Model** | Python (Flask / FastAPI) |
| **Authentication** | JWT, Bcrypt |
| **Notifications** | Nodemailer |

---

## ⚙️ Setup Instructions (Local Development)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/ThejashwiniSrinivas/SuLife.git
cd SuLife
2️⃣ Start the Backend Server
cd server
npm install
npm run dev
3️⃣ Start the Frontend (React)
cd ../client
npm install
npm run dev
4️⃣ Start the Machine Learning API
cd ../ml_training
python model_api.py
5️⃣ (Optional) Start MongoDB Change Stream Listener
cd ../server
node changeStreamListener.js

🧰 Commands Summary
Task	Command
🖥️ Start backend	npm run dev (in /server)
💻 Start frontend	npm run dev (in /client)
🧠 Run ML API	python model_api.py
🔁 Run listener	node changeStreamListener.js

🌱 Future Enhancements
💬 Donor-Hospital chat integration

✉️ Real-time email & SMS notifications

🎨 UI upgrade using Tailwind CSS

🧾 Donation history tracking

📈 Hospital analytics dashboard

👩‍💻 Author
Thejashwini Srinivas
💼 MERN Stack 

⭐ If you like this project, please give it a star on GitHub!
It helps others discover this project 😊
