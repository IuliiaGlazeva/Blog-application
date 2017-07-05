var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
const bcrypt= require('bcrypt-nodejs');

var sequelize = new Sequelize('blogapp', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres',
    define: {
        timestamps: false
    }
});
// creating tables

var User = sequelize.define('user', {
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

var Post = sequelize.define('post', {
    title: Sequelize.STRING,
    post: Sequelize.STRING
})

var Comment = sequelize.define('comment', {
    comment: Sequelize.STRING
})

User.hasMany(Post)
Post.belongsTo(User)
Post.hasMany(Comment)
User.hasMany(Comment)
Comment.belongsTo(Post)
Comment.belongsTo(User)

sequelize.sync({force:false})

const app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: `${process.env.SECRET_SESSION}`,
    resave: true,
    saveUninitialized: false
}));

app.set('views', 'view');
app.set('view engine', 'pug');



app.get('/', function (req, res) {

    res.render('index', {
        post: req.query.post,
        user: req.session.user,
        
        
    });
});


app.post('/login', (req, res) => {
    if(req.body.email.length ===0) {
        res.redirect('/login?message=' + encodeURIComponent("Invalid email"));
        return;
    }
    if(req.body.password.length ===0) {
        res.redirect('/login?message=' + encodeURIComponent("Invalid password"));
        return;
    }
    User.findOne({
        where: {
            email:req.body.email
        }
    }).then((user) => { //This part needs fixing, when the email is not in the database it should not pass on, it will yield errors.
        if(user === null) {
            res.redirect('/login?message=' + encodeURIComponent("Does not exist!"));
            return;
        }
        bcrypt.compare(req.body.password, user.password, (err, data)=>{
            if (err) {
                    throw err;
            } else {
                if(user !== null && data === true) {
                    loggedInUser= user;
                    req.session.user = loggedInUser;
                    res.redirect('/profile');
                } else {
                    res.redirect('/login?message=' + encodeURIComponent("Invalid email or password."));
                }
            }
        });
    }), (error)=> {
        res.redirect('/login?message=' + encodeURIComponent("Invalid email or password."));
    };
});


app.get('/logout', (req, res) => {
    req.session.destroy(function(error) {
        if(error) {
            throw error;
        }

        res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
    })
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
    });
});

app.post('/signup', (req, res) => {
    // check email im DB
        User.findOne({
            where: {
                    email: req.body.email
            }
        })
        .then((user) => {
            if(user !== null && req.body.email=== user.email) {
                res.redirect('/?message=' + encodeURIComponent("Email already exists!"));
                return;
            }
            else{
                bcrypt.hash(req.body.password, null, null, (err, hash) =>{
                    if (err) {
                        throw err
                    }
                    User.sync()
                    .then(() => {
                        User.create({
                            name: req.body.name,
                            email: req.body.email,
                            password: hash,
                    
                        })
                    })
                    .then(() =>{
                        res.redirect('/login')
                    })
                    .then().catch(error=> console.log(error))
                })
            }
        })
        
    .then().catch(error => console.log(error))
})

app.get('/post', function(req, res){
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to post a message."));
    } 
    else {
        Post.findAll()
            .then((posts)=>{
                res.render('post', {
                posts: posts
            });
        })
    }
});

app.post('/post', function(req, res){
    var user = req.session.user;
        Post.findOne({
            where: {
                userId: user.id //userId des eingelogten Users
            }
        })
        .then((post) => {
            console.log(user);
            Post.create({
                title: req.body.title,
                post: req.body.post,
                userId: user.id
            })
        .then(() => {
            res.redirect('/myposts')
        })
    })

});

 
// app.get('/allposts', function(request, response) {
//     var user = request.session.user;
//     if (user === undefined) {
//         response.redirect('/?message=' + encodeURIComponent("Please log in to post a message."));
//     } else {
//     Post.findAll({
//         where: {         
//             userId: user.id
//         },
//         include: [{
//                 model9: User},
//                 {
//                 model: Post},
//                 {
//                 model: Comment}]
//     }) 
//     .then((posts) => {
//         response.render('myposts')
//     })

//     } 
// })

 app.get('/myposts', (req, res) => {
    var user = req.session.user;
    Post.findAll({
            where: {         
                userId: user.id
            },
            include: [{
                model: User
            },
            {
                model: Comment,
                include: [User]
            }]
        }) 
    .then( (posts) => {
        console.log('my amaizing posts')
        console.log(posts)
        res.render('myposts', {posts: posts})  
    })
})

app.get('/allposts', (req, res) => {
    var user = req.session.user;
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in to post a message."));
    } 
    else {
        Post.findAll({
            include: [{
                model: User
            },
            {
                model: Comment,
                as: 'comments'
            }]
        }) 
        .then( (posts) => {

        res.render('allposts', 
            {posts: posts
            })  
        })
    }
})

app.post('/comments', (req, res) => {
    const user = req.session.user;
    console.log('req.query.amazingPostId', req.query.amazingPostId)
    if (user === undefined) {
        res.redirect('/?message=' + encodeURIComponent("Please log in."));
    } 
    else{

        Comment.create({
           comment: req.body.comment,
           postId: req.query.amazingPostId, //linked to post
           userId: user.id
        })
        .then(() => {
            res.redirect('/myposts')
        })
    }
})

var server = app.listen(3000, function () {
    console.log('Example app listening on port: ' + server.address().port);
});

