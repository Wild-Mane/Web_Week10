import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('StudentsController', () => {
  let controller: StudentsController;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getStats: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [{ provide: StudentsService, useValue: mockService }],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    jest.clearAllMocks();
  });

  it('should delegate CRUD and stats calls to StudentsService', async () => {
    await controller.create({
      nim: '103022400101',
      nama: 'Alya',
      programStudi: 'Informatika',
    });
    expect(mockService.create).toHaveBeenCalledTimes(1);

    await controller.findAll('Alya', 'Informatika');
    expect(mockService.findAll).toHaveBeenCalledWith('Alya', 'Informatika');

    await controller.getStats();
    expect(mockService.getStats).toHaveBeenCalledTimes(1);

    await controller.findOne(1);
    expect(mockService.findOne).toHaveBeenCalledWith(1);

    await controller.update(1, { nama: 'Alya Baru' });
    expect(mockService.update).toHaveBeenCalledWith(1, { nama: 'Alya Baru' });

    await controller.remove(1);
    expect(mockService.remove).toHaveBeenCalledWith(1);
  });
});
