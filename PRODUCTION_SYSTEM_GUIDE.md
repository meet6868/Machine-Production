# Production System - PyQt to MERN Conversion

## Overview
This system tracks machine production data with **day** and **night** shifts, separating fields that are recorded per-shift vs. fields that are constant for the whole 24-hour period.

## Data Structure

### 1. **Shift-Specific Fields** (Production Model)
Recorded separately for Day and Night shifts:
- `runtime` - Machine runtime in minutes (converted from HH:MM format)
- `efficiency` - Efficiency percentage (0-100)
- `h1` - Hour 1 production
- `h2` - Hour 2 production  
- `worph` - Work per hour
- `meter` - Fabric meters produced
- `totalPick` - Total pick count
- `worker` - Which worker operated the machine
- `notes` - Optional notes

### 2. **Daily Fields** (DailyProduction Model)
Entered once per day per machine (same for both shifts):
- `speed` - Machine speed
- `cfm` - Cubic Feet per Minute (only used in day shift calculations)
- `pik` - Pick value

### 3. **Summary Fields** (ProductionSummary Model)
Auto-calculated daily summaries:

**Day Shift:**
- `dayEfficiency` - Average efficiency
- `dayMeter` - Total meters (multiplied by 2x for double machines)
- `dayPick` - Total pick (multiplied by 2x for double machines)
- `dayMachine` - Number of machines operated
- `avgDayRuntime` - Average runtime per machine

**Night Shift:**
- `nightEfficiency`
- `nightMeter`
- `nightPick`
- `nightMachine`
- `avgNightRuntime`

**Total (24 Hours):**
- `totalEfficiency` - Average of day + night
- `totalMeter` - Sum of day + night meters
- `totalPick` - Sum of day + night picks
- `totalMachine` - Average machines (day + night) / 2
- `totalAvgRuntime` - Sum of average runtimes
- `avgCFM` - Average CFM across all machines

## API Endpoints

### Production Endpoints
```
POST   /api/production              - Create/update production record
GET    /api/production              - Get all production records (with filters)
GET    /api/production/:id          - Get single production record
PUT    /api/production/:id          - Update production record
DELETE /api/production/:id          - Delete production record
GET    /api/production/stats        - Get today's statistics
```

### Summary Endpoints
```
GET    /api/production/summary/daily        - Get daily summary (query: ?date=YYYY-MM-DD)
GET    /api/production/summary/:date        - Get complete summary for specific date
```

## Workflow

### 1. Creating Production Entry
```javascript
// Example: Day shift entry
POST /api/production
{
  "machine": "machine_id",
  "worker": "worker_id",
  "productionDate": "2025-12-16",
  "shift": "day",
  
  // Shift-specific fields
  "runtime": 660,  // 11 hours in minutes
  "efficiency": 85.5,
  "h1": 100,
  "h2": 95,
  "worph": 12.5,
  "meter": 1500,
  "totalPick": 25000,
  
  // Daily fields (entered once, applies to whole day)
  "speed": 120,
  "cfm": 850,
  "pik": 44,
  
  "notes": "Good performance"
}
```

### 2. Data Storage Logic
1. **Shift data** stored in `Production` collection with unique constraint: `(company, machine, date, shift)`
2. **Daily data** stored in `DailyProduction` collection with unique constraint: `(company, machine, date)`
3. **Summary** auto-calculated and stored in `ProductionSummary` after each save/update/delete

### 3. Summary Calculation
After saving production data:
1. Fetch all day shift records for the date
2. Fetch all night shift records for the date
3. Fetch daily production data (CFM)
4. Calculate shift summaries:
   - Average efficiency (from machines with efficiency > 0)
   - Total meters (multiplied by machine type: double = 2x, single = 1x)
   - Total picks (multiplied by machine type)
   - Average runtime per machine
5. Calculate total summary (day + night combined)
6. Store in ProductionSummary table

## Key Features

### Machine Type Multiplier
- **Single machines**: meter × 1, pick × 1
- **Double machines**: meter × 2, pick × 2

### Runtime Format
- Stored as **minutes** in database
- Frontend displays as **HH:MM**
- Conversion functions needed in frontend

### CFM (Cubic Feet per Minute)
- Only entered during **day shift**
- Used in daily summary calculation
- Converted to m³/min for display: `cfm / 28.31`

### Shift Types
Changed from `['morning', 'afternoon', 'night']` to `['day', 'night']`

## Summary Display Format

```
📊 Daily Summary
─────────────────────────────────
Total Efficiency:     85.50%
Avg CFM:              30.00 m³/min
Total Meter:          3500.00 m
Runtime (Per Machine): 12:15 / 24:00
Total Pick:           58000.00
```

## Database Indexes

### Production
- `{ company: 1, productionDate: -1 }` - For date queries
- `{ company: 1, machine: 1, productionDate: 1, shift: 1 }` - Unique constraint

### DailyProduction
- `{ company: 1, machine: 1, productionDate: 1 }` - Unique constraint

### ProductionSummary
- `{ company: 1, date: -1 }` - For summary queries
- `{ date: 1 }` - Unique constraint

## Frontend Implementation Notes

1. **Form Layout**:
   - Top section: Daily fields (Speed, CFM, Pik) - shown once
   - Middle section: Shift selector (Day/Night tabs)
   - Per-shift section: Runtime, Efficiency, H1, H2, WorPH, Meter, Total Pick, Worker
   - Bottom: Notes field

2. **Data Loading**:
   - When editing, load both shift data and daily data
   - Populate daily fields from DailyProduction
   - Populate shift fields from Production (selected shift)

3. **Summary Display**:
   - Fetch from `/api/production/summary/daily?date=YYYY-MM-DD`
   - Display in card/panel below the form
   - Show Day/Night/Total sections

4. **Runtime Input**:
   - Use time input (HH:MM)
   - Convert to minutes before sending to API
   - Convert from minutes when displaying

## Migration from Old System

### Field Mapping
| Old Field | New Field | Notes |
|-----------|-----------|-------|
| shift (morning/afternoon/night) | shift (day/night) | Simplified to 2 shifts |
| quantityProduced | totalPick | Renamed for clarity |
| fabricLength | meter | Renamed to match PyQt |
| - | runtime | New field (from PyQt) |
| - | efficiency | New field (from PyQt) |
| - | h1, h2 | New fields (from PyQt) |
| - | worph | New field (from PyQt) |
| - | speed, cfm, pik | New daily fields (from PyQt) |

### Worker Changes
| Old Field | New Field |
|-----------|-----------|
| shift | (removed) | Shift now selected during production entry |
| employeeId | aadhaarNumber | Government ID |
| - | phone | Contact number |
