const { Rental } = require("../models/rental");
const { Movie } = require("../models/movie");
const auth = require("../middlewares/auth");
const moment = require("moment");
const express = require("express");
const router = express.Router();

router.post("/", auth, async (req, res) => {
  if (!req.body.customerId)
    return res.status(400).send("customerId not provided.");
  if (!req.body.movieId) return res.status(400).send("movieId not provided");

  const rental = await Rental.findOne({
    "customer._id": req.body.customerId,
    "movie._id": req.body.movieId,
  });
  if (!rental) return res.status(404).send("Rental not found.");

  if (rental.dateReturned)
    return res.status(400).send("Return already processed.");

  rental.dateReturned = new Date();

  const daysRented = moment().diff(rental.dateOut, "days"); // diff between now and the date returned in days
  rental.rentalFee = daysRented * rental.movie.dailyRentalRate;
  await rental.save();

  await Movie.findByIdAndUpdate(rental.movie._id, {
    $inc: { numberInStock: 1 },
  });

  res.send(rental);
});

module.exports = router;
