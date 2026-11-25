import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  let service: StudentsService;

  const mockPrisma = {
    student: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  it('should create a student with trimmed fields', async () => {
    const expected = {
      id: 1,
      nim: '103022400101',
      nama: 'Alya Putri',
      programStudi: 'Informatika',
    };
    mockPrisma.student.create.mockResolvedValue(expected);

    const result = await service.create({
      nim: ' 103022400101 ',
      nama: ' Alya Putri ',
      programStudi: ' Informatika ',
    });

    expect(result).toEqual(expected);
    expect(mockPrisma.student.create).toHaveBeenCalledWith({
      data: {
        nim: '103022400101',
        nama: 'Alya Putri',
        programStudi: 'Informatika',
      },
    });
  });

  it('should throw BadRequestException when required field is empty', async () => {
    await expect(
      service.create({ nim: '  ', nama: 'Alya', programStudi: 'Informatika' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException on duplicate nim (P2002)', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint',
      {
        code: 'P2002',
        clientVersion: '6.19.0',
      },
    );
    mockPrisma.student.create.mockRejectedValue(p2002);

    await expect(
      service.create({
        nim: '103022400101',
        nama: 'Alya',
        programStudi: 'Informatika',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should filter students when search or programStudi is provided', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);

    await service.findAll('Alya', 'Informatika');

    expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
      where: {
        programStudi: { equals: 'Informatika', mode: 'insensitive' },
        OR: [
          { nim: { contains: 'Alya', mode: 'insensitive' } },
          { nama: { contains: 'Alya', mode: 'insensitive' } },
          { programStudi: { contains: 'Alya', mode: 'insensitive' } },
        ],
      },
      orderBy: { nim: 'asc' },
    });
  });

  it('should return stats using count and groupBy', async () => {
    mockPrisma.student.count.mockResolvedValue(3);
    mockPrisma.student.groupBy.mockResolvedValue([
      { programStudi: 'Informatika', _count: { _all: 2 } },
      { programStudi: 'Sistem Informasi', _count: { _all: 1 } },
    ]);

    const stats = await service.getStats();

    expect(stats).toEqual({
      total: 3,
      byProgramStudi: [
        { programStudi: 'Informatika', total: 2 },
        { programStudi: 'Sistem Informasi', total: 1 },
      ],
    });
  });

  it('should throw NotFoundException when student id is not found', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should update a student', async () => {
    const updated = {
      id: 1,
      nim: '103022400101',
      nama: 'Alya Updated',
      programStudi: 'Informatika',
    };
    mockPrisma.student.update.mockResolvedValue(updated);

    const result = await service.update(1, { nama: 'Alya Updated' });
    expect(result).toEqual(updated);
  });

  it('should throw BadRequestException when update payload is empty', async () => {
    await expect(service.update(1, {})).rejects.toThrow(BadRequestException);
  });

  it('should delete a student and throw NotFoundException on P2025', async () => {
    const deleted = {
      id: 1,
      nim: '103022400101',
      nama: 'Alya Putri',
      programStudi: 'Informatika',
    };
    mockPrisma.student.delete.mockResolvedValueOnce(deleted);
    expect(await service.remove(1)).toEqual(deleted);

    const p2025 = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '6.19.0',
    });
    mockPrisma.student.delete.mockRejectedValueOnce(p2025);
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
