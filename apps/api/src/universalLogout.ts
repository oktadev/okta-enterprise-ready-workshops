import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
import { store } from './sessionsStore';
const prisma = new PrismaClient();
interface IRequestSchema {
  'sub_id': {format:string; email: string};
}
universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;
  // 400 If the request is malformed
  if (!req.body) {
    return res.status(400);
  }
  // Find the user by email associated with the org id from the validated signed JWT
  const domainOrg = req['org'];
  if (!domainOrg?.id) {
    return res.sendStatus(401);
  }
  const newRequest: IRequestSchema = req.body;
  const { email } = newRequest.sub_id;
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      org: { id: domainOrg.id } ,
    },
  });
  // 404 User not found
  if (!user) {
    return res.sendStatus(404);
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
  console.log('User session deleted')
  return res.sendStatus(httpStatus);
});
universalLogoutRoute.use((err,req,res,next) => {
  if(err){
    return res.sendStatus(404)
  }
})
