const config = require("config");
const { createLogger, transports, format } = require("winston");
const { combine, colorize, timestamp, prettyPrint, printf, json, simple } =
  format;
require("winston-mongodb");

const db = config.get("db");

const my_transports = [
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
    format: combine(timestamp({ format: "YYYY-MM-DD hh:mm:ss.SSS A" }), json()),
  }),
];

if (process.env.NODE_ENV !== "test")
  my_transports.push(
    new transports.MongoDB({
      level: "info",
      format: json(),
      db,
      options: {
        useUnifiedTopology: true,
      },
    })
  );

module.exports = createLogger({
  format: combine(prettyPrint(), simple()),
  level: "info",
  transports: my_transports,
  exceptionHandlers: [
    new transports.Console(),
    new transports.File({
      filename: "logs/exceptions.log",
      format: json(),
    }),
  ],
});
