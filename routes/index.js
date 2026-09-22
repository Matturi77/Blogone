var express = require('express');
var router = express.Router();
const db = require('./database');

/* GET home page. */
router.get('/', function(req, res, next) {
  db.all("SELECT * FROM posts", (err, rows) => {
    if (err) {
        throw err;
    }
    res.render('index', { title: 'My Blog', posts: rows });
});
});

module.exports = router;
