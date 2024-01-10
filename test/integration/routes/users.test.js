const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const config = require("config");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { User } = require("../../../models/user");

describe("/api/users", () => {
  let server;

  beforeEach(() => {
    server = require("../../../index");
  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  describe("POST /", () => {
    let name, email, password;
    beforeEach(() => {
      (name = "user1"), (email = "user@email.com"), (password = "12345");
    });

    const exec = () =>
      request(server).post("/api/users").send({ name, email, password });

    it("should return 400 if a user with the given email exists", async () => {
      await User.create({ name: "user24", email, password: "12345" });
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should hash the user password", async () => {
      await exec();
      const user = await User.findOne({ email });

      const password_match = await bcrypt.compare(password, user.password);
      expect(password_match).toBe(true);
      expect(password).not.toBe(user.password);
    });

    it("should return the created user excluding their password", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", name);
      expect(res.body).toHaveProperty("email", email);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should append a valid auth token on the response headers", async () => {
      const res = await exec();

      expect(res.headers).toHaveProperty("x-auth-token");

      const token = res.headers["x-auth-token"];
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
      expect(decoded).toHaveProperty("_id");
    });
  });

  describe("GET /me", () => {
    it("should return the user if a valid JWT is passed on the request header", async () => {
      const user = await User.create({
        name: "user1",
        email: "user@email.com",
        password: "12345",
      });
      const token = user.generateAuthToken();
      const res = await request(server)
        .get("/api/users/me")
        .set("x-auth-token", token);

      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", "user1");
      expect(res.body).toHaveProperty("email", "user@email.com");
    });
  });
});
