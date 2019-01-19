var express = require('express');
var appExpress = express();
var bodyParser = require('body-parser');
var app = require('http').createServer(appExpress)
var io = require('socket.io')(app);
var fs = require('fs');


function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
        function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading index.html');
            }

            res.writeHead(200);
            res.end(data);
        });
}
app.listen(3000);
appExpress.get('/api/banks', (req, res) => {
    var parse = require('csv-parse');
    var csvData=[];
    var bankData = [];
    fs.createReadStream("./data/banks.csv")
        .pipe(parse({delimiter: ':'}))
        .on('data', function(csvrow) {
            csvData.push(csvrow);
        })
        .on('end',function() {
            csvData.forEach((d) => {
                d = d[0].replace(/'/g,'');
                var a = d.split(",");
                var temp = {};
                temp.id = Number(a[0]);
                temp.name = a[1];
                bankData.push(temp)
            });
            res.send(bankData);
        });
});
appExpress.post('/api/creditcard',(req, res) => {
    var isValid = false;
    if(req.body && req.body.creditCard && req.body.expirationDate && req.body.cvc && req.body.amount){
        isValid = true;
    }
    res.send({valid: isValid});
})

appExpress.use(bodyParser.json());
appExpress.post('/api/netbanking',(req, res) => {
    var isValid = false;
    if(req.                     body && req.body.selectedBank && req.body.amount){
        isValid = true;
    }
    res.send({valid: isValid});
})
io.on('connection', function (socket) {
    postPriceData(socket);
    fs.watch("./data/price.csv", (event, filename) => {
        if (filename && event ==='change') {
            console.log(`${filename} file Changed`);
            postPriceData(socket);
        }
    });
});

function postPriceData(socket) {
    var parse = require('csv-parse');
    var csvData=[];
    var priceData = [];
    fs.createReadStream("./data/price.csv")
        .pipe(parse({delimiter: ':'}))
        .on('data', function(csvrow) {
            csvData.push(csvrow);
        })
        .on('end',function() {
            csvData.forEach((d) => {
                d = d[0].replace(/'/g,'');
                var a = d.split(",");
                var temp = {};
                temp.price = Number(a[1]);
                temp.bonusPrice = Number(a[2]);
                temp.order = a[0];
                priceData.push(temp)
            });
            priceData = priceData.sort(function (a,b) {
                if(a.order < b.order){
                    return -1;
                } else {
                    return 1;
                }
            });
            priceData.forEach((d)=>{
                d.order = undefined;
            })
            socket.emit("priceData",priceData);
        });
}