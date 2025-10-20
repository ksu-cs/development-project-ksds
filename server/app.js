var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var compress = require('compression');

var indexRouter = require('./routes/index');

var app = express();

app.use(compress());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve all static files in public/geojson/
app.use('/geojson', express.static(path.join(__dirname, 'public', 'geojson')));

app.use('/', indexRouter);

module.exports = app;
