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
const { User } = require("../../models/user");

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

  describe("POST /", () => {
    let token;
    let name;
    let phone;

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = "customer1";
      phone = "12345";
    });

    const exec = () =>
      request(server)
        .post("/api/customers")
        .set("x-auth-token", token)
        .send({ name, phone });

    it("should return 401 if the client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if customer name is less than 5 characters", async () => {
      name = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if customer name is more than 50 characters", async () => {
      name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is less than 5 characters", async () => {
      phone = "1";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is more than 50 characters", async () => {
      phone = new Array(52).join("1");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should save the customer if the request is valid", async () => {
      await exec();
      const customer = await Customer.findOne({ name, phone });
      expect(customer).toHaveProperty("_id");
      expect(customer).toHaveProperty("name", "customer1");
      expect(customer).toHaveProperty("phone", "12345");
    });

    it("should return the customer if the request is valid", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "name", "phone", "isGold"])
      );
    });
  });

  describe("PUT /:id", () => {
    let token;
    let name;
    let phone;
    let customerId;

    beforeEach(async () => {
      token = new User().generateAuthToken();
      customerId = new mongoose.Types.ObjectId();
      name = "customer5";
      phone = "67890";

      await Customer.create({
        _id: customerId,
        name: "customer1",
        phone: "12345",
      });
    });

    const exec = () =>
      request(server)
        .put("/api/customers/" + customerId)
        .set("x-auth-token", token)
        .send({ name, phone });

    it("should return 401 if the client is not logged in", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if customer name is less than 5 characters", async () => {
      name = "a";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if customer name is more than 50 characters", async () => {
      name = new Array(52).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is less than 5 characters", async () => {
      phone = "1";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if phone is more than 50 characters", async () => {
      phone = new Array(52).join("1");
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if an invalid id is passed", async () => {
      customerId = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no customer with the given id exists", async () => {
      customerId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should update the customer if the request is valid", async () => {
      await exec();
      const customer = await Customer.findById(customerId);

      const expected_object = {
        name: "customer5",
        phone: "67890",
        isGold: false,
      };
      expect(customer).toMatchObject(expected_object);
    });

    it("should return the customer if the request is valid", async () => {
      const res = await exec();
      expect(Object.keys(res.body)).toEqual(
        expect.arrayContaining(["_id", "name", "phone", "isGold"])
      );
    });
  });
});
