import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-register',
    imports: [FormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class RegisterPage {
    private auth = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    error = '';
    loading = false;

    onSubmit() {
        this.error = '';
        this.loading = true;
        this.auth.register(this.email, this.password).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.error || 'Registration failed.';
            },
        });
    }
}
