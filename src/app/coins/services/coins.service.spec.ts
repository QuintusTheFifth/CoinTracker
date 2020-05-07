import { TestBed } from '@angular/core/testing';

import { CoinsService } from './coins.service';

describe('CoinsService', () => {
  let service: CoinsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoinsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
