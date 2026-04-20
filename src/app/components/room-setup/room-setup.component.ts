import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-room-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './room-setup.component.html',
  styleUrl: './room-setup.component.scss'
})
export class RoomSetupComponent {
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) displayName = 'Latido';
  @Input() activeCode = '';
  @Input() busy = false;
  @Input() error = '';

  @Output() readonly joinRoom = new EventEmitter<string>();
  @Output() readonly leaveRoom = new EventEmitter<void>();

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(3)]]
  });

  protected readonly generatedCode = signal(this.generateIdea());

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.joinRoom.emit(this.form.getRawValue().code);
  }

  protected fillGeneratedCode(): void {
    const suggestion = this.generateIdea();
    this.generatedCode.set(suggestion);
    this.form.patchValue({ code: suggestion });
  }

  private generateIdea(): string {
    const ideas = ['SOL-LUNA', 'AMOR-24', 'LATIDO-UNO', 'CASITA-ROSA', 'NOSOTROS'];
    return ideas[Math.floor(Math.random() * ideas.length)];
  }
}
