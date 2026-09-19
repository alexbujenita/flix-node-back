const request = require("supertest");
const { describe, expect, test } = require("@jest/globals");
const { createApp } = require("../../src/app");

describe("health", () => {
  test("responds successfully from the mounted status route", async () => {
    const response = await request(createApp()).get("/status");

    expect(response.status).toBe(200);
  });

  test("responds with not found for an unmounted route", async () => {
    const response = await request(createApp()).get("/not-mounted");

    expect(response.status).toBe(404);
  });
});
