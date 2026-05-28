// Лёгкий логгер. В проде стоило бы winston, но для MVP - хватит.
const log = (level, msg, meta) => {
  const stamp = new Date().toISOString();
  const line  = `[${stamp}] [${level}] ${msg}`;
  if (meta) console.log(line, meta);
  else console.log(line);
};

module.exports = {
  info:  (msg, meta) => log('INFO',  msg, meta),
  warn:  (msg, meta) => log('WARN',  msg, meta),
  error: (msg, meta) => log('ERROR', msg, meta)
};
