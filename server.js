const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration (CRITICAL for authentication)
app.use(session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
    secret: 'your-super-secret-key-change-this-to-something-random',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        httpOnly: true,
        secure: false // Set to true if using HTTPS
    }
}));

// Make user data available to all views
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId ? {
        id: req.session.userId,
        username: req.session.username
    } : null;
    next();
});

// Initialize database
db.initializeDatabase();

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const establishmentRoutes = require('./routes/establishments');
const reviewRoutes = require('./routes/reviews');
const profileRoutes = require('./routes/profile');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/establishments', establishmentRoutes);
app.use('/reviews', reviewRoutes);
app.use('/profile', profileRoutes);

app.listen(PORT, () => {
    console.log(`Community Insight Portal running at http://localhost:${PORT}`);
});