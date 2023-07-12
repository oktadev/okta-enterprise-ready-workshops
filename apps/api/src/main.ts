import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';

interface IUser {
  id: number;
}

const prisma = new PrismaClient();
const LocalStrategy = passportLocal.Strategy;
const OpenIDConnectStrategy = passportOIDC.Strategy;

const app = express();
app.use(express.json())
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'top secret',
  cookie: {
    http: false,
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/todos', (req, res, next) => {
  if (req.isUnauthenticated()) {
    return res.sendStatus(401);
  }

  next();
});
app.use('/api/users', (req, res, next) => {
  if (req.isUnauthenticated()) {
    return res.sendStatus(401);
  }

  next();
});

passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await prisma.user.findFirst({
      where: { 
        AND: {
          email: username,
          password
        }
      }
    });

    return done(null, user);
  }
));

passport.serializeUser( async (user: IUser, done) => {
  done(null, user.id);
});

passport.deserializeUser( async (id: number, done) => {
  const user: User = await prisma.user.findUnique({
    where: { 
     id
    }
  });

  done(null, user);
});

app.post('/api/signin', passport.authenticate('local'), async (req, res) => {
  res.json({
    name: req.user['name']
  })
});

app.post('/api/signout', async (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err)};
    res.sendStatus(204);
  });
  
});

app.get('/api/users/me', async (req, res) => {
  const user: User = await prisma.user.findUnique({
    where: {
      id: req.user['id']
    }
  });

  delete user.password;

  res.json({...user});
});

app.get('/api/todos', async ( req, res) => {
  const todos: Todo[] = await prisma.todo.findMany({
    where: {
      userId: req.user['id']
    }
  });
  res.json({todos});
});

app.post('/api/todos', async (req, res) => {
  const { task } = req.body;
  const id = req.user['id'];
  const todo: Todo = await prisma.todo.create({
    data: {
      task,
      completed: false,
      user : { connect: {id}}
    }
  })

  res.json(todo);
});

app.put('/api/todos/:id', async (req, res) => {
  const id  = parseInt(req.params.id);
  const { task, completed } = req.body;
  let completedAt = null;

  if (completed) {
    completedAt = new Date().toISOString();
  }

  const todo: Todo = await prisma.todo.update({
    where: { id },
    data: { task, completed, completedAt }
  });

  res.json(todo);
});

app.delete('/api/todos/:id', async (req, res) => {
  const id  = parseInt(req.params.id);
  await prisma.todo.delete({
    where: { id }
  });

  res.sendStatus(204);
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);


///////////////////////////////////////////////////////
// SSO-related routes
// TODO: Move these to a new file

function getDomainFromEmail(email) {
  let domain;
  try {
      domain = email.split('@')[1];
  } catch (e) {
      console.error("Invalid email format");
      return null;
  }
  return domain;
}

// https://medium.com/passportjs/authenticate-using-strategy-instances-49e58d96ec8c
function createStrategy(org) {
return new OpenIDConnectStrategy({
  issuer: org.issuer,
  authorizationURL: org.authorization_endpoint,
  tokenURL: org.token_endpoint,
  userInfoURL: org.userinfo_endpoint,
  clientID: org.client_id,
  clientSecret: org.client_secret,
  scope: "profile email",
  // The callback URL is the URL to the front-end React app,
  // which proxies the call to the back-end
  // TODO: set the host name from config or env
  callbackURL: "http://localhost:3333/openid/callback/"+org.id
},
async function verify(issuer, profile, cb) {

  // Passport.js runs this verify function after successfully completing
  // the OIDC flow, and gives this app a chance to do something with
  // the response from the OIDC server, like create users on the fly.

  // Look up the user by the IDP ID ("subject")
  var user = await prisma.user.findFirst({
    where: {
      orgId: org.id,
      externalId: profile.id
    }
  });

  // Check if there is a user that matches the email on this IDP
  if(!user) {
    user = await prisma.user.findFirst({
      where: {
        orgId: org.id,
        email: profile.emails[0].value
      }
    });
    if(user) {
      // If we're here, then user.externalId is null, which means they were
      // a previously existing user prior to the OIDC connection. Update their
      // info now to add the IDP ID.
      await prisma.user.update({
        where: { id: user.id },
        data: { externalId: profile.id }
      });
    }
  }

  // If there is no local user, create one now with profile info from the IDP
  if(!user) {
    user = await prisma.user.create({
    data: {
        org: {connect: {id: org.id}},
        externalId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      }
    })
  }

  return cb(null, user);
});
}

// The front-end POSTs to this route to check if there is an IDP for this email.
// This doesn't leak individual accounts, but does leak whether an email matches a customer domain.
app.post('/api/openid/check', async (req, res, next) => {
const { username } = req.body;

const domain = getDomainFromEmail(username);
if(domain) {
  const org = await prisma.org.findFirst({
    where: {
      domain: domain
    }
  });
  if(org) {
    return res.json({ org_id: org.id });
  } else {
    // Check for an exact match of email address
    const user = await prisma.user.findFirst({
      where: {
        email: username
      }
    });
    if(user) {
      return res.json({ org_id: user.orgId });
    }
  }
}

res.json({ org_id: null });
});

// The frontend then redirects here to have the backend start the OIDC flow.
// (You should probably use random IDs, not auto-increment integers
// to avoid revealing how many enterprise customers you have.)
app.get('/openid/start/:id', async (req, res, next) => {

const org = await prisma.org.findFirst({
  where: {
    id: parseInt(req.params.id)
  }
});

if(org) {
  var strategy = createStrategy(org);
  passport.authenticate(strategy)(req, res, next);
} else {
  res.sendStatus(404);
}
});

// The OIDC server redirects the browser back here to finish the OIDC flow.
// The backend starts the session and redirects to the frontend.
app.get('/openid/callback/:id', async (req, res, next) => {
const org = await prisma.org.findFirst({
  where: {
    id: parseInt(req.params.id)
  }
});

if(org) {
  var strategy = createStrategy(org);
  passport.authenticate(strategy, { successRedirect: 'http://localhost:3000/', })(req, res, next);
} else {
  res.sendStatus(404);
}
});