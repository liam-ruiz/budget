import { Injectable, inject, NgZone } from '@angular/core';
import { ApiService } from './api';

declare global {
    interface Window {
        Plaid: any;
    }
}

@Injectable({ providedIn: 'root' })
export class PlaidService{
    private api = inject(ApiService);
    private zone = inject(NgZone);

    /**
     * Opens Plaid Link in sandbox mode.
     * Returns a promise that resolves with the exchange response or rejects on error/exit.
     */
    open(): Promise<{ account_id: string; item_id: string }> {
        return new Promise((resolve, reject) => {
            this.api.createLinkToken().subscribe({
                next: (res) => {
                    const handler = window.Plaid.create({
                        token: res.link_token,
                        onSuccess: (publicToken: string, metadata: any) => {
                            this.zone.run(() => {
                                const institution = metadata?.institution?.name ?? 'Unknown';
                                const account = metadata?.accounts?.[0];
                                this.api
                                    .exchangePublicToken({
                                        public_token: publicToken,
                                        institution_name: institution,
                                        account_name: account?.name ?? 'Primary',
                                        account_type: account?.subtype ?? 'checking',
                                    })
                                    .subscribe({
                                        next: (exchangeRes) => resolve(exchangeRes),
                                        error: (err) => reject(err),
                                    });
                            });
                        },
                        onExit: (err: any) => {
                            this.zone.run(() => {
                                if (err) {
                                    reject(err);
                                }
                            });
                        },
                    });
                    handler.open();
                },
                error: (err) => reject(err),
            });
        });
    }
}
