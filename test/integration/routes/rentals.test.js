const request = require("supertest");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { Rental } = require("../../../models/rental");

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
});
