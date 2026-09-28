const request = require('supertest');
const app = require('../app'); // adjust path if your server file is in root or src/

describe('Blog API Unit & Integration Tests', () => {

  // ==========================================
  // MANUALLY GENERATED TESTS (Tests 1 - 5)
  // ==========================================

  // Test 1: Health / root endpoint status check
  test('1. GET / - Should return 200 OK and serve home page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  // Test 2: Fetch all blog posts
  test('2. GET /posts - Should return list of posts with status 200', async () => {
    const res = await request(app).get('/posts');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Test 3: Input validation - rejecting post without title
  test('3. POST /posts - Should return 400 when title is missing', async () => {
    const newPost = { content: 'Post content without title', author: 'Tester' };
    const res = await request(app)
      .post('/posts')
      .send(newPost);
    expect(res.statusCode).toBe(400);
  });

  // Test 4: Handling non-existent resources
  test('4. GET /posts/999999 - Should return 404 for unknown post ID', async () => {
    const res = await request(app).get('/posts/999999');
    expect(res.statusCode).toBe(404);
  });

  // Test 5: Verify response headers
  test('5. GET /posts - Should return application/json content-type', async () => {
    const res = await request(app).get('/posts');
    expect(res.headers['content-type']).toMatch(/json/);
  });


  // ==========================================
  // AUTOMATICALLY GENERATED TESTS (Tests 6 - 10)
  // (Prompted via AI / Copilot and reviewed)
  // ==========================================

  // Test 6: Successful post creation
  test('6. POST /posts - Should successfully create a post and return 201 Created', async () => {
    const validPost = {
      title: 'Automated Test Title',
      content: 'Automated test content body',
      author: 'Jest Runner'
    };
    const res = await request(app)
      .post('/posts')
      .send(validPost);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(validPost.title);
  });

  // Test 7: Prevent empty JSON payloads
  test('7. POST /posts - Should return 400 when body payload is completely empty', async () => {
    const res = await request(app)
      .post('/posts')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  // Test 8: Fetch post by specific ID
  test('8. GET /posts/:id - Should retrieve single post matching requested ID', async () => {
    // Create an entry first to guarantee ID presence
    const created = await request(app)
      .post('/posts')
      .send({ title: 'Fetch Me', content: 'Testing single fetch', author: 'Author' });
    
    const res = await request(app).get(`/posts/${created.body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  // Test 9: Handling invalid / malformed ID parameters
  test('9. GET /posts/invalid-id-string - Should handle non-numeric or malformed ID with 400/404', async () => {
    const res = await request(app).get('/posts/invalid-id-format');
    expect([400, 404]).toContain(res.statusCode);
  });

  // Test 10: Delete operation
  test('10. DELETE /posts/:id - Should delete post and return 200 or 204 status', async () => {
    const created = await request(app)
      .post('/posts')
      .send({ title: 'Delete Me', content: 'Temporary content', author: 'Author' });

    const res = await request(app).delete(`/posts/${created.body.id}`);
    expect([200, 204]).toContain(res.statusCode);
  });

});