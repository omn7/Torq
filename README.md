<div align="center">
  <img src="client/assets/images/icon.jpg" alt="Torq Logo" width="200" height="200" style="border-radius: 20px;">
  <h1>Torq Fitness Tracker</h1>
  <p>Your ultimate social fitness companion.</p>
</div>

---

## 🏋️‍♂️ About Torq
Torq is a full-stack cross-platform mobile application designed to help you and your friends stay motivated, track workouts, log meals, and conquer goals together. With real-time chat, friend circles, and comprehensive health tracking, fitness becomes a shared adventure.

## 🚀 Features
- **Dynamic Workout Tracking**: Log your daily exercises and watch your streaks grow.
- **Meal & Macro Logging**: Track your daily intake (Protein, Carbs, Fats) to stay on top of your diet.
- **Social "Friend Circles"**: Create or join circles, view your friends' stats, and keep each other accountable.
- **Real-Time Group Chat**: Chat directly inside your friend circles. Features instant Expo Push Notifications when new messages arrive.
- **Rich Profiles**: Customize your bio and profile picture to stand out.

## 🛠️ Tech Stack
- **Frontend**: React Native, Expo SDK 50, Expo Router (File-based routing), TailwindCSS (NativeWind).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB paired with Prisma ORM.
- **Notifications**: Expo Push Notifications API.

## 📱 Getting Started
### Prerequisites
- Node.js installed
- Expo Go app installed on your iOS or Android device

### Installation
1. Clone the repository and navigate into the folder.
2. Setup the backend:
   ```bash
   cd server
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your MongoDB connection string:
   ```env
   PORT=3001
   DATABASE_URL="mongodb+srv://..."
   ```
4. Start the backend:
   ```bash
   npx prisma generate
   npm run dev
   ```
5. Setup the frontend:
   ```bash
   cd ../client
   npm install
   ```
6. Start the app:
   ```bash
   npm start
   ```
7. Scan the QR code with **Expo Go** on your phone!

## 📦 Building an APK
Torq is fully configured for Expo Application Services (EAS). To generate a standalone Android build:
```bash
cd client
npx eas-cli login
npx eas-cli build -p android --profile preview
```

---
*Built with ❤️ to keep the FitFam growing.*
