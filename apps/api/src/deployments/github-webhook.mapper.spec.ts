import { mapGithubWebhookToDeployment } from './github-webhook.mapper';

describe('mapGithubWebhookToDeployment', () => {
  it('maps a GitHub push event into a deployment request', () => {
    const payload = {
      ref: 'refs/heads/main',
      after: '8f4b0d4b6c3c9d8a7e5f1234567890abcdef1234',
      repository: {
        name: 'api-gateway',
        full_name: 'octo-org/api-gateway',
      },
      pusher: {
        name: 'mona',
      },
    };

    expect(
      mapGithubWebhookToDeployment('push', 'delivery-123', payload),
    ).toEqual({
      serviceName: 'api-gateway',
      imageTag: '8f4b0d4b6c3c9d8a7e5f1234567890abcdef1234',
      environment: 'production',
      triggeredBy: 'mona',
      webhookEventId: 'delivery-123',
      payload,
    });
  });

  it('maps non-production branches to staging', () => {
    const payload = {
      ref: 'refs/heads/feature/webhook-test',
      after: '8f4b0d4',
      repository: {
        name: 'worker',
      },
      sender: {
        login: 'octocat',
      },
    };

    expect(
      mapGithubWebhookToDeployment('push', 'delivery-456', payload),
    ).toMatchObject({
      serviceName: 'worker',
      imageTag: '8f4b0d4',
      environment: 'staging',
      triggeredBy: 'octocat',
      webhookEventId: 'delivery-456',
    });
  });

  it('acknowledges GitHub ping events without creating a deployment', () => {
    expect(mapGithubWebhookToDeployment('ping', 'delivery-789', {})).toBeNull();
  });
});
