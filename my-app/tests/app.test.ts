import { app } from '../src/app'; // Adjust the import based on your app's structure
import request from 'supertest';

describe('App Tests', () => {
    it('should respond with a 200 status for the root endpoint', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    // Add more tests as needed
});