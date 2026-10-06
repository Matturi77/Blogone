const request = require('supertest');
const app = require('../app');
const db = require('../database');
const bcrypt = require('bcrypt');

describe('Blog Application Unit & Integration Tests', () => {

  beforeAll((done) => {
    db.serialize(() => {
      db.run("DELETE FROM users WHERE username IN ('testuser', 'admin')", () => {
        db.run("INSERT INTO users (username, password, sessionId) VALUES ('testuser', 'password123', 'valid-test-session')", () => {
          db.run("INSERT INTO users (username, password, sessionId) VALUES ('admin', 'adminpass', 'admin-test-session')", done);
        });
      });
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  // Unauthenticated access

  // Root route
  // GET /
  test('1. GET / - Should redirect (302) unauthenticated users to /auth/login', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  
  // GET /new-post
  test('2. GET /new-post - Should redirect (302) to /auth/login without session cookie', async () => {
    const res = await request(app).get('/new-post');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  // POST /new-post
  test('3. POST /new-post - Should reject unauthenticated post creation with 302 redirect', async () => {
    const res = await request(app)
      .post('/new-post')
      .type('form')
      .send({ title: 'Unauthorized Post', content: 'Should not create' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });



  // Unauthenticated admin user request
  // GET /admin
  test('4. GET /admin - Should return 403 Forbidden for unauthenticated users', async () => {
    const res = await request(app).get('/admin');
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('Access denied');
  });

  // Unknown routes
  test('5. GET /unknown - Should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toBe(404);
  });


  // Authenticated access

  // Root route
  // GET /
  test('6. GET / - Should return 200 OK and render HTML when valid session cookie is provided', async () => {
    const res = await request(app)
      .get('/')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(200);
  });

  // GET /new-post
  test('7. GET /new-post - Should return 200 OK when authenticated with valid session', async () => {
    const res = await request(app)
      .get('/new-post')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(200);
  });

  // POST /new-post
  test('8. POST /new-post - Should create post and redirect (302) to / when authenticated', async () => {
    const res = await request(app)
      .post('/new-post')
      .set('Cookie', ['sessionId=valid-test-session'])
      .type('form')
      .send({ title: 'Jest Integration Post', content: 'Testing post submission' });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  // Role-based access control

  // normal user
  test('9. GET /admin - Should return 403 when authenticated as a non-admin user', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', ['sessionId=valid-test-session']);
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('Access denied');
  });

  // admin user
  test('10. GET /admin - Should return 200 OK when authenticated as admin', async () => {
    const res = await request(app)
      .get('/admin')
      .set('Cookie', ['sessionId=admin-test-session']);
    expect(res.statusCode).toBe(200);
  });


  // auth tests

  // Cryptographic check on password hashing 
  test('11. POST /auth/register - Should store passwords as bcrypt hashes', async () => {
    const rawPassword = 'SecretPassword123!';
    await request(app)
      .post('/auth/register')
      .type('form')
      .send({ username: 'reg_sec_user', password: rawPassword });

    await new Promise((resolve) => {
      db.get("SELECT password FROM users WHERE username = 'reg_sec_user'", (err, row) => {
        expect(err).toBeNull();
        expect(row).toBeDefined();
        expect(row.password).not.toBe(rawPassword);
        expect(row.password).toMatch(/^\$2[ab]\$\d{2}\$/);
        resolve();
      });
    });
  });


  // Wrong password
  test('12. POST /auth/login - Should reject invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .type('form')
      .send({ username: 'testuser', password: 'incorrect-password' });
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Invalid username or password');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  


