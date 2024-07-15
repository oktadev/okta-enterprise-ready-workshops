export interface IScimResource {
  id: string;
  schemas: string[];
  meta?: IMetadata;
}

export interface IMetadata {
  resourceType: RESOURCE_TYPES;
  location?: string;
}

export interface IOktaRole extends IScimResource{
  displayName: string;
}

export interface IResourceType {
  id?: string;
  schemas: string[];
  name: string;
  description?: string;
  endpoint: string;
  schema: string;
  schemaExtensions?: {schema: string, required: boolean}[];
  meta: IMetadata;
}


export interface IListResponse<T extends IScimResource | IResourceType | ISchema> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export interface ISchema {
  id: string;
  name?: string;
  description?: string;
  attributes: IAttribute[];
  meta: IMetadata;
}

export interface IAttribute {
  name: string;
  description: string;
  type: string;
  multiValued: boolean;
  required: boolean;
  caseExact: boolean;
  mutability: string;
  returned: string;
  uniqueness: string;
}

export interface ICharacteristic extends IScimResource {
  type: string;
  displayName: string;
}

export const SCHEMA_OKTA_ROLE = 'urn:okta:scim:schemas:core:1.0:Role';
export const SCHEMA_LIST_RESPONSE = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
export const SCHEMA_RESOURCE_TYPE = 'urn:ietf:params:scim:schemas:core:2.0:ResourceType';
export const SCHEMA_OKTA_ENTITLEMENT = 'urn:okta:scim:schemas:core:1.0:Entitlement';
export const SCHEMA_CHARACTERISTIC = 'urn:bestapps:scim:schemas:extension:todoapp:1.0:Characteristic';

export type RESOURCE_TYPES = 'Role' | 'ResourceType' | 'Schema';
