/**
 * Backfills `description` (Lexical richText) on every product that doesn't have one — a short,
 * factual paragraph naming the active ingredient's known therapeutic class and general accepted
 * use, derived from the `composition` field already on each product. Deliberately avoids
 * benefit/efficacy claims or dosing instructions given Indian pharma advertising restrictions,
 * and always ends with an explicit disclaimer that this is AI-drafted informational copy pending
 * pharmacist review — see TASKS.md.
 *
 * Product images are NOT auto-seeded — the storefront falls back to a capsule icon placeholder
 * until an admin sets a real photo (gallery upload) or a URL (`imageUrl` field) per product in
 * the CMS. See `clear-product-images.ts` for the script that reset the field.
 */
import { config as loadEnv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(dirname, '../../.env') })

// Ordered substring -> [therapeutic class, general use] rules. First match wins.
const CLASS_RULES: Array<[RegExp, string, string]> = [
  [/DAPAGLIFLOZIN|EMPAGLIFLOZIN/, 'an SGLT2 inhibitor', 'the management of Type 2 diabetes'],
  [/VILDAGLIPTIN|SITAGLIPTIN|TENELIGLIPTIN|LINAGLIPTIN/, 'a DPP-4 inhibitor', 'the management of Type 2 diabetes'],
  [/GLIMEPIRIDE|GLIPIZIDE|GLICLAZIDE/, 'a sulfonylurea', 'the management of Type 2 diabetes'],
  [/METFORMIN/, 'a biguanide', 'the management of Type 2 diabetes'],
  [/INSULIN/, 'an insulin formulation', 'blood glucose management in diabetes'],
  [/TELMISARTAN|LOSARTAN|OLMESARTAN/, 'an angiotensin receptor blocker (ARB)', 'the management of high blood pressure'],
  [/ENALAPRIL|RAMIPRIL|LISINOPRIL/, 'an ACE inhibitor', 'the management of high blood pressure and heart failure'],
  [/AMLODIPINE|CILNIDIPINE/, 'a calcium channel blocker', 'the management of high blood pressure'],
  [/METOPROLOL|ATENOLOL|BISOPROLOL|NEBIVOLOL/, 'a beta-blocker', 'the management of high blood pressure and heart rhythm conditions'],
  [/ATORVASTATIN|ROSUVASTATIN|SIMVASTATIN/, 'a statin (lipid-lowering agent)', 'the management of high cholesterol'],
  [/CLOPIDOGREL|ASPIRIN|ECOSPRIN/, 'an antiplatelet agent', 'reducing the risk of blood clots'],
  [/OMEPRAZOLE|PANTOPRAZOLE|RABEPRAZOLE|ESOMEPRAZOLE/, 'a proton pump inhibitor (PPI)', 'the management of acidity and acid reflux'],
  [/RANITIDINE|FAMOTIDINE/, 'an H2-receptor antagonist', 'the management of acidity'],
  [/CETIRIZINE|LEVOCETIRIZINE|FEXOFENADINE|LORATADINE/, 'an antihistamine', 'relief from allergic symptoms'],
  [/MONTELUKAST/, 'a leukotriene receptor antagonist', 'the management of asthma and allergic rhinitis'],
  [/BUDESONIDE|FORMOTEROL|SALBUTAMOL|SALMETEROL/, 'a bronchodilator/inhaled corticosteroid', 'the management of asthma and respiratory conditions'],
  [/DICLOFENAC|IBUPROFEN|NAPROXEN|ACECLOFENAC|ETORICOXIB/, 'a non-steroidal anti-inflammatory drug (NSAID)', 'relief from pain and inflammation'],
  [/PARACETAMOL|ACETAMINOPHEN/, 'an analgesic and antipyretic', 'relief from pain and fever'],
  [/TRAMADOL/, 'an opioid analgesic', 'the management of moderate to severe pain'],
  [/PREGABALIN|GABAPENTIN/, 'a neuropathic pain agent', 'the management of nerve-related pain'],
  [/CIPROFLOXACIN|OFLOXACIN|LEVOFLOXACIN|MOXIFLOXACIN/, 'a fluoroquinolone antibiotic', 'the treatment of bacterial infections'],
  [/AMOXICILLIN|AMPICILLIN|CLOXACILLIN/, 'a penicillin-class antibiotic', 'the treatment of bacterial infections'],
  [/AZITHROMYCIN|CLARITHROMYCIN/, 'a macrolide antibiotic', 'the treatment of bacterial infections'],
  [/CEFIXIME|CEFPODOXIME|CEFUROXIME/, 'a cephalosporin antibiotic', 'the treatment of bacterial infections'],
  [/FLUCONAZOLE|ITRACONAZOLE|KETOCONAZOLE/, 'an antifungal agent', 'the treatment of fungal infections'],
  [/DYDROGESTERONE|PROGESTERONE/, 'a progestogen', 'gynecological hormonal support'],
  [/FERROUS|FOLIC ACID|IRON/, 'an iron and folic acid supplement', 'the management of iron-deficiency anemia'],
  [/CALCIUM|VITAMIN D3|CHOLECALCIFEROL/, 'a calcium and vitamin D supplement', 'bone health support'],
  [/MULTIVITAMIN|ZINC/, 'a multivitamin/mineral supplement', 'general nutritional support'],
  [/CARBOXYMETHYL.?CELLULOSE|GLYCERIN/, 'a lubricant eye drop', 'relief from dry-eye symptoms'],
  [/MOXIFLOXACIN.*EYE|EYE.*DROP/, 'an ophthalmic antibiotic', 'the treatment of eye infections'],
]

function describeComposition(composition: string): { className: string; use: string } {
  for (const [pattern, className, use] of CLASS_RULES) {
    if (pattern.test(composition)) return { className, use }
  }
  return {
    className: 'a pharmaceutical formulation',
    use: 'use as directed by your physician or pharmacist',
  }
}

function buildDescriptionRichText(composition: string) {
  const { className, use } = describeComposition(composition)
  const text = `Contains ${composition}, ${className} generally associated with ${use}. This is a general informational summary, not medical advice — pending pharmacist review before publishing live.`

  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

async function main() {
  const { getPayload } = await import('payload')
  const configPromise = (await import('@payload-config')).default
  const payload = await getPayload({ config: configPromise })

  const force = process.argv.includes('--force')

  let updated = 0
  let page = 1
  const limit = 50

  while (true) {
    const result = await payload.find({ collection: 'products', limit, page, depth: 0 })
    if (result.docs.length === 0) break

    for (const product of result.docs as any[]) {
      if ((force || !product.description) && product.composition) {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { description: buildDescriptionRichText(product.composition) as any },
        })
        updated += 1
      }
    }

    if (!result.hasNextPage) break
    page += 1
  }

  console.log(`Updated ${updated} products with descriptions.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
