export class EllmaError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = () => new EllmaError(404, "not_found");
