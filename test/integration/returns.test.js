const request = require("supertest");
const moment = require("moment");
const mongoose = require("mongoose");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { Rental } = require("../../models/rental");
const { User } = require("../../models/user");

describe("/api/returns", () => {
  let server;
  let customerId;
  let movieId;
  let rental;
  let token;

  beforeEach(async () => {
    server = require("../../index");

    token = new User().generateAuthToken();
    customerId = new mongoose.Types.ObjectId();
    movieId = new mongoose.Types.ObjectId();

    rental = await Rental.create({
      customer: {
        _id: customerId,
        name: "12345",
        phone: "12345",
      },
      movie: {
        _id: movieId,
        title: "12345",
        dailyRentalRate: 2,
      },
    });
  });

  afterEach(async () => {
    await server.close();
    await Rental.deleteMany({});
  });

  const exec = () =>
    request(server)
      .post("/api/returns")
      .set("x-auth-token", token)
      .send({ customerId, movieId });

  it("should return 401 if the client is not logged in", async () => {
    token = "";
    const res = await exec();
    expect(res.status).toBe(401);
  });

  it("should return 400 if no customerId is provided", async () => {
    customerId = "";
    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return 400 if no movieId is provided", async () => {
    movieId = "";
    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return 404 if no rental exists for the given customer/movie", async () => {
    await Rental.deleteMany({});
    const res = await exec();
    expect(res.status).toBe(404);
  });

  it("should return 400 if the return has already been processed", async () => {
    rental.dateReturned = new Date();
    await rental.save();

    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return 200 if request is valid", async () => {
    const res = await exec();
    expect(res.status).toBe(200);
  });

  it("should set the date returned if request is valid", async () => {
    await exec();

    const rentalInDb = await Rental.findById(rental._id);

    const diff = new Date() - rentalInDb.dateReturned;
    expect(diff).toBeLessThan(10 * 1000); // expect the dateReturned to have been set less than 10 seconds ago
  });

  it("should set the rental fee if the input is valid", async () => {
    // Simulate the order was created 7 days ago
    rental.dateOut = moment().add(-7, "days").toDate();
    await rental.save();

    await exec();

    const rentalInDb = await Rental.findById(rental._id);
    expect(rentalInDb.rentalFee).toBe(14); // rentalFee is dailyRentalRate (2) x days rented (7)
  });
});
