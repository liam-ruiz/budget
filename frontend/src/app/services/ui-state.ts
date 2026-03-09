import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
    modalOpen = signal(false);

    openModal() {
        this.modalOpen.set(true);
    }

    closeModal() {
        this.modalOpen.set(false);
    }
}
