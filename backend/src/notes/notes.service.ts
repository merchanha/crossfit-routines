import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { WorkoutNote } from './entities/note.entity';
import { Routine } from '../routines/entities/routine.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(WorkoutNote)
    private readonly noteRepository: Repository<WorkoutNote>,
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
  ) {}

  async create(
    createNoteDto: CreateNoteDto,
    userId: string,
  ): Promise<WorkoutNote> {
    const { content, date, routineId } = createNoteDto;

    // Verify routine exists and belongs to user (if routineId is provided)
    if (routineId) {
      const routine = await this.routineRepository.findOne({
        where: { id: routineId, userId },
      });

      if (!routine) {
        throw new NotFoundException('Routine not found');
      }
    }

    const note = this.noteRepository.create({
      content,
      date: new Date(date),
      routineId,
      userId,
    });

    return this.noteRepository.save(note);
  }

  async findAll(userId: string): Promise<WorkoutNote[]> {
    return this.noteRepository.find({
      where: { userId },
      relations: ['routine'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<WorkoutNote> {
    const note = await this.noteRepository.findOne({
      where: { id, userId },
      relations: ['routine', 'user'],
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    return note;
  }

  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    userId: string,
  ): Promise<WorkoutNote> {
    const note = await this.findOne(id, userId);

    // Update note
    Object.assign(note, updateNoteDto);
    return this.noteRepository.save(note);
  }

  async remove(id: string, userId: string): Promise<void> {
    const note = await this.findOne(id, userId);
    await this.noteRepository.softDelete(id);
  }

  async findByRoutine(
    routineId: string,
    userId: string,
  ): Promise<WorkoutNote[]> {
    // Verify routine exists and belongs to user
    const routine = await this.routineRepository.findOne({
      where: { id: routineId, userId },
    });

    if (!routine) {
      throw new NotFoundException('Routine not found');
    }

    return this.noteRepository.find({
      where: { routineId, userId },
      relations: ['routine'],
      order: { date: 'DESC' },
    });
  }

  async findByDate(date: Date, userId: string): Promise<WorkoutNote[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.noteRepository.find({
      where: {
        userId,
        date: Between(startOfDay, endOfDay),
      },
      relations: ['routine'],
      order: { date: 'DESC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<WorkoutNote[]> {
    return this.noteRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
      relations: ['routine'],
      order: { date: 'DESC' },
    });
  }

  async searchNotes(
    userId: string,
    searchTerm: string,
  ): Promise<WorkoutNote[]> {
    return this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.routine', 'routine')
      .where('note.userId = :userId', { userId })
      .andWhere('note.content ILIKE :searchTerm', {
        searchTerm: `%${searchTerm}%`,
      })
      .orderBy('note.date', 'DESC')
      .getMany();
  }

  async getRecentNotes(
    userId: string,
    limit: number = 10,
  ): Promise<WorkoutNote[]> {
    return this.noteRepository.find({
      where: { userId },
      relations: ['routine'],
      order: { date: 'DESC' },
      take: limit,
    });
  }

  async getNoteStats(userId: string): Promise<{
    totalNotes: number;
    notesThisWeek: number;
    notesThisMonth: number;
    mostActiveRoutine: string;
  }> {
    const allNotes = await this.noteRepository.find({
      where: { userId },
      relations: ['routine'],
    });

    const totalNotes = allNotes.length;

    // Calculate notes this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const notesThisWeek = allNotes.filter(
      (note) => new Date(note.date) >= oneWeekAgo,
    ).length;

    // Calculate notes this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const notesThisMonth = allNotes.filter(
      (note) => new Date(note.date) >= oneMonthAgo,
    ).length;

    // Find most active routine
    const routineNoteCount: { [key: string]: number } = {};
    allNotes.forEach((note) => {
      if (note.routine) {
        const routineName = note.routine.name;
        routineNoteCount[routineName] =
          (routineNoteCount[routineName] || 0) + 1;
      }
    });

    const mostActiveRoutine =
      Object.entries(routineNoteCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'No routine notes yet';

    return {
      totalNotes,
      notesThisWeek,
      notesThisMonth,
      mostActiveRoutine,
    };
  }
}
