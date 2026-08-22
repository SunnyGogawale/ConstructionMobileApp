const createApp = require('./app');
const connectDatabase = require('./config/database');
const {port, host, nodeEnv} = require('./config/env');

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const listenArgs = host ? [port, host] : [port];

  app.listen(...listenArgs, () => {
    console.log(`Backend running on ${host || '0.0.0.0'}:${port} in ${nodeEnv} mode`);
  });
}

bootstrap().catch(error => {
  console.error('Server bootstrap failed:', error.message);
  process.exit(1);
});
