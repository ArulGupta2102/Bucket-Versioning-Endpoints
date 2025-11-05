import { Test, TestingModule } from '@nestjs/testing';
import { StorjService } from './storj.service';
import { ConfigService } from '@nestjs/config';

describe('StorjService', () => {
  let service: StorjService;
  let configServiceMock: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          STORJ_ACCESS_KEY: 'test-access-key',
          STORJ_SECRET_KEY: 'test-secret-key',
          STORJ_ENDPOINT: 'https://test-endpoint.com',
          STORJ_BUCKET: 'test-bucket',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorjService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorjService>(StorjService);
    configServiceMock = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file to Storj', async () => {
    const file = Buffer.from('test file content');
    const key = 'test-key';

    // Mock S3Client send method
    const mockSend = jest.fn().mockResolvedValue({});
    (service as any).s3Client.send = mockSend;

    const result = await service.uploadFile(file, key);

    expect(result).toBeDefined();
    expect(mockSend).toHaveBeenCalled();
  });

  it('should download a file from Storj', async () => {
    const key = 'test-key';
    const mockBody = Buffer.from('downloaded content');

    // Mock the stream
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') callback(mockBody);
        if (event === 'end') callback();
      }),
    };

    const mockSend = jest.fn().mockResolvedValue({ Body: mockStream });
    (service as any).s3Client.send = mockSend;

    const result = await service.downloadFile(key);

    expect(result).toEqual(mockBody);
    expect(mockSend).toHaveBeenCalled();
  });

  it('should list objects in bucket', async () => {
    const mockObjects = [{ Key: 'file1' }, { Key: 'file2' }];

    const mockSend = jest.fn().mockResolvedValue({ Contents: mockObjects });
    (service as any).s3Client.send = mockSend;

    const result = await service.listObjects();

    expect(result).toEqual(mockObjects);
    expect(mockSend).toHaveBeenCalled();
  });
});