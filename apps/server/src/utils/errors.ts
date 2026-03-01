export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function assertOrThrow(condition: unknown, statusCode: number, message: string): asserts condition {
  if (!condition) {
    throw new AppError(statusCode, message);
  }
}
