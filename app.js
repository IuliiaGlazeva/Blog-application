var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');




var Sequelize = require('sequelize');
var sequelize = new Sequelize('blogapp', process.env.POSTGRES_USER,process.env.POSTGRES_PASSWORD, {
	host: 'localhost',
	dialect: 'postgres',
	define:{
		timestamps: false
	}
});

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

var app = express();

app.use(session({
	secret: 'some text',
	resave:true,
	saveUninitialized: false
}));

//app.use('/', bodyParser);
app.set('views', 'view');
app.set('view engine', 'pug');

app.get('/', (req, res) => {

	res.render('index', {
        message: req.query.message,
		user: req.session.user
	});

});


app.get('/profile', (req, res) => {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
    } else {
        res.render('profile', {
            user: user
        });
    }
});

app.get('/signup', (req, res) => {
    res.render('signup', {
        user: session.user
    });
});

app.post('/login', bodyParser.urlencoded({extended: true}), (req, res) => {
    if(req.body.email.length === 0) {
        res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
        return;
    }

    if(req.body.password.length === 0) {
        res.redirect('/?message=' + encodeURIComponent('Please fill out your password.'));
        return;
    }

    User.findOne({
        where: {
            email: req.body.email
        }
        
    }).then(function (user) {
        if (user !== null && req.body.password === user.password) {
            req.session.user = user;
            res.redirect('/profile');
        } else {
            res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
        }
    }, function (error) {
        res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(function(error){
        if(error){
            throw error;
        }
        res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    });
});

sequelize.sync({force: true}).then(function () {
    User.create({
        name: "stabbins",
        email: "iuliia@gmail.com",
        password: "not_password"

    }).then(function () {
        var server = app.listen(3000, function () {
            console.log('BlogApp listening on port: ' + server.address().port);
        });
    });
    }, function (error) {
    console.log('sync failed: ');
    console.log(error);
});