export class GeneralError extends Error {
  constructor(message: string) {
    super();
    this.message = message;
  }

  getCode() {
    switch (this.constructor) {
      case BadRequest:
        return 400;
      case NotFound:
        return 404;
      case ValidationError:
        return 403;
      case Unauthorized:
        return 401;
      default:
        return 500;
    }
  }
}

export class BadRequest extends GeneralError {}

export class NotFound extends GeneralError {}

export class ValidationError extends GeneralError {}

export class Unauthorized extends GeneralError {}
