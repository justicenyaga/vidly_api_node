const request = require("supertest");
const {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} = require("@jest/globals");
const { Customer } = require("../../models/customer");

describe("/api/customers", () => {
  let server;

  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    await server.close();
    await Customer.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all the customers", async () => {
      await Customer.collection.insertMany([
        { name: "customer1", phone: "12345" },
        { name: "customer2", phone: "67890" },
      ]);

      const res = await request(server).get("/api/customers");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(
        res.body.some(
          (c) => c.name === "customer1" && c.phone === "12345" && !c.isGold
        )
      ).toBeTruthy();
      expect(
        res.body.some(
          (c) => c.name === "customer2" && c.phone === "67890" && !c.isGold
        )
      ).toBeTruthy();
    });
  });
});
