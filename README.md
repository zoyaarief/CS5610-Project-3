# CS5610-Project-3
🌎 Travel Tracker for the United States

Authors

Theresa Coleman – User Authentication, Account Management, State Information Pages

Stewart Almeida – Trip Logging, Map Visualization, Dashboard & Stats

Course: CS5610 Web Development
Instructor: John Alexis Guerra Gomez

🎯 Project Objective

This project is a full-stack web application that lets users track their travels across the United States.
Users can create an account, log trips they’ve taken, and view a color-coded U.S. map that highlights the states they’ve visited.

Each user can:

✈️ Create an account and securely log in/out

🧑‍💻 Edit or delete their account information

🗺️ Add, edit, and delete trips

💸 View travel statistics (total states visited, total trip costs, % of U.S. covered)

📍 Browse state detail pages with regional info and fun facts

🧠 Tech Stack
Layer	Technology
Frontend	React (Hooks), Vite, HTML5, CSS3
Backend	Node.js, Express
Database	MongoDB (using official driver, no Mongoose)
Libraries	react-simple-maps (for U.S. map), bcryptjs, jsonwebtoken
Development Tools	Prettier (code formatting), ESLint (linting), GitHub, VS Code
🧑‍🎨 Design Overview

Theresa focused on user account management and authentication, while Stewart focused on trip management and visualization.
Together, these features create a complete travel-tracking experience.

Key Features
👤 User Accounts (Theresa)

Create account (/register)

Log in securely with JWT cookies

Edit name or email via /account/edit

Delete account permanently

State info pages with JSON data for all 50 states

🗺️ Trip Dashboard (Stewart)

Add trips with start/end destinations and optional legs

Edit or delete trips

Calculate total cost and states visited

Display interactive map using react-simple-maps

🧩 Database Structure
Collections

users

{
  "_id": ObjectId,
  "name": "Theresa Coleman",
  "email": "theresa@example.com",
  "pass": "hashed_password",
  "createdAt": ISODate,
  "updatedAt": ISODate
}


trips

{
  "_id": ObjectId,
  "userId": ObjectId,
  "tripName": "East Coast Adventure",
  "statesVisited": ["MA", "NY", "PA"],
  "totalCost": 850,
  "notes": "Visited family and historic sites.",
  "createdAt": ISODate,
  "updatedAt": ISODate
}

⚙️ Installation & Setup
🧱 Prerequisites

Node.js 22+

MongoDB running locally (mongodb://127.0.0.1:27017)

1️⃣ Start the Backend
cd auth-server
npm install
node server.js


Default runs on: http://127.0.0.1:4000

2️⃣ Start the Frontend
cd client
npm install
npm run dev


Default runs on: http://localhost:5174

Make sure both the client and auth-server are running simultaneously.

🔐 Environment Variables

Create a .env file inside auth-server with:

AUTH_PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=tripTracker
AUTH_SECRET=change-me-to-a-long-random-string
NODE_ENV=development

🧭 Usage Instructions

Visit http://localhost:5174

Register a new user account.

Log in and open your Account Page to edit name or email.

Add trips from your dashboard and view the color-coded map.

Delete account if desired (handled safely with cookie cleanup).

🧹 Developer Notes

The project uses Prettier for code formatting.
Run npm run format in the project root to format both client & server.

Cookies are configured for localhost to ensure session persistence.

No Mongoose or Axios were used — only official MongoDB and fetch APIs.

ESLint configuration ensures clean, consistent syntax.

Environment secrets are excluded from source control.

📸 Screenshots

(Insert screenshots once your app is live)

🖥️ Login / Register page

🧭 Dashboard with trips and color-coded map

🧑‍💻 Edit Account page

🌐 Deployment

The application can be deployed with:

Render or Railway for Node.js backend

Netlify or Vercel for React frontend

Environment variables should match .env from development.

🧾 License

This project is licensed under the MIT License.

MIT License © 2025 Theresa Coleman & Stewart Almeida

🧪 Smoke Test

After setup:

Start both servers.

Visit /register → create an account.

Log in, edit name/email, confirm changes.

Add at least one trip → confirm map highlights visited states.

Refresh page — data should persist.
