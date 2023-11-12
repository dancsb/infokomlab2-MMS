const express = require('express');
const app = express();

const fs = require('fs');
const http = require('http');
const https = require('https');

const credentials = {
    key: fs.readFileSync('C:/Users/balazs/Documents/___dancs.sch.bme.hu/dancs.sch.bme.hu/privkey.pem'),
    cert: fs.readFileSync('C:/Users/balazs/Documents/___dancs.sch.bme.hu/dancs.sch.bme.hu/fullchain.pem')
};

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(express.static('static'));

require('./route/main')(app);

app.use((err, req, res, next) => {
    res.end('Problem...');
    console.log(err);
});

const httpServer = http.createServer(function (req, res) {
    res.writeHead(302, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
});
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);