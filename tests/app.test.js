const request = require('supertest');
const app = require('../app');
const db = require('../database');

describe('Blog Application Unit & Integration Tests', () => {

  beforeAll((done) => {
    db.serialize(() => {
      // Ensure records are clean for tests
      db.run("DELETE FROM users WHERE username IN ('testuser', 'admin')", () => {
        // Match exact database.js schema: (username, password, sessionId)
        db.run("INSERT INTO users (username, password, sessionId) VALUES ('testuser', 'password123', 'valid-test-session')", () => {
          db.run("INSERT INTO users (username, password, sessionId) VALUES ('admin', 'adminpass', 'admin-test-session')", done);
        });
      });
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  // ==========================================
  // MANUALLY GENERATED TESTS (Tests 1 - 5)
  // Baseline authentication & routing contracts
  // ==========================================

  // Test 1: Unauthenticated root access
  test('1. GET / - Should redirect (302) unauthenticated users to /auth/login', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // Test 2: Unauthenticated new-post view
  test('2. GET /new-post - Should redirect (302) to /auth/login without session cookie', async () => {
    const res = await request(app).get('/new-post');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // Test 3: Unauthenticated post creation
  test('3. POST /new-post - Should reject unauthenticated post creation with 302 redirect', async () => {
    const res = await request(app)
      .post('/new-post')
      .type('form')
      .send({ title: 'Unauthorized Post', content: 'Should not create' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // Test 4: Anonymous admin route protection
  test('4. GET /admin - Should return 403 Forbidden for unauthenticated users', async () => {
    const res = await request(app).get('/admin');
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('Access denied');
  });

  // Test 5: Handling unknown routes
  test('5. GET /non-existent-route - Should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/non-existent-endpoint-xyz');
    expect(res.statusCode).toBe(404);
  });

  // ==========================================
  // AUTOMATICALLY GENERATED TESTS (Tests 6 - 10)
  // Session authorization, data insertion & RBAC
  // ==========================================

  // Test 6: Authenticated root access
  test('6. GET / - Should return 200 OK and render HTML when valid session cookie is provided', async () => {
    const res = await request(app)
      .get('/')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(200);
  });

  // Test 7: Authenticated new-post access
  test('7. GET /new-post - Should return 200 OK when authenticated with valid session', async () => {
    const res = await request(app)
      .get('/new-post')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(200);
  });

  // Test 8: Authenticated post creation
  test('8. POST /new-post - Should create post and redirect (302) to / when authenticated', async () => {
    const res = await request(app)
      .post('/new-post')
      .set('Cookie', ['sessionId=valid-test-session'])
      .type('form')
      .send({ title: 'Jest Integration Post', content: 'Testing post submission' });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  // Test 9: Role-based access control (non-admin user)
  test('9. GET /admin - Should return 403 when authenticated as a non-admin user', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('Access denied');
  });

  // Test 10: Role-based access control (admin user)
  test('10. GET /admin - Should return 200 OK when authenticated as admin', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', ['sessionId=admin-test-session']);
    expect(res.statusCode).toBe(200);
  });

});