import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { CarouselBlock } from '@/blocks/Carousel/Component'
import { CategoryShowcaseBlock } from '@/blocks/CategoryShowcase/Component'
import { TrustBarBlock } from '@/blocks/TrustBar/Component'
import { PromoTilesBlock } from '@/blocks/PromoTiles/Component'
import { HealthHighlightsBlock } from '@/blocks/HealthHighlights/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ThreeItemGridBlock } from '@/blocks/ThreeItemGrid/Component'
import { FAQBlockComponent } from '@/blocks/FAQBlock/Component'
import { StatsBlockComponent } from '@/blocks/StatsBlock/Component'
import { ValueCardsBlockComponent } from '@/blocks/ValueCardsBlock/Component'
import { TimelineBlockComponent } from '@/blocks/TimelineBlock/Component'
import { ContactBlockComponent } from '@/blocks/ContactBlock/Component'
import { HeroBlockComponent } from '@/blocks/HeroBlock/Component'
import { WhyChooseUsBlockComponent } from '@/blocks/WhyChooseUsBlock/Component'
import { PromoBannerBlockComponent } from '@/blocks/PromoBannerBlock/Component'
import { HealthAndVisitBlockComponent } from '@/blocks/HealthAndVisitBlock/Component'
import { FeaturedRailBlockComponent } from '@/blocks/FeaturedRailBlock/Component'
import { PopularRangesBlockComponent } from '@/blocks/PopularRangesBlock/Component'
import { CallToOrderBlockComponent } from '@/blocks/CallToOrderBlock/Component'
import { toKebabCase } from '@/utilities/toKebabCase'
import React, { Fragment } from 'react'

import type { Page } from '../payload-types'

const blockComponents = {
  archive: ArchiveBlock,
  banner: BannerBlock,
  carousel: CarouselBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  threeItemGrid: ThreeItemGridBlock,
  categoryShowcase: CategoryShowcaseBlock,
  trustBar: TrustBarBlock,
  promoTiles: PromoTilesBlock,
  healthHighlights: HealthHighlightsBlock,
  faq: FAQBlockComponent,
  stats: StatsBlockComponent,
  valueCards: ValueCardsBlockComponent,
  timeline: TimelineBlockComponent,
  contactInfo: ContactBlockComponent,
  homeHero: HeroBlockComponent,
  whyChooseUs: WhyChooseUsBlockComponent,
  promoBanner: PromoBannerBlockComponent,
  healthAndVisit: HealthAndVisitBlockComponent,
  featuredRail: FeaturedRailBlockComponent,
  popularRanges: PopularRangesBlockComponent,
  callToOrder: CallToOrderBlockComponent,
}

// These blocks already manage their own vertical spacing (including full-bleed, pinned-scroll
// sections) — wrapping them in the default "my-16" spacer would add unwanted gaps and break
// full-bleed sections like the promo banner.
const SELF_SPACED_BLOCKS = new Set([
  'homeHero',
  'categoryShowcase',
  'whyChooseUs',
  'promoBanner',
  'healthAndVisit',
  'featuredRail',
  'popularRanges',
  'callToOrder',
])

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockName, blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              const isSelfSpaced = blockType && SELF_SPACED_BLOCKS.has(blockType)

              return (
                <div className={isSelfSpaced ? undefined : 'my-16'} key={index}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore - weird type mismatch here */}
                  <Block id={toKebabCase(blockName!)} {...block} />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
