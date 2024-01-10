const request = require("supertest");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { User } = require("../../models/user");
const { Genre } = require("../../models/genre");

describe("auth middleware", () => {
  let server;
  let token;

  beforeEach(() => {
    server = require("../../index");
    token = new User().generateAuthToken();
  });

  afterEach(async () => {
    await server.close();
    await Genre.deleteMany({});
  });

  const exec = () =>
    request(server)
      .post("/api/genres")
      .set("x-auth-token", token)
      .send({ name: "genre1" });

  it("should return 401 if no token is provided", async () => {
    token = "";
    const res = await exec();
    expect(res.status).toBe(401);
  });

  it("should return 400 if an invalid token is passed", async () => {
    token = "a";
    const res = await exec();
    expect(res.status).toBe(400);
  });

  it("should return 200 if the token is valid", async () => {
    const res = await exec();
    expect(res.status).toBe(200);
  });
});
