const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = '/home/sathish/Main-Peojects/Products/Rental-Management/Rental-server/public/templates';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Rental Products Template
const rentalData = [
    {
        "Product Name": "Sony A7III",
        "Quantity": 1,
        "Purchase Cost": 150000,
        "Batch Number": "SN-001",
        "Brand": "Sony",
        "Model Number": "A7III",
        "Condition": "new",
        "Notes": "Main camera body"
    },
    {
        "Product Name": "24-70mm GM Lens",
        "Quantity": 2,
        "Purchase Cost": 180000,
        "Batch Number": "SN-002",
        "Brand": "Sony",
        "Model Number": "SEL2470GM",
        "Condition": "good",
        "Notes": "Standard zoom lens"
    }
];

const rentalWS = XLSX.utils.json_to_sheet(rentalData);
const rentalWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(rentalWB, rentalWS, "Rental_Import");
XLSX.writeFile(rentalWB, path.join(outputDir, 'rental_import_template.xlsx'));

// 2. Selling Accessories Template
const accessoryData = [
    {
        "Product Name": "AA Batteries",
        "SKU": "BATT-AA-01",
        "Quantity": 50,
        "Purchase Cost": 500,
        "Selling Price": 15,
        "Min Stock": 10,
        "Location": "Shelf A1"
    },
    {
        "Product Name": "Electrical Tape",
        "SKU": "TAPE-EL-01",
        "Quantity": 20,
        "Purchase Cost": 200,
        "Selling Price": 25,
        "Min Stock": 5,
        "Location": "Rack B2"
    }
];

const accessoryWS = XLSX.utils.json_to_sheet(accessoryData);
const accessoryWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(accessoryWB, accessoryWS, "Accessory_Import");
XLSX.writeFile(accessoryWB, path.join(outputDir, 'selling_accessory_template.xlsx'));

console.log('✅ Templates generated in /public/templates');
