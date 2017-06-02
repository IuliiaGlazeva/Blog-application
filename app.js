const express = require('express');
const app = express();
const bodyParser = require('body-parser')();
var session = require('express-session');




const Sequelize = require('sequelize');
const sequelize = new Sequelize('blogapp', process.env.POSTGRES_USER,process.env.POSTGRES_PASSWORD, {
	host: 'localhost',
	dialect: 'postgres',
	define:{
		timestamps: false
	}
});

sequelize.sync({forse: true})

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    password: Sequelize.STRING
});

app.use(session({
	secret: 'some text',
	resave:true,
	saveUninitialized: false
}));

app.use('/', bodyParser);
app.set('views', 'views');
app.set('view engine', 'pug');

app.get('/', (req, res) => {
	response.render('index', {
		message: req.query.message,
		user: req.session.user
	});
});


sequelize.sync({force: true}).then(function () {
    User.create({
        name: "stabbins",
        password: "not_password"
    }).then(function () {
        var server = app.listen(3000, function () {
            console.log('BlogApp: ' + server.address().port);
        });
    });
    }, function (error) {
    console.log('sync failed: ');
    console.log(error);
});