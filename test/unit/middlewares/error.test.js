const { describe, expect, it } = require("@jest/globals");
const error = require("../../../middlewares/error");

describe("Error Middleware", () => {
  it("should handle errors and respond with a 500 status", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn();

    const err = new Error("Test error");

    error(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Something failed.");
  });
});
