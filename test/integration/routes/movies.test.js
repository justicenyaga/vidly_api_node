const request = require("supertest");
const mongoose = require("mongoose");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { Movie } = require("../../../models/movie");

describe("/api/movies", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Movie.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all the movies", async () => {
      await Movie.collection.insertMany([
        {
          title: "movie1",
          dailyRentalRate: 2,
          numberInStock: 2,
          genre: { name: "genre1" },
        },
        {
          title: "movie2",
          dailyRentalRate: 4,
          numberInStock: 10,
          genre: { name: "genre2" },
        },
      ]);

      const res = await request(server).get("/api/movies");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(
        res.body.some((m) => m.title === "movie1" && m.dailyRentalRate === 2)
      ).toBeTruthy();
      expect(
        res.body.some((m) => m.title === "movie2" && m.dailyRentalRate === 4)
      ).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return the movie if valid id is passed", async () => {
      const movie_object = {
        title: "movie1",
        numberInStock: 2,
        dailyRentalRate: 4,
        genre: { name: "genre1" },
      };
      const movie = await Movie.create(movie_object);

      const res = await request(server).get("/api/movies/" + movie._id);

      expect(res.body).toMatchObject(movie_object);
    });

    it("should return 404 if an invalid id is passed", async () => {
      const res = await request(server).get("/api/movies/1");
      expect(res.status).toBe(404);
    });

    it("should return 404 if no movie exists for the given id", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(server).get("/api/movies/" + id);
      expect(res.status).toBe(404);
    });
  });
});
