# CSV Import Template Guide

This guide explains how to use the CSV template for bulk inventory import.

## CSV Template File

Use `inventory-import-template.csv` as a reference for the correct format.

## Required Fields

These fields **must** be filled in for every row:

- **name** - Product name (e.g., "Ibuprofen")
- **sku** - Stock Keeping Unit (e.g., "AC-IBU-400")
- **categoryName** - Product category (e.g., "Tablets", "Capsules")
- **warehouseId** - UUID of the warehouse (e.g., "9b40f144-e2e8-4d04-8ce9-598d396c2257")
- **purchasePrice** - Purchase price in cents (e.g., 25000 = ₦250.00)
- **sellingPrice** - Selling price in cents (e.g., 35000 = ₦350.00)
- **expiryDate** - Expiry date in format M/D/YYYY or YYYY-MM-DD (e.g., "3/5/2026" or "2026-03-05")

## Optional Fields

These fields can be left empty (but column headers must be present):

- **barcode** - Product barcode
- **description** - Product description
- **pricePerPiece** - Price per individual piece in cents
- **pricePerCarton** - Price per carton in cents
- **pricePerRoll** - Price per roll in cents (separate from dozen price)
- **pricePerDozen** - Price per dozen in cents (separate from roll price)
- **piecesPerCarton** - Number of pieces in one carton
- **piecesPerRoll** - Number of pieces in one roll
- **piecesPerDozen** - Number of pieces in one dozen (typically 12)
- **piecesInStock** - Current stock in pieces
- **cartonsInStock** - Current stock in cartons
- **rollsInStock** - Current stock in rolls
- **productSize** - Dosage strength amount (e.g., "400", "500", "20")
- **productSizeUnit** - Dosage strength unit (e.g., "mg", "ml", "g", "mcg", "IU", "mg/5ml")
- **packSize** - Pack size / Unit of sale (e.g., "Tablet", "Capsule", "Sachet", "Bottle", "Strip", "Vial", "Box", "Pack")
- **reorderPoint** - Minimum stock level before reordering
- **expiryAlertThreshold** - Days before expiry to show alert
- **isOutsourced** - "true" or "false" (or "1"/"0", "yes"/"no")
- **expiryWarehouseId** - UUID of warehouse for expiry tracking

## Field Mapping

The frontend automatically maps some fields:

- `cartonInStock` → `cartonsInStock` (singular to plural)
- `piecesInStock` → `inventoryUnits.piecesInStock` (nested structure)
- `cartonsInStock` → `inventoryUnits.cartonsInStock` (nested structure)
- `rollsInStock` → `inventoryUnits.rollsInStock` (nested structure)

### Field Aliases (Alternative Names)

The system accepts alternative field names for convenience:

**Pack Size / Unit of Sale:**
- `packSize` (recommended)
- `unitOfSale`
- `packaging`
- `packType`
- `dispensingUnit`
- `salesUnit`

**Dosage Strength:**
- `productSize` (recommended)
- `dosageStrength`
- `strength`
- `dosage`
- `concentration`
- `potency`

## Date Format

Dates can be in either format:
- **M/D/YYYY** (e.g., "3/5/2026") - Will be converted to YYYY-MM-DD
- **YYYY-MM-DD** (e.g., "2026-03-05") - Used as-is

## Price Format

All prices should be in **cents** (smallest currency unit):
- ₦250.00 = 25000
- ₦350.00 = 35000
- ₦15.50 = 1550

## Boolean Fields

For `isOutsourced`, use:
- `true`, `1`, or `yes` for true
- `false`, `0`, or `no` for false
- Leave empty for false

## Warehouse ID

You must use a valid warehouse UUID. To find available warehouses:
1. Check your warehouse list in the application
2. Copy the exact UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
3. Use the same UUID for all products in that warehouse

## Example CSV Row

```csv
name,sku,categoryName,warehouseId,purchasePrice,sellingPrice,expiryDate,barcode,description,pricePerPiece,pricePerCarton,pricePerRoll,piecesPerCarton,piecesPerRoll,piecesInStock,cartonsInStock,rollsInStock,productSize,productSizeUnit,packSize,reorderPoint,expiryAlertThreshold,isOutsourced,expiryWarehouseId
Ibuprofen,AC-IBU-400,Tablets,9b40f144-e2e8-4d04-8ce9-598d396c2257,25000,35000,3/5/2026,1234567890123,AC-IBU 400mg Tablets,700,35000,7000,50,10,100,5,15,400,mg,Tablet,7,40,false,
```

## Common Issues and Solutions

### Issue: "CSV parser returned empty objects"
**Solution**: Ensure your CSV has:
- Headers in the first row
- Data rows matching the header columns
- No empty rows between data
- Proper comma separation

### Issue: "Missing required fields"
**Solution**: Check that all required fields have values:
- name, sku, categoryName, warehouseId, purchasePrice, sellingPrice, expiryDate

### Issue: "Warehouse ID does not exist"
**Solution**: 
- Verify the warehouseId is correct
- Check that the warehouse exists in your system
- Copy the UUID exactly (case-sensitive)

### Issue: "Invalid date format"
**Solution**: Use dates in M/D/YYYY or YYYY-MM-DD format

### Issue: "Empty error response from backend"
**Solution**: 
- Check browser console (F12) for detailed logs
- Verify CSV data was parsed correctly
- Ensure all required fields are present

## Tips

1. **Always include headers**: The first row must contain all column names
2. **No empty rows**: Remove any blank rows between data
3. **Consistent formatting**: Use the same date and number formats throughout
4. **Test with small files**: Import 2-3 rows first to verify format
5. **Check console logs**: Browser console (F12) shows detailed parsing information

## Notes

- Fields marked as "unsupported" (`dozensInStock`) will be ignored
- `pricePerRoll` and `pricePerDozen` are separate fields - you can set different prices for rolls vs dozens
- `piecesPerRoll` and `piecesPerDozen` are separate fields - rolls and dozens can contain different quantities
- Empty optional fields can be left blank (just leave the cell empty)
- The system automatically handles BOM characters (common in Excel exports)
- All numeric fields are parsed as numbers (no currency symbols)
