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

User.hasMany(Message)
Message.belongsTo(User)

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
    sequelize.sync()
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
    Message.findAll()
        .then((messages)=>{
            response.render('messages', {
                messages: messages
            });
        })
});

app.post('/messages', function(request, response){
    // //welcher user schreibt die Nachricht?
        User.findOne({
            where: {
                id: request.session.user.id //userId des eingelogten Users
            }
        })
        .then((user) => {
            console.log(user);
            user.createMessage({
                title: request.body.title,
                message: request.body.message
            })
            .then(() => {
                response.redirect('/myposts')
            })
        });
    //user.createMessage
     Message.create({
        title: request.body.title,
        message: request.body.message
    })
    .then(() => {
        response.redirect('/myposts')
    })
})

 
app.get('/specialPost', function(request, response) {
    var postId = request.session.id;
    Message.findOne({
        where {         
            id: request.session.user.id
        }
          include
    })
   
  
})

 app.get('/myposts', function(request, response){
    console.log(request.session.user)
    Message.findAll({
        where: {
            id: request.session.user.id
        }
    })
    .then( (posts) => {
        console.log(posts)
        response.render('myposts', {posts: posts})  
    })
})

app.get('/allposts', function(request, response){
    console.log(request.session.user)
    Message.findAll()
    .then( (posts) => {
        response.render('allposts', 
            {posts: posts})  
    })
})

sequelize.sync({force: false}).then(function () {
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