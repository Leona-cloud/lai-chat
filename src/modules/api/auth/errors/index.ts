import { HttpException } from '@nestjs/common';

export class UserAlreadyRegisteredException extends HttpException {
  name = 'UserAlreadyRegisteredException';
}

export class PasswordsDoNotMatchException extends HttpException {
  name = 'PasswordsDoNotMatchException';
}

export class InvalidAuthTokenException extends HttpException {
  name = 'InvalidAuthTokenException';
}

export class UserNotFoundException extends HttpException {
  name = 'UserNotFoundException';
}

export class PrismaNetworkException extends HttpException {
  name = 'PrismaNetworkException';
}

export class AuthTokenValidationException extends HttpException {
  name = 'AuthTokenValidationException';
}

export class InvalidUserCredentialException extends HttpException {
  name = 'InvalidUserCredentialException';
}

export class InvalidTokenException extends HttpException {
  name = 'InvalidTokenException';
}

export class UserNotVerifiedException extends HttpException {
  name = 'UserNotVerifiedException';
}

export class InvalidRefreshTokenException extends HttpException {
  name = 'InvalidRefreshTokenException';
}

export class InvalidCredentialException extends HttpException {
  name = 'InvalidCredentialException';
}

export class AuthGenericException extends HttpException {
  name = 'AuthGenericException';
}
