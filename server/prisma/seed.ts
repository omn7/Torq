import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean up
  await prisma.dailyLog.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.user.deleteMany();

  // Create User
  const user = await prisma.user.create({
    data: {
      name: "Alex",
      email: "alex@example.com",
      password: "$2b$10$/AQX9mzEVZpQx50LIqrAnOWzQW2YsozQpMsHiwMHaAJvyEe8mMrKa", // "password" hashed
      avatarUrl: "https://i.pravatar.cc/150?u=alex",
      streakDays: 14,
      totalPoints: 1250,
    }
  });

  // Create 7 Days of Logs
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);
    
    await prisma.dailyLog.create({
      data: {
        userId: user.id,
        date: logDate,
        stepsCount: 5000 + Math.floor(Math.random() * 5000),
        waterIntakeMl: 1000 + Math.floor(Math.random() * 1500),
        caloriesBurned: 300 + Math.floor(Math.random() * 500),
        caloriesEaten: 1800 + Math.floor(Math.random() * 600),
        weightKg: 75.5,
        gymVisited: Math.random() > 0.5
      }
    });
  }

  // Create Workout Plans
  await prisma.workoutPlan.createMany({
    data: [
      {
        title: "Upper Body Power",
        category: "Muscle Gain",
        difficulty: "Intermediate",
        durationMin: 25,
        rating: 4.8,
        trainerName: "Alex Carter",
        description: "Focus on chest, back, and shoulders.",
      },
      {
        title: "Ultimate Muscle Sculpting and Strength Workout",
        category: "Muscle Gain",
        difficulty: "Advanced",
        durationMin: 45,
        rating: 5.0,
        trainerName: "Alex Carter",
        description: "Full body strength training for serious gains.",
      },
      {
        title: "Morning Yoga Flow",
        category: "Yoga",
        difficulty: "Beginner",
        durationMin: 15,
        rating: 4.9,
        trainerName: "Sarah Jenkins",
        description: "Start your day with flexibility and mindfulness.",
      },
      {
        title: "HIIT Fat Burner",
        category: "Fat Loss",
        difficulty: "Advanced",
        durationMin: 30,
        rating: 4.7,
        trainerName: "Marcus Doe",
        description: "High intensity intervals to maximize calorie burn.",
      }
    ]
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
