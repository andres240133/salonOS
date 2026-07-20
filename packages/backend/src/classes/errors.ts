export class SlotUnavailableError extends Error {
  readonly statusCode = 409;

  constructor(message = 'Este horario ya no está disponible, por favor elige otro') {
    super(message);
    this.name = 'SlotUnavailableError';
  }
}

export class ServiceNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message = 'Servicio no encontrado o inactivo') {
    super(message);
    this.name = 'ServiceNotFoundError';
  }
}

export class BookingNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message = 'Cita no encontrada') {
    super(message);
    this.name = 'BookingNotFoundError';
  }
}
