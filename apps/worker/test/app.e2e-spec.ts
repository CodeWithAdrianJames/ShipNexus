import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication }    from '@nestjs/common';
import request from 'supertest';
import { AppModule }           from './../src/app.module';
import { ProcessorService }    from './../src/processor/processor.service';

// Minimal ProcessorService stub — no SQS/DB connections needed for a
// health check test. Prevents onModuleInit from firing real AWS SDK calls.
const ProcessorServiceMock = {
  onModuleInit:   jest.fn().mockResolvedValue(undefined),
  onModuleDestroy: jest.fn().mockResolvedValue(undefined),
};

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ProcessorService)
      .useValue(ProcessorServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});