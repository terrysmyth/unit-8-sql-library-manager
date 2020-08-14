const express = require('express');
const router = express.Router();
const Book = require('../models').Book;
const Sequelize = require('sequelize');
const {Op} = Sequelize;

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}

/* GET books listing. */
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll();
  res.render("books/index", { books, title: "My SQL Library" });

}));

router.post('/search', asyncHandler( async (req, res) => {
    let books;
    const search = req.body.search;
    if (search == "") {
      books = await Book.findAll();

      res.render("books/index", { books, title: "My SQL Library" });
    }
    try {
      books = await Book.findAll({
        where: {
            [Op.or]: [
              {title: {
                [Op.substring]: search
              }},
              {author:  {
                [Op.substring]: search
              }},
              {year:  {
                [Op.substring]: search
              }},
              {genre:  {
                [Op.substring]: search
              }}
            ]
        }
      })
      if (books){
        res.render("books/index", { books, title: `Search: ${req.body.search}` });
      }
    } catch (error) {

    }
}));

/* Create a new book form. */
router.get('/new', (req, res) => {
  res.render("books/new",  {title: "Make a new book"});
}); 

/* POST create book. */
router.post('/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books/" + book.id);
  } catch (error) {
     if(error.name === "SequelizeValidationError") { // checking the error
      book = await Book.build(req.body);
      res.render("books/new", { book, errors: error.errors, title: "New book" })
    } else {
      throw error; // error caught in the asyncHandler's catch block
    }  
  }
}));

/* GET individual book. */
router.get("/:id", asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.findByPk(req.params.id)
      res.render("books/show", { book, title: book.title });
    } catch (error) {
      res.render("books/page-not-found.pug", {title: "Sorry! Book not found!" });
    }
    
}));

/* Update an book. */
router.post('/:id/edit', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      await book.update(req.body);
      res.redirect("/books/" + book.id); 
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id; // make sure correct book gets updated
      res.render("books/" + book.id, { book, errors: error.errors, title: "Edit book" })
    } else {
      throw error;
    }
  }
  
}));

/* Delete individual book. */
router.post('/:id/delete', asyncHandler(async (req ,res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    await book.destroy();
    res.redirect("/books");
  } else {
    res.sendStatus(404);
  }
}));

module.exports = router;