const { Rental, validateRental } = require("../models/rental");
const { Customer } = require("../models/customer");
const { Movie } = require("../models/movie");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const validateObjectId = require("../middlewares/validateObjectId");
const _ = require("lodash");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const rentals = await Rental.find().sort("-dateOut");
  res.send(rentals);
});

router.post("/", [auth, validate(validateRental)], async (req, res) => {
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send("Invalid customer");

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send("Invalid movie");

  if (movie.numberInStock === 0)
    return res.status(400).send("Movie not in stock.");

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const rental = await Rental.create(
      [
        {
          customer: _.pick(customer, ["_id", "name", "phone", "isGold"]),
          movie: _.pick(movie, ["_id", "title", "dailyRentalRate"]),
        },
      ],
      { session }
    );

    await movie.updateOne({ $inc: { numberInStock: -1 } }, { session });

    await session.commitTransaction();
    res.send(rental[0]);
  } catch (error) {
    await session.abortTransaction();
    res.status(500).send("Something went wrong.");
  }

  session.endSession();
});

router.get("/:id", validateObjectId, async (req, res) => {
  const rental = await Rental.findById(req.params.id);
  if (!rental)
    return res.status(404).send("The rental with the given Id was not found");

  res.send(rental);
});

module.exports = router;
