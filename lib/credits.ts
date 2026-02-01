import prisma from "./prisma";

const DAILY_CREDITS = 150000;

export async function getAndUpdateUserCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, lastCreditRefresh: true },
  });

  if (!user) return 0;

  const now = new Date();
  const lastRefresh = new Date(user.lastCreditRefresh);

  // Check if it's a new day (at or after 12 AM)
  const isNewDay = 
    now.getFullYear() > lastRefresh.getFullYear() ||
    now.getMonth() > lastRefresh.getMonth() ||
    now.getDate() > lastRefresh.getDate();

  if (isNewDay) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: DAILY_CREDITS,
        lastCreditRefresh: now,
      },
    });
    return updatedUser.credits;
  }

  return user.credits;
}

export async function consumeCredits(userId: string, amount: number = 1000) {
  // First ensure credits are refreshed if needed
  await getAndUpdateUserCredits(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.credits < amount) {
    throw new Error("Insufficient credits");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: Math.min(amount, user.credits),
      },
    },
  });

  return updatedUser.credits;
}
