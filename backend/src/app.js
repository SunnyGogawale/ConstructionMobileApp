const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const {notFoundHandler, errorHandler} = require('./middlewares/errorHandler');
const {corsOrigin} = require('./config/env');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({limit: '1mb'}));
  app.use(express.urlencoded({extended: true}));
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.json({success: true, message: 'API is healthy'});
  });

  app.use('/api/v1', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
