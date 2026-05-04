import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const staffPassword = await bcrypt.hash('Staff123!', 10);
  const clientPassword = await bcrypt.hash('Client123!', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carloc.ma' },
    update: {},
    create: {
      email: 'admin@carloc.ma',
      password: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'CarLoc',
      phone: '+212612345678',
    },
  });
  console.log('Created admin:', admin.email);

  // Create Staff
  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@carloc.ma' },
    update: {},
    create: {
      email: 'staff1@carloc.ma',
      password: staffPassword,
      role: 'PERSONNEL',
      firstName: 'Youssef',
      lastName: 'Amrani',
      phone: '+212612111111',
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@carloc.ma' },
    update: {},
    create: {
      email: 'staff2@carloc.ma',
      password: staffPassword,
      role: 'PERSONNEL',
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+212612222222',
    },
  });

  const staff3 = await prisma.user.upsert({
    where: { email: 'staff3@carloc.ma' },
    update: {},
    create: {
      email: 'staff3@carloc.ma',
      password: staffPassword,
      role: 'PERSONNEL',
      firstName: 'Omar',
      lastName: 'Bennani',
      phone: '+212612333333',
    },
  });
  console.log('Created 3 staff members');

  // Create Clients with Profiles
  const clients = [
    {
      email: 'client1@carloc.ma',
      firstName: 'Ali',
      lastName: 'Benharkat',
      phone: '+212661111111',
      address: '45 Rue Mohammed V, Casablanca',
      city: 'Casablanca',
      drivingLicenseNumber: 'DL12345678',
      idCardNumber: 'CB1234567',
    },
    {
      email: 'client2@carloc.ma',
      firstName: 'Sarah',
      lastName: 'Mrani',
      phone: '+212662222222',
      address: '12 Avenue Hassan II, Marrakech',
      city: 'Marrakech',
      drivingLicenseNumber: 'DL87654321',
      idCardNumber: 'CB7654321',
    },
    {
      email: 'client3@carloc.ma',
      firstName: 'Mehdi',
      lastName: 'Elouardi',
      phone: '+212663333333',
      address: '8 Boulevard de la Résistance, Rabat',
      city: 'Rabat',
      drivingLicenseNumber: 'DL11223344',
      idCardNumber: 'CB1122334',
    },
    {
      email: 'client4@carloc.ma',
      firstName: 'Nadia',
      lastName: 'Azizi',
      phone: '+212664444444',
      address: '25 Rue des Arts, Tanger',
      city: 'Tanger',
      drivingLicenseNumber: 'DL55667788',
      idCardNumber: 'CB5566778',
    },
    {
      email: 'client5@carloc.ma',
      firstName: 'Hicham',
      lastName: 'Kadiri',
      phone: '+212665555555',
      address: '3 Rue Ibn Khaldoun, Fès',
      city: 'Fès',
      drivingLicenseNumber: 'DL99887766',
      idCardNumber: 'CB9988776',
    },
  ];

  const createdClients = [];
  for (const client of clients) {
    const user = await prisma.user.upsert({
      where: { email: client.email },
      update: {},
      create: {
        email: client.email,
        password: clientPassword,
        role: 'CLIENT',
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        profile: {
          create: {
            address: client.address,
            city: client.city,
            country: 'Maroc',
            drivingLicenseNumber: client.drivingLicenseNumber,
            drivingLicenseExpiry: new Date('2027-12-31'),
            idCardNumber: client.idCardNumber,
            idCardExpiry: new Date('2030-12-31'),
            isVerified: true,
            verifiedAt: new Date('2024-01-15'),
          },
        },
      },
    });
    createdClients.push(user);
  }
  console.log('Created 5 client accounts with profiles');

  // Create Categories
  const categories = [
    { name: 'Economy', description: 'Voitures économiques', basePricePerDay: 150 },
    { name: 'Standard', description: 'Voitures familiales', basePricePerDay: 250 },
    { name: 'SUV', description: 'SUV et 4x4', basePricePerDay: 400 },
    { name: 'Luxury', description: 'Voitures de luxe', basePricePerDay: 800 },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories[cat.name] = category;
  }
  console.log('Created 4 categories');

  // Create Vehicles (10 vehicles)
  const vehicles = [
    {
      brand: 'Dacia',
      model: 'Logan',
      categoryId: createdCategories['Economy'].id,
      registrationNumber: 'D-12345-MA',
      year: 2023,
      color: 'Blanc',
      transmission: 'MANUAL',
      fuelType: 'PETROL',
      doors: 4,
      seats: 5,
      luggage: 3,
      pricePerDay: 180,
      deposit: 1500,
    },
    {
      brand: 'Renault',
      model: 'Clio',
      categoryId: createdCategories['Economy'].id,
      registrationNumber: 'R-23456-MA',
      year: 2023,
      color: 'Rouge',
      transmission: 'MANUAL',
      fuelType: 'PETROL',
      doors: 4,
      seats: 5,
      luggage: 2,
      pricePerDay: 200,
      deposit: 1500,
    },
    {
      brand: 'Peugeot',
      model: '208',
      categoryId: createdCategories['Economy'].id,
      registrationNumber: 'P-34567-MA',
      year: 2024,
      color: 'Gris',
      transmission: 'MANUAL',
      fuelType: 'PETROL',
      doors: 4,
      seats: 5,
      luggage: 2,
      pricePerDay: 210,
      deposit: 1500,
    },
    {
      brand: 'Renault',
      model: 'Mégane',
      categoryId: createdCategories['Standard'].id,
      registrationNumber: 'R-45678-MA',
      year: 2023,
      color: 'Bleu',
      transmission: 'AUTO',
      fuelType: 'DIESEL',
      doors: 4,
      seats: 5,
      luggage: 4,
      pricePerDay: 280,
      deposit: 2000,
    },
    {
      brand: 'Volkswagen',
      model: 'Golf',
      categoryId: createdCategories['Standard'].id,
      registrationNumber: 'VW-56789-MA',
      year: 2024,
      color: 'Noir',
      transmission: 'AUTO',
      fuelType: 'PETROL',
      doors: 4,
      seats: 5,
      luggage: 3,
      pricePerDay: 300,
      deposit: 2000,
    },
    {
      brand: 'Toyota',
      model: 'Corolla',
      categoryId: createdCategories['Standard'].id,
      registrationNumber: 'T-67890-MA',
      year: 2023,
      color: 'Argent',
      transmission: 'AUTO',
      fuelType: 'HYBRID',
      doors: 4,
      seats: 5,
      luggage: 4,
      pricePerDay: 320,
      deposit: 2000,
    },
    {
      brand: 'Hyundai',
      model: 'Tucson',
      categoryId: createdCategories['SUV'].id,
      registrationNumber: 'H-78901-MA',
      year: 2024,
      color: 'Blanc',
      transmission: 'AUTO',
      fuelType: 'DIESEL',
      doors: 4,
      seats: 5,
      luggage: 5,
      pricePerDay: 450,
      deposit: 3000,
    },
    {
      brand: 'Kia',
      model: 'Sportage',
      categoryId: createdCategories['SUV'].id,
      registrationNumber: 'K-89012-MA',
      year: 2024,
      color: 'Gris',
      transmission: 'AUTO',
      fuelType: 'DIESEL',
      doors: 4,
      seats: 5,
      luggage: 5,
      pricePerDay: 420,
      deposit: 3000,
    },
    {
      brand: 'BMW',
      model: '320i',
      categoryId: createdCategories['Luxury'].id,
      registrationNumber: 'BM-90123-MA',
      year: 2024,
      color: 'Noir',
      transmission: 'AUTO',
      fuelType: 'PETROL',
      doors: 4,
      seats: 5,
      luggage: 4,
      pricePerDay: 850,
      deposit: 5000,
    },
    {
      brand: 'Mercedes',
      model: 'C300',
      categoryId: createdCategories['Luxury'].id,
      registrationNumber: 'MB-01234-MA',
      year: 2024,
      color: 'Blanc',
      transmission: 'AUTO',
      fuelType: 'DIESEL',
      doors: 4,
      seats: 5,
      luggage: 4,
      pricePerDay: 950,
      deposit: 5000,
    },
  ];

  const createdVehicles = [];
  for (const v of vehicles) {
    const vehicle = await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: {},
      create: v,
    });
    createdVehicles.push(vehicle);
  }
  console.log('Created 10 vehicles');

  // Create 15 Reservations with various statuses
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  const reservations = [
    // PENDING - Cash (waiting for payment)
    {
      userId: createdClients[0].id,
      vehicleId: createdVehicles[0].id,
      pickupDate: tomorrow,
      returnDate: nextWeek,
      pickupLocation: 'Casablanca',
      returnLocation: 'Casablanca',
      status: 'PENDING',
      totalPrice: 1260,
      depositAmount: 1500,
      depositPaid: false,
      paymentMethod: 'CASH',
    },
    {
      userId: createdClients[1].id,
      vehicleId: createdVehicles[6].id,
      pickupDate: nextWeek,
      returnDate: nextMonth,
      pickupLocation: 'Marrakech',
      returnLocation: 'Marrakech',
      status: 'PENDING',
      totalPrice: 13500,
      depositAmount: 3000,
      depositPaid: false,
      paymentMethod: 'CASH',
    },
    // CONFIRMED - Paid
    {
      userId: createdClients[2].id,
      vehicleId: createdVehicles[3].id,
      pickupDate: tomorrow,
      returnDate: nextWeek,
      pickupLocation: 'Rabat',
      returnLocation: 'Casablanca',
      status: 'CONFIRMED',
      totalPrice: 1960,
      depositAmount: 2000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    {
      userId: createdClients[3].id,
      vehicleId: createdVehicles[1].id,
      pickupDate: nextWeek,
      returnDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Tanger',
      returnLocation: 'Tanger',
      status: 'CONFIRMED',
      totalPrice: 630,
      depositAmount: 1500,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    // ACTIVE - Currently rented
    {
      userId: createdClients[4].id,
      vehicleId: createdVehicles[4].id,
      agentId: staff1.id,
      pickupDate: yesterday,
      returnDate: tomorrow,
      pickupLocation: 'Fès',
      returnLocation: 'Fès',
      status: 'ACTIVE',
      totalPrice: 900,
      depositAmount: 2000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    // COMPLETED - Past rentals
    {
      userId: createdClients[0].id,
      vehicleId: createdVehicles[2].id,
      agentId: staff2.id,
      pickupDate: twoWeeksAgo,
      returnDate: lastWeek,
      pickupLocation: 'Casablanca',
      returnLocation: 'Casablanca',
      status: 'COMPLETED',
      totalPrice: 840,
      depositAmount: 1500,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    {
      userId: createdClients[1].id,
      vehicleId: createdVehicles[7].id,
      agentId: staff1.id,
      pickupDate: threeWeeksAgo,
      returnDate: twoWeeksAgo,
      pickupLocation: 'Marrakech',
      returnLocation: 'Marrakech',
      status: 'COMPLETED',
      totalPrice: 2100,
      depositAmount: 3000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    {
      userId: createdClients[2].id,
      vehicleId: createdVehicles[8].id,
      agentId: staff3.id,
      pickupDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Rabat',
      returnLocation: 'Casablanca',
      status: 'COMPLETED',
      totalPrice: 5950,
      depositAmount: 5000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    {
      userId: createdClients[3].id,
      vehicleId: createdVehicles[5].id,
      agentId: staff2.id,
      pickupDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() - 53 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Tanger',
      returnLocation: 'Tanger',
      status: 'COMPLETED',
      totalPrice: 2240,
      depositAmount: 2000,
      depositPaid: true,
      paymentMethod: 'CASH',
    },
    {
      userId: createdClients[4].id,
      vehicleId: createdVehicles[9].id,
      agentId: staff1.id,
      pickupDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() - 83 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Fès',
      returnLocation: 'Marrakech',
      status: 'COMPLETED',
      totalPrice: 6650,
      depositAmount: 5000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    // Additional PENDING and CONFIRMED
    {
      userId: createdClients[0].id,
      vehicleId: createdVehicles[5].id,
      pickupDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Casablanca',
      returnLocation: 'Marrakech',
      status: 'CONFIRMED',
      totalPrice: 2240,
      depositAmount: 2000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    {
      userId: createdClients[1].id,
      vehicleId: createdVehicles[4].id,
      pickupDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Marrakech',
      returnLocation: 'Marrakech',
      status: 'PENDING',
      totalPrice: 600,
      depositAmount: 2000,
      depositPaid: false,
      paymentMethod: 'CASH',
    },
    {
      userId: createdClients[2].id,
      vehicleId: createdVehicles[6].id,
      pickupDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Rabat',
      returnLocation: 'Tanger',
      status: 'CONFIRMED',
      totalPrice: 900,
      depositAmount: 3000,
      depositPaid: true,
      paymentMethod: 'CARD',
    },
    // CANCELLED
    {
      userId: createdClients[3].id,
      vehicleId: createdVehicles[0].id,
      pickupDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Tanger',
      returnLocation: 'Tanger',
      status: 'CANCELLED',
      totalPrice: 540,
      depositAmount: 1500,
      depositPaid: false,
      paymentMethod: 'CASH',
      notes: 'Annulé par le client',
    },
    {
      userId: createdClients[4].id,
      vehicleId: createdVehicles[1].id,
      pickupDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
      pickupLocation: 'Fès',
      returnLocation: 'Casablanca',
      status: 'CANCELLED',
      totalPrice: 600,
      depositAmount: 1500,
      depositPaid: true,
      paymentMethod: 'CARD',
      notes: 'Annulé - paiement non reçu',
    },
  ];

  const createdReservations = [];
  for (const r of reservations) {
    const reservation = await prisma.reservation.create({
      data: r,
    });
    createdReservations.push(reservation);
  }
  console.log('Created 15 reservations');

  // Create CheckIns for ACTIVE and COMPLETED reservations
  const activeRes = createdReservations.find(r => r.status === 'ACTIVE');
  if (activeRes) {
    await prisma.checkIn.create({
      data: {
        reservationId: activeRes.id,
        agentId: staff1.id,
        pickupDateTime: activeRes.pickupDate,
        vehicleCondition: 'Bon état',
        kmAtPickup: 45000,
        fuelLevelPickup: 0.75,
        notes: 'Vérifié - aucune bosse ni rayure',
        signature: 'data:image/png;base64,mock',
      },
    });
  }

  const completedReservations = createdReservations.filter(r => r.status === 'COMPLETED');
  for (let i = 0; i < completedReservations.length; i++) {
    const res = completedReservations[i];
    const staffMember = [staff1, staff2, staff3][i % 3];
    
    await prisma.checkIn.create({
      data: {
        reservationId: res.id,
        agentId: staffMember.id,
        pickupDateTime: res.pickupDate,
        vehicleCondition: 'Excellent',
        kmAtPickup: 30000 + i * 5000,
        fuelLevelPickup: 0.8,
        signature: 'data:image/png;base64,mock',
      },
    });

    await prisma.checkOut.create({
      data: {
        reservationId: res.id,
        agentId: staffMember.id,
        returnDateTime: res.returnDate,
        vehicleCondition: 'Bon état',
        kmAtReturn: 32000 + i * 5000,
        fuelLevelReturn: 0.4,
        extraKm: (20000 + i * 5000) - (30000 + i * 5000),
        extraKmCost: 0,
        notes: 'RestitutionOK',
        signature: 'data:image/png;base64,mock',
      },
    });
  }
  console.log('Created check-ins and check-outs');

  // Create 5 Reviews on COMPLETED reservations
  const reviews = [
    {
      reservationId: completedReservations[0].id,
      userId: createdClients[0].id,
      rating: 5,
      comment: 'Excellente expérience! La voiture était en parfait état et le service était professionnel. Je recommande!',
    },
    {
      reservationId: completedReservations[1].id,
      userId: createdClients[1].id,
      rating: 4,
      comment: 'Très bon service, véhicule confortable. Un peu de retard au ramassage mais sinon rien à redire.',
    },
    {
      reservationId: completedReservations[2].id,
      userId: createdClients[2].id,
      rating: 5,
      comment: 'Une voiture de rêve! Le personnel était très serviable et courtois. Je louerai encore.',
    },
    {
      reservationId: completedReservations[3].id,
      userId: createdClients[3].id,
      rating: 3,
      comment: 'Service correct mais quelques petits problèmes avec le GPS. Le véhicule était propre.',
    },
    {
      reservationId: completedReservations[4].id,
      userId: createdClients[4].id,
      rating: 5,
      comment: 'Parfait du début à la fin. Réservation simple, pickup rapide, véhicule impeccable. Merci CarLoc!',
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({
      data: review,
    });
  }
  console.log('Created 5 reviews');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n=== Account Credentials ===');
  console.log('Admin: admin@carloc.ma / Admin123!');
  console.log('Staff: staff1@carloc.ma, staff2@carloc.ma, staff3@carloc.ma / Staff123!');
  console.log('Clients: client1@carloc.ma ... client5@carloc.ma / Client123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });