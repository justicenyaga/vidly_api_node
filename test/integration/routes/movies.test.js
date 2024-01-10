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
const { Genre } = require("../../../models/genre");
const { User } = require("../../../models/user");

describe("/api/movies", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Movie.deleteMany({});
    await Genre.deleteMany({});
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

  describe("POST /", () => {
    let token;
    let title;
    let dailyRentalRate;
    let numberInStock;
    let genreId;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      title = "movie1";
      dailyRentalRate = 2;
      numberInStock = 10;
      genreId = new mongoose.Types.ObjectId();

      await Genre.create({ _id: genreId, name: "genre1" });
    });

    const exec = () =>
      request(server).post("/api/movies").set("x-auth-token", token).send({
        title,
        dailyRentalRate,
        numberInStock,
        genreId,
      });

    it("should return 401 if the client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if the title is less than 5 characters", async () => {
      title = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if the title is more than 50 characters", async () => {
      title = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if dailyRentalRate is less than 0", async () => {
      dailyRentalRate = -1;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if numberInStock is less than 0", async () => {
      numberInStock = -1;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if an invalid genreId is passed", async () => {
      genreId = "1";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if no genre exists for the given id", async () => {
      genreId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should save the movie if the request is valid", async () => {
      await exec();
      const movie = await Movie.findOne({
        title,
        dailyRentalRate,
        numberInStock,
      });

      const expected_movie = { title, dailyRentalRate, numberInStock };

      expect(movie).toMatchObject(expected_movie);
    });

    it("should return the movie if the request is valid", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining([
          "_id",
          "title",
          "dailyRentalRate",
          "numberInStock",
          "genre",
        ])
      );
    });
  });
});
