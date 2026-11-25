import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  private requireNonEmptyString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`Field '${field}' wajib diisi`);
    }
    return value.trim();
  }

  private handlePrismaError(error: unknown, id?: number): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('NIM sudah terdaftar');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Mahasiswa dengan id ${id ?? ''} tidak ditemukan`.trim(),
        );
      }
    }
    throw error;
  }

  async create(dto: CreateStudentDto) {
    const nim = this.requireNonEmptyString(dto?.nim, 'nim');
    const nama = this.requireNonEmptyString(dto?.nama, 'nama');
    const programStudi = this.requireNonEmptyString(
      dto?.programStudi,
      'programStudi',
    );

    try {
      return await this.prisma.student.create({
        data: { nim, nama, programStudi },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  findAll(search?: string, programStudi?: string) {
    const where: Prisma.StudentWhereInput = {};
    const trimmedProgram = programStudi?.trim();
    const trimmedSearch = search?.trim();

    if (trimmedProgram) {
      where.programStudi = { equals: trimmedProgram, mode: 'insensitive' };
    }

    if (trimmedSearch) {
      where.OR = [
        { nim: { contains: trimmedSearch, mode: 'insensitive' } },
        { nama: { contains: trimmedSearch, mode: 'insensitive' } },
        { programStudi: { contains: trimmedSearch, mode: 'insensitive' } },
      ];
    }

    return this.prisma.student.findMany({
      where,
      orderBy: { nim: 'asc' },
    });
  }

  async getStats() {
    const [total, grouped] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.student.groupBy({
        by: ['programStudi'],
        _count: { _all: true },
        orderBy: { programStudi: 'asc' },
      }),
    ]);

    return {
      total,
      byProgramStudi: grouped.map((item) => ({
        programStudi: item.programStudi,
        total: item._count._all,
      })),
    };
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan id ${id} tidak ditemukan`);
    }

    return student;
  }

  async update(id: number, dto: UpdateStudentDto) {
    const data: Prisma.StudentUpdateInput = {};

    if (dto?.nim !== undefined) {
      data.nim = this.requireNonEmptyString(dto.nim, 'nim');
    }
    if (dto?.nama !== undefined) {
      data.nama = this.requireNonEmptyString(dto.nama, 'nama');
    }
    if (dto?.programStudi !== undefined) {
      data.programStudi = this.requireNonEmptyString(
        dto.programStudi,
        'programStudi',
      );
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Minimal satu field (nim, nama, programStudi) harus diisi untuk update',
      );
    }

    try {
      return await this.prisma.student.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error, id);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.student.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error, id);
    }
  }
}
