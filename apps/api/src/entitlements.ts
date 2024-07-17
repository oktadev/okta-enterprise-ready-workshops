import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  ICharacteristic,
  IListResponse,
  IOktaRole,
  IResourceType,
  ISchema,
  SCHEMA_CHARACTERISTIC,
  SCHEMA_LIST_RESPONSE,
  SCHEMA_OKTA_ENTITLEMENT,
  SCHEMA_OKTA_ROLE,
  SCHEMA_RESOURCE_TYPE
} from './scim-types';

const prisma = new PrismaClient();
export const rolesRoute = Router();
export const resourceTypesRoute = Router();
export const schemasRoute = Router();
export const characteristicsRoute = Router();


rolesRoute.route('/')
.get(async (req, res) => {
  const startIndex = parseInt(req.query.startIndex as string ?? '1');
  const recordLimit = parseInt(req.query.recordLimit as string ?? '100');

  const roles = await prisma.role.findMany({
    take: recordLimit,
    skip: startIndex - 1
  });

  const listResponse: IListResponse<IOktaRole> = {
    schemas: [SCHEMA_LIST_RESPONSE],
    totalResults: roles.length,
    startIndex,
    itemsPerPage: recordLimit,
    Resources: roles.map(role => ({
      schemas: [SCHEMA_OKTA_ROLE],
      id: role.id.toString(),
      displayName: role.name
    }))
  };


  return res.json(listResponse);
});

resourceTypesRoute.route('/')
.get((req, res) => {
  const resourceTypes: IResourceType[] = [{
    schemas: [SCHEMA_RESOURCE_TYPE],
    id: 'Role',
    name: 'Role',
    endpoint: '/Roles',
    description: 'Roles you can set on users of Todo App',
    schema: SCHEMA_OKTA_ROLE,
    meta: {
      resourceType: 'ResourceType'
    }
  },
  {
    schemas: [SCHEMA_RESOURCE_TYPE],
    id: 'Characteristic',
    name: 'Characteristic',
    endpoint: '/Characteristics',
    description: 'This resource type is user characteristics',
    schema: 'urn:okta:scim:schemas:core:1.0:Entitlement',
    schemaExtensions: [
      {
        schema: SCHEMA_CHARACTERISTIC,
        required: true
      }
    ],
    meta: {
      resourceType: 'ResourceType'
    }
  }
];

  const resourceTypesListResponse: IListResponse<IResourceType> = {
    schemas: [SCHEMA_LIST_RESPONSE],
    totalResults: resourceTypes.length,
    startIndex: 1,
    itemsPerPage: resourceTypes.length,
    Resources: resourceTypes
  };

  return res.json(resourceTypesListResponse);
});

schemasRoute.route('/')
  .get((_, res) => {
    const characteristic: ISchema = {
      id: SCHEMA_CHARACTERISTIC,
      name: 'Characteristic',
      description: 'User characteristics for entitlements',
      attributes: [{
        name: 'is_tall',
        description: 'Profile entitlement extension for tallness factor',
        type: 'string',
        multiValued: false,
        required: false,
        mutability: 'readWrite',
        returned: 'default',
        caseExact: false,
        uniqueness: 'none'
      }],
      meta: {
        resourceType: 'Schema',
        location: `/v2/Schemas/${SCHEMA_CHARACTERISTIC}`
      }
    };

    const schemas = {
      schemas: [SCHEMA_LIST_RESPONSE],
      totalResults: 1,
      startIndex: 1,
      itemsPerPage: 1,
      Resources: [
        characteristic
      ]
    };

    return res.json(schemas);
  });

  characteristicsRoute.route('/')
  .get((_, res) => {
    const characteristicsListResponse: IListResponse<ICharacteristic> = {
      schemas: [
        SCHEMA_OKTA_ENTITLEMENT,
        SCHEMA_CHARACTERISTIC
      ],
      totalResults: 1,
      startIndex: 1,
      itemsPerPage: 1,
      Resources: [{
        schemas: [SCHEMA_CHARACTERISTIC],
        type: 'Characteristic',
        id: 'is_tall',
        displayName: 'This user is so tall'
      }]
    };

    return res.json(characteristicsListResponse);
  });
