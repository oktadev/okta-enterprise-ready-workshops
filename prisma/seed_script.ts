import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.org.create({
    data: {
      domain: 'gridco.example',
      apikey: '123123'
    }
  });
  console.log('Created org Portal', org);

  // Roles defined by the Todo app
  const roles = [
    { name: 'Todo-er' },
    { name: 'Todo Auditor' },
    { name: 'Manager'}
  ];

  const createdRoles = await Promise.all(
    roles.map(data => prisma.role.create({data}))
  );

  for (const role of createdRoles) {
    console.log('Created role ', role);
  }

  const somnusUser = await prisma.user.create({
    data: {
      name: 'Somnus Henderson',
      email: 'somnus.henderson@gridco.example',
      password: 'correct horse battery staple',
      orgId: org.id,
      externalId: '31',
      active: true
    }
  });
  console.log('Created user Somnus', somnusUser)

 const trinityUser = await prisma.user.create({
    data: {
      name: 'Trinity JustTrinity',
      email: 'trinity@gridco.example',
      password: 'Zion',
      orgId: org.id,
      externalId: '32',
      active: true,
      roles: {
        connect: {
          id: createdRoles.find(r => r.name === 'Todo-er')?.id
        }
      }
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
