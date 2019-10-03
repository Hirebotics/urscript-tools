import { createLogger, format, transports } from 'winston';

const level: string = process.env.LOG_LEVEL || 'warn';

export const logger = createLogger({
  level,
  format: format.json(),
  transports: [new transports.Console()],
});
