import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const OpdVisitSchema = new mongoose.Schema({
  doctor: mongoose.Schema.Types.ObjectId,
  tokenNumber: String,
  status: String,
  visitDate: Date
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
  name: String,
  user: mongoose.Schema.Types.ObjectId
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
});

const OpdVisit = mongoose.model('OpdVisit', OpdVisitSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);
const User = mongoose.model('User', UserSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('--- Connected to MongoDB ---');

  const users = await User.find({ role: 'doctor' });
  console.log('\n--- DOCTOR USERS ---');
  users.forEach(u => console.log(`Name: ${u.name}, Email: ${u.email}, ID: ${u._id}`));

  const doctors = await Doctor.find();
  console.log('\n--- DOCTOR PROFILES ---');
  doctors.forEach(d => console.log(`Name: ${d.name}, UserRef: ${d.user}, ID: ${d._id}`));

  const visits = await OpdVisit.find().sort({ createdAt: -1 }).limit(10);
  console.log('\n--- RECENT VISITS ---');
  visits.forEach(v => console.log(`Token: ${v.tokenNumber}, DoctorRef: ${v.doctor}, Status: ${v.status}, ID: ${v._id}, Created: ${v.createdAt}`));

  mongoose.connection.close();
}

run().catch(console.error);
