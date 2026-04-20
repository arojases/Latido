import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-panel.component.html',
  styleUrl: './auth-panel.component.scss'
})
export class AuthPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly mode = signal<'anonymous' | 'signin' | 'signup'>('anonymous');
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly anonymousForm = this.fb.nonNullable.group({
    nickname: ['', [Validators.required, Validators.minLength(2)]]
  });

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    nickname: ['']
  });

  protected selectMode(mode: 'anonymous' | 'signin' | 'signup'): void {
    this.mode.set(mode);
    this.errorMessage.set('');
  }

  protected async loginAnonymous(): Promise<void> {
    if (this.anonymousForm.invalid) {
      this.anonymousForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.loginAnonymously(this.anonymousForm.getRawValue().nickname);
    } catch (error) {
      this.errorMessage.set(this.getFriendlyError(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async loginEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.errorMessage.set('');

    try {
      const { email, password } = this.emailForm.getRawValue();
      await this.authService.loginWithEmail(email, password);
    } catch (error) {
      this.errorMessage.set(this.getFriendlyError(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async registerEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    this.errorMessage.set('');

    try {
      const { email, password, nickname } = this.emailForm.getRawValue();
      await this.authService.registerWithEmail(email, password, nickname);
    } catch (error) {
      this.errorMessage.set(this.getFriendlyError(error));
    } finally {
      this.busy.set(false);
    }
  }

  private getFriendlyError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('auth/invalid-credential')) {
        return 'Correo o contraseña incorrectos.';
      }

      if (error.message.includes('auth/email-already-in-use')) {
        return 'Ese correo ya tiene una cuenta creada.';
      }
    }

    return 'No pudimos completar el acceso. Revisa Firebase Authentication y vuelve a intentar.';
  }
}
