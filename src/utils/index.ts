import { customAlphabet, urlAlphabet } from 'nanoid';
import { GenerateIdOptions } from './interfaces';

export * from './api-response-util';
export * from './interfaces';

export const generateId = (options: GenerateIdOptions): string => {
  const alphaNumeric = '1234567890ABCDEFGHIJKLMNOPQRSTU';
  const length = options.length ?? 15;

  switch (options.type) {
    case 'identifier': {
      return customAlphabet(urlAlphabet, 16)();
    }
    default:
      break;
  }
};

export const generateRandomNum = (size: number): string => {
  let str = '';
  for (let i = 0; i < size; i++) {
    const rand = Math.floor(Math.random() * 10);
    str += rand;
  }
  return str;
};
