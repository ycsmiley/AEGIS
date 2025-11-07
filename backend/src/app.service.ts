import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Aegis Finance API - Arc Supply Chain Finance Platform';
  }
}

