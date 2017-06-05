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

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    password: Sequelize.STRING
});

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
		user: req.session.user
	});

});

app.get('/signup', (req, res) => {
    res.render('signup', {
        user: session.user
    });
});

app.get('/profile', function (request, response) {
    var user = request.session.user;
    if (user === undefined) {
        response.end("please log in");
    } else {
        response.render('profile', {
            user: user
        });
    }
});

// app.post('/login', bodyParser.urlencoded({extended: true}), function (request, response) {
//     if(request.body.email.length === 0) {
//         response.end('Please fill out your email address')
//         response.redirect('/login');
//         return;
//     }

//     if(request.body.password.length === 0) {
//         response.end('Please fill out your password');
//         response.redirect('/login')
//     }

//     User.findOne({
//         where: {
//             email: request.body.email
//         }
//     }).then(function (user) {
//         if (user !== null && request.body.password === user.password) {
//             request.session.user = user;
//             response.redirect('/profile');
//         } else {
//             response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
//         }
//     }, function (error) {
//         response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
//     });
// });



sequelize.sync({force: true}).then(function () {
    User.create({
        name: "stabbins",
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