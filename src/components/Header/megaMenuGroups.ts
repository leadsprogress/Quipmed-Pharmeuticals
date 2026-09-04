import type { Category, Header } from '@/payload-types'

// Fallback grouping used only until the CMS "Mega menu groups" field (Admin → Header) is filled
// in — keeps the site's navigation working out of the box on a fresh install.
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

export type NavGroup = {
  label: string
  categories: Category[]
}

export const buildNavGroups = (
  categories: Category[],
  navGroups?: Header['navGroups'],
): NavGroup[] => {
  if (navGroups && navGroups.length > 0) {
    return navGroups
      .map((group) => ({
        label: group.label,
        categories: (group.categories || []).filter(
          (category): category is Category => typeof category === 'object' && category !== null,
        ),
      }))
      .filter((group) => group.categories.length > 0)
  }

  return MEGA_MENU_GROUPS.map((g) => ({
    label: g.label,
    categories: categories.filter((c) => g.categoryTitles.includes(c.title)),
  })).filter((g) => g.categories.length > 0)
}
