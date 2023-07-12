import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.org.create({
    data: {
      domain: 'matrix.fake',
      apikey: '131313'
    }
  });
  console.log('Created org Matrix', org);

  const bobbyUser= await prisma.user.create({
    data: {
      name: 'Bobby Tables',
      email: 'bob@tables.fake',
      password: 'correct horse battery staple',
      orgId: org.id,
      externalId: '1000002'
    },
  })
  console.log('Created user Bobby Tables', bobbyUser)

  const trinityUser = await prisma.user.create({
    data: {
      name: 'Trinity',
      email: 'trinity@whiterabbit.fake',
      password: 'Zion',
      orgId: org.id,
      externalId: '1000003'
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