const { createMovement, approveMovement } = require('../controllers/stockController');
const { pool } = require('../config/db');
const stockService = require('../services/stockService');

jest.mock('../config/db', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn()
  }
}));

jest.mock('../services/stockService', () => ({
  updateStock: jest.fn()
}));

jest.mock('../controllers/notificationController', () => ({
  notifyAdminsAndSupervisors: jest.fn(),
  createNotification: jest.fn()
}));

describe('Stock Controller Atomic Operations Refactor', () => {
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
      user: { user_id: 1, role_name: 'admin', username: 'admin_user' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createMovement (Auto-approval)', () => {
    it('should use StockService.updateStock for admin auto-approval', async () => {
      req.body = {
        plant_id: 1,
        movement_type: 'IN',
        quantity: 10,
        notes: 'Test IN'
      };
      
      // 1. connection.execute for plant fetch
      mockConnection.execute.mockResolvedValueOnce([[{ 
        plant_id: 1, 
        name: 'Snake Plant', 
        current_stock: 5, 
        min_stock_threshold: 2 
      }]]);

      // 2. pool.execute for getSetting (require_stock_approval)
      pool.execute.mockResolvedValueOnce([[{ setting_value: 'false' }]]);
      
      // 3. stockService.updateStock
      stockService.updateStock.mockResolvedValue({ success: true, newStock: 15, movementId: 100 });
      
      // 4. connection.execute for activity log
      mockConnection.execute.mockResolvedValueOnce([]);
      
      // 5. pool.execute for final movement fetch
      pool.execute.mockResolvedValueOnce([[{ movement_id: 100, plant_name: 'Snake Plant' }]]);

      await createMovement(req, res);

      expect(stockService.updateStock).toHaveBeenCalledWith(
        1, 10, 'IN', 1, 'Test IN', mockConnection
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ movement_id: 100 })
      }));
    });
  });

  describe('approveMovement', () => {
    it('should use StockService.updateStock with existing movement ID', async () => {
      req.params.id = 50;
      req.user = { user_id: 2, username: 'supervisor_user' };

      // 1. connection.execute for movement fetch with lock
      mockConnection.execute.mockResolvedValueOnce([[{ 
        movement_id: 50, 
        plant_id: 1, 
        quantity: 5, 
        movement_type: 'OUT', 
        approval_status: 'pending',
        notes: 'Request OUT',
        plant_name: 'Snake Plant',
        min_stock_threshold: 2,
        created_by: 3
      }]]);

      // 2. stockService.updateStock
      stockService.updateStock.mockResolvedValue({ success: true, newStock: 10, movementId: 50 });

      // 3. connection.execute for activity log
      mockConnection.execute.mockResolvedValueOnce([]);
      
      await approveMovement(req, res);

      expect(stockService.updateStock).toHaveBeenCalledWith(
        1, 5, 'OUT', 2, 'Request OUT', mockConnection, 50
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { movement_id: 50, new_stock: 10 }
      }));
    });
  });
});
