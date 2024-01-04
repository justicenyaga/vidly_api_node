const { createLogger, transports, format } = require("winston");
const { combine, colorize, timestamp, prettyPrint, printf, json, simple } =
  format;
require("winston-mongodb");

module.exports = createLogger({
  format: combine(prettyPrint(), simple()),
  level: "info",
  transports: [
    new transports.Console({
      format: combine(
        colorize({ level: true }),
        timestamp({
          format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
        prettyPrint(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
      ),
    }),
    new transports.File({
      filename: "logs/logfile.log",
      format: combine(
        timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }),
        json()
      ),
    }),
    new transports.MongoDB({
      level: "info",
      format: json(),
      db: "mongodb://localhost/vidly",
      options: {
        useUnifiedTopology: true,
      },
    }),
  ],
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({
      filename: "logs/exceptions.log",
      format: json(),
    }),
  ],
});
