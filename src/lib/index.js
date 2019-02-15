import fetch from 'isomorphic-fetch';
import admin from 'firebase-admin';
import express from 'express';
import serviceAccount from '../../../config/serviceAccountKey';
import config from '../../../config/server';
import serverFetch from './fetch';
import validate from './validate';

import login from '../../pages/login/Login';
import token from '../../pages/token/Token';
import logout from '../../pages/logout/Logout';
import newUser from '../../pages/newUser/NewUser';

import bodyParser from 'body-parser';

import setTimeZone from './setTimezone';

import rest from '../../rest/index';

import alpha1 from '../../alpha1/index';
import morgan from 'morgan';


const expressApp = express();

const fbApp = admin.initializeApp({
    credential:  admin.credential.cert(serviceAccount),
    databaseURL: config.databaseURL,
}, 'migraine-detective_' + new Date().getTime());

expressApp.use(bodyParser.json());

// Set server side Timezone from client.
// We taking timezone, based on client IP. For Proxy this is an issue.
// Mostly this is important for Browsers, without service workers.
expressApp.use(setTimeZone);


if (process.env.NODE_ENV !== 'test') {
    expressApp.use(morgan('combined'));
    //General validation, second param in array, we can define secured entries.
    expressApp.use(validate(fbApp, [
        '/app',
        '/api/v1/events',
        '/api/v1/keywords',
        '/api/v1/profile'
    ],'/token'));

    expressApp.get('/login', (req, res) => res.send(login()));
    expressApp.get('/logout', (req, res) => res.send(logout()));
    expressApp.get('/token', (req, res) => res.send(token()));
    expressApp.get('/new-user', (req, res) => res.send(newUser()));

    expressApp.get('/app/dashboard', (req, res) => res.redirect('/token'));

}

//There is a part for app routes
// This one is for Application Calendar and input.
/*expressApp.use((req, res, next) => app(appResponse(req))
    .then(({content}) => res.send(content))
    .catch(() => next()));*/

const appResponse = serverFetch(fbApp);
expressApp.use((req, res, next) => alpha1(appResponse(req))
    .then(({content}) => res.send(content))
    .catch(() => next()));

//This is part for the rest service.
rest(fbApp).then(service => expressApp.use('/api/v1', service));


export default expressApp
