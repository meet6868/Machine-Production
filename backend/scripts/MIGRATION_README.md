# SQLite to MongoDB Migration Script

This script migrates data from your old PyQt application's SQLite database (`app_data.db`) to the new MongoDB database.

## What Gets Migrated

### 1. **Users** (from `users` table)
- Username
- Password (already hashed)
- Role (admin/user based on username)

### 2. **Machines** (from `machines` table)
- Machine number (converted to format: M1, M2, etc.)
- Production type (0 = single, 1 = double)
- Active status

### 3. **Workers** (from `workers` table)
- Name
- Reference
- Adhaar number
- Address
- Mobile number
- Working status

### 4. **Production Records** (from `machine_data` table)
- Date, Machine, Worker, Shift
- Runtime (converted from HH:MM to minutes)
- Efficiency, H1, H2, WorPH
- Meter, Total Pick

### 5. **Daily Production** (machine settings per day)
- Speed, PIK, CFM values
- Extracted from `machine_data` table

### 6. **Production Summaries** (from `machine_data_summary` table)
- Day/Night/Total statistics
- Efficiency, Meter, Pick
- Machine counts
- Average runtimes

## Schema Mapping

| SQLite Table | MongoDB Collection | Notes |
|--------------|-------------------|-------|
| users | users | Passwords already hashed |
| machines | machines | machine_number → machineNumber (M1, M2...) |
| workers | workers | adhaar_no → adhaarNo |
| machine_data | productions | Runtime converted from HH:MM to minutes |
| machine_data (grouped) | dailyproductions | Speed, PIK, CFM per machine per day |
| machine_data_summary | productionsummaries | Day/Night/Total aggregated stats |

## Field Conversions

### Runtime Format
- **SQLite**: Stored as "HH:MM" string
- **MongoDB**: Stored as minutes (integer)
- **Example**: "10:30" → 630 minutes

### Machine Number
- **SQLite**: Integer (1, 2, 3...)
- **MongoDB**: String with prefix ("M1", "M2", "M3"...)

### Production Type
- **SQLite**: BOOLEAN (0 = single, 1 = double)
- **MongoDB**: String ("single" or "double")

### Shift
- **SQLite**: TEXT ("Day" or "Night")
- **MongoDB**: String (lowercase: "day" or "night")

## Prerequisites

1. **SQLite database** must be at: `/media/hp/New Volume/PyQT Projects/machine-production-mern/app_data.db`
2. **MongoDB** must be running
3. **Backend environment** must be configured (`.env` file)
4. **Packages installed**: `sqlite` and `sqlite3`

## How to Run

### Step 1: Ensure MongoDB is Running
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start if not running
sudo systemctl start mongod
```

### Step 2: Backup Your Current MongoDB Database (Optional but Recommended)
```bash
mongodump --db=machine-production --out=/path/to/backup
```

### Step 3: Run the Migration Script
```bash
cd backend
node scripts/migrate-sqlite-to-mongo.js
```

### Step 4: Review the Output
The script will display:
- ✅ Successfully migrated records
- ⚠️ Skipped records (already exist)
- ❌ Failed records (with error messages)
- 📊 Final statistics

## Migration Statistics

After completion, you'll see a summary like:

```
============================================================
📊 MIGRATION STATISTICS
============================================================

USERS:
  Total:   3
  Success: 3 ✅
  Failed:  0

MACHINES:
  Total:   8
  Success: 8 ✅
  Failed:  0

WORKERS:
  Total:   8
  Success: 8 ✅
  Failed:  0

PRODUCTIONS:
  Total:   2112
  Success: 2112 ✅
  Failed:  0

DAILYPRODUCTIONS:
  Total:   264
  Success: 264 ✅
  Failed:  0

SUMMARIES:
  Total:   132
  Success: 132 ✅
  Failed:  0
============================================================
```

## Important Notes

### Duplicate Prevention
- The script checks for existing records before inserting
- If a record already exists, it will be **skipped** (not duplicated)
- Safe to run multiple times

### Default Company
- All migrated data is assigned to a "Default Company"
- This company is created automatically if it doesn't exist
- You can rename it later in the MongoDB database

### Missing Fields in SQLite
Some fields in MongoDB don't exist in SQLite:
- **Electricity readings** (previousReading, currentReading, unitsConsumed)
  - Set to 0 or undefined
  - Must be entered manually for each date
- **CFM values** (in DailyProduction)
  - Set to 0
  - Can be updated in the application

### Data Validation
After migration, verify:
1. Machine numbers are correct (M1, M2, etc.)
2. Worker names and adhaar numbers
3. Production dates and shift data
4. Summary calculations look reasonable

## Troubleshooting

### "Cannot find module 'sqlite'"
```bash
cd backend
npm install sqlite sqlite3
```

### "MongoDB connection failed"
- Check if MongoDB is running: `sudo systemctl status mongod`
- Verify `.env` file has correct `MONGODB_URI`

### "SQLite database not found"
- Verify the database path: `/media/hp/New Volume/PyQT Projects/machine-production-mern/app_data.db`
- Update `SQLITE_DB_PATH` in the script if needed

### "Duplicate key error"
- This means the record already exists in MongoDB
- The script will skip it automatically
- Not an error, just informational

## Post-Migration Tasks

1. **Verify Data**
   - Login to the application
   - Check Dashboard statistics
   - Review production entries
   - Verify machine and worker lists

2. **Enter Missing Data**
   - Electricity readings for each production date
   - CFM values if needed

3. **Backup SQLite Database**
   ```bash
   cp app_data.db app_data.db.backup
   ```

4. **Update Production Summaries** (if needed)
   - The backend will automatically recalculate summaries
   - Or run: `node scripts/recalculate-summaries.js` (if you create one)

## Rollback

If you need to rollback:

1. **Restore MongoDB from backup**
   ```bash
   mongorestore --db=machine-production /path/to/backup/machine-production
   ```

2. **Or delete migrated data**
   ```javascript
   // In MongoDB shell
   use machine-production
   db.users.deleteMany({ /* criteria */ })
   db.machines.deleteMany({ /* criteria */ })
   // etc.
   ```

## Support

If you encounter issues:
1. Check the error messages in the console output
2. Verify your SQLite database structure matches expected schema
3. Check MongoDB logs: `sudo journalctl -u mongod`
4. Review the migration script for any customizations needed

---

**Created**: December 2025
**Last Updated**: December 2025
