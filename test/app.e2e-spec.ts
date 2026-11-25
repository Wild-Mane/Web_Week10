import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('StudentsController (e2e)', () => {
  let app: INestApplication<App>;
  let createdId: number | undefined;
  const testNim = `E2E${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (createdId !== undefined) {
      await request(app.getHttpServer()).delete(`/students/${createdId}`);
    }
    await app.close();
  });

  it('POST /students creates a student in PostgreSQL', async () => {
    const res = await request(app.getHttpServer())
      .post('/students')
      .send({
        nim: testNim,
        nama: 'Test E2E Student',
        programStudi: 'Informatika',
      })
      .expect(201);

    const body = res.body as {
      id: number;
      nim: string;
      nama: string;
      programStudi: string;
    };
    expect(body.id).toEqual(expect.any(Number));
    expect(body.nim).toBe(testNim);
    createdId = body.id;
  });

  it('GET /students returns list and supports search filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/students')
      .query({ search: testNim })
      .expect(200);

    const list = res.body as Array<{ id: number; nim: string }>;
    expect(list.some((s) => s.id === createdId && s.nim === testNim)).toBe(
      true,
    );
  });

  it('GET /students/stats returns total and programStudi breakdown', async () => {
    const res = await request(app.getHttpServer())
      .get('/students/stats')
      .expect(200);

    const stats = res.body as {
      total: number;
      byProgramStudi: Array<{ programStudi: string; total: number }>;
    };
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(stats.byProgramStudi)).toBe(true);
  });

  it('GET /students/:id returns the created student', async () => {
    const res = await request(app.getHttpServer())
      .get(`/students/${createdId}`)
      .expect(200);

    const student = res.body as { id: number; nim: string };
    expect(student.id).toBe(createdId);
    expect(student.nim).toBe(testNim);
  });

  it('PATCH /students/:id updates the student', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/students/${createdId}`)
      .send({ nama: 'Updated E2E Student' })
      .expect(200);

    const updated = res.body as { nama: string };
    expect(updated.nama).toBe('Updated E2E Student');
  });

  it('DELETE /students/:id removes the student and returns 404 afterward', async () => {
    await request(app.getHttpServer())
      .delete(`/students/${createdId}`)
      .expect(200);

    const deletedId = createdId;
    createdId = undefined;

    await request(app.getHttpServer())
      .get(`/students/${deletedId}`)
      .expect(404);
  });
});
