import { TestBed } from '@angular/core/testing';

import { Plaid } from './plaid';

describe('Plaid', () => {
  let service: Plaid;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Plaid);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
