import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.org.create({
    data: {
      domain: 'portal.example',
      apikey: '131313'
    }
  });
  console.log('Created org Portal', org);
  
  const somnusUser= await prisma.user.create({
    data: {
      name: 'Somnus Blue',
      email: 'somnus.blue@portal.example',
      password: 'correct horse battery staple',
      orgId: org.id,
      externalId: '22',
      active: true
    },
  })
  console.log('Created user Somnus', somnusUser)
  

 const trinityUser= await prisma.user.create({
    data: {
      name: 'Trinity Red',
      email: 'trinity.red@portal.example',
      password: 'Zion',
      orgId: org.id,
      externalId: '23',
      active: true
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
