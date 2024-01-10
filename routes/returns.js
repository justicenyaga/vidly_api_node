const { Rental, validateRental } = require("../models/rental");
const { Movie } = require("../models/movie");
const auth = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const express = require("express");
const router = express.Router();

router.post("/", [auth, validate(validateRental)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
  if (!rental) return res.status(404).send("Rental not found.");

  if (rental.dateReturned)
    return res.status(400).send("Return already processed.");

  rental.return();
  await rental.save();

  await Movie.findByIdAndUpdate(rental.movie._id, {
    $inc: { numberInStock: 1 },
  });

  res.send(rental);
});

module.exports = router;
