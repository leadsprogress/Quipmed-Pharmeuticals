// Maps our flat 15-category list into logical nav groups, matched by category title.
// Update the title lists here if categories are renamed/added in the CMS.
export const MEGA_MENU_GROUPS: { label: string; categoryTitles: string[] }[] = [
  { label: 'Chronic Care', categoryTitles: ['Cardiac Range', 'Diabetic Range', 'Other Critical Range'] },
  {
    label: 'Pain & Recovery',
    categoryTitles: ['Antiinflammatory & Analgesics', 'Orthopedic Range', 'Injectable Range'],
  },
  {
    label: 'Specialty Care',
    categoryTitles: ['Opthalmic', 'Gynecologist', 'Dermatology', 'Respiratory & Anti-allergics', 'Pediatric Range'],
  },
  { label: 'Wellness', categoryTitles: ['Ayurvedic & Herbal', 'Supplements & Immunity Booster', 'Antibiotics'] },
]
