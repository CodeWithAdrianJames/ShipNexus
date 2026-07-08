import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';

describe('DeploymentsController webhook handling', () => {
  const createService = () =>
    ({
      create: jest.fn((dto: unknown) => ({ id: 'job-1', ...dto })),
    }) as unknown as jest.Mocked<DeploymentsService>;

  it('creates a deployment job from a GitHub push event', () => {
    const service = createService();
    const controller = new DeploymentsController(service);
    const payload = {
      ref: 'refs/heads/main',
      after: '8f4b0d4',
      repository: { name: 'api-gateway' },
      pusher: { name: 'mona' },
    };

    const result = controller.create(payload, 'push', 'delivery-123');

    expect(service.create).toHaveBeenCalledWith({
      serviceName: 'api-gateway',
      imageTag: '8f4b0d4',
      environment: 'production',
      triggeredBy: 'mona',
      webhookEventId: 'delivery-123',
      payload,
    });
    expect(result).toMatchObject({ id: 'job-1', serviceName: 'api-gateway' });
  });

  it('acknowledges GitHub ping events without creating a deployment job', () => {
    const service = createService();
    const controller = new DeploymentsController(service);

    expect(controller.create({}, 'ping', 'delivery-ping')).toEqual({
      received: true,
      event: 'ping',
      deliveryId: 'delivery-ping',
    });
    expect(service.create).not.toHaveBeenCalled();
  });

  it('preserves signed ShipNexus deployment payloads when no GitHub event is present', () => {
    const service = createService();
    const controller = new DeploymentsController(service);
    const dto = {
      serviceName: 'api-gateway',
      imageTag: 'sha-123',
      environment: 'staging',
      triggeredBy: 'manual-test',
    };

    controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
