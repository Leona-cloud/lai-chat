import { User } from '@prisma/client';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: User;
}

export interface DataStoredInToken {
  sub: string;
}

export interface LoginMeta {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
