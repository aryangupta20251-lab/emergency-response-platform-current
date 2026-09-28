export const hospitalTypes = ['General', 'Government', 'Trauma centre']

export const hospitals = [
  {
    id: 'city-hospital',
    name: 'City Hospital',
    type: 'General',
    address: 'Sector 12, Chandigarh',
    distance: '1.2 km away',
    detail: 'General hospital · demo listing',
    phone: 'Demo contact · +91 00000 00000',
    hours: 'Hours shown for demo only',
    description: 'A sample nearby hospital record used to demonstrate the hospital directory.',
    marker: { left: '66%', top: '61%' }
  },
  {
    id: 'government-hospital',
    name: 'Government Hospital',
    type: 'Government',
    address: 'Sector 16, Chandigarh',
    distance: '2.4 km away',
    detail: 'Government hospital · demo listing',
    phone: 'Demo contact · +91 00000 00000',
    hours: 'Hours shown for demo only',
    description: 'A sample public hospital record used for frontend search and map presentation.',
    marker: { left: '35%', top: '28%' }
  },
  {
    id: 'north-trauma-centre',
    name: 'North Trauma Centre',
    type: 'Trauma centre',
    address: 'Industrial Area Phase 2, Chandigarh',
    distance: '3.8 km away',
    detail: 'Trauma centre · demo listing',
    phone: 'Demo contact · +91 00000 00000',
    hours: 'Hours shown for demo only',
    description: 'A sample trauma centre record. Capacity and availability are not connected.',
    marker: { left: '52%', top: '74%' }
  }
]