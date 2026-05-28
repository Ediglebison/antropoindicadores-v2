import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { RolesGuard } from '../auth/roles.guard';

describe('LocationsController', () => {
  let controller: LocationsController;
  let locationsService: LocationsService;

  const mockLocationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LocationsController>(LocationsController);
    locationsService = module.get<LocationsService>(LocationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a location', async () => {
      const body = { name: 'Location 1' };
      mockLocationsService.create.mockResolvedValue({ id: '1', ...body });

      const result = await controller.create(body);

      expect(locationsService.create).toHaveBeenCalledWith(body);
      expect(result).toEqual({ id: '1', name: 'Location 1' });
    });
  });

  describe('findAll', () => {
    it('should return all locations', async () => {
      const result = [{ id: '1', name: 'Location 1' }];
      mockLocationsService.findAll.mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(locationsService.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a location (PUT)', async () => {
      const id = '1';
      const body = { name: 'Updated Location' };
      mockLocationsService.update.mockResolvedValue({ id, ...body });

      const result = await controller.update(id, body);

      expect(locationsService.update).toHaveBeenCalledWith(id, body);
      expect(result).toEqual({ id, name: 'Updated Location' });
    });
  });

  describe('patch', () => {
    it('should update a location (PATCH)', async () => {
      const id = '1';
      const body = { name: 'Patched Location' };
      mockLocationsService.update.mockResolvedValue({ id, ...body });

      const result = await controller.patch(id, body);

      expect(locationsService.update).toHaveBeenCalledWith(id, body);
      expect(result).toEqual({ id, name: 'Patched Location' });
    });
  });

  describe('remove', () => {
    it('should remove a location', async () => {
      const id = '1';
      mockLocationsService.remove.mockResolvedValue({ affected: 1 });

      const result = await controller.remove(id);

      expect(locationsService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ affected: 1 });
    });
  });
});
