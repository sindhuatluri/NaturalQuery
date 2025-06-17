export enum JobType {
  GET_CONNECTION_DB_STRUCTURE = 'GET_CONNECTION_DB_STRUCTURE',
  CHECK_FOR_DEFAULT_USER_CONNECTION = 'CHECK_FOR_DEFAULT_USER_CONNECTION',
}

interface BaseJobData {
  type: JobType;
}

export interface GetConnectionDBStructureData extends BaseJobData {
  type: JobType.GET_CONNECTION_DB_STRUCTURE;
  connectionId: string;
}

export interface CheckDefaultUserConnectionData extends BaseJobData {
  type: JobType.CHECK_FOR_DEFAULT_USER_CONNECTION;
  userId: string;
}

export type JobData = GetConnectionDBStructureData | CheckDefaultUserConnectionData;
