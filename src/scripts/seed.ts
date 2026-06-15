import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Camp from '../models/Camp';
import Patient from '../models/Patient';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables.');
  process.exit(1);
}

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to MongoDB.');

    // 1. Seed Users
    console.log('Seeding users...');
    const adminCount = await User.countDocuments({ role: 'admin' });
    let adminUser;
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        isEnabled: true,
        isDeleted: false,
      });
      await adminUser.save();
      console.log('Admin user created (username: admin, password: admin123)');
    } else {
      adminUser = await User.findOne({ role: 'admin' });
      console.log('Admin user already exists.');
    }

    const employeeCount = await User.countDocuments({ role: 'employee' });
    let employeeUser;
    if (employeeCount === 0) {
      const hashedPassword = await bcrypt.hash('employee123', 10);
      employeeUser = new User({
        username: 'employee',
        password: hashedPassword,
        role: 'employee',
        isEnabled: true,
        isDeleted: false,
      });
      await employeeUser.save();
      console.log('Employee user created (username: employee, password: employee123)');
    } else {
      employeeUser = await User.findOne({ role: 'employee' });
      console.log('Employee user already exists.');
    }

    // 2. Seed Medical Camps
    console.log('Seeding camps...');
    const campCount = await Camp.countDocuments();
    let camp1, camp2;
    if (campCount === 0) {
      camp1 = new Camp({
        name: 'Colombo Central Elderly Health Camp',
        code: 'CAMP001',
        center: 'Colombo Community Hall',
        district: 'Colombo',
        mohArea: 'Colombo Municipal Council',
        address: '123 Main Street, Colombo 03',
        campDate: new Date('2026-07-10'),
        organizedBy: 'Health Care Society Colombo',
        status: 'Active',
        notes: 'Targeting 200 elderly patients from local low-income communities.',
        sections: [
          { label: 'Section 01', modules: ['checkup', 'fall'] },
          { label: 'Section 02', modules: ['gds'] },
          { label: 'Section 03', modules: ['minicog', 'adl'] },
          { label: 'Section 04', modules: ['iadl'] },
        ],
        isDeleted: false,
      });
      await camp1.save();

      camp2 = new Camp({
        name: 'Galle Southern Medical Outreach',
        code: 'CAMP002',
        center: 'Galle Town Hall',
        district: 'Galle',
        mohArea: 'Galle MC Area',
        address: '45 Beach Road, Galle',
        campDate: new Date('2026-08-15'),
        organizedBy: 'Southern Elders Foundation',
        status: 'Planned',
        notes: 'Focused on diabetic and hypertensive screenings.',
        sections: [
          { label: 'Section 01', modules: ['checkup', 'fall'] },
          { label: 'Section 02', modules: ['gds', 'minicog'] },
          { label: 'Section 03', modules: ['adl', 'iadl'] },
        ],
        isDeleted: false,
      });
      await camp2.save();
      console.log('Mock camps seeded successfully.');
    } else {
      camp1 = await Camp.findOne({ code: 'CAMP001' });
      camp2 = await Camp.findOne({ code: 'CAMP002' });
      console.log('Camps already exist.');
    }

    // 3. Seed Patient (if camps and users are available)
    if (camp1 && adminUser) {
      const patientCount = await Patient.countDocuments();
      if (patientCount === 0) {
        console.log('Seeding mock patients...');
        const patient = new Patient({
          fullName: 'Ariyapala Perera',
          age: 72,
          dob: new Date('1954-04-12'),
          gender: 'Male',
          nic: '541029384V',
          maritalStatus: 'Married',
          contactNumber: '0771234567',
          campId: camp1._id,
          registeredBy: adminUser._id,
          urinaryIncontinence: false,
          constipation: true,
          freeTextIssues: 'Mild lower back pain when walking.',
          allergies: [
            { type: 'Drug', description: 'Penicillin' }
          ],
          medicalConditions: ['Hypertension', 'Diabetes'],
          customMedicalConditions: '',
          surgeries: [
            { event: 'Appendectomy', date: '1985-06-20', notes: 'No complications' }
          ],
          medications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
            { name: 'Losartan', dosage: '500mg', frequency: 'Once daily' }
          ],
          visionProblems: 'Cataract',
          hearingProblems: 'Mild',
          walkIndependently: true,
          walkingAids: [],
          needsAssistanceWith: [],
          historyOfFalls: true,
          functionalNotes: 'Slipped once in the bathroom 3 months ago.',
          memoryProblems: false,
          dementiaDiagnosis: false,
          alzheimersDiagnosis: false,
          depressionSymptoms: true,
          anxietySymptoms: false,
          cognitiveNotes: 'Reports feeling lonely occasionally.',
          smokingHistory: 'Former',
          alcoholUse: 'Occasional',
          exerciseHabits: 'Short walks in the morning',
          dietaryHabits: 'Low salt, low sugar diet',
          livesAlone: false,
          livesWithFamily: true,
          caregiverMaintained: false,
          isDeleted: false,
        });
        await patient.save();
        console.log('Mock patient seeded.');
      }
    }

    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
