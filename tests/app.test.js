const request = require('supertest');
const app = require('../app');
const db = require('../database');

describe('Blog Application Unit & Integration Tests', () => {

  // Seed a valid user and an admin user for session tests
  beforeAll((done) => {
    db.serialize(() => {
      db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, sessionId TEXT)");
      db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT)");
      db.run("INSERT OR REPLACE INTO users (id, username, sessionId) VALUES (101, 'testuser', 'valid-test-session')");
      db.run("INSERT OR REPLACE INTO users (id, username, sessionId) VALUES (102, 'admin', 'admin-test-session')", done);
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  // ==========================================
  // MANUALLY GENERATED TESTS (Tests 1 - 5)
  // Focused on core authentication guardrails & base routing
  // ==========================================

  // Test 1: Root redirect when unauthenticated
  test('1. GET / - Should redirect (302) unauthenticated users to /auth/login', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // Test 2: Protected route redirection (/new-post)
  test('2. GET /new-post - Should redirect (302) to /auth/login without session cookie', async () => {
    const res = await request(app).get('/new-post');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // Test 3: Unauthorized post submission
  test('3. POST /new-post - Should reject unauthenticated post creation with 302 redirect', async () => {
    const res = await request(app)
      .post('/new-post')
      .type('form')
      .send({ title: 'Unauthorized Post', content: 'Should not create' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // Test 4: Role-based access control (Admin route - Anonymous)
  test('4. GET /admin - Should return 403 Forbidden for unauthenticated users', async () => {
    const res = await request(app).get('/admin');
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('Access denied');
  });

  // Test 5: Handling unknown routes
  test('5. GET /non-existent-route - Should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
  });


  // ==========================================
  // AUTOMATICALLY GENERATED TESTS (Tests 6 - 10)
  // Focused on session verification, creation flow, and authorization edge cases
  // ==========================================

  // Test 6: Authenticated access to root view
  test('6. GET / - Should return 200 OK and render HTML when valid session cookie is provided', async () => {
    const res = await request(app)
      .get('/')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  // Test 7: Authenticated access to new-post view
  test('7. GET /new-post - Should return 200 OK when authenticated with valid session', async () => {
    const res = await request(app)
      .get('/new-post')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(200);
  });

  // Test 8: Successful post creation with session cookie and urlencoded payload
  test('8. POST /new-post - Should create post and redirect (302) to / when authenticated', async () => {
    const res = await request(app)
      .post('/new-post')
      .set('Cookie', ['sessionId=valid-test-session'])
      .type('form')
      .send({ title: 'Jest Integration Post', content: 'Testing post submission' });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  // Test 9: Role-based access control (Non-admin authenticated user)
  test('9. GET /admin - Should return 403 when authenticated as a non-admin user', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('Access denied');
  });

  // Test 10: Role-based access control (Admin authenticated user)
  test('10. GET /admin - Should return 200 OK when authenticated as admin', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', ['sessionId=admin-test-session']);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

});