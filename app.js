const path = require('path');
const express = require('express');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index');
const app = express();

function setGloalVars(req, res, next) {
  res.locals.PUBLIC_PATH = 'http://127.0.0.1:' + app.locals.settings.port;
  res.locals.HANDLE_TYPE = '__MOCK_SERVER_NAVIGATE_SAVE__';
  next();
}

app.all('*', function (req, res, next) {
  const origin = req.headers.origin;

  if (origin && /guazi(?:-cloud|-apps)?\.com/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const requestedHeaders = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    requestedHeaders || 'Content-Type, Authorization, Identity, guazisso, x-ganji-token, pai-token, Accept, Referer, User-Agent, request-id'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Content-Security-Policy', ' upgrade-insecure-requests');
  res.setHeader('X-Powered-By', ' 3.2.1');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(204);
  }
  next();
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(setGloalVars);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
