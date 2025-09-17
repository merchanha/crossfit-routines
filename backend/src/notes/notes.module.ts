import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { WorkoutNote } from './entities/note.entity';
import { Routine } from '../routines/entities/routine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutNote, Routine])],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
