import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodosService } from './todos.service';
import { Todo } from './entities/todo.entity';

type MockRepository = Partial<Record<keyof Repository<Todo>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('TodosService', () => {
  let service: TodosService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        { provide: getRepositoryToken(Todo), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    repository = module.get(getRepositoryToken(Todo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all todos ordered by id', async () => {
      const todos = [{ id: 1 } as Todo];
      repository.find!.mockResolvedValue(todos);

      const result = await service.findAll();

      expect(result).toBe(todos);
      expect(repository.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
    });
  });

  describe('findOne', () => {
    it('returns the todo when found', async () => {
      const todo = { id: 1 } as Todo;
      repository.findOneBy!.mockResolvedValue(todo);

      const result = await service.findOne(1);

      expect(result).toBe(todo);
    });

    it('throws NotFoundException when the todo does not exist', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves a new todo', async () => {
      const dto = { title: 'Buy milk' };
      const created = { title: 'Buy milk' } as Todo;
      const saved = { id: 1, title: 'Buy milk', completed: false } as Todo;
      repository.create!.mockReturnValue(created);
      repository.save!.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(saved);
    });
  });

  describe('update', () => {
    it('merges changes onto the existing todo and saves', async () => {
      const existing = { id: 1, title: 'Old', completed: false } as Todo;
      repository.findOneBy!.mockResolvedValue(existing);
      repository.save!.mockImplementation((todo: Todo) =>
        Promise.resolve(todo),
      );

      const result = await service.update(1, { completed: true });

      expect(result).toEqual({ id: 1, title: 'Old', completed: true });
    });

    it('throws NotFoundException when the todo does not exist', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.update(999, { completed: true })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes an existing todo', async () => {
      const existing = { id: 1 } as Todo;
      repository.findOneBy!.mockResolvedValue(existing);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(existing);
    });

    it('throws NotFoundException when the todo does not exist', async () => {
      repository.findOneBy!.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
