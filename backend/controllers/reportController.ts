import PDFDocument from 'pdfkit';
import { RequestHandler } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

// CSV Export Functions
const exportInventoryCSV: RequestHandler = async (req, res) => {
  try {
    const [plants] = await pool.execute<RowDataPacket[]>(`
      SELECT p.*, c.category_name 
      FROM plants p 
      LEFT JOIN categories c ON p.category_id = c.category_id 
      WHERE p.is_active = 1
      ORDER BY p.name
    `);

    let csv = 'Plant ID,Name,Scientific Name,Category,Current Stock,Min Threshold,Health Status,Growth Stage,Location,Purchase Price,Selling Price,Description\n';

    plants.forEach(plant => {
      csv += `${plant.plant_id},"${plant.name}","${plant.scientific_name || ''}","${plant.category_name || ''}",${plant.current_stock},${plant.min_stock_threshold},"${plant.health_status || ''}","${plant.growth_stage || ''}","${plant.location || ''}",${plant.purchase_price || ''},${plant.selling_price || ''},"${(plant.description || '').replace(/"/g, '""')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

const exportStockMovementsCSV: RequestHandler = async (req, res) => {
  try {
    const { plant_id, start_date, end_date } = req.query;
    let query = `
      SELECT sm.*, p.name as plant_name, u.username 
      FROM stock_movements sm
      JOIN plants p ON sm.plant_id = p.plant_id
      JOIN users u ON sm.created_by = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (plant_id) {
      query += ' AND sm.plant_id = ?';
      params.push(plant_id);
    }
    if (start_date) {
      query += ' AND sm.movement_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND sm.movement_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY sm.movement_date DESC';

    const [movements] = await pool.execute<RowDataPacket[]>(query, params);

    let csv = 'Movement ID,Plant Name,Movement Type,Quantity,Previous Stock,New Stock,Notes,User,Movement Date\n';

    movements.forEach(movement => {
      csv += `${movement.movement_id},"${movement.plant_name}","${movement.movement_type}",${movement.quantity},${movement.previous_stock},${movement.new_stock},"${(movement.notes || '').replace(/"/g, '""')}","${movement.username}","${movement.movement_date}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stock_movements_report.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

const exportHealthLogsCSV: RequestHandler = async (req, res) => {
  try {
    const { plant_id } = req.query;
    let query = `
      SELECT hl.*, p.name as plant_name, u.username 
      FROM plant_health_logs hl
      JOIN plants p ON hl.plant_id = p.plant_id
      JOIN users u ON hl.checked_by = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (plant_id) {
      query += ' AND hl.plant_id = ?';
      params.push(plant_id);
    }

    query += ' ORDER BY hl.check_date DESC';

    const [logs] = await pool.execute<RowDataPacket[]>(query, params);

    let csv = 'Log ID,Plant Name,Health Status,Growth Stage,Notes,Checked By,Check Date\n';

    logs.forEach(log => {
      csv += `${log.log_id},"${log.plant_name}","${log.health_status}","${log.growth_stage || ''}","${(log.notes || '').replace(/"/g, '""')}","${log.username}","${log.check_date}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=health_logs_report.csv');
    res.send(csv);
  } catch (error: any) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

const getSummaryReport: RequestHandler = async (req, res) => {
  try {
    const { download } = req.query;

    const [plants] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM plants WHERE is_active = 1');
    const [stock] = await pool.execute<RowDataPacket[]>('SELECT SUM(current_stock) as total FROM plants WHERE is_active = 1');
    const [lowStock] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM plants WHERE current_stock <= min_stock_threshold AND is_active = 1');
    const [categories] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM categories');
    const [users] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as total FROM users WHERE is_active = 1');

    const summary = {
      total_plants: plants[0].total,
      total_stock: stock[0].total || 0,
      low_stock_items: lowStock[0].total,
      total_categories: categories[0].total,
      total_users: users[0].total,
      generated_at: new Date().toISOString()
    };

    if (download === 'csv') {
      let csv = 'Metric,Value\n';
      csv += `Total Plants,${summary.total_plants}\n`;
      csv += `Total Stock,${summary.total_stock}\n`;
      csv += `Low Stock Items,${summary.low_stock_items}\n`;
      csv += `Total Categories,${summary.total_categories}\n`;
      csv += `Total Users,${summary.total_users}\n`;
      csv += `Generated At,${summary.generated_at}\n`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=summary_report.csv');
      res.send(csv);
    } else {
      res.json({ success: true, data: summary });
    }
  } catch (error: any) {
    console.error('Summary report error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate summary report' });
  }
};

// PDF Export Functions
const generateInventoryPDF: RequestHandler = async (req, res) => {
  try {
    const [plants] = await pool.execute<RowDataPacket[]>(`
      SELECT p.*, c.category_name 
      FROM plants p 
      LEFT JOIN categories c ON p.category_id = c.category_id 
      WHERE p.is_active = 1
      ORDER BY p.name
    `);

    // Check if there's data
    if (!plants || plants.length === 0) {
      // Create a PDF with "no data" message instead of JSON
      const doc = new PDFDocument({ margin: 50 });
      const filename = `inventory-report-${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);
      doc.fontSize(20).text('Growventory - Inventory Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('No plants found in the database.', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Please add plants to generate a report.', { align: 'center' });
      doc.end();
      return;
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `inventory-report-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Growventory - Inventory Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);

    const totalPlants = plants.length;
    const totalStock = plants.reduce((sum, p) => sum + (p.current_stock || 0), 0);
    const lowStock = plants.filter(p => p.current_stock <= p.min_stock_threshold).length;

    doc.fontSize(12).text(`Total Plants: ${totalPlants}`);
    doc.text(`Total Stock: ${totalStock}`);
    doc.text(`Low Stock Items: ${lowStock}`);
    doc.moveDown(2);

    // Table Header
    doc.fontSize(14).text('Plant Details', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [150, 100, 80, 80, 80, 60];

    // Table headers
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Plant Name', tableLeft, tableTop);
    doc.text('Category', tableLeft + colWidths[0], tableTop);
    doc.text('Current Stock', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.text('Min Threshold', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.text('Health Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
    doc.text('Price', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);

    doc.moveTo(tableLeft, tableTop + 15)
      .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
      .stroke();

    // Table rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(10);

    plants.forEach((plant, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        // Re-add table headers on new page
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Plant Name', tableLeft, y - 25);
        doc.text('Category', tableLeft + colWidths[0], y - 25);
        doc.text('Current Stock', tableLeft + colWidths[0] + colWidths[1], y - 25);
        doc.text('Min Threshold', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y - 25);
        doc.text('Health Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y - 25);
        doc.text('Price', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y - 25);
        doc.moveTo(tableLeft, y - 10)
          .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), y - 10)
          .stroke();
        doc.font('Helvetica').fontSize(10);
      }

      const isLowStock = plant.current_stock <= plant.min_stock_threshold;
      const stockColor = isLowStock ? '#ff0000' : '#000000';

      doc.fillColor(stockColor).text(plant.name, tableLeft, y);
      doc.fillColor('#000000').text(plant.category_name || 'N/A', tableLeft + colWidths[0], y);
      doc.fillColor(stockColor).text(plant.current_stock.toString(), tableLeft + colWidths[0] + colWidths[1], y);
      doc.fillColor('#000000').text(plant.min_stock_threshold.toString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
      doc.fillColor('#000000').text(plant.health_status || 'N/A', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
      doc.fillColor('#000000').text(plant.purchase_price ? `$${plant.purchase_price}` : 'N/A', 
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);

      y += 20;
    });

    // Footer
    doc.addPage();
    doc.fontSize(12).text('Report Notes:', { underline: true });
    doc.moveDown(0.5);
    doc.text('• Low stock items are highlighted in red');
    doc.text('• Report includes all active plants');
    doc.text('• Generated by Growventory System');

    doc.end();
  } catch (error: any) {
    console.error('PDF generation error:', error);
    // Return error as PDF instead of JSON
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="error-report.pdf"');
    doc.pipe(res);
    doc.fontSize(20).text('Error Generating Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Failed to generate PDF report.', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Please try again or contact support.', { align: 'center' });
    doc.end();
  }
};

const generateStockMovementsPDF: RequestHandler = async (req, res) => {
  try {
    const { plant_id, start_date, end_date } = req.query;
    let query = `
      SELECT sm.*, p.name as plant_name, u.username 
      FROM stock_movements sm
      JOIN plants p ON sm.plant_id = p.plant_id
      JOIN users u ON sm.created_by = u.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (plant_id) {
      query += ' AND sm.plant_id = ?';
      params.push(plant_id);
    }
    if (start_date) {
      query += ' AND sm.movement_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND sm.movement_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY sm.movement_date DESC';

    const [movements] = await pool.execute<RowDataPacket[]>(query, params);

    const doc = new PDFDocument({ margin: 50 });
    const filename = `stock-movements-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Check if there's data
    if (!movements || movements.length === 0) {
      doc.fontSize(20).text('Growventory - Stock Movements Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('No stock movements found.', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Please record stock movements to generate a report.', { align: 'center' });
      doc.end();
      return;
    }

    // Header
    doc.fontSize(20).text('Growventory - Stock Movements Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    if (plant_id || start_date || end_date) {
      doc.moveDown(0.5);
      doc.fontSize(10).text('Filters:', { underline: true });
      if (plant_id) doc.text(`Plant ID: ${plant_id}`);
      if (start_date) doc.text(`Start Date: ${start_date}`);
      if (end_date) doc.text(`End Date: ${end_date}`);
    }

    doc.moveDown(2);

    // Table
    doc.fontSize(14).text('Stock Movements', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [120, 80, 60, 60, 60, 100, 80];

    // Headers
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Plant', tableLeft, tableTop);
    doc.text('Type', tableLeft + colWidths[0], tableTop);
    doc.text('Qty', tableLeft + colWidths[0] + colWidths[1], tableTop);
    doc.text('Prev', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
    doc.text('New', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
    doc.text('Date', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], tableTop);
    doc.text('User', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], tableTop);

    doc.moveTo(tableLeft, tableTop + 15)
      .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
      .stroke();

    // Rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(10);

    movements.forEach((movement) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const typeColor = movement.movement_type === 'IN' ? '#008000' : 
                       movement.movement_type === 'OUT' ? '#ff0000' : '#0000ff';

      doc.fillColor('#000000').text(movement.plant_name, tableLeft, y);
      doc.fillColor(typeColor).text(movement.movement_type, tableLeft + colWidths[0], y);
      doc.fillColor('#000000').text(movement.quantity.toString(), tableLeft + colWidths[0] + colWidths[1], y);
      doc.fillColor('#000000').text(movement.previous_stock.toString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
      doc.fillColor('#000000').text(movement.new_stock.toString(), tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
      doc.fillColor('#000000').text(new Date(movement.movement_date).toLocaleDateString(), 
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);
      doc.fillColor('#000000').text(movement.username, 
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], y);

      y += 20;
    });

    doc.end();
  } catch (error: any) {
    console.error('PDF generation error:', error);
    // Return error as PDF instead of JSON
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="error-report.pdf"');
    doc.pipe(res);
    doc.fontSize(20).text('Error Generating Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Failed to generate PDF report.', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Please try again or contact support.', { align: 'center' });
    doc.end();
  }
};

export {
  exportInventoryCSV,
  exportStockMovementsCSV,
  exportHealthLogsCSV,
  getSummaryReport,
  generateInventoryPDF,
  generateStockMovementsPDF
};