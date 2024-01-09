const { Customer, validate } = require("../models/customer");
const auth = require("../middlewares/auth");
const admin = require("../middlewares/admin");
const validateObjectId = require("../middlewares/validateObjectId");
const _ = require("lodash");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const customers = await Customer.find().sort("name");
  res.send(customers);
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const customer = new Customer(_.pick(req.body, ["name", "phone", "isGold"]));
  await customer.save();
  res.send(customer);
});

router.put("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    _.pick(req.body, ["name", "phone", "isGold"]),
    { new: true }
  );
  if (!customer)
    return res.status(404).send("The customer with the given Id was not found");

  res.send(customer);
});

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer)
    return res.status(404).send("The customer with the given Id was not found");

  res.send(customer);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer)
    return res.status(404).send("The customer with the given Id was not found");

  res.send(customer);
});

module.exports = router;
