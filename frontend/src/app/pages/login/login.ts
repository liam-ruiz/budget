import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-login',
    imports: [FormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class LoginPage {
    private auth = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    error = '';
    loading = false;

    onSubmit() {
        this.error = '';
        this.loading = true;
        this.auth.login(this.email, this.password).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/dashboard']);
            },
            error: () => {
                this.loading = false;
                this.error = 'Invalid email or password.';
            },
        });
    }
}
