const { Genre, validateGenre } = require("../models/genre");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const validate = require("../middlewares/validate");
const validateObjectId = require("../middlewares/validateObjectId");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const genres = await Genre.find().sort("name");
  res.send(genres);
});

router.post("/", [auth, validate(validateGenre)], async (req, res) => {
  const genre = new Genre({ name: req.body.name });
  await genre.save();
  res.send(genre);
});

router.put(
  "/:id",
  [auth, validate(validateGenre), validateObjectId],
  async (req, res) => {
    const genre = await Genre.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
      },
      { new: true }
    );
    if (!genre)
      return res.status(404).send("The genre with the given Id was not found");

    res.send(genre);
  }
);

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const genre = await Genre.findByIdAndDelete(req.params.id);
  if (!genre)
    return res.status(404).send("The genre with the given Id was not found");

  res.send(genre);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre)
    return res.status(404).send("The genre with the given Id was not found");

  res.send(genre);
});

module.exports = router;
