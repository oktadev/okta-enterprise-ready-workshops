import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
import { store } from './sessionsStore';
import OktaJwtVerifier from '@okta/jwt-verifier';

const prisma = new PrismaClient();

// interface IUserSchema {
//   email?: string;
// }

universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;

  // 400 If the request is malformed
  if (!req.body) {
    res.status(400);
  }
  //console.log(req)
  // const authHeaders = req.headers.authorization
  // if(!authHeaders){
  //   return res.sendStatus(401)
  // }
  //@ts-ignore
  console.log(req.org)
  
  const email: string = req.body['sub_id']['email'];
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      //@ts-ignore
      org: { id: (req.org as any).id } ,
    },
  });
  
  // Target a user within a specific org
  //const orgId = org.id
  // const email = req.body['subject']['email'];
  // const user = await prisma.user.findFirst({
  //   where: {
  //     email: email,

  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //     org: { id: (req.user as any).id } ,
  //   },
  // });
  // 404 User not found - may not want to say the user is not there
  if (!user) {
    res.sendStatus(404);
  }

  // End user session
  const storedSession = store.sessions;
  const userId = user.id;
  const sids = [];
  Object.keys(storedSession).forEach((key) => {
    const sess = JSON.parse(storedSession[key]);
    if (sess.passport.user === userId) {
      sids.push(key);
    }
  });

  sids.map((sid) => store.destroy(sid));

console.log('deleted user session')

  return res.sendStatus(httpStatus);
});

universalLogoutRoute.use((err,req,res,next) => {
  if(err){

    return res.sendStatus(404)
  }
})