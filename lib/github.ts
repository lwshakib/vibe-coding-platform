import prisma from "@/lib/prisma";

export async function getGithubToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
  });

  return account?.accessToken;
}
