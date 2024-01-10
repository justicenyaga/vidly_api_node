const request = require("supertest");
const mongoose = require("mongoose");
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

  describe("GET /:id", () => {
    it("should return the customer if valid id is passed", async () => {
      const customer_object = { name: "customer1", phone: "12345" };
      const customer = await Customer.create(customer_object);

      const res = await request(server).get("/api/customers/" + customer._id);

      expect(res.body).toMatchObject(customer_object);
    });

    it("should return 404 if an invalid id is passed", async () => {
      const res = await request(server).get("/api/customers/1");
      expect(res.status).toBe(404);
    });

    it("should return 404 if no customer exists for the given id", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(server).get("/api/customers/" + id);
      expect(res.status).toBe(404);
    });
  });
});
