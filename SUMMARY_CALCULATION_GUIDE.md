# Daily Production Summary Calculation Guide

## Overview
This document explains how the system calculates daily production summaries for a particular date, considering different machine types (single/double) and aggregating data across all machines.

---

## 1. Data Collection Process

### Input Data Sources
For each date, the system collects:

1. **Production Records** (from `Production` collection)
   - Worker assignments
   - Shift data (day/night)
   - Runtime (minutes)
   - Efficiency %
   - H1, H2, WorPH values
   - Meter production
   - Total Pick

2. **Daily Production Data** (from `DailyProduction` collection)
   - Speed, CFM, Pik (whole day values)
   - Electricity readings (global for all machines)

---

## 2. Machine Type Multiplier

### Important: Double Machine Handling

When calculating totals, **double machines are multiplied by 2**:

```javascript
// For each production record:
const machineMultiplier = machineType === 'double' ? 2 : 1;

// Applied to:
totalMeter += meter * machineMultiplier;
totalPick += totalPick * machineMultiplier;
```

**Example:**
```
Machine #1 (Single): 
  - Meter: 100
  - Total Pick: 50000
  - Contribution: 100 meters, 50000 picks

Machine #2 (Double):
  - Meter: 100
  - Total Pick: 50000
  - Contribution: 200 meters (100 × 2), 100000 picks (50000 × 2)
```

---

## 3. Summary Calculation Steps

### Step 1: Separate by Shift

Productions are grouped by shift:
- **Day Shift** - 14 hours standard
- **Night Shift** - 10 hours standard

### Step 2: Calculate Per-Shift Summaries

For **each shift** (day and night), compute:

#### A. Efficiency
```javascript
avgEfficiency = totalEfficiency / numberOfMachines
```

#### B. Total Meter (with multiplier)
```javascript
totalMeter = sum of (meter × machineMultiplier) for all productions
```

#### C. Total Pick (with multiplier)
```javascript
totalPick = sum of (totalPick × machineMultiplier) for all productions
```

#### D. Average Runtime
```javascript
avgRuntime = totalRuntime / numberOfMachines
```

#### E. Machine Count
```javascript
machineCount = number of unique machines in this shift
```

---

## 4. Day Shift Summary Calculation

### Formula:
```javascript
Day Shift Summary = {
  avgEfficiency: sum(efficiency) / machineCount,
  totalMeter: sum(meter × multiplier),
  totalPick: sum(pick × multiplier),
  machineCount: unique machines working,
  avgRuntime: sum(runtime) / machineCount,
  dayMeterPerHour: totalMeter / (14 × machineCount) // 14 hours for day shift
}
```

### Example Calculation:
```
Day Shift Data:
- Machine #1 (Single): Efficiency 90%, Meter 500, Pick 600000, Runtime 840 min
- Machine #2 (Double): Efficiency 85%, Meter 400, Pick 500000, Runtime 780 min

Calculations:
avgEfficiency = (90 + 85) / 2 = 87.5%
totalMeter = (500 × 1) + (400 × 2) = 500 + 800 = 1300 meters
totalPick = (600000 × 1) + (500000 × 2) = 600000 + 1000000 = 1,600,000 picks
machineCount = 2
avgRuntime = (840 + 780) / 2 = 810 minutes (13:30)
dayMeterPerHour = 1300 / (14 × 2) = 1300 / 28 = 46.43 m/hr
```

---

## 5. Night Shift Summary Calculation

### Formula:
```javascript
Night Shift Summary = {
  avgEfficiency: sum(efficiency) / machineCount,
  totalMeter: sum(meter × multiplier),
  totalPick: sum(pick × multiplier),
  machineCount: unique machines working,
  avgRuntime: sum(runtime) / machineCount,
  nightMeterPerHour: totalMeter / (10 × machineCount) // 10 hours for night shift
}
```

### Example Calculation:
```
Night Shift Data:
- Machine #1 (Single): Efficiency 88%, Meter 350, Pick 420000, Runtime 600 min
- Machine #2 (Double): Efficiency 82%, Meter 300, Pick 360000, Runtime 570 min

Calculations:
avgEfficiency = (88 + 82) / 2 = 85%
totalMeter = (350 × 1) + (300 × 2) = 350 + 600 = 950 meters
totalPick = (420000 × 1) + (360000 × 2) = 420000 + 720000 = 1,140,000 picks
machineCount = 2
avgRuntime = (600 + 570) / 2 = 585 minutes (09:45)
nightMeterPerHour = 950 / (10 × 2) = 950 / 20 = 47.5 m/hr
```

---

## 6. Total Daily Summary (24 Hours)

### Combined Calculations:
```javascript
Total Summary = {
  totalEfficiency: (14 * dayEfficiency + 10 * nightEfficiency) / 24,  // Weighted by shift hours
  totalMeter: dayMeter + nightMeter,
  totalPick: dayPick + nightPick,
  totalMachine: (dayMachineCount + nightMachineCount) / 2,
  totalAvgRuntime: dayRuntime + nightRuntime,
  overallMeterPerHour: totalMeter / 24 / avgMachineCount
}
```

### Example (continuing above):
```
Day + Night Combined:
totalEfficiency = (14 × 87.5 + 10 × 85) / 24 = (1225 + 850) / 24 = 86.46%
totalMeter = 1300 + 950 = 2250 meters
totalPick = 1,600,000 + 1,140,000 = 2,740,000 picks
totalMachine = (2 + 2) / 2 = 2 machines average
totalAvgRuntime = 810 + 585 = 1395 minutes (23:15)
overallMeterPerHour = 2250 / (24 × 2) = 2250 / 48 = 46.88 m/hr
```

---

## 7. Electricity Summary (Global)

Electricity is tracked **globally for all machines** (not per machine):

```javascript
Electricity Summary = {
  totalUnitsConsumed: sum of all unitsConsumed,
  totalMeter: total meters produced (day + night),
  unitsPerMeter: totalUnitsConsumed / totalMeter,
  machinesReported: count of machines with electricity data
}
```

### Example:
```
Electricity Data:
- Previous Reading: 1000 kWh
- Current Reading: 1150 kWh
- Units Consumed: 150 kWh

From above totals:
- Total Meter: 2250 meters

Calculations:
totalUnitsConsumed = 150 kWh
totalMeter = 2250 meters
unitsPerMeter = 150 / 2250 = 0.067 kWh/meter
machinesReported = 1 (electricity is global)
```

---

## 8. Stored Summary Fields

The final `ProductionSummary` document contains:

```javascript
{
  company: ObjectId,
  date: Date,
  
  // Day Shift
  dayEfficiency: 87.5,
  dayMeter: 1300,
  dayPick: 1600000,
  dayMachine: 2,
  avgDayRuntime: 810,
  dayMeterPerHour: 46.43,
  
  // Night Shift
  nightEfficiency: 85,
  nightMeter: 950,
  nightPick: 1140000,
  nightMachine: 2,
  avgNightRuntime: 585,
  nightMeterPerHour: 47.5,
  
  // Total (24 Hours)
  totalEfficiency: 86.25,
  totalMeter: 2250,
  totalPick: 2740000,
  totalMachine: 2,
  totalAvgRuntime: 1395,
  overallMeterPerHour: 46.88,
  
  // Other Daily Data
  avgCFM: 45.5,
  
  // Electricity (Global)
  totalUnitsConsumed: 150,
  unitsPerMeter: 0.067,
  machinesReported: 1
}
```

---

## 9. Key Points to Remember

### ✅ Machine Type Multiplier
- **Single Machine**: Values counted as-is (× 1)
- **Double Machine**: Values doubled (× 2)
- Applied to: Meter and Pick only

### ✅ Shift Hours
- **Day Shift**: 14 hours standard
- **Night Shift**: 10 hours standard
- **Total**: 24 hours

### ✅ M/Hr Calculations
```
Day M/Hr = Day Total Meter / (14 hours × Machine Count)
Night M/Hr = Night Total Meter / (10 hours × Machine Count)
Overall M/Hr = Total Meter / (24 hours × Average Machine Count)
```

### ✅ Electricity
- Tracked **globally** for all machines combined
- Only one electricity reading per day
- Stored with first machine's daily production
- Aggregated in summary for analytics

### ✅ Averages
- Efficiency: Average across machines
- Runtime: Average across machines
- CFM: Average across all machines for the day

---

## 10. Code Implementation

### Location
File: `/backend/controllers/productionController.js`

### Main Functions

#### `computeAndStoreSummary(companyId, date)`
Main function that:
1. Fetches all productions for the date
2. Fetches all daily production data
3. Calls `computeShiftSummary()` for day and night
4. Calculates totals and electricity
5. Saves to `ProductionSummary` collection

#### `computeShiftSummary(productions)`
Helper function that:
1. Filters productions by shift
2. Applies machine type multiplier
3. Calculates averages and totals
4. Returns shift summary object

---

## 11. Example Full Day Calculation

### Input Data:
```
Date: 2025-12-17

Productions:
1. Machine #1 (Single) - Day Shift
   - Worker: W1
   - Runtime: 840 min
   - Efficiency: 90%
   - Meter: 500
   - Pick: 600000

2. Machine #2 (Double) - Day Shift
   - Worker: W2
   - Runtime: 780 min
   - Efficiency: 85%
   - Meter: 400
   - Pick: 500000

3. Machine #1 (Single) - Night Shift
   - Worker: W3
   - Runtime: 600 min
   - Efficiency: 88%
   - Meter: 350
   - Pick: 420000

4. Machine #2 (Double) - Night Shift
   - Worker: W4
   - Runtime: 570 min
   - Efficiency: 82%
   - Meter: 300
   - Pick: 360000

Daily Data:
- Machine #1: Speed 120, CFM 45, Pik 100
- Machine #2: Speed 115, CFM 46, Pik 105

Electricity:
- Previous: 1000 kWh
- Current: 1150 kWh
```

### Output Summary:
```javascript
{
  // Day Shift (14 hours)
  dayEfficiency: 87.5%,
  dayMeter: 1300 (500×1 + 400×2),
  dayPick: 1,600,000 (600000×1 + 500000×2),
  dayMachine: 2,
  avgDayRuntime: 810 min (13:30),
  dayMeterPerHour: 46.43,
  
  // Night Shift (10 hours)
  nightEfficiency: 85%,
  nightMeter: 950 (350×1 + 300×2),
  nightPick: 1,140,000 (420000×1 + 360000×2),
  nightMachine: 2,
  avgNightRuntime: 585 min (09:45),
  nightMeterPerHour: 47.5,
  
  // Total (24 hours)
  totalEfficiency: 86.46%,  // Weighted: (14×87.5 + 10×85)/24
  totalMeter: 2250,
  totalPick: 2,740,000,
  totalMachine: 2,
  totalAvgRuntime: 1395 min (23:15),
  overallMeterPerHour: 46.88,
  
  // Daily Averages
  avgCFM: 45.5,
  
  // Electricity
  totalUnitsConsumed: 150 kWh,
  unitsPerMeter: 0.067 kWh/meter,
  machinesReported: 1
}
```

---

## 12. Dashboard Usage

This summary data is used in:

### Analytics Endpoints:
- `/api/production/analytics/worker/:id` - Worker performance over time
- `/api/production/analytics/machine/:id` - Machine performance with M/Hr
- `/api/production/analytics/electricity` - Electricity consumption trends

### Dashboard Displays:
- Daily production cards (day/night/total)
- Worker performance charts
- Machine M/Hr trends
- Electricity consumption analytics

---

## 13. Important Notes

⚠️ **Machine Type Impact**
Double machines contribute twice the production but are counted as 1 machine for averages.

⚠️ **Runtime vs Hours**
Runtime is stored in minutes, shift hours are fixed (14 day, 10 night).

⚠️ **Electricity is Global**
One meter reading covers all machines - not tracked per machine.

⚠️ **Auto-calculation**
Summary is recalculated every time production data is saved for that date.

---

**Last Updated:** December 17, 2025
