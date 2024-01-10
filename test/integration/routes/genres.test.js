const request = require("supertest");
const mongoose = require("mongoose");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { Genre } = require("../../../models/genre");
const { User } = require("../../../models/user");

let server;

describe("/api/genres", () => {
  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Genre.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all the genres", async () => {
      await Genre.collection.insertMany([
        { name: "genre1" },
        { name: "genre2" },
      ]);
      const res = await request(server).get("/api/genres");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((g) => g.name === "genre1")).toBeTruthy();
      expect(res.body.some((g) => g.name === "genre2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return a genre if a valid id is passed", async () => {
      const genre = await Genre.create({ name: "genre1" });

      const res = await request(server).get("/api/genres/" + genre._id);

      expect(res.body).toHaveProperty("name", "genre1");
    });

    it("should return 404 if an invalid id is passed", async () => {
      const res = await request(server).get("/api/genres/1");
      expect(res.status).toBe(404);
    });

    it("should return 404 if no genre with the given id exists", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(server).get("/api/genres/" + id);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let token;
    let name;

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "genre1";
    });

    const exec = () =>
      request(server)
        .post("/api/genres")
        .set("x-auth-token", token)
        .send({ name });

    it("should return 401 if the client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if genre is less than 5 characters", async () => {
      name = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if genre is more than 50 character", async () => {
      name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should save the genre if it is valid", async () => {
      await exec();
      const genre = await Genre.findOne({ name: "genre1" });
      expect(genre).not.toBeNull();
    });

    it("should return the genre if it is valid", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "genre1");
    });
  });

  describe("PUT /:id", () => {
    let token;
    let name;
    let genreId;

    beforeEach(async () => {
      genreId = new mongoose.Types.ObjectId();
      token = new User().generateAuthToken();
      name = "genre5";

      await Genre.create({ _id: genreId, name: "genre1" });
    });

    afterEach(async () => {
      await Genre.deleteMany({});
    });

    const exec = () =>
      request(server)
        .put("/api/genres/" + genreId)
        .set("x-auth-token", token)
        .send({ name });

    it("should return 401 if the client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if genre is less than 5 characters", async () => {
      name = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if genre is more than 50 characters", async () => {
      name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if the given id is invalid", async () => {
      genreId = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no genre with the given id exists", async () => {
      genreId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should update the genre if input is valid", async () => {
      await exec();
      const genre = await Genre.findById(genreId);
      expect(genre).toHaveProperty("name", "genre5");
    });

    it("should return the update genre if input is valid", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "genre5");
    });
  });

  describe("DELETE /:id", () => {
    let token;
    let genreId;

    beforeEach(async () => {
      token = new User({ isAdmin: true }).generateAuthToken();
      genreId = new mongoose.Types.ObjectId();

      await Genre.create({ _id: genreId, name: "genre1" });
    });

    afterEach(async () => {
      await Genre.deleteMany({});
    });

    const exec = () =>
      request(server)
        .delete("/api/genres/" + genreId)
        .set("x-auth-token", token);

    it("should return 401 if the client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 403 if client is not an admin", async () => {
      token = new User().generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 404 if an invalid id is passed", async () => {
      genreId = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no genre with the given id exists", async () => {
      genreId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should delete the genre if the input is valid", async () => {
      await exec();
      const genre = await Genre.findById(genreId);
      expect(genre).toBeNull();
    });

    it("should return the genre if the input is valid", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "genre1");
    });
  });
});
