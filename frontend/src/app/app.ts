import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  auth = inject(AuthService);
  mobileNavOpen = signal(false);

  logout() {
    this.mobileNavOpen.set(false);
    this.auth.logout();
  }

  toggleMobileNav() {
    this.mobileNavOpen.update(open => !open);
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 900) {
      this.mobileNavOpen.set(false);
    }
  }
}
