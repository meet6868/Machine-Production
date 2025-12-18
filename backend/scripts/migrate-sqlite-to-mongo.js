import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Machine from '../models/Machine.js';
import Worker from '../models/Worker.js';
import Production, { DailyProduction, ProductionSummary } from '../models/Production.js';
import Company from '../models/Company.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// SQLite database path
const SQLITE_DB_PATH = path.join(__dirname, '../../app_data.db');

// Default company ID (you'll need to create a company first or use existing one)
let DEFAULT_COMPANY_ID = null;
let DEFAULT_USER_ID = null; // For createdBy field

// Migration state
const migrationStats = {
  users: { total: 0, success: 0, failed: 0 },
  machines: { total: 0, success: 0, failed: 0 },
  workers: { total: 0, success: 0, failed: 0 },
  productions: { total: 0, success: 0, failed: 0 },
  dailyProductions: { total: 0, success: 0, failed: 0 },
  summaries: { total: 0, success: 0, failed: 0 }
};

// Open SQLite database
async function openSQLiteDB() {
  console.log(`Opening SQLite database: ${SQLITE_DB_PATH}`);
  return open({
    filename: SQLITE_DB_PATH,
    driver: sqlite3.Database
  });
}

// Connect to MongoDB
async function connectMongo() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/machine-production');
  console.log('Connected to MongoDB');
}

// Parse runtime from "HH:MM" to minutes
function parseRuntime(runtime) {
  if (!runtime || runtime === '0' || runtime === '00:00') return 0;
  const parts = runtime.split(':');
  if (parts.length !== 2) return 0;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Format runtime from minutes to "HH:MM"
function formatRuntime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Migrate Users
async function migrateUsers(db) {
  console.log('\n📥 Migrating Users...');
  const users = await db.all('SELECT * FROM users');
  migrationStats.users.total = users.length;

  for (const user of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ username: user.username });
      if (existingUser) {
        console.log(`  ⚠️  User "${user.username}" already exists, skipping`);
        migrationStats.users.success++;
        
        // Return first user ID for createdBy field
        if (!DEFAULT_USER_ID) {
          DEFAULT_USER_ID = existingUser._id;
        }
        continue;
      }

      // Create user with required fields
      const newUser = new User({
        company: DEFAULT_COMPANY_ID,
        username: user.username,
        email: `${user.username.toLowerCase().replace(/\s+/g, '')}@migrated.local`,
        password: user.password, // Already hashed from SQLite
        role: user.username.toLowerCase() === 'admin' || user.username.toLowerCase() === 'master' ? 'admin' : 'user',
        isActive: true
      });

      await newUser.save();
      console.log(`  ✅ Migrated user: ${user.username}`);
      migrationStats.users.success++;
      
      // Set first user as default creator
      if (!DEFAULT_USER_ID) {
        DEFAULT_USER_ID = newUser._id;
      }
    } catch (error) {
      console.error(`  ❌ Failed to migrate user ${user.username}:`, error.message);
      migrationStats.users.failed++;
    }
  }
  
  return DEFAULT_USER_ID;
}

// Migrate Machines
async function migrateMachines(db) {
  console.log('\n📥 Migrating Machines...');
  const machines = await db.all('SELECT * FROM machines');
  migrationStats.machines.total = machines.length;

  const machineMap = {}; // Map SQLite ID to MongoDB ID

  for (const machine of machines) {
    try {
      // Check if machine already exists
      const existingMachine = await Machine.findOne({
        company: DEFAULT_COMPANY_ID,
        machineNumber: `M${machine.machine_number}`
      });

      if (existingMachine) {
        console.log(`  ⚠️  Machine M${machine.machine_number} already exists, skipping`);
        machineMap[machine.id] = existingMachine._id;
        migrationStats.machines.success++;
        continue;
      }

      const newMachine = new Machine({
        company: DEFAULT_COMPANY_ID,
        machineNumber: `M${machine.machine_number}`,
        type: machine.production_type === 1 ? 'double' : 'single',
        description: `Machine ${machine.machine_number}`,
        isActive: true,
        createdBy: DEFAULT_USER_ID
      });

      await newMachine.save();
      machineMap[machine.id] = newMachine._id;
      console.log(`  ✅ Migrated machine: M${machine.machine_number} (${newMachine.type})`);
      migrationStats.machines.success++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate machine ${machine.machine_number}:`, error.message);
      migrationStats.machines.failed++;
    }
  }

  return machineMap;
}

// Migrate Workers
async function migrateWorkers(db) {
  console.log('\n📥 Migrating Workers...');
  const workers = await db.all('SELECT * FROM workers');
  migrationStats.workers.total = workers.length;

  const workerMap = {}; // Map SQLite ID to MongoDB ID

  for (const worker of workers) {
    try {
      // Check if worker already exists
      const existingWorker = await Worker.findOne({
        company: DEFAULT_COMPANY_ID,
        adhaarNo: worker.adhaar_no
      });

      if (existingWorker) {
        console.log(`  ⚠️  Worker "${worker.name}" already exists, skipping`);
        workerMap[worker.id] = existingWorker._id;
        migrationStats.workers.success++;
        continue;
      }

      const newWorker = new Worker({
        company: DEFAULT_COMPANY_ID,
        name: worker.name,
        reference: worker.reference || '',
        adhaarNo: worker.adhaar_no,
        address: worker.address || '',
        mobileNo: worker.mobile_no || '',
        isActive: worker.working_status === 1,
        createdBy: DEFAULT_USER_ID
      });

      await newWorker.save();
      workerMap[worker.id] = newWorker._id;
      console.log(`  ✅ Migrated worker: ${worker.name}`);
      migrationStats.workers.success++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate worker ${worker.name}:`, error.message);
      migrationStats.workers.failed++;
    }
  }

  return workerMap;
}

// Migrate Machine Data (Production records)
async function migrateProductions(db, machineMap, workerMap) {
  console.log('\n📥 Migrating Production Records...');
  const productions = await db.all('SELECT * FROM machine_data ORDER BY date, machine_no, shift');
  migrationStats.productions.total = productions.length;

  // Group by date and machine for DailyProduction
  const dailyProductionMap = {}; // Key: "date-machineId"

  for (const prod of productions) {
    try {
      const machineId = machineMap[prod.machine_no];
      const workerId = prod.worker_id ? workerMap[prod.worker_id] : null;

      if (!machineId) {
        console.log(`  ⚠️  Machine ID ${prod.machine_no} not found in map, skipping`);
        migrationStats.productions.failed++;
        continue;
      }

      const date = new Date(prod.date);
      const shift = prod.shift.toLowerCase();
      const runtime = parseRuntime(prod.runtime);

      // Check if production already exists
      const existingProduction = await Production.findOne({
        company: DEFAULT_COMPANY_ID,
        machine: machineId,
        productionDate: date,
        shift: shift
      });

      if (existingProduction) {
        console.log(`  ⚠️  Production for M${prod.machine_no} on ${prod.date} (${shift}) already exists, skipping`);
        migrationStats.productions.success++;
        continue;
      }

      // Create Production record
      const newProduction = new Production({
        company: DEFAULT_COMPANY_ID,
        machine: machineId,
        worker: workerId,
        productionDate: date,
        shift: shift,
        runtime: runtime,
        efficiency: prod.effi || 0,
        h1: prod.h1 || 0,
        h2: prod.h2 || 0,
        worph: prod.worph || 0,
        meter: prod.meter || 0,
        totalPick: prod.total_pick || 0,
        notes: '',
        createdBy: DEFAULT_USER_ID
      });

      await newProduction.save();
      console.log(`  ✅ Migrated production: M${prod.machine_no} ${prod.date} ${shift}`);
      migrationStats.productions.success++;

      // Track for DailyProduction (speed, pik, cfm)
      const dailyKey = `${prod.date}-${machineId}`;
      if (!dailyProductionMap[dailyKey]) {
        dailyProductionMap[dailyKey] = {
          date: date,
          machineId: machineId,
          speed: prod.speed || 0,
          pik: prod.pik || 0,
          cfm: 0 // Not in SQLite, default to 0
        };
      }

    } catch (error) {
      console.error(`  ❌ Failed to migrate production M${prod.machine_no} ${prod.date}:`, error.message);
      migrationStats.productions.failed++;
    }
  }

  return dailyProductionMap;
}

// Migrate Daily Production (machine daily settings)
async function migrateDailyProductions(dailyProductionMap) {
  console.log('\n📥 Migrating Daily Production Records...');
  const entries = Object.values(dailyProductionMap);
  migrationStats.dailyProductions.total = entries.length;

  for (const entry of entries) {
    try {
      // Check if daily production already exists
      const existing = await DailyProduction.findOne({
        company: DEFAULT_COMPANY_ID,
        machine: entry.machineId,
        productionDate: entry.date
      });

      if (existing) {
        console.log(`  ⚠️  Daily production for machine on ${entry.date.toISOString().split('T')[0]} already exists, skipping`);
        migrationStats.dailyProductions.success++;
        continue;
      }

      const newDaily = new DailyProduction({
        company: DEFAULT_COMPANY_ID,
        machine: entry.machineId,
        productionDate: entry.date,
        speed: entry.speed,
        cfm: entry.cfm,
        pik: entry.pik,
        createdBy: DEFAULT_USER_ID
        // Note: electricity readings not in SQLite, will be entered manually
      });

      await newDaily.save();
      console.log(`  ✅ Migrated daily production: ${entry.date.toISOString().split('T')[0]}`);
      migrationStats.dailyProductions.success++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate daily production:`, error.message);
      migrationStats.dailyProductions.failed++;
    }
  }
}

// Migrate Production Summaries
async function migrateSummaries(db) {
  console.log('\n📥 Migrating Production Summaries...');
  const summaries = await db.all('SELECT * FROM machine_data_summary ORDER BY date');
  migrationStats.summaries.total = summaries.length;

  for (const summary of summaries) {
    try {
      const date = new Date(summary.date);

      // Check if summary already exists
      const existing = await ProductionSummary.findOne({
        company: DEFAULT_COMPANY_ID,
        date: date
      });

      if (existing) {
        console.log(`  ⚠️  Summary for ${summary.date} already exists, skipping`);
        migrationStats.summaries.success++;
        continue;
      }

      const newSummary = new ProductionSummary({
        company: DEFAULT_COMPANY_ID,
        date: date,
        dayEfficiency: summary.day_effi || 0,
        dayMeter: summary.day_meter || 0,
        dayPick: summary.day_pick || 0,
        dayMachine: summary.day_machine || 0,
        avgDayRuntime: parseRuntime(summary.avg_day_runtime),
        dayMeterPerHour: 0, // Will be calculated
        nightEfficiency: summary.night_effi || 0,
        nightMeter: summary.night_meter || 0,
        nightPick: summary.night_pick || 0,
        nightMachine: summary.night_machine || 0,
        avgNightRuntime: parseRuntime(summary.avg_night_runtime),
        nightMeterPerHour: 0, // Will be calculated
        totalEfficiency: summary.total_effi || 0,
        totalMeter: summary.total_meter || 0,
        totalPick: summary.total_pick || 0,
        totalMachine: summary.total_machine || 0,
        totalAvgRuntime: parseRuntime(summary.total_avg_runtime),
        totalUnitsConsumed: 0, // Not in SQLite
        unitsPerMeter: 0 // Not in SQLite
      });

      // Calculate meter per hour
      if (newSummary.avgDayRuntime > 0) {
        newSummary.dayMeterPerHour = (newSummary.dayMeter / newSummary.avgDayRuntime) * 60;
      }
      if (newSummary.avgNightRuntime > 0) {
        newSummary.nightMeterPerHour = (newSummary.nightMeter / newSummary.avgNightRuntime) * 60;
      }

      await newSummary.save();
      console.log(`  ✅ Migrated summary: ${summary.date}`);
      migrationStats.summaries.success++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate summary ${summary.date}:`, error.message);
      migrationStats.summaries.failed++;
    }
  }
}

// Print migration statistics
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION STATISTICS');
  console.log('='.repeat(60));
  
  Object.keys(migrationStats).forEach(key => {
    const stats = migrationStats[key];
    console.log(`\n${key.toUpperCase()}:`);
    console.log(`  Total:   ${stats.total}`);
    console.log(`  Success: ${stats.success} ✅`);
    console.log(`  Failed:  ${stats.failed} ${stats.failed > 0 ? '❌' : ''}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

// Main migration function
async function migrate() {
  let sqliteDB = null;

  try {
    // Connect to databases
    sqliteDB = await openSQLiteDB();
    await connectMongo();

    // Get or create default company
    console.log('\n🏢 Setting up company...');
    const Company = mongoose.model('Company');
    
    // Try to get the first (and likely only) company from the database
    let company = await Company.findOne();
    
    if (!company) {
      // If no company exists, create a default one
      company = new Company({
        name: 'Default Company',
        address: 'Migrated from SQLite',
        contactEmail: 'admin@company.com',
        isActive: true
      });
      await company.save();
      console.log('  ✅ Created default company');
    } else {
      console.log(`  ✅ Using existing company: ${company.name}`);
    }
    
    DEFAULT_COMPANY_ID = company._id;

    // Run migrations in order (users first to get DEFAULT_USER_ID)
    await migrateUsers(sqliteDB);
    const machineMap = await migrateMachines(sqliteDB);
    const workerMap = await migrateWorkers(sqliteDB);
    const dailyProductionMap = await migrateProductions(sqliteDB, machineMap, workerMap);
    await migrateDailyProductions(dailyProductionMap);
    await migrateSummaries(sqliteDB);

    // Print statistics
    printStats();

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    if (sqliteDB) {
      await sqliteDB.close();
      console.log('\nClosed SQLite database');
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Closed MongoDB connection');
    }
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
