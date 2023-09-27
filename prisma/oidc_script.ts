import { PrismaClient, Org, User, Todo } from '@prisma/client';

const prisma = new PrismaClient()

async function main() {

  // Run this:
  // npm run oidc-migrate example.com

  const argv = process.argv.slice(2);
  if (argv.length !== 1) {
    throw 'Provide an org domain'
  }

  const domain = argv[0];

  const org: Org | null = await prisma.org.findFirst({
    where: { domain }
  })

  if(!org) {
    throw 'Org not found'
  }

  const users: User[] = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "@"+domain
      }
    }
  })

  users.forEach(async (user) => {
    await prisma.user.update({
      where: {id: user.id},
      data: {orgId: org.id, password: null}
    })
  })

  const result = await prisma.todo.updateMany({
    where: {
      user: {
        orgId: org.id
      }
    },
    data: {
      orgId: org.id
    },
  })

}


main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

