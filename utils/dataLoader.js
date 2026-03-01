const fs = require('fs').promises;
const path = require('path');
const xlsx = require('xlsx');

const dataDir = path.join(__dirname, '../data');

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (e) {
        return false;
    }
}

// Read products from product_export.xlsx and map to medicine structure
async function readProductsFromExcel() {
    // Accept several common export file name variants
    const candidates = [
        'product_export.xlsx',
        'product-export.xlsx',
        'products-export.xlsx',
        'products_export.xlsx',
        'products.xlsx',
        'product.xlsx'
    ];

    const files = await fs.readdir(dataDir);
    const found = candidates.find(c => files.includes(c));
    if (!found) return null;

    const xlsxPath = path.join(dataDir, found);
    const workbook = xlsx.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    // Map rows to medicines: try to find common columns
    return rows.map((row, idx) => {
        // handle common keys and also keys with spaces (e.g. 'product name')
        const id = row.id || row.ID || row.ProductID || row['product id'] || row['Product ID'] || row.product_id || idx + 1;
        const name = row.name || row.Name || row.ProductName || row['product name'] || row['Product Name'] || row.product || row.Product || 'Unknown';

        const stockVal = row.stock || row.Stock || row.Quantity || row.qty || row.Qty || row['stock'] || 0;
        const stock = parseInt(stockVal, 10) || 0;
        const prescriptionRequired = !!(row.prescriptionRequired || row.PrescriptionRequired || row.RequiresPrescription || false);
        const priceVal = row.price || row.Price || row['price rec'] || row['price'] || row['price_rec'] || row['price rec.'] || 0;
        const price = Number(priceVal) || 0;

        return {
            id,
            name,
            stock,
            price,
            prescriptionRequired
        };
    });
}

// Read consumer order history JSON and map to requests structure
async function readConsumerOrders() {
    // Prefer JSON file if present
    const ordersJsonPath = path.join(dataDir, 'consumer_order_history.json');
    if (await fileExists(ordersJsonPath)) {
        try {
            const data = await fs.readFile(ordersJsonPath, 'utf8');
            const orders = JSON.parse(data);
            return orders.map((o, idx) => ({
                id: o.id || o.orderId || o.OrderID || idx + 1,
                patientName: o.customerName || o.customer || o.buyer || 'Unknown',
                medicineName: o.productName || o.product || (o.items && o.items[0] && o.items[0].name) || 'Unknown',
                quantity: parseInt(o.quantity || o.qty || (o.items && o.items[0] && o.items[0].quantity) || 1, 10) || 1,
                status: o.status || 'completed',
                requestDate: o.date || o.orderDate || new Date().toISOString()
            }));
        } catch (e) {
            // fall through to try excel
        }
    }

    // If no JSON, look for an Excel file in data directory that looks like consumer/order history
    const files = await fs.readdir(dataDir);
    const xlFile = files.find(f => /consumer|order|order_history|consumer_order/i.test(f) && f.toLowerCase().endsWith('.xlsx'));
    if (!xlFile) return null;

    try {
        const xlPath = path.join(dataDir, xlFile);
        const workbook = xlsx.readFile(xlPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        return rows.map((o, idx) => ({
            id: o.id || o.ID || o.orderId || o.OrderID || idx + 1,
            patientName: o.customerName || o.customer || o.buyer || o.Customer || 'Unknown',
            medicineName: o.productName || o.product || o.Product || (o.items && o.items[0] && o.items[0].name) || 'Unknown',
            quantity: parseInt(o.quantity || o.qty || o.Quantity || (o.items && o.items[0] && o.items[0].quantity) || 1, 10) || 1,
            status: o.status || o.Status || 'completed',
            requestDate: o.date || o.orderDate || o.Date || new Date().toISOString()
        }));
    } catch (e) {
        return null;
    }
}

module.exports = {
    readProductsFromExcel,
    readConsumerOrders,
    fileExists
};
