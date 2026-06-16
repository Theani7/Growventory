const { createPlant, updatePlant, importPlants } = require('../controllers/plantController');
const { pool } = require('../config/db');
const stockService = require('../services/stockService');

jest.mock('../config/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

jest.mock('../services/stockService', () => ({
  initializeStock: jest.fn()
}));

jest.mock('../controllers/notificationController', () => ({
  notifyAdminsAndSupervisors: jest.fn()
}));

describe('Plant Controller Audit Trail Refactor', () => {
  let req, res, mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute: jest.fn()
    };
    pool.getConnection.mockResolvedValue(mockConnection);
    
    req = {
      body: {},
      params: {},
      user: { user_id: 1 },
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('updatePlant', () => {
    it('should return 400 if current_stock is provided', async () => {
      req.params.id = 1;
      req.body = { current_stock: 50 };

      // Mock pool.execute for plant lookup
      pool.execute.mockResolvedValueOnce([[{ plant_id: 1, name: 'Test Plant' }]]);

      await updatePlant(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Direct update of current_stock is not allowed. Please use the Stock Management module.'
      }));
    });
  });

  describe('createPlant', () => {
    it('should use a transaction and call initializeStock if current_stock > 0', async () => {
      req.body = {
        name: 'Snake Plant',
        current_stock: 10,
        min_stock_threshold: 5
      };
      
      mockConnection.execute.mockResolvedValueOnce([{ insertId: 1 }]); // Plant insert
      mockConnection.execute.mockResolvedValueOnce([[{ plant_id: 1, name: 'Snake Plant' }]]); // Select new plant
      mockConnection.execute.mockResolvedValueOnce([]); // Activity log

      await createPlant(req, res);

      expect(pool.getConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(stockService.initializeStock).toHaveBeenCalledWith(1, 10, 1, mockConnection);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('importPlants', () => {
    it('should call initializeStock for each imported plant with stock', async () => {
      const csvData = 'name,category_id,current_stock,min_stock_threshold\nPlant A,1,10,5\nPlant B,1,0,5';
      req.file = {
        originalname: 'plants.csv',
        buffer: Buffer.from(csvData)
      };

      // Mock for Plant A
      mockConnection.execute
        .mockResolvedValueOnce([[{ category_id: 1 }]]) // Category check A
        .mockResolvedValueOnce([{ insertId: 123 }]) // Plant insert A
        .mockResolvedValueOnce([]) // Activity log A
        // Mock for Plant B
        .mockResolvedValueOnce([[{ category_id: 1 }]]) // Category check B
        .mockResolvedValueOnce([{ insertId: 124 }]) // Plant insert B
        .mockResolvedValueOnce([]); // Activity log B

      await importPlants(req, res);

      // Should be called for Plant A (stock 10) but not Plant B (stock 0)
      expect(stockService.initializeStock).toHaveBeenCalledTimes(1);
      expect(stockService.initializeStock).toHaveBeenCalledWith(123, 10, 1, mockConnection);
    });
  });
});
