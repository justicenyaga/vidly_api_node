const request = require("supertest");
const mongoose = require("mongoose");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { Rental } = require("../../../models/rental");
const { User } = require("../../../models/user");
const { Customer } = require("../../../models/customer");
const { Movie } = require("../../../models/movie");

describe("/api/rentals", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Rental.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all the rentals", async () => {
      await Rental.collection.insertMany([
        {
          customer: { name: "customer1", phone: "12345" },
          movie: { title: "movie1", dailyRentalRate: 2 },
        },
        {
          customer: { name: "customer2", phone: "67890" },
          movie: { title: "movie2", dailyRentalRate: 5 },
        },
      ]);

      const res = await request(server).get("/api/rentals");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);

      expect(
        res.body.some(
          (r) => r.customer.name === "customer1" && r.movie.title === "movie1"
        )
      ).toBeTruthy();
      expect(
        res.body.some(
          (r) => r.customer.name === "customer2" && r.movie.title === "movie2"
        )
      ).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return a rental if given a valid id", async () => {
      const id = new mongoose.Types.ObjectId();
      await Rental.create({
        _id: id,
        customer: { name: "customer1", phone: "12345" },
        movie: { title: "movie1", dailyRentalRate: 2 },
      });

      const res = await request(server).get("/api/rentals/" + id);
      expect(res.body.customer).toHaveProperty("name", "customer1");
      expect(res.body.movie).toHaveProperty("title", "movie1");
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "customer", "movie", "dateOut"])
      );
    });

    it("should return 404 if no rental with the given id exists", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(server).get("/api/rentals/" + id);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let customerId;
    let movieId;
    let token;
    let numberInStock;

    beforeEach(async () => {
      customerId = new mongoose.Types.ObjectId();
      movieId = new mongoose.Types.ObjectId();
      token = new User().generateAuthToken();
      numberInStock = 3;

      await Customer.create({
        _id: customerId,
        name: "customer1",
        phone: "12345",
      });

      await Movie.create({
        _id: movieId,
        title: "movie1",
        numberInStock,
        dailyRentalRate: 2,
        genre: { name: "genre1" },
      });
    });

    afterEach(async () => {
      await Customer.deleteMany({});
      await Movie.deleteMany({});
      await Rental.deleteMany({});
    });

    const exec = () =>
      request(server)
        .post("/api/rentals")
        .set("x-auth-token", token)
        .send({ customerId, movieId });

    it("should return 400 if no customer with the given customerId exists", async () => {
      customerId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if no movie with the given movieId exists", async () => {
      movieId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if the given movie is not in stock", async () => {
      const movie = await Movie.create({
        title: "movie1",
        numberInStock: 0,
        dailyRentalRate: 2,
        genre: { name: "genre1" },
      });
      movieId = movie._id;

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return the rental if the inputs are valid", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "customer", "movie", "dateOut"])
      );
    });

    it("should decrement the movie stock if the inputs are valid", async () => {
      await exec();
      const movieInDb = await Movie.findById(movieId);
      expect(movieInDb.numberInStock).toBe(numberInStock - 1);
    });
  });
});
