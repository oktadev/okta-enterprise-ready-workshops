import { Router } from 'express';
export const scimRoute = Router();
import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import passport from 'passport';

const prisma = new PrismaClient();

const ORG_ID = 1;
 
interface IUserSchema {
  schemas: string[];
  userName?: string;
  id?: string;
  name?: {
    givenName: string;
    familyName: string;
  };
  emails?: {primary: boolean, value: string, type: string}[];
  displayName?: string;
  locale?: string;
  meta?: {
    resourceType: string;
  }
  externalId?: string;
  groups?: [];
  password?: string;
  active?: boolean;
  detail?: string;
  status?: number;
}

const defaultUserSchema: IUserSchema = {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    locale: 'en-US',
    groups: [],
    meta: {
      resourceType: 'User'
    }
  };


scimRoute.post('/Users', passport.authenticate('bearer'), async (req, res) => {
    // Your Code Here
  });


scimRoute.get('/Users', passport.authenticate('bearer'), async (req, res) => {
    const DEFAULT_START_INDEX = '1';
    const DEFAULT_RECORD_LIMIT = '100';
    let startIndex = parseInt(req.query.startIndex as string ?? DEFAULT_START_INDEX);
    startIndex--; 
    const recordLimit = parseInt(req.query.recordLimit as string ?? DEFAULT_RECORD_LIMIT);
    let filterQuery : string|null = req.query.filter as string ?? null;
    let filterParams: string[] = [];
    let email = null;
  
    if (!!filterQuery) {
      filterParams = filterQuery.split(' ');
  
      const FILTER_EXPRESSION_LENGTH = 3;
      const FILTER_ATTRIBUTE_NAME = 0;
      const FILTER_OPERATOR = 1;
      const FILTER_VALUE = 2;
  
      if (filterParams.length !== FILTER_EXPRESSION_LENGTH || filterParams[FILTER_ATTRIBUTE_NAME] !== 'userName' || filterParams[FILTER_OPERATOR] !== 'eq') {
        filterParams = [];
        filterQuery = null;
      } else {
        email = filterParams[FILTER_VALUE].replaceAll('"', '')
      }
    }
  
    let where: {org:{}, email?: string} = {
      org: {
        id: ORG_ID
      }
    };
  
    if (!!email) {
      where = {...where, email};
    }
  
    const count = await prisma.user.count({where});
    let usersResponse = {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
      totalResults: count, 
      startIndex: 1,
      itemsPerPage: 0, 
      "Resources": []
    };
  
    if (count > 0) {
      const users = await prisma.user.findMany({
        take: recordLimit,
        skip: startIndex,
        select: {
          id: true,
          email: true,
          name: true,
          externalId: true,
          active: true 
        },
        where
      });
  
      usersResponse['Resources'] = users.map(user => {
        
        const [givenName, familyName] = user.name.split(" ")
        return {
            ...defaultUserSchema, 
            id: user.id.toString(),
            userName: user.email,
            name: {
            givenName,
            familyName
            },
            emails: [{
            primary: true,
            value: user.email,
            type: 'work'
            }],
            displayName: user.name,
            externalId: user.externalId, 
            active: user.active
        }
      });
    }
  
    usersResponse.itemsPerPage = usersResponse.Resources.length
    res.json(usersResponse);
  });

scimRoute.get('/Users/:userId', passport.authenticate('bearer'), async ( req, res) => { 
  
    const id = parseInt(req.params.userId);
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        externalId: true, 
        active: true, 
      }, 
      where: {
        id,
        org: {id: ORG_ID},
      }
    });
  
    let httpStatus = 200;
    let userResponse;
  
    if (!!user) {
      const { id, name, email } = user;
      const [givenName, familyName] = name.split(" ")

      userResponse = {
        ...defaultUserSchema,
        id: id.toString(),
        userName: email,
        name: {
          givenName,
          familyName
        },
        emails: [{
          primary: true,
          value: email,
          type: 'work'
        }],
        displayName: name,
        externalId: user.externalId, 
        active: user.active
      } satisfies IUserSchema;
    } else {
      httpStatus = 404;
      userResponse = `User ${id} not found`;
    };
  
    res.status(httpStatus).json(userResponse);
  });  


  scimRoute.put('/Users/:userId', passport.authenticate('bearer'), async (req, res) => {
    const id = parseInt(req.params.userId);
     const userCount = await prisma.user.count({
       where: {
          id,
          org: { id: ORG_ID },
         }
     });
  
     let userResponse;
     let httpStatus = 200;
  
     if (userCount === 1) {
      const updatedUserRequest: IUserSchema = req.body;
      const { name, emails } = updatedUserRequest; 

      const updatedUser = await prisma.user.update({
       data: {
         email: emails.find(email => email.primary).value,
         name: `${name.givenName} ${name.familyName}` 
       },
       where : {
         id 
       }
      });
      
      const [givenName, familyName] = updatedUser.name.split(" ")

      userResponse = {
        ...defaultUserSchema,
        id: id.toString(),
        userName: updatedUser.email,
        name: {
          givenName,
          familyName
        },
        emails: [{
          primary: true,
          value: updatedUser.email,
          type: 'work'
        }],
        displayName: updatedUser.name,
        externalId: updatedUser.externalId, 
        active: updatedUser.active
      } satisfies IUserSchema;
     } else if (userCount === 0) {
      httpStatus = 404;
      userResponse = `User ${id} not found`;
     } else {
      
      httpStatus = 500;
      userResponse = `Whoa there!`;
    }
  
    res.status(httpStatus).send(userResponse);
  });  

 scimRoute.delete('/Users/:userId', passport.authenticate('bearer'), async (req, res) => {
     const id  = parseInt(req.params.userId);
     await prisma.user.delete({
       where: { id }
     });
  
     res.sendStatus(204);
   });

scimRoute.patch('/Users/:userId', passport.authenticate('bearer'), async (req, res) => {
     const id  = parseInt(req.params.userId);
     const active = req.body["Operations"][0]["value"]["active"]
     await prisma.user.update({
       data: {
        active
       },
       where: { id }
     });
  
     res.sendStatus(204);
   });   