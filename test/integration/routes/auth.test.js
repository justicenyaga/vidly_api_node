const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("config");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { User } = require("../../../models/user");

describe("/api/auth", () => {
  let server;
  let name;
  let email;
  let password;

  beforeEach(async () => {
    name = "user1";
    email = "user@email.com";
    password = "12345";

    server = require("../../../index");

    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt);

    await User.create({ name, email, password: hashed_password });
  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  const exec = () =>
    request(server).post("/api/auth").send({ email, password });

  it("should return 400 if no user with the given email exists", async () => {
    email = "invalid@email.com";
    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return 400 if an invalid password is passed", async () => {
    password = "67890";
    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return a valid JWT if inputs are valid", async () => {
    const res = await exec();

    expect(res.status).toBe(200);

    const token = res.text;
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    expect(decoded).not.toBeNull();
  });
});
