const express       = require('express');
const session       = require('express-session');
const {engine}      = require('express-handlebars');
const mongoose      = require('mongoose');
const passport      = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt        = require('bcryptjs');
const app           = express();

mongoose.set('strictQuery', false);

mongoose.connect('mongodb://127.0.0.1:27017/demo_code', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: {
        type : String,
        required: true
    },
    password: {
        type : String,
        required: true
    }
});

const User = mongoose.model('User', userSchema); 

//Middleware
app.engine('hbs', engine({extname: '.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(session ({
    secret: 'very good secret',
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//Passport.json
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    //setup user moderator
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new localStrategy(function(username, password, done) {
    User.findOne({username: username}, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, {message: 'Incorrect username.'});
        }

        bcrypt.compare(password, user.password, function(err, res) {
            if (err) {
                return done(err);
            }
            if (res === false) {
                return done(null, false, {message: 'Incorrect password.'});
            }
            return done(null, user);
        });
    });
}));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

//Routes
app.get('/', (req, res) => {
    res.render('index', {title: "Home"});
});

app.get('/login', (req, res) => {
    res.render('login', {title : "Login"});
});

// app.post('/login', passport.authenticate('local', {
//     successRedirect: '/', 
//     failureRedirect: "/login?error=true"
// }));

//Setup or admin user
app.get('/main', async (req, res) => {
    const exists = await User.exists({username: "admin"});

    if (exists) {
        console.log("Admin user already exists");
        res.redirect('/login');
        return;
    } else {
    
    }

    bcrypt.getSalt(10, function(err, salt) {
        if (err) {
            console.log("error");
            return;
        }
        bcrypt.hash("pass", salt, function(err, hash) {
            if (err) {
                console.log("error");
                return;
            }
            const newAdmin = new User({
                username: "admin",
                password: 123
            });
            newAdmin.save();
            res.redirect('/login');
        });
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});

