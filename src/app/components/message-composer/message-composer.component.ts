import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './message-composer.component.html',
  styleUrl: './message-composer.component.scss'
})
export class MessageComposerComponent {
  private readonly fb = inject(FormBuilder);

  @Output() readonly sendMessage = new EventEmitter<string>();
  @Output() readonly quickMessage = new EventEmitter<string>();

  protected readonly quickActions = ['Pensando en ti ❤️', 'Te extraño 💌', 'Te amo 💖'];
  protected readonly form = this.fb.nonNullable.group({
    text: ['', [Validators.required, Validators.maxLength(280)]]
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { text } = this.form.getRawValue();
    this.sendMessage.emit(text);
    this.form.reset({ text: '' });
  }
}
