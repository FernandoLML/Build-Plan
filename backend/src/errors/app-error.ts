// Caminho: /backend/src/errors/app-error.ts
// Erro de aplicação com status HTTP — permite que o service sinalize
// falhas de negócio que o middleware de erro traduz em respostas.

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}