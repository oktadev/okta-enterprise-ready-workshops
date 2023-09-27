import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';

interface IUser {
  id: number;
}

const prisma = new PrismaClient();
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


////////////////////////////////////////////
// OpenID Connect Routes Below

const passportStrategy = new OpenIDConnectStrategy({
    issuer: process.env.OPENID_ISSUER,
    authorizationURL: process.env.OPENID_AUTHORIZATION_ENDPOINT,
    tokenURL: process.env.OPENID_TOKEN_ENDPOINT,
    userInfoURL: process.env.OPENID_USERINFO_ENDPOINT,
    clientID: process.env.OPENID_CLIENT_ID,
    clientSecret: process.env.OPENID_CLIENT_SECRET,
    scope: 'profile email',
    callbackURL: 'http://localhost:3333/openid/callback'
  },
  async function verify(issuer, profile, idProfile, context, idToken, accessToken, refreshToken, params, cb) {

    // Passport.js runs this verify function after successfully completing
    // the OIDC flow, and gives this app a chance to do something with
    // the response from the OIDC server, like create users on the fly.

    console.log(profile);
    const connection = profile._json['https://example.com/connection']

    // var org = await prisma.org.findFirst({
    //   where: {
    //     auth0ConnectionName: connection.id,
    //   }
    // })
    // if(!org) {
    //   org = await prisma.org.create({
    //     data: {
    //       auth0ConnectionName: connection.id,
    //       name: connection.name,
    //       apikey: "",
    //     }
    //   })
    // }


    var user = await prisma.user.findFirst({
      where: {
        // orgId: org.id,
        externalId: profile.id,
      }
    })

    if(!user) {
      user = await prisma.user.create({
        data: {
          // org: {connect: {id: org.id}},
          externalId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
        }
      })
    }

    return cb(null, user);
  });


// The frontend then redirects here to have the backend start the OIDC flow.
app.get('/openid/start', async (req, res, next) => {

  passport.authenticate(passportStrategy)(req, res, next);

});

app.get('/openid/callback', async (req, res, next) => {

  passport.authenticate(passportStrategy, {
    successRedirect: 'http://localhost:3000/'
  })(req, res, next);

});



