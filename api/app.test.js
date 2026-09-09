const request = require("supertest");
const { app, pool } = require("./app");

describe("Reconnect API", () => {

  test("GET / should return API running message", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Reconnect API is running - CI/CD deployment successful!");
  });

  test("GET /employees should return employees", async () => {
    const response = await request(app).get("/employees");

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });

});

afterAll(async () => {
  await pool.end();
});
