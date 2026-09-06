/**
 * Splits the 14 flat therapeutic-range `categories` into subcategories (by drug class,
 * inferred from each product's `composition` text) so the homepage "Popular Ranges" section
 * can show category -> subcategory drilldown instead of listing medicines directly.
 *
 * For each top-level category:
 *  - creates its subcategories under Payload `categories` (parent = the top-level category)
 *  - tags every product currently in that top-level category with the matching subcategory,
 *    in addition to (not instead of) its existing top-level category tag
 *
 * Idempotent: re-running matches subcategories/tags already created by title+parent and skips
 * them instead of duplicating.
 */
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

type Rule = { title: string; test: (comp: string, brand: string) => boolean }

const has = (comp: string, ...needles: string[]) => needles.some((n) => comp.includes(n))

const TAXONOMY: Record<string, Rule[]> = {
  'Cardiac Range': [
    {
      title: 'Antiplatelet & Heart Protection',
      test: (c) =>
        has(c, 'CLOPIDOGREL', 'ASPIRIN', 'TICAGRELOR', 'SACUBITRIL', 'EPLERENONE', 'IVABRADINE', 'NITROGLYCERIN'),
    },
    {
      title: 'Cholesterol Management',
      test: (c) => has(c, 'ATORVASTATIN', 'ROSUVASTATIN', 'EZETIMIBE', 'FENOFIBRATE'),
    },
    {
      title: 'Blood Pressure Care',
      test: (c) =>
        has(
          c,
          'AMLODIPINE',
          'CILNIDIPINE',
          'TELMISARTAN',
          'LOSARTAN',
          'BISOPROLOL',
          'CARVEDILOL',
          'METOPROLOL',
          'CHLORTHALIDONE',
          'ATENOLOL',
        ),
    },
    { title: 'Heart & Antioxidant Support', test: () => true },
  ],
  'Diabetic Range': [
    { title: 'SGLT2 Inhibitors', test: (c) => has(c, 'DAPAGLIFLOZIN', 'EMPAGLIFLOZIN') },
    { title: 'DPP-4 Inhibitors', test: (c) => has(c, 'LINAGLIPTIN', 'SITAGLIPTIN', 'TENELIGLIPTIN', 'VILDAGLIPTIN') },
    { title: 'Sulfonylureas & Metformin', test: (c) => has(c, 'GLIMEPIRIDE', 'GLICLAZIDE', 'METFORMIN') },
    { title: 'Other Antidiabetic Care', test: () => true },
  ],
  'Orthopedic Range': [
    {
      title: 'Pain, Muscle & Joint Relief',
      test: (c) => has(c, 'ACECLOFENAC', 'THIOCOLCHICOSIDE', 'ETORICOXIB', 'DICLOFENAC', 'LINSEED'),
    },
    { title: 'Bone & Calcium Care', test: (c) => has(c, 'CALCIUM', 'CHOLECALCIFEROL', 'CALCITRIOL', 'COLLAGEN') },
    {
      title: 'Nerve Care & Neuropathy',
      test: (c) => has(c, 'GABAPENTIN', 'PREGABALIN', 'METHYLCOBALAMIN', 'MECOBALAMIN', 'NORTRIPTYLINE'),
    },
    {
      title: 'Autoimmune & Steroid Therapy',
      test: (c) => has(c, 'DEFLAZACORT', 'METHYPREDNISOLONE', 'HYDROXYCHLOROQUINE', 'IGURATIMOD', 'TOFACITINIB'),
    },
    { title: 'Neuro & Psychiatric Care', test: () => true },
  ],
  'Other Critical Range': [
    { title: 'Thyroid Care', test: (c) => has(c, 'THYROXINE') },
    {
      title: 'Neuro & Psychiatric Care',
      test: (c) =>
        has(
          c,
          'QUETIAPINE',
          'PAROXETINE',
          'AMITRIPTYLINE',
          'FLUPENTIXOL',
          'MELITRACEN',
          'TRIHEXYPHENIDYL',
          'DIVALPROEX',
          'VALPORIC',
          'VALPORATE',
          'LEVETIRACETAM',
          'CITICOLIN',
          'PIRACETAM',
          'OXCARBAZEPINE',
        ),
    },
    { title: 'Urology & Prostate Care', test: (c) => has(c, 'SILODOSIN', 'DUTASTERIDE', 'TAMSULOSIN', 'TOLVAPTAN') },
    { title: 'Vertigo & Ear Care', test: (c) => has(c, 'BITAHISTINE') },
    { title: 'Heart, Kidney & Metabolic Care', test: () => true },
  ],
  'Injectable Range': [{ title: 'Bladder & Fluid Balance Care', test: () => true }],
  Opthalmic: [
    {
      title: 'Eye Infection & Inflammation Care',
      test: (c) =>
        has(
          c,
          'CIPROFLOXACIN',
          'GATIFLOXACIN',
          'MOXIFLOXACIN',
          'LOTEPREDNOL',
          'DEXAMETHASONE',
          'PREDNISOLONE',
          'NEPAFENAC',
          'KETOROLAC',
          'OLOPATADINE',
          'TOBRAMYCIN',
        ),
    },
    { title: 'Glaucoma Care', test: (c) => has(c, 'TIMOLOL', 'BRIMONIDINE') },
    {
      title: 'Dry Eye & Lubricant Care',
      test: (c) => has(c, 'CARBOXYMETHYL', 'HYALURONATE', 'POLYETHYLENE GLYCOL'),
    },
    { title: 'Ear & Nasal Care', test: () => true },
  ],
  Antibiotics: [
    {
      title: 'Respiratory & General Antibiotics',
      test: (c) => has(c, 'AMOXYCILLIN', 'AZITHROMYCIN', 'CEFIXIME', 'CEFPODOXIME'),
    },
    { title: 'Gut & Combination Antibiotics', test: () => true },
  ],
  'Antiinflammatory & Analgesics': [
    { title: 'Enzyme & Recovery Support', test: (c) => has(c, 'TRYPSIN', 'SERRATIOPEPTIDASE') },
    { title: 'Pain & Fever Relief', test: () => true },
  ],
  'Pediatric Range': [
    {
      title: 'Acidity & Digestive Care',
      test: (c) =>
        has(
          c,
          'ESOMEPRAZOLE',
          'OMEPRAZOLE',
          'PANTOPRAZOLE',
          'RABEPRAZOLE',
          'SODIUM BICARBONATE',
          'VONOPRAZAN',
          'URSODEOXYCHOLIC',
          'FAST RELIEF FROM ACIDITY',
        ),
    },
    { title: 'Nausea & Vomiting Care', test: (c) => has(c, 'ONDANSETRON') },
    { title: 'Weight Management', test: (c) => has(c, 'ORLISTAT') },
    { title: 'Gut Flora & Immunity', test: () => true },
  ],
  Dermatology: [
    {
      title: 'Skin Infection & Fungal Care',
      test: (c) => has(c, 'ITRACONAZOLE', 'KETOCONAZOLE', 'CLOTRIMAZOLE', 'LULICONAZOLE', 'MICONAZOLE'),
    },
    { title: 'Allergy & Itching Relief', test: (c) => has(c, 'HYDROXYZINE', 'LEVOCETIRIZINE') },
    { title: 'Antiviral Skin Care', test: (c) => has(c, 'ACYCLOVIR') },
    { title: 'Skin Care & Sun Protection', test: () => true },
  ],
  'Supplements & Immunity Booster': [
    { title: 'Omega-3 & Essential Fatty Acids', test: (c) => has(c, 'OMEGA', 'COD LIVER OIL', 'CO-ENZYME') },
    { title: 'Multivitamins & Multiminerals', test: (c) => has(c, 'MULTIVITAMIN', 'MULTIMINERAL') },
    { title: 'Antioxidant & Herbal Boosters', test: () => true },
  ],
  'Respiratory & Anti-allergics': [
    {
      title: 'Asthma & COPD Care',
      test: (c) => has(c, 'BUDESONIDE', 'FORMOTEROL', 'IPRATROPIUM', 'ACEBROPHYLLINE', 'LEVOSALBUTAMOL'),
    },
    { title: 'Allergy Care', test: (c) => has(c, 'BILASTIN', 'MONTELUKAST') },
    { title: 'Cough & Cold Relief', test: () => true },
  ],
  'Ayurvedic & Herbal': [
    { title: 'Joint & Liver Care', test: (c) => has(c, 'LIVER', 'AJWAIN', 'NIRGUNDI', 'SIRAS') },
    { title: 'Immunity & Wellness Care', test: () => true },
  ],
  Gynecologist: [
    { title: 'Hormonal & Fertility Care', test: (c) => has(c, 'DYDROGESTERONE', 'L-ARGININE') },
    { title: 'Nutritional Support in Pregnancy', test: (c) => has(c, 'FERROUS', 'FOLIC ACID') },
    { title: 'Infection Care', test: () => true },
  ],
}

async function run() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const { docs: allCategories } = await payload.find({ collection: 'categories', limit: 200, depth: 0 })
  const topByTitle = new Map(allCategories.filter((c) => !c.parent).map((c) => [c.title, c]))
  const existingSubByParentAndTitle = new Map<string, (typeof allCategories)[number]>()
  for (const c of allCategories) {
    if (c.parent) {
      const parentId = typeof c.parent === 'object' ? c.parent.id : c.parent
      existingSubByParentAndTitle.set(`${parentId}::${c.title}`, c)
    }
  }

  let createdCount = 0
  let taggedCount = 0

  for (const [categoryTitle, rules] of Object.entries(TAXONOMY)) {
    const topCategory = topByTitle.get(categoryTitle)
    if (!topCategory) {
      console.warn(`Skipping "${categoryTitle}" — no matching top-level category found.`)
      continue
    }

    const subcategoryIdByTitle = new Map<string, number | string>()
    for (const rule of rules) {
      const key = `${topCategory.id}::${rule.title}`
      const existing = existingSubByParentAndTitle.get(key)
      if (existing) {
        subcategoryIdByTitle.set(rule.title, existing.id)
        continue
      }
      const created = await payload.create({
        collection: 'categories',
        data: { title: rule.title, parent: topCategory.id },
      })
      subcategoryIdByTitle.set(rule.title, created.id)
      createdCount++
    }

    const { docs: products } = await payload.find({
      collection: 'products',
      depth: 0,
      limit: 1000,
      where: { categories: { in: [topCategory.id] } },
    })

    for (const product of products) {
      const composition = (product.composition || '').toUpperCase()
      const brand = (product.title || '').toUpperCase()
      const matchedRule = rules.find((r) => r.test(composition, brand)) || rules[rules.length - 1]
      const subId = subcategoryIdByTitle.get(matchedRule.title)
      if (!subId) continue

      const existingIds = (product.categories ?? []).map((c: any) => (typeof c === 'object' ? c.id : c))
      if (existingIds.includes(subId)) continue

      await payload.update({
        collection: 'products',
        id: product.id,
        data: { categories: [...existingIds, subId] },
      })
      taggedCount++
    }

    console.log(`${categoryTitle}: ${subcategoryIdByTitle.size} subcategories, ${products.length} products scanned.`)
  }

  console.log(`\nDone. Created ${createdCount} subcategories, tagged ${taggedCount} products.`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
