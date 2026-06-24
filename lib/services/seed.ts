import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedDatabase() {
  try {
    // 1. Seed Config (system_config)
    const configRef = doc(db, 'config', 'system_config');
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      await setDoc(configRef, {
        categories: [
          'Pothole',
          'Streetlight Out',
          'Graffiti',
          'Illegal Dumping',
          'Water Leak',
          'Traffic Signal',
          'Other'
        ],
        severityLevels: ['LOW', 'MODERATE', 'HIGH', 'SEVERE'],
        slaHoursByPriority: {
          'LOW': 72,
          'MODERATE': 48,
          'HIGH': 24,
          'SEVERE': 8
        }
      });
      console.log('Seeded config successfully.');
    }

    // 2. Seed Departments
    const departments = [
      { id: 'dep_public_works', name: 'Public Works', category: 'Pothole', contactInfo: 'publicworks@city.gov' },
      { id: 'dep_sanitation', name: 'Sanitation & Waste', category: 'Illegal Dumping', contactInfo: 'sanitation@city.gov' },
      { id: 'dep_utilities', name: 'Utilities & Water', category: 'Water Leak', contactInfo: 'utilities@city.gov' },
      { id: 'dep_traffic', name: 'Traffic Control', category: 'Traffic Signal', contactInfo: 'traffic@city.gov' },
      { id: 'dep_general', name: 'General Services', category: 'Other', contactInfo: 'cityhall@city.gov' }
    ];

    for (const dept of departments) {
      const deptRef = doc(db, 'departments', dept.id);
      const deptSnap = await getDoc(deptRef);
      if (!deptSnap.exists()) {
        await setDoc(deptRef, dept);
      }
    }
    console.log('Seeded departments successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
