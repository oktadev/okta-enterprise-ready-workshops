import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const bobbyUser= await prisma.user.create({
    data: {
      name: 'Bobby Tables',
      email: 'bob@tables.fake',
      password: 'correct horse battery staple'
    },
  })
  console.log('Created user Bobby Tables', bobbyUser)

  const trinityUser = await prisma.user.create({
    data: {
      name: 'Trinity',
      email: 'trinity@whiterabbit.fake',
      password: 'Zion'
    },
  })
  console.log('Created user Trinity', trinityUser)
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