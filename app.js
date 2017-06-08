var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var sequelize = new Sequelize('blogapp', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres',
    define: {
        timestamps: false
    }
});

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

var Message = sequelize.define('message', {
    title: Sequelize.STRING,
    message: Sequelize.STRING
})

var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'some text',
    resave: true,
    saveUninitialized: false
}));

app.set('views', 'view');
app.set('view engine', 'pug');

app.get('/', function (request, response) {
    response.render('index', {
        message: request.query.message,
        user: request.session.user
    });
});

app.get('/profile', function (request, response) {
    var user = request.session.user;
    if (user === undefined) {
        response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
    } else {
        response.render('profile', {
            user: user
        });
    }
});

app.post('/login', function (request, response) {
    if(request.body.email.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
        return;
    }

    if(request.body.password.length === 0) {
        response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
        return;
    }

    User.findOne({
        where: {
            email: request.body.email
        }
    }).then(function (user) {
        if (user !== null && request.body.password === user.password) {
            request.session.user = user;
            response.redirect('/profile');
        } else {
            response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
        }
    }, function (error) {
        response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    });
});

app.get('/logout', function (request, response) {
    request.session.destroy(function(error) {
        if(error) {
            throw error;
        }
        response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    })
});

app.get('/signup', function (request, response) {
    response.render('signup', {
    });
});

app.post('/signup', function(request, response){
    sequelize.sync({force: true})
    .then(() => {
        User.create({
        name: request.body.name,
        email: request.body.email,
        password: request.body.password
        })
        .then(() => {
            response.redirect('/profile');
        })
    })
})


app.get('/messages', function(request, response){
    response.render('messages', {

    });
});

 app.post('/messages', function(request, response){
    sequelize.sync({force: true})
    .then(() => {
        Message.create({
        title: request.body.title,
        body: request.body.body
        })
        .then(() => {
        response.redirect('/newpost')
        })
    })

 })   

sequelize.sync({force: true}).then(function () {
    User.create({
        name: "stabbins",
        email: "iuliia@gmail.com",
        password: "not_password"
    }).then(function () {
        var server = app.listen(3000, function () {
            console.log('Example app listening on port: ' + server.address().port);
        });
    });
}, function (error) {
    console.log('sync failed: ');
    console.log(error);
});