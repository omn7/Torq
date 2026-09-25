import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";

// Profile: Update
app.put("/api/users/profile", async (req, res) => {
  try {
    const { userId, name, bio, avatarUrl, pushToken } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(pushToken !== undefined && { pushToken }),
      }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Profile: Search users by name
app.get("/api/users/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json([]);
    
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive'
        }
      },
      select: { id: true, name: true, avatarUrl: true },
      take: 5
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Circles: List for user
app.get("/api/circles", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      include: {
        circles: {
          include: {
            users: {
              select: { id: true, name: true, avatarUrl: true, streakDays: true, totalPoints: true }
            }
          }
        }
      }
    });
    res.json(user?.circles || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Circles: Join or Create by name
app.post("/api/circles/join", async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name) return res.status(400).json({ error: "Missing fields" });
    
    let circle = await prisma.circle.findFirst({ where: { name } });
    if (!circle) {
      circle = await prisma.circle.create({
        data: { name, userIds: [userId] }
      });
      await prisma.user.update({ where: { id: userId }, data: { circleIds: { push: circle.id } } });
    } else {
      if (!circle.userIds.includes(userId)) {
        await prisma.circle.update({
          where: { id: circle.id },
          data: { userIds: { push: userId } }
        });
        await prisma.user.update({ where: { id: userId }, data: { circleIds: { push: circle.id } } });
      }
    }
    res.json(circle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Circles: Add member by name or email
app.post("/api/circles/:id/addMember", async (req, res) => {
  try {
    const { id } = req.params;
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "Missing identifier" });
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { name: identifier.trim() }
        ]
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const circle = await prisma.circle.findUnique({ where: { id } });
    if (!circle) return res.status(404).json({ error: "Circle not found" });

    if (!circle.userIds.includes(user.id)) {
      await prisma.circle.update({
        where: { id: circle.id },
        data: { userIds: { push: user.id } }
      });
      await prisma.user.update({ where: { id: user.id }, data: { circleIds: { push: circle.id } } });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Circles: Get Chat
app.get("/api/circles/:id/chat", async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { circleId: id },
      orderBy: { createdAt: 'asc' },
    });
    
    // We need sender names
    const enriched = await Promise.all(messages.map(async (m) => {
      const sender = await prisma.user.findUnique({ where: { id: m.senderId }, select: { name: true, avatarUrl: true } });
      return { ...m, senderName: sender?.name || "Unknown", senderAvatar: sender?.avatarUrl };
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Circles: Send Chat
app.post("/api/circles/:id/chat", async (req, res) => {
  try {
    const { id } = req.params;
    const { senderId, text } = req.body;
    if (!senderId || !text) return res.status(400).json({ error: "Missing fields" });
    
    const msg = await prisma.chatMessage.create({
      data: {
        circleId: id,
        senderId,
        text
      }
    });

    // Send push notifications
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const circle = await prisma.circle.findUnique({
      where: { id },
      include: { users: true }
    });

    if (sender && circle) {
      const pushMessages = circle.users
        .filter(u => u.id !== senderId && u.pushToken)
        .map(u => ({
          to: u.pushToken,
          sound: 'default',
          title: `New message in ${circle.name}`,
          body: `${sender.name}: ${text}`,
          data: { circleId: id, type: 'chat_message' },
          badge: 1
        }));

      if (pushMessages.length > 0) {
        fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pushMessages)
        }).catch(e => console.error("Push Notification Error", e));
      }
    }

    res.json(msg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Meals: Fetch today's meals
app.get("/api/meals", async (req, res) => {
  try {
    const { userId, date } = req.query; // date in YYYY-MM-DD
    if (!userId || !date) return res.status(400).json({ error: "Missing fields" });

    const startDate = new Date(date as string);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const meals = await prisma.meal.findMany({
      where: {
        userId: userId as string,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json(meals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Meals: Add a meal
app.post("/api/meals", async (req, res) => {
  try {
    const { userId, type, name, calories, protein, carbs, fats, date } = req.body;
    if (!userId || !type || !name || calories === undefined) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const meal = await prisma.meal.create({
      data: {
        userId,
        type,
        name,
        calories: Number(calories),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fats: Number(fats || 0),
        date: date ? new Date(date) : new Date()
      }
    });

    // Also update today's DailyLog caloriesEaten
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0,0,0,0);
    
    await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      },
      create: {
        userId,
        date: targetDate,
        caloriesEaten: Number(calories)
      },
      update: {
        caloriesEaten: {
          increment: Number(calories)
        }
      }
    });

    res.json(meal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Auth: Register
app.post("/api/auth/register", async (req, res): Promise<any> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
    
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Dummy Home Feed
app.get("/api/home-feed", async (req, res) => {
  try {
    const user = await prisma.user.findFirst();
    const categories = ["All", "Fat Loss", "Yoga", "Muscle Gain"];
    const challenge = null; // Removed dummy challenge
    
    // Fetch some workout plans as suggestions
    const workoutPlans = await prisma.workoutPlan.findMany({ take: 5 });

    res.json({
      user,
      challenge,
      categories,
      workoutPlans
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Detailed Workout Plan
app.get("/api/workouts/:id", async (req, res) => {
  try {
    const workout = await prisma.workoutPlan.findUnique({
      where: { id: req.params.id }
    });
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    res.json(workout);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Log workout session
app.post("/api/workouts/log", async (req, res) => {
  try {
    const { userId, workoutPlanId, durationMinutes, caloriesBurned, sets } = req.body;
    
    // Calculate streak
    const lastSession = await prisma.workoutSession.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' }
    });

    let newStreak = 1;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currentStreak = user?.streakDays || 0;

    if (lastSession) {
      const lastDate = new Date(lastSession.completedAt);
      const today = new Date();
      
      const lastDateUTC = Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate());
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const diffDays = (todayUTC - lastDateUTC) / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        newStreak = Math.max(1, currentStreak);
      } else if (diffDays === 1) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    const session = await prisma.workoutSession.create({
      data: {
        userId,
        workoutPlanId: workoutPlanId || null,
        durationMinutes: durationMinutes || 0,
        caloriesBurned: caloriesBurned || 0,
        sets
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { streakDays: newStreak }
    });

    res.json({ session, newStreak });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch Weekly Volume for Chart
app.get("/api/metrics/weekly-volume", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // Get sessions from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: userId as string,
        completedAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Group volume by day
    const volumeByDay: Record<string, number> = {};
    for (const session of sessions) {
      const dateKey = new Date(session.completedAt).toISOString().split('T')[0];
      let volume = 0;
      for (const set of session.sets) {
        volume += (set.reps * set.weightKg);
      }
      volumeByDay[dateKey] = (volumeByDay[dateKey] || 0) + volume;
    }

    res.json(volumeByDay);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch Weekly Metrics (Water, Weight, etc.)
app.get("/api/metrics/weekly", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCHours(0,0,0,0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const logs = await prisma.dailyLog.findMany({
      where: {
        userId: userId as string,
        date: { gte: sevenDaysAgo }
      },
      orderBy: { date: 'asc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch Daily Metrics
app.get("/api/metrics/daily", async (req, res) => {
  try {
    const { date, userId } = req.query;
    
    if (!userId || !date) return res.status(400).json({ error: "Missing parameters" });

    const parsedDate = new Date(date as string);
    parsedDate.setUTCHours(0,0,0,0);

    const metrics = await prisma.dailyLog.findFirst({
      where: {
        userId: userId as string,
        date: parsedDate
      }
    });

    res.json(metrics || {});
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Log Water Intake
app.post("/api/metrics/water", async (req, res) => {
  try {
    const { userId, amount, date } = req.body;
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0,0,0,0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date: parsedDate
        }
      },
      update: {
        waterIntakeMl: { increment: amount }
      },
      create: {
        userId,
        date: parsedDate,
        waterIntakeMl: amount,
        stepsCount: 0,
        caloriesBurned: 0,
        caloriesEaten: 0,
      }
    });

    res.json(dailyLog);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Log Weight
app.post("/api/metrics/weight", async (req, res) => {
  try {
    const { userId, weightKg, date } = req.body;
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0,0,0,0);

    const dailyLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId,
          date: parsedDate
        }
      },
      update: {
        weightKg: weightKg
      },
      create: {
        userId,
        date: parsedDate,
        weightKg: weightKg,
        stepsCount: 0,
        waterIntakeMl: 0,
        caloriesBurned: 0,
        caloriesEaten: 0,
      }
    });

    res.json(dailyLog);
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
