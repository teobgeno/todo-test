import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Todo } from './../src/todos/entities/todo.entity';

describe('TodosController (e2e)', () => {
  let app: INestApplication<App>;
  let todosRepository: Repository<Todo>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    todosRepository = moduleFixture.get(getRepositoryToken(Todo));
  });

  // Runs against the app's real configured database, so each test starts
  // from an empty todos table rather than a dedicated test database.
  beforeEach(async () => {
    await todosRepository.clear();
  });

  afterAll(async () => {
    await todosRepository.clear();
    await app.close();
  });

  it('supports the full create -> list -> update -> delete lifecycle', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/todos')
      .send({ title: 'Buy milk' })
      .expect(201);

    expect(createRes.body).toMatchObject({
      title: 'Buy milk',
      completed: false,
    });
    const { id } = createRes.body as { id: number };

    const listRes = await request(app.getHttpServer())
      .get('/todos')
      .expect(200);
    expect(listRes.body).toEqual([
      expect.objectContaining({ id, title: 'Buy milk' }),
    ]);

    const updateRes = await request(app.getHttpServer())
      .patch(`/todos/${id}`)
      .send({ completed: true })
      .expect(200);
    expect(updateRes.body).toMatchObject({ id, completed: true });

    await request(app.getHttpServer()).delete(`/todos/${id}`).expect(204);

    await request(app.getHttpServer()).get(`/todos/${id}`).expect(404);
  });

  it('returns 400 for an empty title', () => {
    return request(app.getHttpServer())
      .post('/todos')
      .send({ title: '' })
      .expect(400);
  });

  it('returns 404 when updating a todo that does not exist', () => {
    return request(app.getHttpServer())
      .patch('/todos/999999')
      .send({ completed: true })
      .expect(404);
  });
});
