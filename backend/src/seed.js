const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Part = require('./models/Part');
const Timeline = require('./models/Timeline');
require('dotenv').config();

// Sample data
const sampleUsers = [
  {
    email: 'dispatcher@example.com',
    password: 'password123',
    name: 'Alice Dispatcher',
    role: 'dispatcher'
  },
  {
    email: 'tech1@example.com',
    password: 'password123',
    name: 'Bob Technician',
    role: 'technician'
  },
  {
    email: 'tech2@example.com',
    password: 'password123',
    name: 'Charlie Technician',
    role: 'technician'
  },
  {
    email: 'tech3@example.com',
    password: 'password123',
    name: 'Diana Technician',
    role: 'technician'
  }
];

const sampleJobs = [
  {
    customerName: 'John Smith',
    siteAddress: '123 Main St, Springfield, IL',
    description: 'Fix leaking kitchen faucet',
    priority: 'medium',
    scheduledDate: new Date('2026-09-04'),
    startTime: '09:00',
    estimatedDuration: 2,
    status: 'unassigned'
  },
  {
    customerName: 'Sarah Johnson',
    siteAddress: '456 Oak Ave, Springfield, IL',
    description: 'Install new HVAC unit',
    priority: 'high',
    scheduledDate: new Date('2026-09-04'),
    startTime: '10:00',
    estimatedDuration: 4,
    status: 'assigned'
  },
  {
    customerName: 'Mike Brown',
    siteAddress: '789 Pine Rd, Springfield, IL',
    description: 'Repair refrigerator compressor',
    priority: 'emergency',
    scheduledDate: new Date('2026-09-04'),
    startTime: '14:00',
    estimatedDuration: 3,
    status: 'en_route'
  },
  {
    customerName: 'Emily Davis',
    siteAddress: '321 Elm St, Springfield, IL',
    description: 'Fix broken water heater',
    priority: 'high',
    scheduledDate: new Date('2026-09-04'),
    startTime: '08:00',
    estimatedDuration: 2,
    status: 'on_site'
  },
  {
    customerName: 'Tom Wilson',
    siteAddress: '654 Maple Dr, Springfield, IL',
    description: 'Install new dishwasher',
    priority: 'low',
    scheduledDate: new Date('2026-09-03'),
    startTime: '09:00',
    estimatedDuration: 2,
    status: 'completed',
    completionNote: 'Dishwasher installed successfully, customer satisfied'
  },
  {
    customerName: 'Lisa Anderson',
    siteAddress: '987 Cedar Ln, Springfield, IL',
    description: 'Fix washing machine not draining',
    priority: 'medium',
    scheduledDate: new Date('2026-09-05'),
    startTime: '11:00',
    estimatedDuration: 1.5,
    status: 'unassigned'
  }
];

const sampleParts = [
  {
    partName: 'Kitchen Faucet Cartridge',
    quantity: 1
  },
  {
    partName: 'HVAC Compressor',
    quantity: 1
  },
  {
    partName: 'Refrigerator Compressor',
    quantity: 1
  },
  {
    partName: 'Water Heater Element',
    quantity: 2
  },
  {
    partName: 'Dishwasher Installation Kit',
    quantity: 1
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Job.deleteMany({});
    await Part.deleteMany({});
    await Timeline.deleteMany({});

    // Create users
    console.log('Creating users...');
    const createdUsers = await User.create(sampleUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Create jobs
    console.log('Creating jobs...');
    const createdJobs = await Job.create(sampleJobs);
    console.log(`Created ${createdJobs.length} jobs`);

    // Assign technicians to jobs
    console.log('Assigning technicians to jobs...');
    const tech1 = createdUsers[1]; // Bob Technician
    const tech2 = createdUsers[2]; // Charlie Technician
    const tech3 = createdUsers[3]; // Diana Technician

    // Assign job 1 to tech1
    createdJobs[1].assignedTechnicians.push(tech1._id);
    createdJobs[1].status = 'assigned';
    await createdJobs[1].save();

    // Assign job 2 to tech2
    createdJobs[2].assignedTechnicians.push(tech2._id);
    createdJobs[2].status = 'en_route';
    await createdJobs[2].save();

    // Assign job 3 to tech3
    createdJobs[3].assignedTechnicians.push(tech3._id);
    createdJobs[3].status = 'on_site';
    await createdJobs[3].save();

    // Assign job 4 to tech1 (will be completed job)
    createdJobs[4].assignedTechnicians.push(tech1._id);
    // Don't mark as completed yet - we need to add parts first
    await createdJobs[4].save();

    // Create parts for job that will be completed
    console.log('Creating parts...');
    const part1 = await Part.create({
      job: createdJobs[4]._id,
      partName: sampleParts[4].partName,
      quantity: sampleParts[4].quantity,
      recordedBy: tech1._id
    });

    const part2 = await Part.create({
      job: createdJobs[4]._id,
      partName: 'Mounting Brackets',
      quantity: 4,
      recordedBy: tech1._id
    });

    // Now mark the job as completed
    createdJobs[4].status = 'completed';
    await createdJobs[4].save();

    // Create timeline entries
    console.log('Creating timeline entries...');
    const dispatcher = createdUsers[0];

    // Timeline for completed job
    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'created',
      description: 'Job created for Tom Wilson',
      performedBy: dispatcher._id
    });

    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'technician_assigned',
      description: 'Bob Technician assigned to job',
      performedBy: dispatcher._id,
      metadata: { technicianId: tech1._id }
    });

    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'status_change',
      description: 'Status changed from assigned to en_route',
      performedBy: tech1._id,
      metadata: { oldStatus: 'assigned', newStatus: 'en_route' }
    });

    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'status_change',
      description: 'Status changed from en_route to on_site',
      performedBy: tech1._id,
      metadata: { oldStatus: 'en_route', newStatus: 'on_site' }
    });

    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'part_added',
      description: 'Part added: Dishwasher Installation Kit',
      performedBy: tech1._id,
      metadata: { partId: part1._id, partName: 'Dishwasher Installation Kit', quantity: 1 }
    });

    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'part_added',
      description: 'Part added: Mounting Brackets',
      performedBy: tech1._id,
      metadata: { partId: part2._id, partName: 'Mounting Brackets', quantity: 4 }
    });

    await Timeline.create({
      job: createdJobs[4]._id,
      eventType: 'completed',
      description: 'Job completed with note: Dishwasher installed successfully, customer satisfied',
      performedBy: tech1._id,
      metadata: { completionNote: 'Dishwasher installed successfully, customer satisfied' }
    });

    // Timeline for other jobs
    for (let i = 0; i < 4; i++) {
      await Timeline.create({
        job: createdJobs[i]._id,
        eventType: 'created',
        description: `Job created for ${createdJobs[i].customerName}`,
        performedBy: dispatcher._id
      });
    }

    console.log('Database seeded successfully!');
    console.log('\n=== Sample Credentials ===');
    console.log('Dispatcher: dispatcher@example.com / password123');
    console.log('Technician 1: tech1@example.com / password123');
    console.log('Technician 2: tech2@example.com / password123');
    console.log('Technician 3: tech3@example.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();