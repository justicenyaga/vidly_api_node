const { Movie, validate } = require("../models/movie");
const { Genre } = require("../models/genre");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const validateObjectId = require("../middlewares/validateObjectId");
const _ = require("lodash");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const movies = await Movie.find().sort("title");
  res.send(movies);
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send("Invalid genre");

  const movie = new Movie({
    ..._.pick(req.body, ["title", "numberInStock", "dailyRentalRate"]),
    genre,
  });
  await movie.save();
  res.send(movie);
});

router.put("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findById(req.body.genreId);
  if (!genre) return res.status(400).send("Invalid genre");

  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    {
      ..._.pick(req.body, ["title", "numberInStock", "dailyRentalRate"]),
      genre,
    },
    { new: true }
  );
  if (!movie)
    return res.status(404).send("The movie with the given Id was not found");

  res.send(movie);
});

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie)
    return res.status(404).send("The movie with the given Id was not found");

  res.send(movie);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie)
    return res.status(404).send("The movie with the given Id was not found");

  res.send(movie);
});

module.exports = router;
