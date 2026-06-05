import React, { useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { toPng } from 'html-to-image'
import './App.css'

const CATEGORY_CHIPS = ['World', 'Politics', 'Sports', 'Tech'] as const
type TagId = (typeof CATEGORY_CHIPS)[number]

type Story = {
  id: string
  title: string
  dek: string
  image: string
  tag: TagId
  readTime: string
  publisher?: string
  date?: string
  time?: string
}

function TagIcon({ tag }: { tag: TagId }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24' as const, 'aria-hidden': true as const }
  switch (tag) {
    case 'World':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.25" />
          <ellipse cx="12" cy="12" rx="3.5" ry="9.25" />
          <path d="M3 12h18" />
          <path d="M5.5 8c2 1 4.5 1.5 6.5 0s4.5-1 6.5 0" opacity="0.9" />
          <path d="M5.5 16c2-1 4.5-1.5 6.5 0s4.5 1 6.5 0" opacity="0.9" />
          <path d="M18 7l2-1.5M17 17l2.5 1" strokeWidth="1.5" />
        </svg>
      )
    case 'Politics':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l-1.5 3h3L12 3z" />
          <path d="M6 21V9h2v12M16 21V9h2v12M11 21v-5h2v5" />
          <path d="M4 9h16M4 9l2-3h12l2 3" />
          <path d="M8 13h2M14 13h2M8 17h2M14 17h2" strokeWidth="1.5" />
        </svg>
      )
    case 'Sports':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 4h6l1 3H8l1-3z" />
          <path d="M8 7h8v2a4 3 0 0 1-8 0V7z" />
          <path d="M10 9v8M14 9v8" />
          <path d="M7 17h10v1H7zM9 21h6v-3H9z" />
          <path d="M11 12h2" strokeWidth="1.5" />
        </svg>
      )
    case 'Tech':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="12" rx="1.5" />
          <path d="M2 19h20" strokeWidth="2" />
          <path d="M8 9h8v5H8z" strokeWidth="1.5" />
          <circle cx="10" cy="11.5" r="0.85" fill="currentColor" strokeWidth={0} />
          <path d="M12.5 11.5h3.5M8 21l8-2" strokeWidth="1.5" opacity="0.85" />
        </svg>
      )
  }
}

function ArticleTag({ tag }: { tag: TagId }) {
  return (
    <span className={`article-tag article-tag--${tag.toLowerCase()}`}>
      <span className="article-tag__icon" aria-hidden>
        <TagIcon tag={tag} />
      </span>
      <span className="article-tag__label">{tag}</span>
    </span>
  )
}

const READ_WORD_MS = 420
const HERO_AUTO_ADVANCE_MS = 8000

type ShortSegment = {
  headline: string
  text: string
  /** Per-reel art (falls back to story hero if omitted) */
  image?: string
}

type ArticleExtra = { body: string; paragraphs?: string[]; shorts: ShortSegment[] }

const STORY_CONTENT: Record<string, ArticleExtra> = {
  '1': {
    body: `As northern sea ice retreats, carriers are testing routes that shave days off Suez-bound voyages. Insurers and port authorities remain cautious, but early adopters report measurable fuel savings. Analysts expect incremental adoption rather than an overnight shift. Environmental groups want stricter spill and emissions rules before traffic grows.`,
    paragraphs: [
      `For the first time in recorded history, bulk carriers and container ships are regularly completing full transits of the Northern Sea Route in a single season without icebreaker escorts. The 2024 navigation window extended three weeks longer than the previous decade's average, a milestone that shipping analysts say marks a structural shift rather than an anomaly.`,
      `The commercial appeal is straightforward: voyages from Yokohama to Rotterdam via the Arctic shave roughly 7,000 nautical miles compared with the Suez Canal route. At current bunker prices, that translates to fuel savings of $800,000 to $1.2 million per round trip for a large container vessel, according to filings reviewed by industry consultants.`,
      `Early adopters are mostly dry-bulk operators moving iron ore and coal from Russian ports, along with a handful of European container lines testing the lane with older vessels they are willing to risk in marginal ice conditions. The handful of LNG tankers using the route benefit from their own cargo insulating the hull against cold.`,
      `Insurers are pricing the additional risk carefully. London underwriters say pilotage and salvage premiums add back roughly 40 percent of the fuel savings on a typical voyage, narrowing but not erasing the economic advantage. Policies routinely exclude incidents on unlicensed segments, forcing operators to hire Russian state icebreaker escorts even when ice coverage is technically manageable.`,
      `Port infrastructure remains the most obvious bottleneck. The handful of Arctic hub ports — Sabetta, Tiksi, Pevek — were built to handle LNG and resource exports, not general cargo. Container cranes, cold-storage warehousing, and reliable communications are either absent or years from completion. Analysts estimate full build-out of three viable transshipment hubs would cost north of $14 billion.`,
      `Environmental regulators are watching with growing unease. The International Maritime Organization is drafting new corridor standards covering emissions caps, spill response placement, and mandatory traffic separation schemes. Critics argue that the current 12-month environmental review cycle cannot keep pace with traffic projections that have been revised upward every year since 2019.`,
      `Geopolitics adds a layer of complexity that no shipping model fully captures. Russia controls the longest stretch of the route and charges transit fees that have risen 18 percent in two years. Western sanctions on Russian flag vessels have pushed some operators to reflag through third countries, creating paper trails that compliance teams at major shippers are only beginning to untangle.`,
      `Indigenous communities along the Siberian coast are pressing for binding consultation rights before traffic scales. Representatives from the Nenets and Chukchi regions told an IMO working group that increased vessel noise and the risk of oil contamination threaten subsistence fishing grounds that have no equivalent backup in those latitudes.`,
      `On the technology side, satellite coverage has improved dramatically. A new constellation of low-earth-orbit communications satellites now provides near-continuous broadband across most of the route, enabling real-time ice-chart updates and AIS tracking that were impossible five years ago. Several operators are tripling their ice-routing algorithm refresh rates as a result.`,
      `The competitive picture is nuanced. The Suez Canal Authority has already begun lobbying flag states and industry groups with revised toll structures, and Panama is studying Arctic-proofed container designs as a contingency. Neither is conceding the future, and analysts expect the next decade to produce a bifurcated market in which seasonal Arctic cargo complements rather than replaces the established southern lanes.`,
      `What seems clear is that the window for setting enforceable standards before meaningful traffic arrives is closing faster than most regulators anticipated. The IMO's next plenary session in the autumn is expected to be the most contentious in the organization's history, with the Arctic routing agenda likely to dominate the working-group schedule.`,
    ],
    shorts: [
      {
        headline: 'Shorter runs, same cargo',
        text: 'New Arctic corridors are shaving four to nine days off some Asia–Europe voyages versus Suez, according to early carrier filings.',
        image: 'https://picsum.photos/seed/nm-arctic-1/800/450',
      },
      {
        headline: 'Fuel math is improving',
        text: 'Operators logging northern legs report measurable bunker savings on long hauls, though ice-class hulls and escort fees still bite.',
        image: 'https://picsum.photos/seed/nm-arctic-2/800/450',
      },
      {
        headline: 'Insurers stay cautious',
        text: 'Underwriters are pricing pilotage and salvage risk higher than on traditional lanes; many policies still exclude experimental routes.',
        image: 'https://picsum.photos/seed/nm-arctic-3/800/450',
      },
      {
        headline: 'Ports test the water',
        text: 'Arctic hub ports are upgrading tugs and charts, but full-season throughput targets remain years out.',
        image: 'https://picsum.photos/seed/nm-arctic-4/800/450',
      },
      {
        headline: 'Rules before a rush',
        text: 'Regulators are drafting corridor standards on emissions, spill response, and traffic separation before traffic scales up.',
        image: 'https://picsum.photos/seed/nm-arctic-5/800/450',
      },
    ],
  },
  '2': {
    body: `Utility-scale storage crossed a tipping point in a dozen markets last quarter. Developers say lithium and iron-based packs now beat peaker gas on levelized cost when paired with renewables. Grid operators are quietly expanding procurements beyond earlier forecasts. Interconnection queues remain the main bottleneck.`,
    paragraphs: [
      `Battery storage crossed an economic threshold that analysts had been forecasting for years but few expected to arrive this quickly. In at least twelve regional electricity markets, the levelized cost of a grid-scale lithium-iron-phosphate pack paired with a co-located wind or solar project now undercuts the equivalent peaker gas plant on every metric that procurement teams track.`,
      `The shift is most pronounced in markets where natural gas prices remain elevated following supply disruptions and where grid operators face retirement deadlines on aging coal and gas-fired peakers. Utilities in those regions have quietly accelerated procurement rounds, with several awarding contracts 30 to 50 percent above initial capacity targets after bids came in below reserve prices.`,
      `Lithium-iron-phosphate chemistry dominates new builds, but the technology mix is widening. Iron-air batteries — which store energy through a rust-and-unrust reaction — are winning a handful of long-duration slots where eight-hour or longer discharge cycles matter more than energy density. Flow battery pilots are attracting interest from industrial campuses and hospitals that need continuous backup power.`,
      `Interconnection queues remain the principal drag on deployment. Project developers routinely cite two- to four-year wait times for grid studies and upgrade approvals as the single biggest obstacle to accelerating their pipelines. Several US regional transmission organizations have proposed reforms to allow co-located storage to inherit the queue position of an already-approved renewable project, a change that could unlock hundreds of gigawatts of capacity.`,
      `The cost curve for battery packs has continued its downward trajectory even as some commodity prices fluctuated. Analysts attribute the sustained decline to manufacturing scale in China and South Korea, improved cell chemistry that requires less cobalt, and increasingly competitive module-level electronics. The leading integrated manufacturers have guided to further cost reductions through the end of the decade.`,
      `Grid operators are adjusting their planning models in real time. Several are running pilots that dispatch batteries not just for energy arbitrage but for frequency regulation, voltage support, and black-start capability — services traditionally reserved for thermal generation. Early results suggest storage can provide all three with response times measured in milliseconds rather than minutes.`,
      `The investment community has taken notice. Infrastructure funds that previously focused on gas pipeline and midstream assets are establishing dedicated storage verticals, and several major pension funds have committed to direct equity in utility-scale projects. Sponsor returns on contracted storage assets are now comparable to those on regulated transmission, which appeals to long-duration capital.`,
      `Supply-chain concentration presents a risk that procurement teams are beginning to price. The vast majority of battery cells are manufactured in a small number of Asian facilities, and the minerals required — lithium, nickel, manganese — are sourced from an even more concentrated set of countries. Western governments are funding domestic refining capacity, but most analysts expect the dependency to persist for at least another decade.`,
      `Fire safety has emerged as a non-trivial concern. Several high-profile thermal runaway events at co-located storage sites over the past two years have led insurers to tighten underwriting standards and require more sophisticated suppression systems. Developers say the added cost is manageable but must be factored into project economics from the outset rather than retrofitted.`,
      `The regulatory framework is evolving more slowly than the technology. Rate structures in most jurisdictions were designed for a grid where generation flows one way and storage was largely theoretical. Updating those structures to properly compensate storage for the full stack of services it can provide is a multi-year process that involves state utility commissions, federal agencies, and sometimes legislative action.`,
      `Looking ahead, analysts expect procurement volumes to remain elevated through the end of the decade as utilities lock in capacity ahead of major renewable build-outs. The question is no longer whether storage will play a central role in the grid's future — it is whether the interconnection and permitting infrastructure can expand fast enough to absorb the capital that is already committed.`,
    ],
    shorts: [
      {
        headline: 'Twelve markets flip the math',
        text: 'Battery projects in a dozen regions now undercut gas peakers on all-in cost when paired with wind or solar, analysts say.',
        image: 'https://picsum.photos/seed/nm-grid-1/800/450',
      },
      {
        headline: 'Utilities go bigger than forecasts',
        text: 'Procurement rounds this year are landing above what most Wall Street models assumed—often by double-digit percentages.',
        image: 'https://picsum.photos/seed/nm-grid-2/800/450',
      },
      {
        headline: 'Tech mix is widening',
        text: 'Lithium dominates, but iron-air and flow pilots are winning slots where duration and safety matter more than energy density.',
        image: 'https://picsum.photos/seed/nm-grid-3/800/450',
      },
      {
        headline: 'The queue is the bottleneck',
        text: 'Interconnection studies and upgrade timelines—not cell prices—are what developers cite as the top delay.',
        image: 'https://picsum.photos/seed/nm-grid-4/800/450',
      },
      {
        headline: 'What operators watch next',
        text: 'Grid operators are modeling four-hour dispatch patterns and winter peaks before signing the next wave of long-duration deals.',
        image: 'https://picsum.photos/seed/nm-grid-5/800/450',
      },
      {
        headline: 'Investor takeaway',
        text: 'Analysts expect storage capex to stay elevated through next year as utilities lock in capacity ahead of renewable build-outs.',
        image: 'https://picsum.photos/seed/nm-grid-6/800/450',
      },
    ],
  },
  '3': {
    body: `Lawmakers advanced a draft that would harmonize cross-border data flows for publishers and platforms. Lobbyists on both sides say the text leaves key definitions for a second reading. Smaller outlets worry about compliance costs; large platforms focus on liability carve-outs. A final vote is weeks away at best.`,
    paragraphs: [
      `A parliamentary committee cleared a long-anticipated draft framework for cross-border data flows in the media sector, advancing legislation that would set new rules for how news content, audience data, and advertising signals can move between jurisdictions. The vote was closer than proponents had hoped, reflecting deep divisions that will need to be resolved before a full floor vote.`,
      `At the heart of the bill is an attempt to create a single digital trading zone for licensed publishers and accredited news aggregators. Under the current regime, a publisher in one country distributing content to an audience in another faces a patchwork of consent requirements, data-residency rules, and revenue-sharing obligations that can differ dramatically across borders.`,
      `Large platforms have focused their lobbying energy on the liability carve-out provisions. Their position is that hosting or summarizing third-party news content should not create secondary copyright or defamation exposure, a stance that smaller publishers strenuously oppose. The current draft language on this point is considered a placeholder pending the second reading.`,
      `Regional and local outlets are sounding alarms about compliance costs. Trade groups representing community newspapers and online-only local news operations calculate that implementing the required consent infrastructure and data mapping could cost a typical operation between 60,000 and 100,000 euros annually — a sum that could eliminate the newsroom margin entirely for many outlets.`,
      `The bill includes a public-interest carve-out that would exempt non-commercial publishers and academic journalism from some requirements, but the definition of "public interest" has not been finalized. At least three member states have submitted conflicting interpretations, and legal analysts say the ambiguity will generate years of litigation if not resolved in the text itself.`,
      `For advertising technology companies, the legislation creates a new compliance layer on top of existing privacy rules. The draft requires that any profiling signal derived from news content consumption be tagged with a "journalism-origin" flag that downstream systems must honor. Ad-tech trade groups argue this is technically difficult to implement across the multi-hop auction chains that serve most programmatic ads today.`,
      `The transatlantic dimension complicates the picture further. US-based platforms operating in the affected jurisdictions would need to comply with the framework for their European and UK traffic, adding to an already complex matrix of obligations under GDPR, the Digital Markets Act, and new AI transparency rules. Several US trade officials have signaled concern about market-access implications.`,
      `Broadcasters occupy an unusual position in the debate. Public broadcasters tend to support the framework because it could strengthen their licensing revenue; commercial broadcasters are more divided, with those that have significant digital operations worried about being regulated differently from their streaming counterparts.`,
      `The committee chair acknowledged in remarks following the vote that the current text contains internal tensions that will require careful drafting work before the second reading. Observers expect intensive backroom negotiations over the summer break, with the major platforms and publisher coalitions each pressing for language that shifts the compliance burden toward the other side.`,
      `Enforcement has received less attention than definitions, but it may prove equally contentious. The proposed framework assigns oversight to national media regulators rather than to a single supranational body, which critics argue will lead to inconsistent application and regulatory arbitrage. Several digital rights organizations are pushing for a coordinated enforcement mechanism with binding cross-border effect.`,
      `A final vote is not expected before the autumn session at the earliest. Whichever version passes, legal challenges are virtually guaranteed, and analysts expect the full framework to spend at least two years in courts before its provisions are considered settled. In the meantime, most publishers and platforms say they will continue operating under existing bilateral agreements and industry codes.`,
    ],
    shorts: [
      {
        headline: 'Cross-border rules take shape',
        text: 'The draft spells out how publisher and platform data can move between jurisdictions—with carve-outs still under negotiation.',
        image: 'https://picsum.photos/seed/nm-data-1/800/450',
      },
      {
        headline: 'Publishers want clarity',
        text: 'News trade groups are pushing for explicit consent and syndication paths so small outlets are not locked out of EU–UK deals.',
        image: 'https://picsum.photos/seed/nm-data-2/800/450',
      },
      {
        headline: 'Platforms want safe harbors',
        text: 'Tech coalitions are focused on liability limits when content is mirrored or summarized across borders.',
        image: 'https://picsum.photos/seed/nm-data-3/800/450',
      },
      {
        headline: 'Smallest rooms feel the cost',
        text: 'Regional publishers say compliance tooling could eat a full reporter salary if definitions stay broad.',
        image: 'https://picsum.photos/seed/nm-data-4/800/450',
      },
      {
        headline: 'Second reading looms',
        text: 'Key definitions—what counts as “public interest” reuse—are slated for amendment before a final vote.',
        image: 'https://picsum.photos/seed/nm-data-5/800/450',
      },
    ],
  },
  '4': {
    body: `The underdogs forced overtime with a late surge that flipped momentum in the fourth. Starters logged heavy minutes as the bench tightened the rotation. The result sets up a decisive weekend for playoff seeding. Fans emptied the arena long after the final buzzer.`,
    paragraphs: [
      `When the scoreboard showed a seven-point deficit with two minutes left in regulation, most of the crowd had already begun mentally composing their commute home. What followed was one of the most compressed momentum swings of the season: a 12-2 run built on three forced turnovers, two fast-break layups, and a step-back three that rattled the rim for a full second before dropping through the net.`,
      `The overtime period was almost anticlimactic by comparison. The underdogs had broken the opposition's composure in those frantic closing minutes, and the extra frame played out with the calm efficiency of a team that had just rediscovered its identity. The final margin — a six-point cushion — did not capture how thoroughly they had seized control.`,
      `The head coach made a consequential decision midway through the fourth quarter, shortening the rotation to eight players and asking the top two starters to shoulder workloads that climbed past 41 minutes each. Both logged the heaviest minutes they have seen in six weeks, a choice that carries injury-management implications the team's medical staff will be monitoring carefully through the weekend.`,
      `The bench contribution that mattered most was defensive, not offensive. Five steals in the fourth quarter — three in a four-possession stretch that directly precipitated the comeback — came from reserves who were asked to pick up full-court pressure assignments they had barely run in practice. The gamble worked, though opponents will have film on those tendencies by Sunday.`,
      `The box score obscures one subnarrative worth noting. The point guard who had been struggling to find rhythm after returning from a minor ankle sprain played with the controlled aggression that coaches have been coaxing out of him for weeks. His court vision in the overtime period, particularly a no-look pass that led to a wide-open corner three, drew a standing ovation from sections that had been largely silent for the first three quarters.`,
      `At the other end, the opposition will be asking hard questions about their fourth-quarter execution. They had multiple opportunities to put the game out of reach and converted none of them, settling for contested mid-range shots when ball movement could have generated cleaner looks. Their head coach was measured in post-game remarks but did not shy away from describing the collapse as a self-inflicted wound.`,
      `The playoff seeding implications are real. The win moves the underdogs within a single game of the six-seed with two matches remaining on the regular-season schedule. A head-to-head tiebreaker they currently hold means Sunday's opponent needs to win to keep its own seeding position intact. The scenario is the kind that neutral observers find irresistible.`,
      `Fan energy was a notable factor throughout the second half. The arena, which had been conspicuously quiet for stretches of a listless first half, found its voice after a flagrant foul call that turned three points into a momentum shift. From that moment, the decibel levels were measurable on the broadcast audio. Several players credited the crowd in post-game interviews with an unselfconsciousness that suggested they meant it.`,
      `The medical staff's game report, which the team will release in summary form on Friday, will be closely read. Two rotation players logged minutes despite being listed as questionable before tip-off. Neither showed visible signs of discomfort during the game, but load management protocols this late in the season are interpreted conservatively, and both are expected to be held out of the Saturday shootaround.`,
      `What the result confirms is that this team has the capacity for the kind of burst that wins short playoff series. The question that the regular season has never fully answered is whether they can sustain that level for four-game stretches. A deep run would require answers to that question, and Sunday's match — regardless of seeding — will serve as something close to an audition.`,
    ],
    shorts: [
      {
        headline: 'OT for the underdogs',
        text: 'A 12–2 run in the final two minutes of regulation erased a seven-point deficit and forced the extra frame.',
        image: 'https://picsum.photos/seed/nm-sport-1/800/450',
      },
      {
        headline: 'Stars played heavy minutes',
        text: 'The top two starters each cleared 41 minutes as the coach shortened the bench to eight bodies.',
        image: 'https://picsum.photos/seed/nm-sport-2/800/450',
      },
      {
        headline: 'Bench tightened the defense',
        text: 'Substitutes combined for five steals in the fourth, flipping momentum when the offense stalled.',
        image: 'https://picsum.photos/seed/nm-sport-3/800/450',
      },
      {
        headline: 'Seeding still wide open',
        text: 'The win moves them within a game of the six-seed with two left on the schedule.',
        image: 'https://picsum.photos/seed/nm-sport-4/800/450',
      },
      {
        headline: 'Weekend decides it',
        text: 'Head-to-head tiebreakers mean Sunday’s matchup could clinch or kill their playoff odds.',
        image: 'https://picsum.photos/seed/nm-sport-5/800/450',
      },
    ],
  },
  '5': {
    body: `Five cities piloted car-free Sundays and shared early retail and transit data. Shop owners on main corridors saw mixed results; transit agencies reported smoother headways. Survey responses skewed positive among residents who tried the program. Officials will decide on expansion after the summer trial.`,
    paragraphs: [
      `Five mid-sized cities on three continents coordinated their car-free Sunday pilots this spring so that planners could compare data across contexts. The shared methodology — identical survey instruments, matched retail monitoring zones, and coordinated transit data exports — was itself an experiment in whether urban transportation research can be standardized across different governance systems.`,
      `The retail picture was more nuanced than either advocates or skeptics had predicted. Cafés, bakeries, and specialty food shops on pedestrianized blocks universally reported double-digit increases in foot traffic and modest revenue gains on pilot days. Hardware stores, furniture retailers, and any business whose customers routinely arrive by car showed the opposite pattern, with some reporting afternoon revenue drops severe enough to require staff reductions.`,
      `Transit performance improved in ways that the agencies had not fully anticipated. Removing private vehicles from designated corridors not only cleared the obvious congestion but also reduced the frequency of illegal parking in bus stops and bike lanes — a chronic problem that had been adding two to four minutes of unscheduled delay per hour of service on several routes. Headway adherence improved across all five cities, with two reporting their most reliable Sunday service on record.`,
      `The cycling and pedestrian usage data were striking. In three of the five cities, the number of people traveling through the pilot zones on foot or by bicycle on car-free Sundays was two to three times the equivalent figure on regular Sundays. Transport researchers say this suggests significant suppressed demand — people who want to use active modes but are discouraged by traffic volumes and a perceived lack of safety.`,
      `Not all residents experienced the change positively. A consistent finding across the survey data was a generational divide: respondents under 35 rated the pilot significantly more favorably than those over 55. Older residents, particularly those with mobility challenges who rely on personal vehicles because public transit access in their neighborhoods is limited, were more likely to describe the restrictions as exclusionary.`,
      `Business improvement districts played a complicated role. In two cities, the districts had lobbied hard for the pilot, organized pop-up markets, and arranged street performers; in those cities, the commercial results were markedly stronger than in the cities where the program was implemented without supplementary programming. Planners are drawing the obvious conclusion about how context shapes outcomes.`,
      `The air quality data will take longer to analyze fully, but preliminary readings from fixed monitoring stations showed meaningful reductions in nitrogen dioxide and particulate matter during pilot hours. In one city, the closest monitoring station to the main pedestrianized corridor recorded its lowest Sunday afternoon NO2 reading in the dataset's history.`,
      `Noise levels dropped as well, though the measurement is complicated by the fact that some pilot zones included outdoor concert stages. In the quieter residential sections adjacent to commercial corridors, ambient noise fell to levels associated with parks and green spaces, which residents in post-program focus groups described as startling and pleasant in equal measure.`,
      `The enforcement picture was more complex than organizers had advertised. All five cities relied on a combination of physical barriers and volunteer marshals rather than police enforcement, and all five reported incidents of drivers circumventing restrictions at certain intersections. The rate of non-compliance declined over successive pilots as residents and drivers became familiar with the routes, but zero incidents was never achieved.`,
      `City councils are expected to vote on expansion by September. The political calculus differs by city: in the two with strong cycling advocacy communities, expansion is nearly certain; in the two where car-ownership rates are highest and public transit is thinnest, the vote is genuinely uncertain. The fifth city has proposed a longer evaluation period, frustrating advocates who want faster action.`,
      `The consortium of participating cities plans to publish a joint technical report in late summer, with anonymized data sets made available for independent research. Transport scholars say the coordinated methodology, whatever its limitations, represents the most rigorous cross-city study of pedestrianization to date, and several universities have already applied for access to run secondary analyses.`,
    ],
    shorts: [
      {
        headline: 'Five cities, one experiment',
        text: 'Car-free Sundays ran monthly on paired corridors so planners could compare foot traffic and retail receipts.',
        image: 'https://picsum.photos/seed/nm-carfree-1/800/450',
      },
      {
        headline: 'Retail split by street',
        text: 'Cafés and grocers on pedestrianized blocks saw lifts; auto-dependent shops on the fringe reported softer afternoons.',
        image: 'https://picsum.photos/seed/nm-carfree-2/800/450',
      },
      {
        headline: 'Transit ran smoother',
        text: 'Buses and trams gained more reliable headways where curb lanes were cleared of parked traffic.',
        image: 'https://picsum.photos/seed/nm-carfree-3/800/450',
      },
      {
        headline: 'Residents who tried it, liked it',
        text: 'Survey respondents who walked or biked the route rated the program highly; occasional drivers were split.',
        image: 'https://picsum.photos/seed/nm-carfree-4/800/450',
      },
      {
        headline: 'Expansion after summer',
        text: 'City councils will vote in September on whether to widen the zones or add evening pilots.',
        image: 'https://picsum.photos/seed/nm-carfree-5/800/450',
      },
    ],
  },
  '6': {
    body: `Open-weight coding models narrowed the gap on common benchmarks as teams adopted smaller local stacks. Engineers report faster code review cycles when pairing with on-device assistants. Enterprise buyers still want clearer licensing and security guarantees. The next release cycle could widen adoption further.`,
    paragraphs: [
      `The gap between open-weight coding models and the closed commercial APIs that have dominated enterprise adoption for the past two years narrowed sharply in the latest round of benchmark evaluations. On three widely tracked leaderboards covering code completion, bug localization, and test generation, the leading open models now sit within a few percentage points of the frontier closed offerings.`,
      `The improvement comes from a combination of factors that researchers describe as compounding rather than singular. Fine-tuning on curated code corpora, improved instruction-following from reinforcement learning with human feedback, and better handling of long context windows — a perennial weakness of smaller architectures — have each contributed measurable gains in the past two release cycles.`,
      `Engineering teams at companies that have deployed local stacks report that the subjective quality of completions has improved even more than the benchmarks suggest. Several described a qualitative shift in which the model began to internalize the idioms and conventions of their specific codebase, not just generic programming patterns. That kind of contextual adaptation is difficult to capture in standardized evaluations.`,
      `Code review cycle times have emerged as the headline productivity metric. Teams using on-device assistants for first-pass review report that the time from pull request creation to first substantive comment has dropped by 25 to 40 percent in self-reported surveys. The reduction comes partly from speed and partly from a shift in how senior engineers allocate their attention — they spend less time on mechanical issues and more on architecture and logic.`,
      `Quantization has been the key enabler of the on-device movement. Models that would have required a high-end workstation server two years ago now run on a standard developer laptop after 4-bit or 8-bit quantization with minimal perceptible quality loss. Several teams have moved entirely to laptop inference for review assistance, eliminating the latency and the compliance exposure that comes with sending code to an external API.`,
      `Enterprise buyers remain the most cautious segment of the market. Legal and security teams at large organizations are asking for clearer answers to questions that the open-source community has not yet standardized: what was in the training data, are there indemnity protections against generated code that replicates copyrighted patterns, and what audit trails exist for code suggestions that end up in production. Without satisfactory answers, many enterprises are running internal pilots rather than org-wide deployments.`,
      `The licensing landscape for open-weight models is genuinely complicated. Several popular models carry licenses that restrict commercial use above certain revenue thresholds or prohibit specific categories of application. Legal teams at midsize technology companies report spending meaningful time parsing license terms and tracking version-specific conditions, an overhead that commercial APIs avoid by design.`,
      `Security reviews are taking longer than technical pilots. The standard enterprise vendor questionnaire on training data provenance, data residency, and model update governance takes an average of eight to twelve weeks to complete for a novel AI vendor, according to procurement consultants. By the time the paperwork closes, the model version being evaluated is often superseded by a newer release.`,
      `The competitive response from closed-API providers has been to accelerate their own releases and introduce tiered pricing that makes their smaller models competitive with the cost of self-hosting open alternatives. Several have also published detailed technical and legal documentation specifically designed to answer the questions that enterprise security teams ask most frequently.`,
      `Developer communities have responded to the progress with enthusiasm that sometimes outpaces practical application. The open ecosystem has produced a proliferation of fine-tunes, adapters, and specialized variants that makes evaluating options genuinely time-consuming. Several engineering managers described a side effect of abundance: junior engineers spending more time benchmarking models than building products.`,
      `The next major release cycle from two of the largest open-model maintainers is expected before the end of the third quarter. Hints in changelogs and public roadmaps suggest improvements to tool-use reliability — the ability to reliably call external functions rather than merely describe them — which is considered the last major barrier before broader internal adoption at companies with complex developer toolchains.`,
    ],
    shorts: [
      {
        headline: 'Benchmarks tighten',
        text: 'Open-weight models cut the gap to closed APIs on several coding leaderboards after the latest fine-tunes.',
        image: 'https://picsum.photos/seed/nm-ai-1/800/450',
      },
      {
        headline: 'Smaller stacks in production',
        text: 'Teams are shipping quantized models on laptops for review assist, keeping code off shared SaaS where policy requires it.',
        image: 'https://picsum.photos/seed/nm-ai-2/800/450',
      },
      {
        headline: 'Reviews get faster',
        text: 'Engineers report shorter turnaround on diffs when the assistant runs locally beside the IDE.',
        image: 'https://picsum.photos/seed/nm-ai-3/800/450',
      },
      {
        headline: 'Legal still wants paper',
        text: 'Enterprise buyers are asking for clearer indemnity and audit trails before greenlighting org-wide rollouts.',
        image: 'https://picsum.photos/seed/nm-ai-4/800/450',
      },
      {
        headline: 'Security reviews lag',
        text: 'Vendor questionnaires on training data provenance are taking longer than the technical pilots themselves.',
        image: 'https://picsum.photos/seed/nm-ai-5/800/450',
      },
      {
        headline: 'Next release cycle',
        text: 'Maintainers hint at better tool-use reliability in Q3—often the last blocker before broader internal adoption.',
        image: 'https://picsum.photos/seed/nm-ai-6/800/450',
      },
    ],
  },
  f1: {
    body: `Markets are pricing divergent guidance from major central banks as traders weigh sticky services inflation against slowing goods data. Currency desks report elevated volatility around macro prints. Credit spreads have tightened modestly on investment-grade names.`,
    paragraphs: [
      `Traders are navigating one of the most complex macro environments in several years as central banks in the major economies issue guidance that is not just different in degree but different in direction. The Federal Reserve, European Central Bank, and Bank of England are each responding to domestic inflation and labor market data that, while originating in the same global supply-shock cycle, have resolved at different speeds.`,
      `Services inflation has proven stickier than the headline CPI trajectory suggested. In the economies where goods disinflation has proceeded furthest, services prices — driven by wages, rents, and the cost of insured activities — have continued to run well above pre-pandemic averages. Strategists at several major banks have revised their rate-cut timing forecasts backward for a second consecutive quarter.`,
      `Currency markets have responded with the kind of realized volatility that options desks had been pricing in for months but had not seen materialize. Major pairs moved two to three standard deviations on recent CPI print days, with particularly sharp moves in yen crosses and in currencies most exposed to commodity prices and global growth expectations.`,
      `The bond market's term premium has become the variable that professional investors are most focused on. After years near zero, the compensation that investors demand for holding long-dated government bonds rather than rolling short-term paper has been drifting upward, and some strategists believe a structural repricing is underway rather than a cyclical fluctuation.`,
      `Credit markets have been surprisingly resilient given the rates backdrop. Investment-grade spreads have drifted a few basis points tighter over the past month as new issuance stayed light — a pattern that technical analysts attribute to supply-demand dynamics rather than any fundamental reassessment of corporate credit quality.`,
      `High-yield is more nuanced. The headline index is flat, but dispersion between sectors is at multi-year highs. Companies in sectors where revenue is sensitive to consumer discretionary spending are trading wider, while issuers with locked-in long-term contracts or regulated utility-like cash flows have seen spreads compress to historically tight levels.`,
      `Equity markets have adapted to the rates environment in ways that reflect a maturation of the post-pandemic narrative. The rate-sensitive growth sector has de-rated substantially, and the multiple-expansion trade that characterized 2020-2021 has largely reversed. What remains is a market that professional investors describe as valuation-rational in some pockets and still stretched in others.`,
      `The labor market data that central banks are most focused on is not the top-line unemployment number but rather the measures of wage growth and hours worked in the services sectors that drive sticky inflation. Those figures have decelerated but not to levels that make policy-setters confident about declaring victory.`,
      `Commodity markets are pricing a divergent set of growth expectations. Energy markets reflect concerns about demand from major industrial economies slowing; agricultural commodities are tightening on weather-related supply concerns; and industrial metals are caught between weak manufacturing demand in developed markets and steady infrastructure-driven demand in emerging economies.`,
      `What to watch in the coming weeks: the next coordinated set of central bank meeting minutes, which may provide more granular insight into the internal debates around timing; labor market prints in the US and eurozone; and the auction calendar for long-dated government debt, where a soft reception would reinforce the term-premium repricing narrative that several strategists are building their current positioning around.`,
    ],
    shorts: [
      {
        headline: 'Mixed signals from banks',
        text: 'Traders are parsing conflicting hints on how long rates stay elevated as goods inflation cools but services stay warm.',
        image: 'https://picsum.photos/seed/nm-f1-a/800/450',
      },
      {
        headline: 'FX volatility spikes',
        text: 'Major pairs swung on surprise CPI revisions—options desks say one-week implied vol is up sharply.',
        image: 'https://picsum.photos/seed/nm-f1-b/800/450',
      },
      {
        headline: 'Credit still calm',
        text: 'Investment-grade spreads tightened a few basis points; high yield is flat as issuance stays light.',
        image: 'https://picsum.photos/seed/nm-f1-c/800/450',
      },
      {
        headline: 'What to watch',
        text: 'Labor market prints and term-premium moves are the focus before the next policy windows.',
        image: 'https://picsum.photos/seed/nm-f1-d/800/450',
      },
    ],
  },
  f2: {
    body: `A climate resilience fund allocated its first tranche to coastal storm-surge and microgrid projects. Grant rules favor cities with updated vulnerability maps. Auditors will review outcomes annually.`,
    paragraphs: [
      `A major climate resilience fund committed its first tranche of grants this month, directing capital to a portfolio of coastal storm-surge infrastructure, microgrid installations, and community cooling center upgrades. The initial allocation of $2.4 billion covers 47 projects across 23 countries, with a deliberate concentration in lower-middle-income cities that face high physical risk but have limited access to conventional infrastructure financing.`,
      `The grant selection process placed unusual weight on the quality of applicants' climate vulnerability assessments. Cities that had invested in updated flood-inundation modeling, heat-island mapping, and infrastructure-criticality analysis moved to the front of the queue even when their project proposals were otherwise comparable to those from cities with older or less detailed assessments. Fund managers say the approach creates incentives for better planning data.`,
      `Coastal storm-surge projects dominate the initial portfolio by dollar value. The largest single grant — $340 million to a delta city that faces compound risk from sea-level rise and intensifying cyclone seasons — will fund a combination of engineered barriers, mangrove restoration, and early-warning system upgrades. Engineers on the project say the blended approach provides more resilience per dollar than a pure grey-infrastructure solution.`,
      `Microgrid installations are the second-largest category. The projects funded range from hospital campus islanding systems in sub-Saharan Africa to multi-building community energy hubs in island territories. Several pair storage with solar generation in configurations that can serve as emergency shelters during grid outages. Fund managers say the microgrid portfolio will be the most closely watched, because the operational models are newer and the performance data is thinner.`,
      `The grant rules include an equity weighting that gives additional points to projects serving communities with below-median incomes and to projects led by local rather than multinational contractors. Several large infrastructure firms expressed frustration with the weighting in public comments, arguing that local contractors lack the capacity to execute complex projects on the required timelines. Fund administrators counter that building local capacity is a stated objective of the program.`,
      `Private capital mobilization is a central goal. The fund's theory of change holds that a dollar of concessional grant capital should catalyze three to five dollars of private co-investment by de-risking the projects and demonstrating viability. Early results are mixed: the coastal projects have attracted co-investment from development finance institutions at approximately the targeted ratio, but the microgrid projects have found private co-investors harder to assemble.`,
      `Annual audits will evaluate each project against a set of resilience metrics established at the time of grant approval. Recipients that miss milestones face escalating reporting requirements and, in cases of persistent underperformance, potential clawbacks. Fund administrators say the accountability structure is stricter than most development finance facilities, though critics note that clawbacks from sovereign governments are rarely actually collected.`,
      `Climate attribution science is being integrated into project design in ways that were not standard practice a decade ago. Several of the coastal projects used probabilistic storm-surge modeling that incorporates the latest assessments of how climate change is affecting storm intensity and track frequency in their specific basins. The modeling feeds directly into infrastructure specifications and design lifetimes.`,
      `The fund's governance structure has drawn scrutiny from some civil society groups. The board is dominated by representatives from donor governments and multilateral institutions, with limited formal representation from recipient communities. Several advocacy organizations have called for a more participatory approach to governance, particularly for projects that require the relocation of communities from high-risk areas.`,
      `Round two is expected to open for applications in the fourth quarter, with a broader mandate that includes inland flood management, urban heat mitigation, and freshwater security. Officials are also exploring whether a blended-finance window — pairing grants with subordinated debt — could expand the range of projects the fund can support and attract a wider base of private co-investors.`,
    ],
    shorts: [
      {
        headline: 'First checks go coastal',
        text: 'Initial grants target surge barriers, wetland buffers, and backup power for critical facilities.',
        image: 'https://picsum.photos/seed/nm-f2-a/800/450',
      },
      {
        headline: 'Maps matter',
        text: 'Cities with fresh flood and heat models moved to the front of the queue.',
        image: 'https://picsum.photos/seed/nm-f2-b/800/450',
      },
      {
        headline: 'Microgrids in the mix',
        text: 'Islanded campus and hospital pilots can pair with storage under the new guidelines.',
        image: 'https://picsum.photos/seed/nm-f2-c/800/450',
      },
      {
        headline: 'Annual audits',
        text: 'Recipients must report resilience metrics yearly or face clawbacks.',
        image: 'https://picsum.photos/seed/nm-f2-d/800/450',
      },
      {
        headline: 'Private capital next',
        text: 'Officials hope blended finance will match public funds in round two.',
        image: 'https://picsum.photos/seed/nm-f2-e/800/450',
      },
    ],
  },
  f3: {
    body: `A tour rookie posted a course record on moving day, vaulting into contention ahead of the final round. Wind shifts and firm greens challenged the afternoon wave. The leaderboard remains crowded at the top.`,
    paragraphs: [
      `A 22-year-old in just his fourth full season on the tour posted a 62 on moving day, setting the course record at a venue known for its demanding combination of tight tree-lined corridors and greens that slope uniformly from back to front. The round included five consecutive birdies on holes eleven through fifteen and a closing eagle that drew a noise response from the gallery not heard at this venue in years.`,
      `The significance of the performance extends beyond the number itself. The player entered the week ranked 74th in the world, outside the automatic exemption bubble for the year's remaining major championships. A strong Sunday finish would not just secure his position in next week's field; it would almost certainly move him inside the top 50, the threshold that matters most for global exemption purposes.`,
      `Course management was the differentiating factor according to his caddie's post-round comments. On a day when several marquee names went for broke and paid the price in bogeys and double-bogeys, the leader played within himself on the difficult par-threes, taking on conservative targets and relying on a sharp short game to convert par saves into the kind of momentum that feeds on itself over eighteen holes.`,
      `The afternoon wave encountered a different course. Wind shifted from southwest to northwest between mid-morning and noon, fundamentally altering the club selection calculus on at least five holes. The change particularly affected the long par-threes on the front nine, where players who had planned approach shots with mid-irons found themselves needing fairway woods. Several of the contenders who were expected to climb the leaderboard instead stalled.`,
      `Greens firmed significantly from morning to afternoon, a function of reduced cloud cover and an on-course temperature that peaked near the warm end of the forecast range. Approach shots that had been stopping within four feet of their landing spot in the morning were releasing to the back fringe and below by mid-afternoon. Birdies became harder to make just as the broadcasters began showing the leaderboard with its crowded traffic.`,
      `Six players finished the third round within three shots of the lead, the most competitive 54-hole picture the tournament has produced in seven years. The group includes two former major champions, a player who nearly withdrew on Thursday with a wrist complaint, and a veteran who has finished in the top ten at this event four times without ever converting. Sunday's pairing sheet will read like a promotional document.`,
      `Statistical analysis of this player's performance suggests a particular strength that is easily missed in a highlight reel. His scrambling percentage — the frequency with which he makes par or better after missing a green in regulation — ranks in the top five on tour this season. On a course that punishes approach play this severely, that statistic is worth more than its raw number suggests because it transforms near-misses into pars rather than bogeys.`,
      `The field's other storyline involves a two-time champion who posted a 67 to claw within striking distance after an opening-round 74 that seemed to end his week before it started. The recovery required two consecutive rounds without a bogey, a run of consecutive sub-par holes, and a putting performance that his statistics portal describes as the hottest three-day stretch of his year. His caddie declined to comment on whether it felt like a heist.`,
      `Broadcast viewing figures for Saturday were reportedly the highest for a third round at this venue in the current television deal. The demographic breakdown showed stronger-than-usual engagement from the 18-34 age group, which analysts attributed to the presence of the young leader and to a social media clip of his eagle on the final hole that had accumulated significant shares before the broadcast even ended.`,
      `Sunday's final round starts with morning fog in the forecast, which could slow play and potentially alter tee times. Course officials say they are monitoring conditions but expect play to begin on schedule. Given the competitive field, the leaderboard trajectory of the past 54 holes, and a course that has historically seen major swings on Sunday, observers across the golf world will be watching to see whether the rookie completes his week or becomes a footnote in someone else's story.`,
    ],
    shorts: [
      {
        headline: 'Record on Saturday',
        text: 'A 62 included a stretch of five birdies in six holes on the back nine.',
        image: 'https://picsum.photos/seed/nm-f3-a/800/450',
      },
      {
        headline: 'Wind turned midday',
        text: 'The afternoon wave saw gusts that added two clubs on par-threes.',
        image: 'https://picsum.photos/seed/nm-f3-b/800/450',
      },
      {
        headline: 'Greens firmed up',
        text: 'Approach shots that held in the morning began releasing in the afternoon.',
        image: 'https://picsum.photos/seed/nm-f3-c/800/450',
      },
      {
        headline: 'Crowded Sunday',
        text: 'Six players sit within three shots of the lead going into the final round.',
        image: 'https://picsum.photos/seed/nm-f3-d/800/450',
      },
    ],
  },
  f4: {
    body: `Browser vendors aligned on a timeline for a privacy-preserving ads trial spanning limited regions. Publishers want transparency into auction mechanics. Regulators in two jurisdictions asked for delay.`,
    paragraphs: [
      `After more than three years of contested proposals, public comment periods, and regulatory reviews, the major browser vendors have announced a coordinated timeline for the first large-scale trial of privacy-preserving advertising infrastructure. The trial will run in limited geographic regions, with audience-size caps and constrained reporting granularity designed to allow evaluation without exposing users in the pilot cohorts to the full commercial intensity of production advertising systems.`,
      `The core technical architecture replaces the third-party cookie — which allowed advertisers and data brokers to track users across websites — with a system that performs audience classification on-device and releases only aggregate, differentially-private signals to advertisers. In theory, this means that the browser knows a user's interests but never shares that knowledge with a third party in a form that could be used for individual identification.`,
      `Publishers have expressed a consistent concern that transparency into how bids resolve is insufficient. Under current cookie-based systems, publishers with sophisticated ad operations can see a detailed breakdown of which advertisers bid on which impression, at what price, and with what targeting parameters. Under the proposed replacement architecture, that granularity is restricted, and publishers worry they will lose the ability to diagnose and optimize their yield operations.`,
      `The auction mechanics concern is not merely philosophical. Publishers whose ad revenue funds journalism and public-interest content argue that opaque auction systems will make it harder to detect underpayment, harder to negotiate direct deals, and harder to identify when their audiences are being systematically undervalued. Several news industry trade groups have called for an independent technical audit of the auction resolution process before the trial expands.`,
      `Regulators in two jurisdictions have formally requested a delay. Their concerns center on competition effects: specifically, whether a system where the browser vendor controls both the audience classification and the auction infrastructure creates a structural advantage for that vendor's own advertising products. Both regulators have published preliminary analyses arguing that more time is needed to evaluate the potential for foreclosure of third-party competitors.`,
      `Ad-technology companies occupy a complex position in the debate. The largest players — those with sufficient scale to build proprietary identity solutions that work without third-party cookies — are generally less threatened by the transition than smaller ad networks that depend heavily on cross-site tracking. Several mid-tier players have publicly aligned with publishers in criticizing the lack of transparency, while larger ones have negotiated bilateral agreements with browser vendors.`,
      `Advertiser reactions have been more muted than the industry's internal debates might suggest. Many large advertisers have been investing in first-party data strategies for several years, anticipating the eventual deprecation of cross-site tracking. For those advertisers, the transition to privacy-preserving infrastructure is an operational challenge but not an existential threat, because their direct customer relationships provide an alternative signal that the new systems can accommodate.`,
      `User experience implications are receiving less attention than the commercial ones, but they matter. On-device classification requires more local computation and storage than the passive cookie-setting that currently tracks users. Browser developers say the performance impact is negligible on modern hardware, but independent testing has found measurable battery and CPU effects on older devices, a concern for users in markets where device refresh cycles are longer.`,
      `The interoperability question is the one that will define the medium-term outcome. If the privacy-preserving infrastructure works only within a single browser engine, it will create a fragmented advertising ecosystem where some users can be addressed with new techniques and others cannot. Chromium-based browsers represent a significant majority of global usage, but Firefox and Safari have different privacy architectures, and aligning them involves technical and political negotiations that have not yet produced a joint standard.`,
      `The trial's results will determine whether regulators in the two delay-requesting jurisdictions proceed with formal investigations. If the pilot data shows that the browser vendor's own advertising products disproportionately benefit from the new system, the competitive concerns become a formal complaint. If the data shows roughly neutral effects, the regulatory pressure is likely to ease. The next twelve months of results will be scrutinized by every major stakeholder in the online advertising ecosystem.`,
    ],
    shorts: [
      {
        headline: 'Trial window set',
        text: 'Vendors sketched a phased rollout with caps on audience size and reporting granularity.',
        image: 'https://picsum.photos/seed/nm-f4-a/800/450',
      },
      {
        headline: 'Publishers push back',
        text: 'News groups want open documentation on how bids resolve when third-party cookies are gone.',
        image: 'https://picsum.photos/seed/nm-f4-b/800/450',
      },
      {
        headline: 'Regulators hit pause',
        text: 'Two markets asked for more time to review competition effects before any live traffic.',
        image: 'https://picsum.photos/seed/nm-f4-c/800/450',
      },
      {
        headline: 'What changes for users',
        text: 'Early builds show fewer cross-site ad profiles but more on-device topic hints.',
        image: 'https://picsum.photos/seed/nm-f4-d/800/450',
      },
      {
        headline: 'Next milestone',
        text: 'Interop tests between Chromium and non-Chromium clients land before year-end.',
        image: 'https://picsum.photos/seed/nm-f4-e/800/450',
      },
    ],
  },
  f5: {
    body: `Wire services and video-first newsrooms shared lessons from adopting short-form packages alongside traditional wires. Training and rights clearance took longer than tooling. Archival search emerged as an unexpected bottleneck.`,
    paragraphs: [
      `At a closed-door summit attended by representatives from thirty wire services and video-first newsrooms, editors and production leaders shared remarkably candid assessments of what has worked, what has failed, and what nobody anticipated when they set out to integrate short-form video packages alongside their traditional text wire operations. The shared thread was consistent: the technology was the easy part.`,
      `The editorial workflow problem proved more stubborn than anyone had forecasted. Text wire operations run on a one-reporter-files-to-one-editor-publishes model that has been refined over decades into an efficient, low-friction pipeline. Inserting a video clip into that pipeline requires decisions that do not arise in text — thumbnail selection, caption styling, autoplay behavior, accessibility descriptions — and those decisions require skills that traditional wire editors neither had nor were hired to develop.`,
      `Training became the dominant budget line in video adoption, not technology. Operations that had planned for the new tools to be intuitive found that even experienced journalists needed significant time to internalize the editorial judgment calls that go into a 45-second explainer: what to show first, how to pace scene transitions, when a talking head undermines credibility rather than establishing it. Several news directors described the learning curve as comparable to training a new beat from scratch.`,
      `Rights clearance emerged as the most corrosive operational bottleneck, particularly for organizations that cover sports, entertainment, and breaking news that generates iconic footage quickly. Clearing match highlights, concert clips, and user-generated footage for distribution in short-form packages requires a legal review process that often takes longer than the story's relevance window. Several outlets described producing finished clips that missed their news cycle waiting for rights confirmation.`,
      `Archival search became an unexpected problem that no one had budgeted for. When vertical-format short packages began requiring B-roll and historical context footage, editors discovered that most archive systems had been catalogued with text-search in mind — subject tags, reporter names, event dates — rather than with visual-format considerations. Finding safe-to-use footage that fit a 9:16 frame, had clean audio, and matched a current story often took longer than shooting new material.`,
      `The beat reporter as visual journalist model has worked better than the skeptics predicted and worse than the enthusiasts promised. Reporters who had been filing text for years were able to learn basic filming and scripting techniques, but the workload increase was real. Several operations that had reduced video staffing on the assumption that text reporters would absorb the work found they had underestimated the time cost and quietly rehired.`,
      `Completion rates — the percentage of viewers who watch a video clip through to its end — have been the headline metric that distribution platforms use to evaluate content. Early data from participating newsrooms suggested that 45-second explainers dramatically outperformed 90-second documentary-style packages on this metric, a finding that has shaped editorial guidelines at several organizations to impose a hard maximum runtime for breaking-news clips.`,
      `The syndication economics of short-form video are still being worked out. Text wire services have established licensing models built on subscription access and per-item fees that publishers understand. Video requires bandwidth agreements, format-specific licensing structures, and platform-specific encoding requirements that add complexity to every deal. Several small regional outlets withdrew from video wire agreements when they calculated the total operational cost.`,
      `Co-operative approaches to rights clearance are emerging as the most practical near-term solution. Groups of newsrooms that cover overlapping beats are pooling legal review costs and sharing clearance playbooks, reducing duplication and building institutional knowledge about which rights holders move quickly and which consistently require extended negotiations. The model does not solve the structural problem but makes it manageable.`,
      `The summit's working group on archival access produced a set of minimum metadata standards that participating organizations agreed to implement within eighteen months. The standards require that footage be tagged with aspect-ratio information, rights status at the clip level rather than the story level, and a visual search description that does not rely on knowing the text story the footage was originally paired with. Implementors acknowledge that applying those standards retroactively to existing archives is a multi-year project.`,
    ],
    shorts: [
      {
        headline: 'Video-first desks',
        text: 'Wire teams are pairing text alerts with vertical clips filed from the same beat reporter.',
        image: 'https://picsum.photos/seed/nm-f5-a/800/450',
      },
      {
        headline: 'Training lagged tools',
        text: 'Editors say the bigger delay was upskilling producers—not buying software.',
        image: 'https://picsum.photos/seed/nm-f5-b/800/450',
      },
      {
        headline: 'Rights slow the cut',
        text: 'Clearing match and concert footage for social cuts often takes longer than writing the story.',
        image: 'https://picsum.photos/seed/nm-f5-c/800/450',
      },
      {
        headline: 'Archives are the choke point',
        text: 'Metadata-poor libraries make it hard to find safe B-roll under deadline.',
        image: 'https://picsum.photos/seed/nm-f5-d/800/450',
      },
      {
        headline: 'What’s next',
        text: 'Co-ops are sharing clearance playbooks so smaller outlets do not duplicate legal review.',
        image: 'https://picsum.photos/seed/nm-f5-e/800/450',
      },
      {
        headline: 'Reader habits',
        text: 'Early data shows completion rates higher on 45-second explainers than on 90-second packages.',
        image: 'https://picsum.photos/seed/nm-f5-f/800/450',
      },
    ],
  },
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/* ——————————————————————————————————————
   Bookmarks — type, storage helpers, hook
—————————————————————————————————————— */
type TextBookmarkSelection = {
  selectedText: string
  paragraphIndex?: number
  startOffset?: number
}

type Bookmark = {
  id: string
  storyId: string
  storyTitle: string
  storyDek: string
  storyImage: string
  storyTag: TagId
  storyReadTime: string
  selectedText?: string
  paragraphIndex?: number
  startOffset?: number
  savedAt: number
}

const BM_KEY = 'newsmuncher_bookmarks'

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BM_KEY)
    return raw ? (JSON.parse(raw) as Bookmark[]) : []
  } catch {
    return []
  }
}

function persistBookmarks(bm: Bookmark[]): void {
  try { localStorage.setItem(BM_KEY, JSON.stringify(bm)) } catch { /* ignore */ }
}

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks)

  const addBookmark = useCallback((story: Story, selection?: string | TextBookmarkSelection) => {
    setBookmarks((prev) => {
      const selectedText = typeof selection === 'string' ? selection : selection?.selectedText
      let base = prev
      if (selectedText) {
        // Word bookmark takes precedence — remove ALL existing bookmarks for this article
        base = prev.filter((b) => b.storyId !== story.id)
      } else {
        // Article-level: skip if any bookmark already exists for this story
        if (prev.some((b) => b.storyId === story.id)) return prev
      }
      const entry: Bookmark = {
        id: `${story.id}-${Date.now()}`,
        storyId: story.id,
        storyTitle: story.title,
        storyDek: story.dek,
        storyImage: story.image,
        storyTag: story.tag,
        storyReadTime: story.readTime,
        selectedText,
        paragraphIndex: typeof selection === 'object' ? selection.paragraphIndex : undefined,
        startOffset: typeof selection === 'object' ? selection.startOffset : undefined,
        savedAt: Date.now(),
      }
      const updated = [entry, ...base]
      persistBookmarks(updated)
      return updated
    })
  }, [])

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id)
      persistBookmarks(updated)
      return updated
    })
  }, [])

  // True if the story has ANY bookmark (article-level or word)
  const isArticleBookmarked = useCallback(
    (storyId: string) => bookmarks.some((b) => b.storyId === storyId),
    [bookmarks],
  )

  // Toggle: if any bookmark exists remove them all; otherwise add article-level bookmark
  const toggleArticleBookmark = useCallback(
    (story: Story) => {
      if (bookmarks.some((b) => b.storyId === story.id)) {
        setBookmarks((prev) => {
          const updated = prev.filter((b) => b.storyId !== story.id)
          persistBookmarks(updated)
          return updated
        })
      } else {
        addBookmark(story)
      }
    },
    [bookmarks, addBookmark],
  )

  const getTextBookmark = useCallback(
    (storyId: string) => bookmarks.find((b) => b.storyId === storyId && !!b.selectedText) ?? null,
    [bookmarks],
  )

  return { bookmarks, addBookmark, removeBookmark, isArticleBookmarked, toggleArticleBookmark, getTextBookmark }
}

function formatBookmarkTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function storyFromBookmark(bm: Bookmark): Story {
  return {
    id: bm.storyId,
    title: bm.storyTitle,
    dek: bm.storyDek,
    image: bm.storyImage,
    tag: bm.storyTag,
    readTime: bm.storyReadTime,
  }
}

/* ——————————————————————————————————————
   Reactions — per-story like / dislike
—————————————————————————————————————— */
type Reaction = 'like' | 'dislike' | null

function useReactions() {
  const [reactions, setReactions] = useState<Record<string, Reaction>>(() => {
    try { return JSON.parse(localStorage.getItem('nm_reactions') ?? '{}') as Record<string, Reaction> } catch { return {} }
  })
  const [refinements, setRefinements] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('nm_reaction_refinements') ?? '{}') as Record<string, string> } catch { return {} }
  })
  const setReaction = useCallback((storyId: string, r: Reaction) => {
    setReactions((prev) => {
      const updated = { ...prev, [storyId]: r }
      try { localStorage.setItem('nm_reactions', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
    // Clearing a reaction wipes the refinement too
    if (r == null) {
      setRefinements((prev) => {
        if (!(storyId in prev)) return prev
        const { [storyId]: _drop, ...rest } = prev
        try { localStorage.setItem('nm_reaction_refinements', JSON.stringify(rest)) } catch { /* ignore */ }
        return rest
      })
    }
  }, [])
  const getReaction = useCallback((storyId: string): Reaction => reactions[storyId] ?? null, [reactions])
  const setRefinement = useCallback((storyId: string, key: string | null) => {
    setRefinements((prev) => {
      let updated: Record<string, string>
      if (key == null) {
        if (!(storyId in prev)) return prev
        const { [storyId]: _drop, ...rest } = prev
        updated = rest
      } else {
        updated = { ...prev, [storyId]: key }
      }
      try { localStorage.setItem('nm_reaction_refinements', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }, [])
  const getRefinement = useCallback((storyId: string): string | null => refinements[storyId] ?? null, [refinements])
  return { getReaction, setReaction, getRefinement, setRefinement }
}

/* ——————————————————————————————————————
   Comments — per-story threaded comments
—————————————————————————————————————— */
type CommentReply = {
  id: string
  author: string
  initials: string
  text: string
  timestamp: number
}

type Comment = {
  id: string
  author: string
  initials: string
  text: string
  timestamp: number
  replies: CommentReply[]
}

function loadComments(storyId: string): Comment[] {
  try { return JSON.parse(localStorage.getItem(`nm_comments_${storyId}`) ?? '[]') as Comment[] } catch { return [] }
}

function saveComments(storyId: string, comments: Comment[]): void {
  try { localStorage.setItem(`nm_comments_${storyId}`, JSON.stringify(comments)) } catch { /* ignore */ }
}

function useComments(storyId: string) {
  const [comments, setComments] = useState<Comment[]>(() => loadComments(storyId))

  useEffect(() => { setComments(loadComments(storyId)) }, [storyId])

  const addComment = useCallback((text: string) => {
    setComments((prev) => {
      const entry: Comment = {
        id: Date.now().toString(),
        author: 'You',
        initials: 'Y',
        text,
        timestamp: Date.now(),
        replies: [],
      }
      const updated = [...prev, entry]
      saveComments(storyId, updated)
      return updated
    })
  }, [storyId])

  const addReply = useCallback((commentId: string, text: string) => {
    setComments((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== commentId) return c
        const reply: CommentReply = {
          id: Date.now().toString(),
          author: 'You',
          initials: 'Y',
          text,
          timestamp: Date.now(),
        }
        return { ...c, replies: [...c.replies, reply] }
      })
      saveComments(storyId, updated)
      return updated
    })
  }, [storyId])

  return { comments, addComment, addReply }
}

function ReadingWordBlock({
  text,
  isPlaying,
  prefersReducedMotion,
  className,
  as: Tag = 'div',
}: {
  text: string
  isPlaying: boolean
  prefersReducedMotion: boolean
  className?: string
  as?: 'div' | 'h2' | 'h3' | 'p'
}) {
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text])
  const totalWords = words.length
  const [readIndex, setReadIndex] = useState(0)

  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || totalWords === 0) {
      setReadIndex(0)
      return
    }
    setReadIndex(0)
    const id = window.setInterval(() => {
      setReadIndex((i) => (i + 1 >= totalWords ? 0 : i + 1))
    }, READ_WORD_MS)
    return () => window.clearInterval(id)
  }, [isPlaying, prefersReducedMotion, totalWords, text])

  useEffect(() => {
    if (!isPlaying) setReadIndex(0)
  }, [isPlaying])

  const progressPct = totalWords > 0 ? ((readIndex + 1) / totalWords) * 100 : 0

  const wordClass = (globalIdx: number) => {
    if (prefersReducedMotion || !isPlaying) return 'read-word'
    if (globalIdx < readIndex) return 'read-word read-word--past'
    if (globalIdx === readIndex) return 'read-word read-word--current'
    return 'read-word read-word--future'
  }

  if (prefersReducedMotion || !isPlaying) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <>
      <div className="hero-read-progress article-read-progress" aria-hidden>
        <div className="hero-read-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>
      <Tag className={className}>
        {words.map((w, i) => (
          <span key={i} className={wordClass(i)}>
            {i > 0 ? ' ' : ''}
            {w}
          </span>
        ))}
      </Tag>
    </>
  )
}

function HeroReadingContent({
  title,
  dek,
  isActive,
  prefersReducedMotion,
}: {
  title: string
  dek: string
  isActive: boolean
  prefersReducedMotion: boolean
}) {
  if (prefersReducedMotion || !isActive) {
    return (
      <>
        <h3 className="hero-card-title">{title}</h3>
        <p className="hero-card-dek">{dek}</p>
      </>
    )
  }

  return (
    <>
      <ReadingWordBlock
        text={title}
        isPlaying={isActive}
        prefersReducedMotion={false}
        className="hero-card-title hero-card-title--read"
        as="h3"
      />
      <p className="hero-card-dek">{dek}</p>
    </>
  )
}

function IconReadThrough() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  )
}


function ArticleReadModal({
  story,
  onClose,
  prefersReducedMotion,
}: {
  story: Story | null
  onClose: () => void
  prefersReducedMotion: boolean
}) {
  const extra = story ? STORY_CONTENT[story.id] : undefined

  useEffect(() => {
    if (!story) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [story])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (story) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [story, onClose])

  if (!story || !extra) return null

  return (
    <div className="article-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="article-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="article-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="article-modal__tag">
          <ArticleTag tag={story.tag} />
        </p>
        <h2 id="article-modal-title" className="article-modal__title">
          {story.title}
        </h2>
        <p className="article-modal__dek">{story.dek}</p>
        {prefersReducedMotion ? (
          <div className="article-modal__body article-modal__body--static">{extra.body}</div>
        ) : (
          <ReadingWordBlock
            text={extra.body}
            isPlaying={true}
            prefersReducedMotion={false}
            className="article-modal__body article-modal__body--read"
            as="div"
          />
        )}
      </div>
    </div>
  )
}

type SelectionPopup = {
  x: number
  y: number
  text: string
  mobile: boolean
  paragraphIndex?: number
  startOffset?: number
}

type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

const QUIZ_BY_TAG: Record<TagId, QuizQuestion[]> = {
  World: [
    {
      id: 'w1',
      prompt: 'What is usually the first priority in cross-border logistics stories?',
      options: ['Reducing route risk and cost', 'Adding more ad slots', 'Changing font size', 'Reducing article length'],
      correctIndex: 0,
      explanation: 'Route reliability and cost are core drivers in global logistics decisions.',
    },
    {
      id: 'w2',
      prompt: 'When policy and trade shift together, coverage often focuses on...',
      options: ['Meme trends', 'Supply chains and regulation impact', 'Celebrity gossip', 'Movie awards'],
      correctIndex: 1,
      explanation: 'World coverage typically tracks policy impact on trade and supply chains.',
    },
    {
      id: 'w3',
      prompt: 'A practical reader takeaway from world economy pieces is to watch...',
      options: ['Only social media likes', 'One-day weather only', 'Currency and shipping signals', 'App icon colors'],
      correctIndex: 2,
      explanation: 'Currency moves and shipping data are commonly useful leading indicators.',
    },
  ],
  Politics: [
    {
      id: 'p1',
      prompt: 'In policy drafts, what matters most before final vote?',
      options: ['Definitions and enforceability', 'Headline font', 'Comment count', 'Photo filter'],
      correctIndex: 0,
      explanation: 'Draft wording and enforceability determine real-world legal impact.',
    },
    {
      id: 'p2',
      prompt: 'Why do second readings get close attention?',
      options: ['They remove all legal checks', 'Key amendments are negotiated there', 'They end all debate', 'They skip committees'],
      correctIndex: 1,
      explanation: 'Second readings often carry major clarifications and compromise language.',
    },
    {
      id: 'p3',
      prompt: 'A common risk in political implementation stories is...',
      options: ['Too many emojis', 'Oversized hero images', 'Regulatory ambiguity across regions', 'Short article titles'],
      correctIndex: 2,
      explanation: 'Ambiguous language creates uneven interpretation and delayed outcomes.',
    },
  ],
  Sports: [
    {
      id: 's1',
      prompt: 'Late-game momentum swings usually follow...',
      options: ['Execution and turnover shifts', 'Logo redesigns', 'Stadium paint color', 'New mascot names'],
      correctIndex: 0,
      explanation: 'Execution runs and turnovers are common drivers of rapid momentum changes.',
    },
    {
      id: 's2',
      prompt: 'Why do analysts watch player minutes closely?',
      options: ['To predict ticket color', 'Because fatigue/injury risk changes strategy', 'For camera angles', 'To pick halftime songs'],
      correctIndex: 1,
      explanation: 'Heavy minutes can influence fatigue, rotation choices, and injury risk.',
    },
    {
      id: 's3',
      prompt: 'A useful post-game indicator for next match is...',
      options: ['Bench selfie count', 'Arena snack sales', 'Fourth-quarter defensive efficiency', 'Warm-up playlist'],
      correctIndex: 2,
      explanation: 'Late-game defensive efficiency can better predict short-term match outcomes.',
    },
  ],
  Tech: [
    {
      id: 't1',
      prompt: 'In platform rollout stories, the toughest bottleneck is often...',
      options: ['Workflow integration', 'Title punctuation', 'Emoji support', 'Banner color'],
      correctIndex: 0,
      explanation: 'Integration into existing workflows is usually harder than feature launch itself.',
    },
    {
      id: 't2',
      prompt: 'Why do teams monitor reproducibility in benchmark reports?',
      options: ['To reduce server colors', 'To validate results and avoid leakage', 'To increase ad popups', 'To shorten URLs'],
      correctIndex: 1,
      explanation: 'Reproducibility confirms whether outcomes are reliable and transferable.',
    },
    {
      id: 't3',
      prompt: 'For real adoption, enterprises typically need...',
      options: ['Only viral buzz', 'Minimal documentation', 'Clear ROI and operational fit', 'More notification sounds'],
      correctIndex: 2,
      explanation: 'Production adoption requires measurable value and compatibility with operations.',
    },
  ],
}

/** Split text around a target match and return highlighted React nodes */
function ParagraphWithHighlight({
  text,
  target,
  startOffset,
  markRef,
  flash,
}: {
  text: string
  target: string
  startOffset?: number
  markRef?: React.RefObject<HTMLElement | null>
  flash?: boolean
}) {
  const idxFromOffset = typeof startOffset === 'number'
    && startOffset >= 0
    && text.slice(startOffset, startOffset + target.length) === target
    ? startOffset
    : -1
  const idx = idxFromOffset >= 0 ? idxFromOffset : text.indexOf(target)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark
        ref={markRef as React.RefObject<HTMLElement>}
        className={`bm-word-mark${flash ? ' bm-word-mark--flash' : ''}`}
      >
        {text.slice(idx, idx + target.length)}
      </mark>
      {text.slice(idx + target.length)}
    </>
  )
}

function QuizCircularTimer({ pct, seconds }: { pct: number; seconds: number }) {
  const radius = 32;
  const circum = 2 * Math.PI * radius;
  const offset = circum - (pct / 100) * circum;

  return (
    <div className="quiz-circular-timer">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <defs>
          <linearGradient id="quizTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <circle className="quiz-circular-timer__bg" cx="40" cy="40" r={radius} />
        <circle 
          className="quiz-circular-timer__progress" 
          cx="40" cy="40" r={radius} 
          stroke="url(#quizTimerGradient)"
          strokeDasharray={circum}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
        <text className="quiz-circular-timer__text" x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
          {seconds}
        </text>
      </svg>
    </div>
  )
}

function ArticleQuiz({ story, onClosePanel: _onClosePanel }: { story: Story; onClosePanel: () => void }) {
  const questions = useMemo(() => {
    const base = QUIZ_BY_TAG[story.tag]
    return base.map((q, idx) => ({
      ...q,
      prompt: idx === 0 ? `Based on "${story.title}", ${q.prompt.charAt(0).toLowerCase()}${q.prompt.slice(1)}` : q.prompt,
    }))
  }, [story.id, story.tag, story.title])

  const [started, setStarted] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(15000)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setStarted(false)
    setCurrentIdx(0)
    setTimeLeftMs(15000)
    setAnswers([])
    setFinished(false)
  }, [story.id])

  const current = questions[currentIdx]
  const selected = answers[currentIdx] ?? null
  const timedOut = started && !finished && selected === null && timeLeftMs <= 0

  useEffect(() => {
    if (!started || finished || selected !== null) return
    if (timeLeftMs <= 0) return
    const id = window.setInterval(() => {
      setTimeLeftMs((ms) => Math.max(0, ms - 100))
    }, 100)
    return () => window.clearInterval(id)
  }, [started, finished, selected, timeLeftMs, currentIdx])

  useEffect(() => {
    if (!started || finished || selected !== null || timeLeftMs > 0) return
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIdx] = null
      return next
    })
  }, [started, finished, selected, timeLeftMs, currentIdx])

  const startQuiz = () => {
    setStarted(true)
    setFinished(false)
    setCurrentIdx(0)
    setAnswers(Array(questions.length).fill(null))
    setTimeLeftMs(15000)
  }

  const chooseOption = (optIdx: number) => {
    if (!started || finished || selected !== null || timeLeftMs <= 0) return
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIdx] = optIdx
      return next
    })
  }

  const goNext = () => {
    if (currentIdx >= questions.length - 1) {
      setFinished(true)
      return
    }
    setCurrentIdx((i) => i + 1)
    setTimeLeftMs(15000)
  }

  const score = answers.reduce<number>((sum, ans, idx) => (ans === questions[idx]?.correctIndex ? sum + 1 : sum), 0)
  const progressPct = (timeLeftMs / 15000) * 100

  return (
    <section className="quiz-wrap" aria-labelledby="quiz-heading">
      {!started && (
        <div className="quiz-start">
          <span className="quiz-start__icon" aria-hidden><IconQuiz /></span>
          <h3 id="quiz-heading" className="quiz-start__title">Quick challenge</h3>
          <div className="quiz-start__meta">
            <span className="quiz-pill">{questions.length} questions</span>
            <span className="quiz-start__meta-sep" aria-hidden>·</span>
            <span className="quiz-start__meta-time">~{questions.length * 15}s</span>
          </div>
          <p className="quiz-start__sub">Test what stuck from this story with a quick, timed questionnaire.</p>
          <button type="button" className="quiz-start-btn" onClick={startQuiz}>
            Start questionnaire
          </button>
        </div>
      )}

      {started && !finished && current && (
        <div className="quiz-card">
          <div className="quiz-header">
            <span className="quiz-progress-text">Question {currentIdx + 1} of {questions.length}</span>
            <QuizCircularTimer pct={progressPct} seconds={Math.ceil(timeLeftMs / 1000)} />
          </div>

          <div className="quiz-image-wrap">
            <img 
              src={`${import.meta.env.BASE_URL}quiz_editorial_${(currentIdx % 3) + 1}.png`}
              alt="Editorial illustration" 
              className="quiz-image" 
            />
          </div>
          <p className="quiz-question">{current.prompt}</p>
          <ul className="quiz-options">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correctIndex
              const isSelected = selected === i
              const optionClass = selected !== null || timedOut
                ? isCorrect
                  ? ' quiz-option--correct'
                  : isSelected
                    ? ' quiz-option--wrong'
                    : ''
                : ''
              return (
                <li key={opt}>
                  <button type="button" className={`quiz-option${optionClass}`} onClick={() => chooseOption(i)}>
                    {opt}
                  </button>
                </li>
              )
            })}
          </ul>

          {(selected !== null || timedOut) && (
            <div className="quiz-footer">
              <p className="quiz-explain">{current.explanation}</p>
              <button type="button" className="quiz-next-btn" onClick={goNext}>
                {currentIdx === questions.length - 1 ? 'See results' : 'Next question'}
              </button>
            </div>
          )}
        </div>
      )}

      {started && finished && (
        <div className="quiz-result">
          <p className="quiz-score">You scored {score}/{questions.length}</p>
          <ul className="quiz-answer-list">
            {questions.map((q, idx) => {
              const answer = answers[idx]
              const isRight = answer === q.correctIndex
              return (
                <li key={q.id} className="quiz-answer-item">
                  <p className="quiz-answer-q">{q.prompt}</p>
                  <p className={`quiz-answer-you${isRight ? ' quiz-answer-you--ok' : ' quiz-answer-you--bad'}`}>
                    Your answer: {answer === null ? 'Not answered' : q.options[answer]}
                  </p>
                  <p className="quiz-answer-correct">Correct: {q.options[q.correctIndex]}</p>
                </li>
              )
            })}
          </ul>
          <button type="button" className="quiz-start-btn" onClick={startQuiz}>Play again</button>
        </div>
      )}
    </section>
  )
}

function IconOpinions() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

function IconSideLeftLg() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="7.5" r="2.6" />
      <circle cx="16" cy="8.5" r="2.1" />
      <path d="M3.5 19c0-3 2.4-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
      <path d="M14 19c.2-2.3 2-4.1 4.4-4.1 1 0 1.9.3 2.6.7" />
      <path d="M12 21h.01" />
    </svg>
  )
}

function IconSideCenterLg() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v18" />
      <path d="M5 7h14" />
      <path d="M5 7l-3 6h6l-3-6z" />
      <path d="M19 7l-3 6h6l-3-6z" />
      <path d="M9 21h6" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

function IconSideRightLg() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 21V8h14v13" />
      <path d="M3 21h18" />
      <path d="M5 8 12 3l7 5" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 11.5h.01M15 11.5h.01" />
    </svg>
  )
}

const OPINION_SLIDES: { id: OpinionSide; chip: string; tagline: string }[] = [
  { id: 'left',   chip: 'Left',   tagline: 'Progressive lens'  },
  { id: 'center', chip: 'Center', tagline: 'Balanced view'     },
  { id: 'right',  chip: 'Right',  tagline: 'Conservative lens' },
]

function OpinionSideIcon({ side }: { side: OpinionSide }) {
  if (side === 'left') return <IconSideLeftLg />
  if (side === 'center') return <IconSideCenterLg />
  return <IconSideRightLg />
}

function OpinionsPanel({ story, onClosePanel: _onClosePanel }: { story: Story; onClosePanel: () => void }) {
  const opinions = OPINIONS_BY_STORY_ID[story.id]
  const [carouselIdx, setCarouselIdx] = useState(1)
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollSettleRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = carouselRef.current
    if (!el) return
    el.scrollLeft = el.offsetWidth
    setCarouselIdx(1)
  }, [story.id])

  const onScroll = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    if (scrollSettleRef.current !== null) {
      window.clearTimeout(scrollSettleRef.current)
    }
    scrollSettleRef.current = window.setTimeout(() => {
      const w = el.offsetWidth
      const i = Math.round(el.scrollLeft / w)
      setCarouselIdx(Math.min(Math.max(i, 0), 2))
      scrollSettleRef.current = null
    }, 60)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollSettleRef.current !== null) window.clearTimeout(scrollSettleRef.current)
    }
  }, [])

  const goToSlide = (i: number) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' })
    setCarouselIdx(i)
  }

  if (!opinions) return null

  const activeSide = OPINION_SLIDES[carouselIdx]?.id ?? 'center'

  return (
    <section className={`opinions-wrap opinions-wrap--${activeSide}`} aria-labelledby="opinions-heading">
      <header className="opinions-article-header">
        <span className="opinions-article-eyebrow">Perspectives on</span>
        <h3 className="opinions-article-title">{story.title}</h3>
      </header>

      {/* Spectrum meter — primary navigation */}
      <div className="opinions-spectrum">
        <div className="opinions-spectrum__track">
          <div className="opinions-spectrum__highlight" style={{ transform: `translateX(${carouselIdx * 100}%)` }} />
          {OPINION_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`opinions-spectrum__stop${i === carouselIdx ? ' opinions-spectrum__stop--active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to ${s.chip}`}
            >
              {s.chip}
            </button>
          ))}
        </div>
      </div>

      <div className="opinions-carousel-wrap">
        <div className="opinions-carousel" ref={carouselRef} onScroll={onScroll}>
          {OPINION_SLIDES.map((s, i) => {
            const data = opinions[s.id]
            const isActive = i === carouselIdx
            return (
              <article
                key={s.id}
                className={`opinions-slide opinions-slide--${s.id}${isActive ? ' opinions-slide--active' : ''}`}
              >
                <header className="opinions-slide__head">
                  <span className={`opinions-slide__icon opinions-slide__icon--${s.id}`}>
                    <OpinionSideIcon side={s.id} />
                  </span>
                  <div className="opinions-slide__head-text">
                    <span className={`opinions-slide__chip opinions-slide__chip--${s.id}`}>{s.chip}</span>
                    <span className="opinions-slide__tagline">{s.tagline}</span>
                  </div>
                </header>

                <h4 className="opinions-slide__title">{data.title}</h4>
                <p className="opinions-slide__body">{data.body}</p>

                <ul className={`opinions-slide__watch-row opinions-slide__watch-row--${s.id}`}>
                  {data.watchFor.map((w) => (
                    <li key={w} className={`opinions-slide__watch-pill opinions-slide__watch-pill--${s.id}`}>
                      {w}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        <div className="opinions-nav-bottom">
          <button
            type="button"
            className="opinions-arrow opinions-arrow--prev"
            onClick={() => goToSlide(Math.max(0, carouselIdx - 1))}
            disabled={carouselIdx === 0}
            aria-label="Previous perspective"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            className="opinions-arrow opinions-arrow--next"
            onClick={() => goToSlide(Math.min(2, carouselIdx + 1))}
            disabled={carouselIdx === 2}
            aria-label="Next perspective"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>

      <footer className="opinions-footer">
        <div className="opinions-footer-card">
          <p className="opinions-footer-msg">
            {activeSide === 'left' && "These progressive viewpoints highlight the need for systemic change and long-term equity."}
            {activeSide === 'center' && "Balanced perspectives focus on pragmatic solutions and maintaining stability across interests."}
            {activeSide === 'right' && "Conservative lenses prioritize traditional values, individual agency, and established systems."}
          </p>
          <div className="opinions-footer-line" />
        </div>
      </footer>
    </section>
  )
}

function IconImpact() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  )
}

function IconArrowUpSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

function IconArrowDownSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  )
}

function IconArrowFlatSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M15 8l4 4-4 4" />
    </svg>
  )
}

function ImpactDomainIcon({ kind }: { kind: ImpactDomainKind }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.85', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  switch (kind) {
    case 'fuel': return (
      <svg {...common}><rect x="3" y="3" width="10" height="18" rx="1.5" /><path d="M3 9h10" /><path d="M13 9h3v8a2 2 0 0 0 4 0V7l-2-2" /></svg>
    )
    case 'food': return (
      <svg {...common}><path d="M4 5v6a3 3 0 0 0 3 3v7" /><path d="M7 5v6" /><path d="M14 3c-1 2-2 5-2 8 0 1.5.7 3 2 3v8" /></svg>
    )
    case 'hotel': return (
      <svg {...common}><path d="M3 18v-6a2 2 0 0 1 2-2h12a4 4 0 0 1 4 4v4" /><path d="M3 18h18" /><path d="M3 14h18" /><circle cx="8" cy="11" r="2" /></svg>
    )
    case 'energy': return (
      <svg {...common}><path d="M13 2 4 14h7l-1 8 10-12h-7l1-8z" /></svg>
    )
    case 'travel': return (
      <svg {...common}><path d="M21 16v-2l-9-5V4a2 2 0 1 0-4 0v5L-1 14v2l8-2.5V18l-2 1.5V21l4-1 4 1v-1.5L13 18v-4.5L21 16z" /></svg>
    )
    case 'tech': return (
      <svg {...common}><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" /></svg>
    )
    case 'shopping': return (
      <svg {...common}><path d="M3 4h2l2.6 12.2A2 2 0 0 0 9.6 18h8.8a2 2 0 0 0 2-1.6L22 8H6" /><circle cx="9" cy="21" r="1.5" /><circle cx="19" cy="21" r="1.5" /></svg>
    )
    case 'housing': return (
      <svg {...common}><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>
    )
    case 'jobs': return (
      <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></svg>
    )
    case 'health': return (
      <svg {...common}><path d="M3 12h4l2-4 4 8 2-4h6" /></svg>
    )
    case 'freight': return (
      <svg {...common}><path d="M2 8h11v9H2zM13 11h5l3 3v3h-8z" /><circle cx="6" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></svg>
    )
    case 'insurance': return (
      <svg {...common}><path d="M12 3 4 6v6c0 4.5 3.4 8.6 8 9 4.6-.4 8-4.5 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></svg>
    )
    case 'finance': return (
      <svg {...common}><path d="M3 17l5-5 4 4 8-9" /><path d="M14 7h6v6" /></svg>
    )
    case 'climate': return (
      <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></svg>
    )
    case 'media': return (
      <svg {...common}><rect x="3" y="5" width="14" height="12" rx="1.5" /><path d="M17 9l4-2v10l-4-2" /></svg>
    )
  }
}

function ImpactSparkline({
  series,
  direction,
  height = 36,
  mode = 'price',
}: {
  series: number[]
  direction: 'up' | 'down' | 'flat'
  height?: number
  /** 'price' = up is good (green) — stocks/indices.
   *  'metric' = up is bad (red) — inflation, premiums, costs. */
  mode?: 'price' | 'metric'
}) {
  const w = 96
  const h = height
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const stepX = w / (series.length - 1 || 1)
  const points = series.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 4) - 2}`)
  const path = `M${points.join(' L')}`
  const area = `${path} L${w},${h} L0,${h} Z`

  const stroke =
    direction === 'flat'
      ? '#64748b'
      : mode === 'metric'
        ? (direction === 'up' ? '#dc2626' : '#0d9488')
        : (direction === 'up' ? '#16a34a' : '#dc2626')
  const fill =
    direction === 'flat'
      ? 'rgba(100,116,139,0.10)'
      : mode === 'metric'
        ? (direction === 'up' ? 'rgba(220,38,38,0.12)' : 'rgba(13,148,136,0.12)')
        : (direction === 'up' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="impact-spark" preserveAspectRatio="none" aria-hidden>
      <path d={area} fill={fill} stroke="none" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ImpactPanel({ story, onClosePanel }: { story: Story; onClosePanel: () => void }) {
  const impact = IMPACT_BY_STORY_ID[story.id]
  if (!impact) return null

  const renderArrow = (a: ImpactArrow) => a === 'up' ? <IconArrowUpSm /> : a === 'down' ? <IconArrowDownSm /> : <IconArrowFlatSm />

  return (
    <section className="impact-wrap" aria-labelledby="impact-heading">
      <div className="impact-head">
        <div className="impact-head__title-row">
          <span className="impact-head__badge" aria-hidden><IconImpact /></span>
          <h3 id="impact-heading" className="impact-head__title">Impact</h3>
        </div>
        <button type="button" className="impact-close" onClick={onClosePanel} aria-label="Close impact panel">
          <span aria-hidden>×</span>
          <span>Close</span>
        </button>
      </div>

      <div className="impact-hero">
        <h4 className="impact-hero__headline">{impact.headline}</h4>
        <p className="impact-hero__summary">{impact.summary}</p>
      </div>

      <div className="impact-section">
        <p className="impact-eyebrow">How it touches your day</p>
        <div className="impact-areas">
          {impact.areas.map((a) => (
            <article key={a.kind + a.label} className={`impact-area impact-area--${a.arrow}`}>
              <div className="impact-area__top">
                <span className={`impact-area__icon impact-area__icon--${a.arrow}`}>
                  <ImpactDomainIcon kind={a.kind} />
                </span>
                <span className={`impact-area__arrow impact-area__arrow--${a.arrow}`} aria-label={a.arrow}>
                  {renderArrow(a.arrow)}
                </span>
              </div>
              <div className="impact-area__body">
                <p className="impact-area__label">{a.label}</p>
                <p className="impact-area__detail">{a.detail}</p>
              </div>
              <div className={`impact-area__mag impact-area__mag--${a.magnitude}`} aria-label={`Magnitude ${a.magnitude} of 3`}>
                <span /><span /><span />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="impact-section">
        <p className="impact-eyebrow">Trend at a glance</p>
        <div className="impact-trends">
          {impact.trends.map((t) => {
            const direction = t.delta > 0 ? 'up' : t.delta < 0 ? 'down' : 'flat'
            return (
              <article key={t.label} className={`impact-trend impact-trend--${direction}`}>
                <p className="impact-trend__label">{t.label}</p>
                <p className="impact-trend__value">{t.value}</p>
                <p className={`impact-trend__delta impact-trend__delta--${direction}`}>
                  {renderArrow(direction)}
                  <span>{t.delta > 0 ? '+' : ''}{t.delta.toFixed(1)}%</span>
                </p>
                <ImpactSparkline series={t.series} direction={direction} mode="metric" />
              </article>
            )
          })}
        </div>
      </div>

      <div className="impact-section">
        <p className="impact-eyebrow">Markets reacting</p>
        <ul className="impact-companies">
          {impact.companies.map((c) => {
            const direction = c.changePct > 0 ? 'up' : c.changePct < 0 ? 'down' : 'flat'
            return (
              <li key={c.ticker} className={`impact-company impact-company--${direction}`}>
                <div className="impact-company__id">
                  <span className="impact-company__ticker">{c.ticker}</span>
                  <span className="impact-company__name">{c.name}</span>
                  <span className="impact-company__sector">{c.sector}</span>
                </div>
                <ImpactSparkline series={c.series} direction={direction} height={28} />
                <span className={`impact-company__delta impact-company__delta--${direction}`}>
                  {renderArrow(direction)}
                  <span>{c.changePct > 0 ? '+' : ''}{c.changePct.toFixed(1)}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

type DetailSubScreenAccent = 'quiz' | 'opinions' | 'impact'

function DetailSubScreen({
  title,
  accent,
  story,
  onClose,
  children,
}: {
  title: string
  accent: DetailSubScreenAccent
  story: Story
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className={`sub-screen sub-screen--${accent}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="sub-screen__header">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Back">
          <IconBack />
        </button>
        <div className="sub-screen__title-wrap">
          <span className="sub-screen__title-eyebrow">
            <ArticleTag tag={story.tag} />
          </span>
          <h2 className="sub-screen__title">{title}</h2>
        </div>
        <div style={{ width: 44 }} />
      </header>
      <div className="sub-screen__body">
        <p className="sub-screen__context" title={story.title}>
          <span className="sub-screen__context-label">From the story</span>
          {story.title}
        </p>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function NewsDetailScreen({
  story,
  onTimeline,
  onAddBookmark,
  isBookmarked,
  onToggleBookmark,
  textBookmark,
  scrollToHighlight,
  getReaction,
  setReaction,
  getRefinement,
  setRefinement,
}: {
  story: Story
  onTimeline: (() => void) | null
  onAddBookmark: (selection: TextBookmarkSelection) => void
  isBookmarked: boolean
  onToggleBookmark: () => void
  textBookmark?: TextBookmarkSelection | null
  scrollToHighlight?: boolean
  getReaction: (id: string) => Reaction
  setReaction: (id: string, r: Reaction) => void
  getRefinement: (id: string) => string | null
  setRefinement: (id: string, key: string | null) => void
}) {
  const extra = STORY_CONTENT[story.id]
  const opinions = getOpinionsForStory(story)
  const impact = getImpactForStory(story)
  const bodyRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLElement | null>(null)
  const [selPopup, setSelPopup] = useState<SelectionPopup | null>(null)
  const [flashBookmark, setFlashBookmark] = useState<TextBookmarkSelection | null>(null)
  const [activeSubScreen, setActiveSubScreen] = useState<DetailSubScreenAccent | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [isAudioOpen, setIsAudioOpen] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [audioSpeed, setAudioSpeed] = useState(1)
  const [audioProgress, setAudioProgress] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setSelPopup(null)
    setFlashBookmark(null)
    setActiveSubScreen(null)
    setShowInsights(false)
    setIsAudioOpen(false)
    setIsAudioPlaying(false)
    setAudioProgress(0)
    setSeekValue(0)
    setIsSeeking(false)
    window.speechSynthesis.cancel()
  }, [story.id])

  useEffect(() => {
    return () => { window.speechSynthesis.cancel() }
  }, [])

  // Scroll to bookmarked word when navigating from the Saved list
  useEffect(() => {
    if (!scrollToHighlight) return
    const id = setTimeout(() => {
      markRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 350)
    return () => clearTimeout(id)
  }, [scrollToHighlight, story.id])

  // ── Selection popup ──────────────────────────────────────────
  const dismissPopup = useCallback(() => {
    setSelPopup(null)
    // Use rAF so the click event that triggered this finishes first
    requestAnimationFrame(() => {
      window.getSelection()?.removeAllRanges()
      document.getSelection()?.removeAllRanges()
    })
  }, [])

  const handleSaveSelection = useCallback(() => {
    if (!selPopup) return
    const saved: TextBookmarkSelection = {
      selectedText: selPopup.text,
      paragraphIndex: selPopup.paragraphIndex,
      startOffset: selPopup.startOffset,
    }
    setSelPopup(null)
    onAddBookmark(saved)
    setFlashBookmark(saved)
    // Flash fades then text bookmark provides the permanent highlight
    requestAnimationFrame(() => {
      window.getSelection()?.removeAllRanges()
    })
    setTimeout(() => setFlashBookmark(null), 1600)
  }, [selPopup, onAddBookmark])

  const updatePopup = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) { setSelPopup(null); return }
    const rawText = sel.toString()
    const text = rawText.trim()
    if (text.length < 2) { setSelPopup(null); return }
    if (!bodyRef.current) return
    try {
      const range = sel.getRangeAt(0)
      if (!bodyRef.current.contains(range.commonAncestorContainer)) {
        setSelPopup(null); return
      }
      const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer as Element
        : range.startContainer.parentElement
      const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE
        ? range.endContainer as Element
        : range.endContainer.parentElement
      const startParagraph = startElement?.closest('.detail-para') as HTMLElement | null
      const endParagraph = endElement?.closest('.detail-para') as HTMLElement | null
      if (!startParagraph || !endParagraph || startParagraph !== endParagraph) {
        setSelPopup(null); return
      }
      const paraIndexRaw = startParagraph.dataset.paraIndex
      const paragraphIndex = paraIndexRaw ? Number(paraIndexRaw) : Number.NaN
      if (Number.isNaN(paragraphIndex)) {
        setSelPopup(null); return
      }
      const leadingTrim = rawText.length - rawText.trimStart().length
      const beforeRange = range.cloneRange()
      beforeRange.selectNodeContents(startParagraph)
      beforeRange.setEnd(range.startContainer, range.startOffset)
      const startOffset = beforeRange.toString().length + leadingTrim
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) { setSelPopup(null); return }

      // ── Position: above the selection by default, below if near top ──
      const POPUP_W = 192
      const POPUP_H = 44
      const rawX = rect.left + rect.width / 2
      const x = Math.max(POPUP_W / 2 + 8, Math.min(window.innerWidth - POPUP_W / 2 - 8, rawX))
      // Prefer above; fall back to below if not enough room
      const y = rect.top >= POPUP_H + 16
        ? rect.top - POPUP_H - 10
        : rect.bottom + 10

      const isMobileSelectionUI = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
      if (isMobileSelectionUI) {
        const POPUP_H_MOBILE = 44
        const SAFE_BOTTOM = 110
        const MENU_CLEARANCE = 62
        const baseY = rect.bottom + MENU_CLEARANCE
        const maxY = window.innerHeight - SAFE_BOTTOM - POPUP_H_MOBILE
        const minY = 12
        const fallbackAbove = rect.top - POPUP_H_MOBILE - 18
        const y = baseY <= maxY
          ? baseY
          : Math.max(minY, fallbackAbove)
        setSelPopup({
          x: window.innerWidth / 2,
          y,
          text,
          mobile: true,
          paragraphIndex,
          startOffset,
        })
        return
      }
      setSelPopup({ x, y, text, mobile: false, paragraphIndex, startOffset })
    } catch { setSelPopup(null) }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onSlow = () => { clearTimeout(timer); timer = setTimeout(updatePopup, 120) }
    const onFast = () => { clearTimeout(timer); timer = setTimeout(updatePopup, 20) }
    document.addEventListener('selectionchange', onSlow, { passive: true })
    document.addEventListener('mouseup', onFast, { passive: true })
    document.addEventListener('touchend', onFast, { passive: true })
    return () => {
      clearTimeout(timer)
      document.removeEventListener('selectionchange', onSlow)
      document.removeEventListener('mouseup', onFast)
      document.removeEventListener('touchend', onFast)
    }
  }, [updatePopup])

  // Dismiss on click outside the popup
  useEffect(() => {
    if (!selPopup) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!(e.target as Element).closest('.sel-popup')) dismissPopup()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [selPopup, dismissPopup])

  const paragraphs = extra?.paragraphs ?? (extra ? [extra.body] : [])

  const startAudio = useCallback((startChar = 0) => {
    window.speechSynthesis.cancel()
    const fullText = paragraphs.join('. ')
    const textToRead = fullText.substring(startChar)
    if (!textToRead) return

    const utterance = new SpeechSynthesisUtterance(textToRead)
    utterance.rate = audioSpeed
    utterance.onend = () => {
      setIsAudioPlaying(false)
      setAudioProgress(100)
    }
    utterance.onboundary = (event) => {
      const totalChars = fullText.length || 1
      const currentGlobalPos = startChar + event.charIndex
      setAudioProgress((currentGlobalPos / totalChars) * 100)
    }
    window.speechSynthesis.speak(utterance)
    setIsAudioPlaying(true)
    setIsAudioOpen(true)
  }, [paragraphs, audioSpeed])

  const toggleAudio = useCallback(() => {
    if (isAudioPlaying) {
      window.speechSynthesis.pause()
      setIsAudioPlaying(false)
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      } else {
        const fullText = paragraphs.join('. ')
        const startChar = Math.floor((audioProgress / 100) * fullText.length)
        startAudio(startChar)
      }
      setIsAudioPlaying(true)
      setIsAudioOpen(true)
    }
  }, [isAudioPlaying, startAudio, audioProgress, paragraphs])

  const changeSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const nextIdx = (speeds.indexOf(audioSpeed) + 1) % speeds.length
    const nextSpeed = speeds[nextIdx]
    setAudioSpeed(nextSpeed)
    if (isAudioPlaying) {
      const fullText = paragraphs.join('. ')
      const startChar = Math.floor((audioProgress / 100) * fullText.length)
      startAudio(startChar)
    }
  }, [audioSpeed, isAudioPlaying, startAudio, audioProgress, paragraphs])

/*
  const skipAudio = useCallback((dir: 'fwd' | 'back') => {
    const fullText = paragraphs.join('. ')
    const step = Math.floor(fullText.length * 0.05) // skip 5%
    const currentPos = Math.floor((audioProgress / 100) * fullText.length)
    const newPos = dir === 'fwd' 
      ? Math.min(fullText.length - 10, currentPos + step)
      : Math.max(0, currentPos - step)
    
    setAudioProgress((newPos / fullText.length) * 100)
    startAudio(newPos)
  }, [audioProgress, paragraphs, startAudio])
*/

/*
  const stopAudio = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsAudioPlaying(false)
    setAudioProgress(0)
  }, [])
*/

  const closeAudio = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsAudioPlaying(false)
    setIsAudioOpen(false)
    setAudioProgress(0)
    setSeekValue(0)
  }, [])

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(audioProgress)
    }
  }, [audioProgress, isSeeking])

  const handleSeekStart = () => {
    setIsSeeking(true)
  }

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(Number(e.target.value))
  }

  const handleSeekEnd = () => {
    setIsSeeking(false)
    const fullText = paragraphs.join('. ')
    const newPos = Math.floor((seekValue / 100) * fullText.length)
    startAudio(newPos)
  }

  const activeHighlight = flashBookmark ?? textBookmark ?? null

  const openQuizSubScreen = useCallback(() => setActiveSubScreen('quiz'), [])
  const openOpinionsSubScreen = useCallback(() => setActiveSubScreen('opinions'), [])
  const openImpactSubScreen = useCallback(() => setActiveSubScreen('impact'), [])
  const closeSubScreen = useCallback(() => setActiveSubScreen(null), [])

  return (
    <div className="detail-screen">
      {/* Popup — rendered via portal into document.body so no ancestor CSS can trap it */}
      {selPopup && createPortal(
        <button
          type="button"
          className={`sel-popup${selPopup.mobile ? ' sel-popup--mobile' : ''}`}
          style={{ left: selPopup.x, top: selPopup.y }}
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleSaveSelection}
        >
          <IconBookmarkSmall />
          Bookmark selection
        </button>,
        document.body
      )}

      <div className="detail-hero">
        <img src={story.image} alt="" className="detail-hero__img" />
        <div className="detail-hero__grad" aria-hidden />
        <button
          type="button"
          className={`detail-bm-btn${isBookmarked ? ' detail-bm-btn--saved' : ''}`}
          onClick={onToggleBookmark}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this article'}
          aria-pressed={isBookmarked}
        >
          {isBookmarked ? <IconBookmarkFilled /> : <IconBookmarkOutline />}
        </button>
      </div>

      <div className="detail-body" ref={bodyRef}>
        <div className="detail-tag-row">
          <ArticleTag tag={story.tag} />
        </div>
        <h2 className="detail-title">{story.title}</h2>
        <p className="detail-dek">{story.dek}</p>
        <div className="detail-meta">
          <span>{story.readTime}</span>
          <span className="detail-meta__dot" aria-hidden />
          <span>In-depth</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`icon-btn${showInsights ? ' icon-btn--active' : ''}`}
              onClick={() => setShowInsights(!showInsights)}
              aria-label="Toggle Insights"
              title="Toggle AI Key Insights"
            >
              <IconInsightsList />
            </button>
            <button
              type="button"
              className={`icon-btn${isAudioOpen ? ' icon-btn--active' : ''}`}
              onClick={toggleAudio}
              aria-label="Listen to article"
              title="Listen to natural voice read-out"
            >
              <IconAudio />
            </button>
            <button type="button" className="icon-btn" aria-label="Share article">
              <IconShare />
            </button>
          </div>
        </div>

        {showInsights && extra?.shorts && (
          <div className="insights-panel">
            <div className="insights-panel__head">
              <IconInsightsList />
              <h3 className="insights-panel__title">Key Insights</h3>
              <button
                type="button"
                className="insights-panel__close"
                onClick={() => setShowInsights(false)}
                aria-label="Close Insights"
              >
                <IconClose />
              </button>
            </div>
            <div className="insights-list">
              {extra.shorts.map((s, i) => (
                <div key={i} className="insight-item">
                  <div className="insight-item__bullet" />
                  <div className="insight-item__content">
                    <strong className="insight-item__label">{s.headline}</strong>
                    <span className="insight-item__text">{s.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {(() => {
          // Prefer exact saved location; fallback to text search for older bookmarks.
          const locatedParaIdx = (activeHighlight
            && typeof activeHighlight.paragraphIndex === 'number'
            && activeHighlight.paragraphIndex >= 0
            && activeHighlight.paragraphIndex < paragraphs.length
            && paragraphs[activeHighlight.paragraphIndex].includes(activeHighlight.selectedText))
            ? activeHighlight.paragraphIndex
            : -1
          const firstMatchIdx = activeHighlight
            ? (locatedParaIdx >= 0
              ? locatedParaIdx
              : paragraphs.findIndex(p => p.includes(activeHighlight.selectedText)))
            : -1
          const highlightStartOffset = locatedParaIdx >= 0 ? activeHighlight?.startOffset : undefined
          return paragraphs.map((p, i) => {
            const isHighlightedPara = i === firstMatchIdx
            const isFlashing = isHighlightedPara && !!flashBookmark
            return (
              <p key={i} data-para-index={i} className={`detail-para${isHighlightedPara ? ' detail-para--highlighted' : ''}`}>
                {isHighlightedPara ? (
                  <ParagraphWithHighlight
                    text={p}
                    target={activeHighlight!.selectedText}
                    startOffset={highlightStartOffset}
                    markRef={markRef}
                    flash={isFlashing}
                  />
                ) : p}
              </p>
            )
          })
        })()}
      </div>

      {/* Shorts / Timeline */}
      <div className="detail-actions">
        {onTimeline && (
          <button type="button" className="detail-action-btn detail-action-btn--timeline" onClick={onTimeline}>
            <IconChronology />
            Timeline
          </button>
        )}
        {opinions && (
          <button
            type="button"
            className="detail-action-btn detail-action-btn--opinions"
            onClick={openOpinionsSubScreen}
          >
            <IconOpinions />
            Opinions
          </button>
        )}
        {impact && (
          <button
            type="button"
            className="detail-action-btn detail-action-btn--impact"
            onClick={openImpactSubScreen}
          >
            <IconImpact />
            Impact
          </button>
        )}
        <button type="button" className="detail-action-btn detail-action-btn--quiz" onClick={openQuizSubScreen}>
          <IconQuiz />
          Trivia Trek
        </button>
      </div>

      {/* Reaction bar */}
      <ReactionBar
        story={story}
        getReaction={getReaction}
        setReaction={setReaction}
        getRefinement={getRefinement}
        setRefinement={setRefinement}
      />

      {/* Comments */}
      <CommentsSection storyId={story.id} />

      {activeSubScreen === 'quiz' && (
        <DetailSubScreen title="Trivia Trek" accent="quiz" story={story} onClose={closeSubScreen}>
          <ArticleQuiz story={story} onClosePanel={closeSubScreen} />
        </DetailSubScreen>
      )}
      {activeSubScreen === 'opinions' && (
        <DetailSubScreen title="Opinions" accent="opinions" story={story} onClose={closeSubScreen}>
          <OpinionsPanel story={story} onClosePanel={closeSubScreen} />
        </DetailSubScreen>
      )}
      {activeSubScreen === 'impact' && (
        <DetailSubScreen title="Impact" accent="impact" story={story} onClose={closeSubScreen}>
          <ImpactPanel story={story} onClosePanel={closeSubScreen} />
        </DetailSubScreen>
      )}
      {isAudioOpen && createPortal(
        <div className="audio-player">
          <div className="audio-player__top">
            <img src={story.image} alt="" className="audio-player__thumb" />
            <div className="audio-player__info">
              <h4 className="audio-player__title">{story.title}</h4>
              <div className="audio-player__status">
                {isAudioPlaying ? (
                  <>
                    <div className="audio-waveform">
                      <div className="waveform-bar" />
                      <div className="waveform-bar" />
                      <div className="waveform-bar" />
                      <div className="waveform-bar" />
                    </div>
                    <span>Speaking...</span>
                  </>
                ) : (
                  <span>Paused</span>
                )}
              </div>
            </div>
            <button type="button" className="audio-ctl-btn audio-ctl-btn--close" onClick={closeAudio} aria-label="Close Player">
              <IconClose />
            </button>
          </div>

          <div className="audio-player__mid">
            <div className="audio-slider-outer">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={seekValue} 
                className="audio-input"
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                aria-label="Seek through article"
              />
              {isSeeking && (
                <div 
                  className="audio-tooltip" 
                  style={{ left: `${seekValue}%` }}
                >
                  {Math.round(seekValue)}%
                </div>
              )}
            </div>
            <div className="audio-timer">
              <span>Natural Voice</span>
              <span>{Math.round(seekValue)}%</span>
            </div>
          </div>

          <div className="audio-player__controls">
            <button type="button" className="audio-ctl-btn audio-ctl-btn--speed" onClick={changeSpeed}>
              {audioSpeed}x
            </button>

            <div className="audio-player__main-btn">
              <button type="button" className="audio-ctl-btn audio-ctl-btn--play" onClick={toggleAudio} aria-label={isAudioPlaying ? 'Pause' : 'Play'}>
                {isAudioPlaying ? <IconPauseLarge /> : <IconPlayLarge />}
              </button>
            </div>

            <div style={{ width: 58 }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

function ReelSlideBody({ story, segment }: { story: Story; segment: ShortSegment }) {
  const src = segment.image ?? story.image
  return (
    <>
      <img src={src} alt="" className="reel-card__img" draggable={false} />
      <div className="reel-card__grad" />
      <div className="reel-card__textblock">
        <div className="reel-card__tag-row">
          <ArticleTag tag={story.tag} />
        </div>
        <h2 className="reel-card__title">{segment.headline}</h2>
        <p className="reel-card__bit">{segment.text}</p>
      </div>
    </>
  )
}

const REEL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const REEL_DURATION_MS = 320
const REEL_SNAP_MS = 240

function ShortsStack({
  story,
  onClose,
  prefersReducedMotion,
}: {
  story: Story | null
  onClose: () => void
  prefersReducedMotion: boolean
}) {
  const extra = story ? STORY_CONTENT[story.id] : undefined
  const shorts = extra?.shorts ?? []
  const [idx, setIdx] = useState(0)
  const [dragY, setDragY] = useState(0)
  const dragYRef = useRef(0)
  const dragStart = useRef<{ y: number; id: number } | null>(null)
  const wheelCooldown = useRef(false)
  const [animating, setAnimating] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLDivElement>(null)
  const prevRef = useRef<HTMLDivElement>(null)
  const [layoutH, setLayoutH] = useState(400)

  const vh = () => viewportRef.current?.offsetHeight ?? layoutH

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const apply = () => setLayoutH(el.offsetHeight)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [story?.id])

  useEffect(() => {
    if (animating) return
    const h = layoutH
    const cur = currentRef.current
    const nxt = nextRef.current
    const prv = prevRef.current
    if (cur) cur.style.transform = `translateY(${dragY}px)`
    if (nxt) nxt.style.transform = `translateY(${h + dragY}px)`
    if (prv) prv.style.transform = `translateY(${-h + dragY}px)`
  }, [dragY, layoutH, animating, idx])

  useEffect(() => {
    if (!story) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [story])

  useEffect(() => {
    setIdx(0)
    dragYRef.current = 0
    setDragY(0)
  }, [story?.id])

  const goPrevInstant = useCallback(() => {
    dragYRef.current = 0
    setDragY(0)
    setIdx((i) => (i <= 0 ? 0 : i - 1))
  }, [])

  const goNextInstant = useCallback(() => {
    dragYRef.current = 0
    setDragY(0)
    setIdx((i) => {
      if (shorts.length === 0) return i
      if (i >= shorts.length - 1) {
        onClose()
        return i
      }
      return i + 1
    })
  }, [shorts.length, onClose])

  const runSnapBack = useCallback(
    (dy: number) => {
      if (prefersReducedMotion) {
        dragYRef.current = 0
        setDragY(0)
        return
      }
      const h = vh()
      const cur = currentRef.current
      const nxt = nextRef.current
      const prv = prevRef.current
      if (!cur) {
        dragYRef.current = 0
        setDragY(0)
        return
      }
      flushSync(() => setAnimating(true))
      const anims: Animation[] = [
        cur.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0px)' }],
          { duration: REEL_SNAP_MS, easing: REEL_EASE, fill: 'none' },
        ),
      ]
      if (nxt) {
        anims.push(
          nxt.animate(
            [{ transform: `translateY(${h + dy}px)` }, { transform: `translateY(${h}px)` }],
            { duration: REEL_SNAP_MS, easing: REEL_EASE, fill: 'none' },
          ),
        )
      }
      if (prv) {
        anims.push(
          prv.animate(
            [{ transform: `translateY(${-h + dy}px)` }, { transform: `translateY(${-h}px)` }],
            { duration: REEL_SNAP_MS, easing: REEL_EASE, fill: 'none' },
          ),
        )
      }
      void Promise.all(anims.map((a) => a.finished)).then(() => {
        anims.forEach((a) => a.cancel())
        dragYRef.current = 0
        setDragY(0)
        setAnimating(false)
      })
    },
    [prefersReducedMotion],
  )

  const runCommitNext = useCallback(
    (startDy: number) => {
      const h = vh()
      const cur = currentRef.current
      if (idx >= shorts.length - 1) {
        if (prefersReducedMotion) {
          onClose()
          return
        }
        if (!cur) {
          onClose()
          return
        }
        flushSync(() => setAnimating(true))
        const a = cur.animate(
          [{ transform: `translateY(${startDy}px)` }, { transform: `translateY(${-h}px)` }],
          { duration: REEL_DURATION_MS, easing: REEL_EASE, fill: 'none' },
        )
        void a.finished.then(() => {
          a.cancel()
          setAnimating(false)
          onClose()
        })
        return
      }
      const nxt = nextRef.current
      if (prefersReducedMotion) {
        goNextInstant()
        return
      }
      if (!cur || !nxt) {
        goNextInstant()
        return
      }
      flushSync(() => setAnimating(true))
      const a1 = cur.animate(
        [{ transform: `translateY(${startDy}px)` }, { transform: `translateY(${-h}px)` }],
        { duration: REEL_DURATION_MS, easing: REEL_EASE, fill: 'none' },
      )
      const a2 = nxt.animate(
        [{ transform: `translateY(${h + startDy}px)` }, { transform: 'translateY(0px)' }],
        { duration: REEL_DURATION_MS, easing: REEL_EASE, fill: 'none' },
      )
      void Promise.all([a1.finished, a2.finished]).then(() => {
        a1.cancel()
        a2.cancel()
        setIdx((i) => i + 1)
        dragYRef.current = 0
        setDragY(0)
        setAnimating(false)
      })
    },
    [idx, shorts.length, prefersReducedMotion, onClose, goNextInstant],
  )

  const runCommitPrev = useCallback(
    (startDy: number) => {
      if (idx <= 0) return
      const h = vh()
      const cur = currentRef.current
      const prv = prevRef.current
      if (prefersReducedMotion) {
        goPrevInstant()
        return
      }
      if (!cur || !prv) {
        goPrevInstant()
        return
      }
      flushSync(() => setAnimating(true))
      const a1 = cur.animate(
        [{ transform: `translateY(${startDy}px)` }, { transform: `translateY(${h}px)` }],
        { duration: REEL_DURATION_MS, easing: REEL_EASE, fill: 'none' },
      )
      const a2 = prv.animate(
        [{ transform: `translateY(${-h + startDy}px)` }, { transform: 'translateY(0px)' }],
        { duration: REEL_DURATION_MS, easing: REEL_EASE, fill: 'none' },
      )
      void Promise.all([a1.finished, a2.finished]).then(() => {
        a1.cancel()
        a2.cancel()
        setIdx((i) => i - 1)
        dragYRef.current = 0
        setDragY(0)
        setAnimating(false)
      })
    },
    [idx, prefersReducedMotion, goPrevInstant],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (animating) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') runCommitNext(0)
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') runCommitPrev(0)
    }
    if (story) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [story, onClose, runCommitNext, runCommitPrev, animating])

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (animating) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { y: e.clientY, id: e.pointerId }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (animating) return
    if (!dragStart.current || dragStart.current.id !== e.pointerId) return
    const dy = e.clientY - dragStart.current.y
    dragYRef.current = dy
    setDragY(dy)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || dragStart.current.id !== e.pointerId) return
    dragStart.current = null
    if (animating) return
    const dy = dragYRef.current
    const threshold = 56
    if (Math.abs(dy) <= threshold) {
      runSnapBack(dy)
      return
    }
    if (dy < -threshold) runCommitNext(dy)
    else if (dy > threshold) runCommitPrev(dy)
  }

  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (animating) return
    if (wheelCooldown.current) return
    wheelCooldown.current = true
    window.setTimeout(() => {
      wheelCooldown.current = false
    }, 380)
    if (e.deltaY > 12) runCommitNext(0)
    else if (e.deltaY < -12) runCommitPrev(0)
  }

  if (!story || !extra || shorts.length === 0) return null

  const currentSeg = shorts[idx]
  const nextSeg = idx + 1 < shorts.length ? shorts[idx + 1] : null
  const prevSeg = idx > 0 ? shorts[idx - 1] : null

  return (
    <div className="reel-backdrop" role="presentation">
      <button type="button" className="reel-backdrop__close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <div className="reel-root" role="dialog" aria-modal="true" aria-label="Read through">
        <header className="reel-header">
          <span className="reel-header__brand">Newsmuncher</span>
          <span className="reel-header__step">
            {idx + 1} / {shorts.length}
          </span>
        </header>

        <nav className="reel-progress" aria-label="Segment">
          {shorts.map((_, i) => (
            <span key={i} className={i === idx ? 'reel-progress__seg reel-progress__seg--active' : 'reel-progress__seg'} />
          ))}
        </nav>

        <div
          className={`reel-stage ${animating ? 'reel-stage--animating' : ''}`}
          onWheel={onWheel}
          ref={viewportRef}
        >
          {prevSeg && (
            <div
              ref={prevRef}
              className="reel-slide reel-slide--prev"
              aria-hidden
            >
              <div className="reel-card reel-card--layer">
                <ReelSlideBody story={story} segment={prevSeg} />
              </div>
            </div>
          )}
          {nextSeg && (
            <div
              ref={nextRef}
              className="reel-slide reel-slide--next"
              aria-hidden
            >
              <div className="reel-card reel-card--layer">
                <ReelSlideBody story={story} segment={nextSeg} />
              </div>
            </div>
          )}
          <div
            ref={currentRef}
            className="reel-slide reel-slide--current"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div className="reel-card reel-card--front">
              <ReelSlideBody story={story} segment={currentSeg} />
            </div>
          </div>
        </div>

        <p className="reel-hint">Swipe up for next · down for previous</p>
      </div>
    </div>
  )
}

const TOP_STORIES: Story[] = [
  {
    id: '1',
    title: 'Arctic corridors reshape global shipping',
    dek: 'The melting of Arctic ice is opening new, shorter shipping routes between Asia and Europe. These corridors could significantly reduce transit times and fuel costs, though environmental concerns and geopolitical tensions remain high as nations compete for control over these emerging lanes of global trade.',
    image: 'https://picsum.photos/seed/newsmuncher-top1/800/450',
    tag: 'World',
    readTime: '4 min',
  },
  {
    id: '2',
    title: 'Grid batteries hit cost parity in twelve regions',
    dek: 'Utility-scale battery storage has reached a critical tipping point, achieving cost parity with traditional power plants in twelve major regions. This milestone is accelerating the transition to renewable energy as utilities rapidly expand their storage capacities to balance intermittent solar and wind power with growing demand.',
    image: 'https://picsum.photos/seed/newsmuncher-top2/800/450',
    tag: 'Tech',
    readTime: '6 min',
  },
  {
    id: '3',
    title: 'Parliament votes on cross-border data rules',
    dek: 'The latest parliamentary vote on cross-border data regulations signals a major shift for the digital economy. The proposed framework aims to harmonize data flows while protecting user privacy, but publishers and tech platforms remain divided on how these rules will affect advertising revenue and content distribution.',
    image: 'https://picsum.photos/seed/newsmuncher-top3/800/450',
    tag: 'Politics',
    readTime: '5 min',
  },
  {
    id: '4',
    title: 'Underdogs clinch playoff spot in overtime thriller',
    dek: 'In a stunning display of resilience, the underdogs secured their playoff berth with a narrow overtime victory. A massive late-game surge flipped the momentum, silencing the home crowd and proving that this squad has the grit to compete with the league’s top-seeded teams in the upcoming series.',
    image: 'https://picsum.photos/seed/newsmuncher-top4/800/450',
    tag: 'Sports',
    readTime: '3 min',
  },
  {
    id: '5',
    title: 'What early adopters learned from car-free Sundays',
    dek: 'Recent pilots of car-free Sundays across five major cities have provided a wealth of data on urban mobility. Early results show a surprising boost in local retail foot traffic and improved transit efficiency, leading urban planners to consider more permanent pedestrian-friendly zones as part of long-term sustainable growth.',
    image: 'https://picsum.photos/seed/newsmuncher-top5/800/450',
    tag: 'World',
    readTime: '4 min',
  },
  {
    id: '6',
    title: 'Open models close the gap on coding benchmarks',
    dek: 'The latest open-source AI models are narrowing the performance gap with proprietary systems on key coding benchmarks. Engineering teams are reporting significant productivity gains by deploying these smaller, local stacks, which offer faster code review cycles while maintaining higher levels of data privacy and internal security.',
    image: 'https://picsum.photos/seed/newsmuncher-top6/800/450',
    tag: 'Tech',
    readTime: '7 min',
  },
]

/** Topic timeline for chronology screen (story id → coverage thread) */
type TimelineEvent = {
  /** ISO date string */
  date: string
  headline: string
  summary: string
  /** Optional thumbnail illustrating the event */
  image?: string
}

type TopicTimeline = {
  topicTitle: string
  tag: TagId
  intro: string
  events: TimelineEvent[]
}

const CHRONOLOGY_BY_STORY_ID: Record<string, TopicTimeline> = {
  '1': {
    topicTitle: 'Arctic shipping & northern sea routes',
    tag: 'World',
    intro: 'How melting ice and new pilot programs reshaped Asia–Europe routing debates.',
    events: [
      {
        date: '2019-09-12',
        headline: 'IMO tightens polar fuel rules',
        summary: 'Shipping regulators adopt stricter bunker standards for Arctic waters.',
        image: 'https://picsum.photos/seed/nm-tl-arctic-1/600/360',
      },
      {
        date: '2021-03-04',
        headline: 'First commercial trial via Northern Sea Route',
        summary: 'A container line tests a two-week shorter leg with icebreaker escort.',
        image: 'https://picsum.photos/seed/nm-tl-arctic-2/600/360',
      },
      {
        date: '2022-11-18',
        headline: 'Insurers publish joint risk framework',
        summary: 'Underwriters share salvage and environmental caps for experimental lanes.',
        image: 'https://picsum.photos/seed/nm-tl-arctic-3/600/360',
      },
      {
        date: '2024-06-02',
        headline: 'EU ports fund ice pilot training',
        summary: 'Rotterdam and Hamburg split grants for tug and navigation crews.',
        image: 'https://picsum.photos/seed/nm-tl-arctic-4/600/360',
      },
      {
        date: '2025-01-22',
        headline: 'Carriers report measurable fuel savings',
        summary: 'Early adopters log lower bunker use on northern strings versus Suez.',
        image: 'https://picsum.photos/seed/nm-tl-arctic-5/600/360',
      },
      {
        date: '2026-03-10',
        headline: 'Corridor standards enter draft at UN body',
        summary: 'Traffic separation and spill rules aim to scale traffic before volume spikes.',
        image: 'https://picsum.photos/seed/nm-tl-arctic-6/600/360',
      },
    ],
  },
  '2': {
    topicTitle: 'Grid-scale battery storage',
    tag: 'Tech',
    intro: 'From pilot projects to procurement waves—how storage economics flipped.',
    events: [
      { date: '2020-04-08', headline: 'First gigawatt-hour state mandate', summary: 'A western grid sets a storage procurement floor for peak shaving.' , image: 'https://picsum.photos/seed/nm-tl-battery-1/600/360' },
      { date: '2021-10-30', headline: 'Lithium supply crunch hits developers', summary: 'Lead times stretch; utilities delay two utility-scale awards.' , image: 'https://picsum.photos/seed/nm-tl-battery-2/600/360' },
      { date: '2023-02-14', headline: 'Iron-air pilots win capacity slots', summary: 'Duration-focused tech lands contracts where lithium is overkill.' , image: 'https://picsum.photos/seed/nm-tl-battery-3/600/360' },
      { date: '2024-07-01', headline: 'Twelve markets show cost parity with gas peakers', summary: 'Analysts publish levelized-cost crossover paired with wind and solar.' , image: 'https://picsum.photos/seed/nm-tl-battery-4/600/360' },
      { date: '2025-09-19', headline: 'Interconnection queue reforms proposed', summary: 'Grid operators float faster studies for storage-only upgrades.' , image: 'https://picsum.photos/seed/nm-tl-battery-5/600/360' },
      { date: '2026-02-05', headline: 'Utilities sign record winter hedges', summary: 'Procurement rounds exceed forecasts as renewables build-outs accelerate.' , image: 'https://picsum.photos/seed/nm-tl-battery-6/600/360' },
    ],
  },
  '3': {
    topicTitle: 'Cross-border data & publisher rules',
    tag: 'Politics',
    intro: 'Legislative timeline from first white papers to a live draft in parliament.',
    events: [
      { date: '2018-05-20', headline: 'Commission opens consultation', summary: 'Publishers and platforms submit initial positions on data flows.' , image: 'https://picsum.photos/seed/nm-tl-data-1/600/360' },
      { date: '2021-11-03', headline: 'UK–EU joint working group', summary: 'Negotiators define scope for “public interest” syndication.' , image: 'https://picsum.photos/seed/nm-tl-data-2/600/360' },
      { date: '2023-08-16', headline: 'Lobby filings peak before draft text', summary: 'Trade groups file competing definitions of liability carve-outs.' , image: 'https://picsum.photos/seed/nm-tl-data-3/600/360' },
      { date: '2025-04-28', headline: 'Draft advances to committee', summary: 'Cross-border data chapter splits publishers and platforms on safe harbors.' , image: 'https://picsum.photos/seed/nm-tl-data-4/600/360' },
      { date: '2026-01-15', headline: 'Second reading scheduled', summary: 'Amendments target compliance costs for regional newsrooms.' , image: 'https://picsum.photos/seed/nm-tl-data-5/600/360' },
    ],
  },
  '4': {
    topicTitle: 'Playoff race & overtime thriller',
    tag: 'Sports',
    intro: 'Key moments in the late-season push for a postseason berth.',
    events: [
      { date: '2026-02-01', headline: 'Star guard returns from injury', summary: 'Team goes 4–1 in first five games back.' , image: 'https://picsum.photos/seed/nm-tl-sport-1/600/360' },
      { date: '2026-02-20', headline: 'Bench depth tested in back-to-backs', summary: 'Coach shortens rotation to eight players as standings tighten.' , image: 'https://picsum.photos/seed/nm-tl-sport-2/600/360' },
      { date: '2026-03-08', headline: 'Rival loss opens door in standings', summary: 'Conference six-seed becomes reachable with two weeks left.' , image: 'https://picsum.photos/seed/nm-tl-sport-3/600/360' },
      { date: '2026-03-28', headline: 'Overtime thriller clinches playoff spot', summary: 'Late 12–2 run forces OT; franchise reaches postseason for first time in four years.' , image: 'https://picsum.photos/seed/nm-tl-sport-4/600/360' },
    ],
  },
  '5': {
    topicTitle: 'Car-free Sunday pilots',
    tag: 'World',
    intro: 'Five cities trial pedestrian-first corridors and share early metrics.',
    events: [
      { date: '2024-04-07', headline: 'Pilot announced in five cities', summary: 'Monthly closures on paired corridors for comparison studies.' , image: 'https://picsum.photos/seed/nm-tl-carfree-1/600/360' },
      { date: '2024-09-15', headline: 'Retail mixed by block', summary: 'Cafés up; auto-dependent shops on fringes report softer traffic.' , image: 'https://picsum.photos/seed/nm-tl-carfree-2/600/360' },
      { date: '2025-02-02', headline: 'Transit reliability improves', summary: 'Buses gain consistent headways where curb lanes stay clear.' , image: 'https://picsum.photos/seed/nm-tl-carfree-3/600/360' },
      { date: '2025-08-20', headline: 'Resident surveys skew positive', summary: 'Walkers and cyclists rate programs highly; drivers split.' , image: 'https://picsum.photos/seed/nm-tl-carfree-4/600/360' },
      { date: '2026-03-01', headline: 'Expansion vote slated for fall', summary: 'Councils weigh evening pilots and wider zones.' , image: 'https://picsum.photos/seed/nm-tl-carfree-5/600/360' },
    ],
  },
  '6': {
    topicTitle: 'Open models & coding assistants',
    tag: 'Tech',
    intro: 'Benchmark gains, local stacks, and enterprise adoption hurdles.',
    events: [
      { date: '2022-06-10', headline: 'First open weights near closed API on HumanEval', summary: 'Community fine-tunes narrow the gap on public leaderboards.' , image: 'https://picsum.photos/seed/nm-tl-ai-1/600/360' },
      { date: '2023-12-05', headline: 'On-device assistants enter beta', summary: 'Teams pair quantized models with IDEs under strict data policies.' , image: 'https://picsum.photos/seed/nm-tl-ai-2/600/360' },
      { date: '2024-09-22', headline: 'Review cycle times drop in surveys', summary: 'Engineers report faster diffs when assistants run locally.' , image: 'https://picsum.photos/seed/nm-tl-ai-3/600/360' },
      { date: '2025-11-08', headline: 'Enterprise security reviews lag pilots', summary: 'Vendor questionnaires on training data outlast technical tests.' , image: 'https://picsum.photos/seed/nm-tl-ai-4/600/360' },
      { date: '2026-03-18', headline: 'Maintainers promise better tool-use in Q3', summary: 'Release roadmap targets reliability before broad internal rollout.' , image: 'https://picsum.photos/seed/nm-tl-ai-5/600/360' },
    ],
  },
  f1: {
    topicTitle: 'Central banks & market repricing',
    tag: 'World',
    intro: 'Macro prints and FX volatility through recent policy cycles.',
    events: [
      { date: '2023-03-22', headline: 'First “higher for longer” guidance', summary: 'Major central bank signals extended restrictive stance.' , image: 'https://picsum.photos/seed/nm-tl-finance-1/600/360' },
      { date: '2024-07-31', headline: 'CPI surprise swings FX majors', summary: 'One-week implied volatility spikes across G10 pairs.' , image: 'https://picsum.photos/seed/nm-tl-finance-2/600/360' },
      { date: '2025-02-14', headline: 'Credit spreads tighten on IG names', summary: 'Issuance stays light; investors reach for quality.' , image: 'https://picsum.photos/seed/nm-tl-finance-3/600/360' },
      { date: '2025-11-09', headline: 'Labor data resets term-premium debate', summary: 'Bond curves steepen into year-end policy windows.' , image: 'https://picsum.photos/seed/nm-tl-finance-4/600/360' },
      { date: '2026-03-25', headline: 'Mixed signals from bank guidance', summary: 'Traders weigh cooling goods inflation against sticky services.' , image: 'https://picsum.photos/seed/nm-tl-finance-5/600/360' },
    ],
  },
  f2: {
    topicTitle: 'Climate resilience & coastal grants',
    tag: 'Politics',
    intro: 'From fund launch to first tranche awards and audit rules.',
    events: [
      { date: '2023-01-18', headline: 'Resilience fund authorized', summary: 'Legislature sets blended public–private structure.' , image: 'https://picsum.photos/seed/nm-tl-climate-1/600/360' },
      { date: '2024-05-06', headline: 'Grant rules favor updated flood maps', summary: 'Cities with fresh vulnerability models move up the queue.' , image: 'https://picsum.photos/seed/nm-tl-climate-2/600/360' },
      { date: '2025-03-22', headline: 'First checks go to surge barriers', summary: 'Coastal cities prioritize storm surge and microgrid backups.' , image: 'https://picsum.photos/seed/nm-tl-climate-3/600/360' },
      { date: '2026-01-30', headline: 'Annual audit requirements kick in', summary: 'Recipients must report resilience metrics or face clawbacks.' , image: 'https://picsum.photos/seed/nm-tl-climate-4/600/360' },
    ],
  },
  f3: {
    topicTitle: 'Tour stop & moving day',
    tag: 'Sports',
    intro: 'Course records, conditions, and the leaderboard into Sunday.',
    events: [
      { date: '2026-03-26', headline: 'Course setup firms greens', summary: 'Sub-air systems dial moisture ahead of the weekend.' , image: 'https://picsum.photos/seed/nm-tl-golf-1/600/360' },
      { date: '2026-03-28', headline: 'Moving day course record', summary: 'Rookie posts 62 with five birdies in six holes on the back nine.' , image: 'https://picsum.photos/seed/nm-tl-golf-2/600/360' },
      { date: '2026-03-29', headline: 'Wind shifts midday Saturday', summary: 'Afternoon wave faces gusts on par-threes.' , image: 'https://picsum.photos/seed/nm-tl-golf-3/600/360' },
      { date: '2026-03-30', headline: 'Six within three shots Sunday', summary: 'Crowded leaderboard sets up a volatile final round.' , image: 'https://picsum.photos/seed/nm-tl-golf-4/600/360' },
    ],
  },
  f4: {
    topicTitle: 'Privacy-preserving ads trial',
    tag: 'Tech',
    intro: 'Browser vendors, publishers, and regulators align on phased tests.',
    events: [
      { date: '2022-10-12', headline: 'Industry group proposes privacy sandbox', summary: 'Initial designs cap cross-site profiling.' , image: 'https://picsum.photos/seed/nm-tl-ads-1/600/360' },
      { date: '2024-04-20', headline: 'Publishers demand auction transparency', summary: 'News coalitions ask for open documentation on bid resolution.' , image: 'https://picsum.photos/seed/nm-tl-ads-2/600/360' },
      { date: '2025-08-03', headline: 'Two regulators request delay', summary: 'Competition reviews pause live traffic in those markets.' , image: 'https://picsum.photos/seed/nm-tl-ads-3/600/360' },
      { date: '2026-02-11', headline: 'Phased rollout timeline published', summary: 'Vendors sketch caps on audience size and reporting granularity.' , image: 'https://picsum.photos/seed/nm-tl-ads-4/600/360' },
    ],
  },
  f5: {
    topicTitle: 'Video-first wire & newsroom training',
    tag: 'World',
    intro: 'How desks adapted tooling, rights, and archives for short-form.',
    events: [
      { date: '2021-09-01', headline: 'Wire pilots vertical packages', summary: 'Text alerts pair with clips from the same reporter.' , image: 'https://picsum.photos/seed/nm-tl-video-1/600/360' },
      { date: '2023-04-18', headline: 'Training budgets outpace software', summary: 'Editors cite upskilling as the main bottleneck.' , image: 'https://picsum.photos/seed/nm-tl-video-2/600/360' },
      { date: '2024-11-07', headline: 'Rights clearance slows social cuts', summary: 'Match and concert footage lags behind writing deadlines.' , image: 'https://picsum.photos/seed/nm-tl-video-3/600/360' },
      { date: '2026-03-05', headline: 'Co-ops share clearance playbooks', summary: 'Smaller outlets pool legal review to avoid duplication.' , image: 'https://picsum.photos/seed/nm-tl-video-4/600/360' },
    ],
  },
}

function getChronologyForStory(story: Story): TopicTimeline | null {
  return CHRONOLOGY_BY_STORY_ID[story.id] ?? null
}

/** Multi-perspective opinions per story — left / center / right framings */
type OpinionSide = 'left' | 'center' | 'right'

type OpinionEntry = {
  title: string
  body: string
  pullQuote: string
  watchFor: string[]
}

type OpinionSet = Record<OpinionSide, OpinionEntry>

const OPINIONS_BY_STORY_ID: Record<string, OpinionSet> = {
  '1': {
    left: {
      title: 'Climate justice first',
      body: 'Arctic shortcuts shave fuel per voyage but accelerate the very warming that opens these lanes. Indigenous communities have not consented to the noise, spill risk, or displacement a corridor build-out brings, and equity rules lag traffic forecasts. Expanding routes before binding emissions caps and revenue-sharing mechanisms rewards operators least exposed to the consequences.',
      pullQuote: 'A shortcut paid for by the people downstream is not a saving — it is a cost shift.',
      watchFor: ['Indigenous consent', 'Spill liability', 'Emissions caps'],
    },
    center: {
      title: 'A pragmatic shipping read',
      body: 'The economics now favour partial Arctic adoption: dry-bulk and LNG operators see clear cost advantages while container lines stay cautious. The realistic outlook is a bifurcated market — Suez stays primary, the Arctic absorbs seasonal volume — provided insurers, ports, and the IMO keep pace on standards. The job for regulators is to set baseline corridor rules without picking winners.',
      pullQuote: 'Suez stays primary; the Arctic absorbs seasonal volume — if standards keep pace.',
      watchFor: ['Insurer terms', 'Port capacity', 'IMO corridor rules'],
    },
    right: {
      title: 'A trade-and-jobs angle',
      body: 'Shorter transit times, lower fuel use, and new port investment are real gains for shippers and consumers facing high logistics costs. Allies that fund icebreaker fleets and Arctic-capable hulls capture supply-chain resilience benefits, especially when Suez and Panama bottlenecks drive freight inflation. Regulators should focus on opening capacity and clarifying liability rather than layering rules that push traffic back into a single chokepoint.',
      pullQuote: 'A second lane is the cheapest insurance against the next chokepoint shock.',
      watchFor: ['Freight savings', 'Supply-chain resilience', 'Liability clarity'],
    },
  },
  '2': {
    left: {
      title: 'Public good, public planning',
      body: 'Storage at scale is a public-interest asset and should be planned and procured like one — with binding labour standards, domestic manufacturing requirements, and equity audits. Leaving the build-out to private developers risks repeating extractive supply chains in lithium and cobalt without sharing the upside with affected workers and communities.',
      pullQuote: 'The grid is a commons. Treat the build-out like one.',
      watchFor: ['Labour standards', 'Mineral sourcing', 'Community equity audits'],
    },
    center: {
      title: 'Storage crosses a threshold',
      body: 'Cost parity with peakers in a dozen markets is the headline, but the real story is interconnection queues and procurement design. Utilities, regulators, and developers each control a piece of the timeline; progress depends on coordinated reforms rather than a single technology bet.',
      pullQuote: 'Cost parity is the headline; interconnection design is the story.',
      watchFor: ['Queue reform', 'Procurement design', 'Long-duration mix'],
    },
    right: {
      title: 'Let markets do the lifting',
      body: 'Lower-cost batteries beating peakers on price is the system working. The fastest path to reliability is removing interconnection bottlenecks, simplifying permitting, and letting developers compete — not stacking labour mandates or domestic-content rules that slow build-out and raise costs to ratepayers.',
      pullQuote: 'Cheaper power and shorter queues — that is the deliverable, not new mandates.',
      watchFor: ['Permitting speed', 'Ratepayer costs', 'Developer competition'],
    },
  },
  '3': {
    left: {
      title: 'Tilt toward smaller publishers',
      body: 'A unified data regime will only work if smaller, public-interest publishers can afford to comply. Compliance costs of 60–100k euros annually would gut local newsroom budgets, and platform liability carve-outs cannot come at the expense of original reporting. The default should be transparency and revenue-sharing in favour of the publishers, not the aggregators.',
      pullQuote: 'If a rule costs a reporter, it costs the public.',
      watchFor: ['Compliance ceilings', 'Revenue sharing', 'Original reporting protection'],
    },
    center: {
      title: 'A test of governance',
      body: 'The draft tries to harmonize three policy goals — privacy, publisher viability, and a single digital market — that pull in different directions. Whether the second-reading text resolves those tensions or kicks them to the courts will define how the framework is judged.',
      pullQuote: 'Three goals, one bill — coherence is the open question.',
      watchFor: ['Public-interest carve-out', 'Cross-border enforcement', 'Litigation pipeline'],
    },
    right: {
      title: 'Watch the regulatory drag',
      body: 'Cross-border rules layered on top of GDPR, the DMA, and AI transparency obligations create real costs for any business operating online. Liability carve-outs for hosting and summarizing news are reasonable; without them, marginal compliance costs land on consumers as fewer free services and higher subscription prices.',
      pullQuote: 'Every new layer is a tax on the open web — pay attention to who absorbs it.',
      watchFor: ['Liability scope', 'Consumer pricing', 'GDPR / DMA overlap'],
    },
  },
  '4': {
    left: {
      title: 'A workload conversation',
      body: 'Stars logging 41-plus minutes is exciting in the moment, but it also previews an offseason of injury reports. Better player-load science and deeper bench rotations matter more than another highlight reel for athletes whose careers shouldn’t be shortened by playoff theatre.',
      pullQuote: 'A career outlasts a single buzzer-beater.',
      watchFor: ['Minutes load', 'Bench depth', 'Injury reports'],
    },
    center: {
      title: 'Momentum, then composure',
      body: 'A 12-2 closing run flipped the game, but the overtime period showed which team had recovered its rhythm. The seeding race is genuinely open, and Sunday’s match — already the kind broadcasters dream of — will probably be decided as much by minutes management as by anyone’s shooting percentages.',
      pullQuote: 'Identity wins the OT period; rotations win the next series.',
      watchFor: ['Closing-five lineup', 'Tiebreaker scenarios', 'Sunday rotations'],
    },
    right: {
      title: 'Old-school grit pays off',
      body: 'Tightened rotations, late-game defensive intensity, and stars willing to play heavy minutes — that is how playoff seeds are clinched. Every analytics critique misses the point: in March basketball, execution and competitive will at the end of regulation are what wins.',
      pullQuote: 'In March, execution beats spreadsheets every time.',
      watchFor: ['Defensive turnovers', 'Crunch-time execution', 'Coach trust'],
    },
  },
  '5': {
    left: {
      title: 'Reclaiming streets for people',
      body: 'Cleaner air, lower noise, and a measurable jump in cycling and walking are exactly the outcomes pedestrian-first design promises. Concerns about access for older residents are legitimate and answerable through transit investment — the answer is not to keep cars on every corridor by default.',
      pullQuote: 'A street that breathes is a street that pays back.',
      watchFor: ['NO₂ readings', 'Active-mode counts', 'Accessibility transit'],
    },
    center: {
      title: 'A coordinated, cautious read',
      body: 'The five-city methodology is the most rigorous pedestrianization study yet, and it shows real wins on transit reliability and air quality alongside genuine retail trade-offs. Expansion should follow the data — including the survey gap between younger and older residents — rather than the loudest voices on either side.',
      pullQuote: 'Trust the data — including the parts you didn’t want to read.',
      watchFor: ['Retail by block', 'Transit headways', 'Generational survey gap'],
    },
    right: {
      title: 'Don’t ignore the costs',
      body: 'Auto-dependent retailers reporting revenue drops are not noise — they are the small businesses that anchor neighbourhoods. Pilots that succeed in one block may fail two streets over, and councils should weigh real losses to commerce and accessibility, not only the survey responses of the residents who already prefer to walk.',
      pullQuote: 'A small business closing is a survey response too.',
      watchFor: ['Retail revenue', 'Older-resident access', 'Enforcement load'],
    },
  },
  '6': {
    left: {
      title: 'Watch the supply chain',
      body: 'Open-weight progress is real, but the training-data provenance question is not just legal compliance — it is a labour and copyright question about whose work was scraped to train the models. Indemnity clauses are necessary; so is a serious answer about consent and compensation for the writers, designers, and engineers whose work made the gains possible.',
      pullQuote: 'Every benchmark gain stands on someone’s unpaid labour — until that changes.',
      watchFor: ['Training-data provenance', 'Creator consent', 'Indemnity terms'],
    },
    center: {
      title: 'Closing the gap, slowly',
      body: 'Open models now sit within a few points of frontier closed offerings on common benchmarks, and quantization makes laptop inference viable. Enterprise adoption still hinges on legal review and security questionnaires more than on raw capability, so the next year is more about governance than another leaderboard win.',
      pullQuote: 'The next year is governance, not benchmarks.',
      watchFor: ['Enterprise security review', 'License terms', 'Quantization quality'],
    },
    right: {
      title: 'Productivity is the point',
      body: 'Local stacks delivering measurable code-review speedups are exactly the kind of bottom-up productivity win that doesn’t need permission from procurement. Companies that lock developers out of these tools while waiting for perfect indemnity end up shipping slower than competitors who get on with it.',
      pullQuote: 'Productivity won by waiting for paperwork is productivity ceded.',
      watchFor: ['Review cycle time', 'Procurement bottlenecks', 'Tool adoption'],
    },
  },
  f1: {
    left: {
      title: 'Workers feel the squeeze',
      body: 'Sticky services inflation is, in plain language, the cost of housing, healthcare, and care work — items families cannot defer. A central-bank stance that holds rates higher to discipline those prices puts the burden on the renters and borrowers who least benefit from term-premium repricing.',
      pullQuote: 'You cannot defer the rent — and you cannot defer the rate.',
      watchFor: ['Mortgage rates', 'Rent indexes', 'Care-work wages'],
    },
    center: {
      title: 'Mixed signals, careful pricing',
      body: 'Markets are pricing genuinely divergent guidance from major central banks, and traders are right to demand more before re-rating long-duration assets. The next set of meeting minutes and labour prints will matter more than any single CPI surprise.',
      pullQuote: 'Listen for the dispersion in the dot plot, not the headline number.',
      watchFor: ['Term premium', 'FX volatility', 'Wage prints'],
    },
    right: {
      title: 'Discipline restores credibility',
      body: 'Holding the line on inflation rebuilds the credibility that years of easy money eroded. Sticky services inflation is the predictable consequence of pandemic-era spending, and savers, retirees, and long-term investors finally benefit from interest rates that reflect real risk.',
      pullQuote: 'Real rates are how trust is rebuilt — slowly.',
      watchFor: ['Real yields', 'Saver returns', 'Long-bond auctions'],
    },
  },
  f2: {
    left: {
      title: 'Equity must lead the build',
      body: 'Resilience grants are most defensible when they reach the communities that contributed least to the climate crisis. Local-contractor weighting and community governance are not bureaucratic friction — they are the difference between projects that protect residents and projects that displace them.',
      pullQuote: 'Resilience without consent is just a different kind of displacement.',
      watchFor: ['Local-contractor share', 'Community governance', 'Relocation terms'],
    },
    center: {
      title: 'A first tranche to watch',
      body: 'The fund’s emphasis on updated vulnerability mapping and annual audits is a real shift from earlier development-finance practice. Whether the blended-finance theory of change holds up depends on how many private co-investors actually show up alongside the next tranche.',
      pullQuote: 'Audits and maps are the new procurement.',
      watchFor: ['Co-investment ratio', 'Audit findings', 'Round-two scope'],
    },
    right: {
      title: 'Insist on returns and rigor',
      body: 'Concessional capital should crowd in private investment, not substitute for it. Strict audits and clawbacks for missed milestones — including for sovereign recipients — are essential if the fund is going to deliver durable infrastructure rather than press-release projects.',
      pullQuote: 'No clawbacks, no credibility — and no follow-on capital.',
      watchFor: ['Clawback enforcement', 'Private match', 'Project ROI'],
    },
  },
  f3: {
    left: {
      title: 'Caddies, crews, and credit',
      body: 'A rookie record is a team result — caddies, course staff, and tour support all carry the round. Coverage that names only the lead player and his sponsor leaves out the workers who make the highlight reels possible.',
      pullQuote: 'Every record round runs on a payroll the broadcast skips.',
      watchFor: ['Caddie credit', 'Course-staff pay', 'Tour worker conditions'],
    },
    center: {
      title: 'A rookie reshapes Sunday',
      body: 'A 62 on a course with this much defence is rare, and the rookie’s scrambling stat — top-five on tour — is the underrated reason the round held together. Sunday’s field is the most competitive in seven years, and conditions could still flip the leaderboard.',
      pullQuote: 'Scrambling, not driving distance, decides this Sunday.',
      watchFor: ['Wind shifts', 'Greens speed', 'Top-50 ranking moves'],
    },
    right: {
      title: 'Old-fashioned grind wins',
      body: 'Conservative targets on the par-threes, sharp short-game saves, and steady course management produced the round, not flair. That kind of discipline travels well, especially in the majors — and it is the lesson younger players watching the broadcast should take.',
      pullQuote: 'Boring is a competitive advantage.',
      watchFor: ['Course management', 'Par-three strategy', 'Short-game stats'],
    },
  },
  f4: {
    left: {
      title: 'Don’t lock in browser power',
      body: 'A privacy framework that places audience classification and the ad auction inside the same vendor’s browser quietly deepens that vendor’s dominance. Independent audits and binding interoperability commitments are the only credible defence against foreclosure.',
      pullQuote: 'Privacy that consolidates power is not privacy.',
      watchFor: ['Auction audit access', 'Interop standards', 'Vendor self-preferencing'],
    },
    center: {
      title: 'A consequential trial',
      body: 'The privacy-preserving architecture is technically promising, but auction transparency for publishers and competition concerns from regulators are the open questions that will decide whether the trial graduates to production.',
      pullQuote: 'The architecture is fine — the governance is the test.',
      watchFor: ['Trial cohort size', 'Publisher reporting', 'Regulator timelines'],
    },
    right: {
      title: 'Innovation without overreach',
      body: 'Replacing third-party tracking with on-device classification is exactly the kind of voluntary industry progress that should not be stalled by drawn-out regulatory delays. Smaller advertisers will be hurt most if the trial drags, and consumers gain little from another year of cookies.',
      pullQuote: 'Don’t freeze the future to study it for another year.',
      watchFor: ['Cookie deprecation date', 'SMB advertiser impact', 'Browser CPU cost'],
    },
  },
  f5: {
    left: {
      title: 'Pay the journalists doing the work',
      body: 'Asking text reporters to absorb video filing without commensurate pay or staffing is the cost-cutting reflex that hollowed out local news in the first place. Co-op rights playbooks help; living wages and union contracts help more.',
      pullQuote: 'Two beats for one paycheck is not innovation — it is attrition.',
      watchFor: ['Reporter contracts', 'Video-shift premiums', 'Union representation'],
    },
    center: {
      title: 'Tooling was the easy part',
      body: 'The summit’s blunt finding — that training, rights clearance, and archival metadata cost more than software — matches what most newsrooms have learned the hard way. Co-operative clearance models and shared metadata standards are the practical near-term wins.',
      pullQuote: 'The bottleneck is people and paperwork — not software.',
      watchFor: ['Clearance time', 'Archive metadata', 'Training budgets'],
    },
    right: {
      title: 'Reach the audience where it is',
      body: 'Vertical short-form is where readers under 35 spend their attention; newsrooms that resist the format on principle lose the audience they need. Faster clearance, leaner tooling, and editorial discipline on runtime are how legacy operations stay relevant.',
      pullQuote: 'Format follows audience — or audience leaves.',
      watchFor: ['Completion rates', 'Time-to-publish', 'Under-35 reach'],
    },
  },
}

function getOpinionsForStory(story: Story): OpinionSet | null {
  return OPINIONS_BY_STORY_ID[story.id] ?? null
}

/** Real-world impact: day-to-day effects, trend metrics, market reaction */
type ImpactArrow = 'up' | 'down' | 'flat'

type ImpactDomainKind =
  | 'fuel' | 'food' | 'hotel' | 'energy' | 'travel' | 'tech'
  | 'shopping' | 'housing' | 'jobs' | 'health' | 'freight'
  | 'insurance' | 'finance' | 'climate' | 'media'

type ImpactArea = {
  kind: ImpactDomainKind
  label: string
  detail: string
  arrow: ImpactArrow
  /** 1 = mild, 2 = moderate, 3 = strong */
  magnitude: 1 | 2 | 3
}

type ImpactTrend = {
  label: string
  value: string
  /** signed % change */
  delta: number
  series: number[]
}

type ImpactCompany = {
  ticker: string
  name: string
  sector: string
  /** signed % change */
  changePct: number
  series: number[]
}

type ImpactReport = {
  headline: string
  summary: string
  areas: ImpactArea[]
  trends: ImpactTrend[]
  companies: ImpactCompany[]
}

const IMPACT_BY_STORY_ID: Record<string, ImpactReport> = {
  '1': {
    headline: 'Lanes shorten — wallets feel it',
    summary: 'Bunker savings ripple into freight, groceries, and insurance.',
    areas: [
      { kind: 'freight',   label: 'Container shipping', detail: 'Asia–Europe rates ease as Arctic strings cut fuel',  arrow: 'down', magnitude: 2 },
      { kind: 'shopping',  label: 'Imported goods',     detail: 'Lower freight flows into electronics & home goods', arrow: 'down', magnitude: 1 },
      { kind: 'insurance', label: 'Marine premiums',    detail: 'Underwriters charge more for ice-class voyages',    arrow: 'up',   magnitude: 2 },
      { kind: 'fuel',      label: 'Bunker fuel',        detail: 'Demand softens on shorter strings',                 arrow: 'down', magnitude: 1 },
      { kind: 'climate',   label: 'Emissions risk',     detail: 'More traffic raises spill and CO₂ exposure',        arrow: 'up',   magnitude: 3 },
    ],
    trends: [
      { label: 'Bunker fuel',     value: '$612/MT', delta: -2.4, series: [640, 638, 635, 628, 624, 619, 615, 612] },
      { label: 'Freight index',   value: '108',     delta: -3.1, series: [115, 113, 112, 111, 110, 109, 108, 108] },
      { label: 'Marine premiums', value: '124',     delta:  4.2, series: [118, 119, 120, 121, 122, 123, 124, 124] },
    ],
    companies: [
      { ticker: 'MAERSK-B', name: 'A.P. Møller-Mærsk',  sector: 'Shipping',  changePct:  2.1, series: [100, 101, 100, 102, 102, 103, 102, 102.1] },
      { ticker: 'ZIM',      name: 'ZIM Integrated',     sector: 'Shipping',  changePct:  1.7, series: [100, 101,  99, 100, 101, 101, 102, 101.7] },
      { ticker: 'COSCO',    name: 'COSCO Shipping',     sector: 'Shipping',  changePct:  0.9, series: [100, 100,  99, 100, 101, 100, 100, 100.9] },
      { ticker: 'AGCB',     name: 'Allianz Marine',     sector: 'Insurance', changePct: -0.4, series: [100, 100, 100,  99,  99,  99,  99,  99.6] },
    ],
  },
  '2': {
    headline: 'Cheaper power, longer queues',
    summary: 'Storage parity trims peak-hour bills but interconnection still drags.',
    areas: [
      { kind: 'energy',   label: 'Electricity bills', detail: 'Peak-hour tariffs ease where storage offsets gas',  arrow: 'down', magnitude: 2 },
      { kind: 'jobs',     label: 'Clean-tech jobs',   detail: 'Installer & integrator hiring picks up',           arrow: 'up',   magnitude: 2 },
      { kind: 'tech',     label: 'Cell prices',       detail: 'LFP modules keep trending cheaper per kWh',        arrow: 'down', magnitude: 3 },
      { kind: 'climate',  label: 'CO₂ from peakers',  detail: 'Battery dispatch displaces gas peaker hours',      arrow: 'down', magnitude: 2 },
      { kind: 'housing',  label: 'Home solar combo',  detail: 'Pairing rooftop solar with batteries gets cheaper', arrow: 'down', magnitude: 1 },
    ],
    trends: [
      { label: 'LFP cell',       value: '$72/kWh', delta: -6.5, series: [85,  82,  80, 78, 76, 75, 73, 72] },
      { label: 'Peaker LCOE',    value: '$112',    delta: -2.1, series: [120, 118, 117, 116, 115, 114, 113, 112] },
      { label: 'Queue wait (mo)',value: '34',      delta:  1.8, series: [30,  31,  32, 32, 33, 33, 34, 34] },
    ],
    companies: [
      { ticker: 'TSLA', name: 'Tesla',     sector: 'Storage',  changePct:  1.4, series: [100, 100, 101, 101, 101, 102, 101, 101.4] },
      { ticker: 'FLNC', name: 'Fluence',   sector: 'Storage',  changePct:  3.2, series: [100,  99, 101, 102, 102, 103, 103, 103.2] },
      { ticker: 'NEE',  name: 'NextEra',   sector: 'Utility',  changePct:  0.6, series: [100, 100, 100, 100, 101, 100, 101, 100.6] },
      { ticker: 'LNG',  name: 'Cheniere',  sector: 'Gas',      changePct: -2.1, series: [100, 100,  99,  99,  98,  98,  98,  97.9] },
    ],
  },
  '3': {
    headline: 'Smaller newsrooms feel the bill',
    summary: 'Cross-border rules raise compliance overhead and shift ad budgets.',
    areas: [
      { kind: 'media',    label: 'Local news',        detail: 'Regional outlets eye 60–100k EUR/yr compliance',  arrow: 'up',   magnitude: 3 },
      { kind: 'shopping', label: 'Free services',     detail: 'Some ad-funded products may add subscriptions',   arrow: 'up',   magnitude: 1 },
      { kind: 'tech',     label: 'Ad-tech vendors',   detail: 'Auction transparency mandates hit margins',        arrow: 'down', magnitude: 2 },
      { kind: 'jobs',     label: 'Compliance roles',  detail: 'Privacy and policy counsel hiring rises',          arrow: 'up',   magnitude: 2 },
      { kind: 'finance',  label: 'Litigation risk',   detail: 'Definitions ambiguity primes a court calendar',    arrow: 'up',   magnitude: 2 },
    ],
    trends: [
      { label: 'Ad CPM',         value: '€8.40', delta: -1.7, series: [9.0, 8.9, 8.8, 8.7, 8.6, 8.5, 8.45, 8.40] },
      { label: 'Compliance idx', value: '142',   delta:  6.4, series: [128, 132, 135, 137, 139, 140, 141, 142] },
      { label: 'News firm exits',value: '37',    delta:  4.1, series: [28, 30, 32, 33, 34, 35, 36, 37] },
    ],
    companies: [
      { ticker: 'GOOGL', name: 'Alphabet',     sector: 'Ad-tech',    changePct: -0.6, series: [100, 100, 100,  99,  99,  99,  99,  99.4] },
      { ticker: 'META',  name: 'Meta',         sector: 'Ad-tech',    changePct: -0.9, series: [100, 100,  99,  99,  99,  98,  99,  99.1] },
      { ticker: 'TTD',   name: 'Trade Desk',   sector: 'Ad-tech',    changePct: -1.4, series: [100, 100,  99,  98,  98,  98,  98,  98.6] },
      { ticker: 'NWS',   name: 'News Corp',    sector: 'Publisher',  changePct:  0.7, series: [100, 100, 100, 101, 100, 101, 101, 100.7] },
    ],
  },
  '4': {
    headline: 'Postseason fever, real spend',
    summary: 'Local hospitality and merch pop; broadcasters chase the bump.',
    areas: [
      { kind: 'hotel',    label: 'Hotel bookings',  detail: 'Visiting-fan rooms book up around game days', arrow: 'up',   magnitude: 2 },
      { kind: 'food',     label: 'Bars & dining',   detail: 'Game-night bills lift across the city',        arrow: 'up',   magnitude: 2 },
      { kind: 'travel',   label: 'Local transit',   detail: 'Rideshare surge windows widen on game nights', arrow: 'up',   magnitude: 1 },
      { kind: 'shopping', label: 'Team merch',      detail: 'Jersey & cap sales spike post-overtime win',   arrow: 'up',   magnitude: 3 },
      { kind: 'media',    label: 'Broadcast spend', detail: 'Ad inventory tightens as ratings climb',       arrow: 'up',   magnitude: 2 },
    ],
    trends: [
      { label: 'Hotel ADR',      value: '$214', delta:  4.2, series: [200, 203, 205, 207, 209, 210, 213, 214] },
      { label: 'Merch units',    value: '12.4k', delta: 28.0, series: [9.0, 9.5, 10.2, 10.8, 11.2, 11.6, 12.0, 12.4] },
      { label: 'Ratings index',  value: '118',  delta:  6.1, series: [110, 112, 113, 114, 115, 116, 117, 118] },
    ],
    companies: [
      { ticker: 'MSGS',  name: 'MSG Sports',     sector: 'Sports',      changePct: 2.4, series: [100, 100, 101, 101, 102, 102, 102, 102.4] },
      { ticker: 'FANG',  name: 'Fanatics',       sector: 'Retail',      changePct: 3.6, series: [100, 101, 102, 102, 103, 103, 103, 103.6] },
      { ticker: 'HLT',   name: 'Hilton',         sector: 'Hospitality', changePct: 1.1, series: [100, 100, 100, 101, 100, 101, 101, 101.1] },
      { ticker: 'DASH',  name: 'DoorDash',       sector: 'Delivery',    changePct: 0.8, series: [100, 100, 100, 100, 100, 101, 100, 100.8] },
    ],
  },
  '5': {
    headline: 'Quieter Sundays, fuller cafés',
    summary: 'Walkable corridors lift small retail; auto-dependent shops feel a pinch.',
    areas: [
      { kind: 'food',     label: 'Cafés & bakeries', detail: 'Foot traffic and tickets up on pilot days',     arrow: 'up',   magnitude: 2 },
      { kind: 'travel',   label: 'Public transit',   detail: 'Bus headways improve where cars are cleared',   arrow: 'up',   magnitude: 2 },
      { kind: 'shopping', label: 'Big-box retail',   detail: 'Auto-dependent shops report softer afternoons', arrow: 'down', magnitude: 2 },
      { kind: 'health',   label: 'Air quality',      detail: 'NO₂ and PM₂.₅ dip during pilot windows',        arrow: 'down', magnitude: 3 },
      { kind: 'housing',  label: 'Corridor rents',   detail: 'Pedestrianized blocks see modest rent lift',    arrow: 'up',   magnitude: 1 },
    ],
    trends: [
      { label: 'Café receipts',  value: '+12%', delta: 12.4, series: [100, 102, 104, 106, 108, 110, 111, 112] },
      { label: 'NO₂ (µg/m³)',    value: '22',   delta: -18.5, series: [27, 26, 25, 24, 23, 22, 22, 22] },
      { label: 'Bus reliability',value: '94%',  delta:  3.2, series: [91, 91, 92, 92, 93, 93, 94, 94] },
    ],
    companies: [
      { ticker: 'SBUX',  name: 'Starbucks',      sector: 'Café',     changePct:  0.6, series: [100, 100, 100, 100, 100, 101, 101, 100.6] },
      { ticker: 'UBER',  name: 'Uber',           sector: 'Mobility', changePct: -0.3, series: [100, 100, 100, 100,  99, 100, 100,  99.7] },
      { ticker: 'LULU',  name: 'Lululemon',      sector: 'Retail',   changePct:  0.4, series: [100, 100, 100, 101, 100, 101, 100, 100.4] },
      { ticker: 'TGT',   name: 'Target',         sector: 'Big-box',  changePct: -0.7, series: [100, 100, 100, 100,  99,  99,  99,  99.3] },
    ],
  },
  '6': {
    headline: 'Faster reviews, slower procurement',
    summary: 'Local AI assistants speed engineering; legal review still gates rollout.',
    areas: [
      { kind: 'jobs',    label: 'Engineering throughput', detail: 'PR-to-first-comment time drops 25–40%',     arrow: 'down', magnitude: 2 },
      { kind: 'tech',    label: 'Cloud GPU spend',         detail: 'On-device inference cuts external API bills', arrow: 'down', magnitude: 2 },
      { kind: 'finance', label: 'IT procurement',          detail: 'Vendor questionnaires stretch to 8–12 wks',   arrow: 'up',   magnitude: 2 },
      { kind: 'media',   label: 'Open-source licenses',    detail: 'Legal teams parse model-by-model terms',      arrow: 'up',   magnitude: 1 },
      { kind: 'health',  label: 'Code privacy',            detail: 'Less code leaves the laptop boundary',        arrow: 'down', magnitude: 2 },
    ],
    trends: [
      { label: 'Review TTM',     value: '4.2h',  delta: -28.0, series: [6.0, 5.6, 5.2, 5.0, 4.7, 4.5, 4.3, 4.2] },
      { label: 'GPU $/req',      value: '$0.014', delta: -41.0, series: [0.024, 0.022, 0.020, 0.019, 0.017, 0.016, 0.015, 0.014] },
      { label: 'Vendor review',  value: '10w',   delta:  11.0, series: [9, 9, 9.5, 10, 10, 10, 10, 10] },
    ],
    companies: [
      { ticker: 'NVDA',  name: 'Nvidia',          sector: 'Chips',     changePct: -0.8, series: [100, 100, 100, 100,  99,  99,  99,  99.2] },
      { ticker: 'MSFT',  name: 'Microsoft',       sector: 'Cloud',     changePct: -0.4, series: [100, 100, 100, 100, 100,  99, 100,  99.6] },
      { ticker: 'GTLB',  name: 'GitLab',          sector: 'Dev tools', changePct:  1.7, series: [100, 100, 101, 101, 101, 102, 102, 101.7] },
      { ticker: 'JFRG',  name: 'JFrog',           sector: 'Dev tools', changePct:  1.2, series: [100, 100, 100, 101, 101, 101, 101, 101.2] },
    ],
  },
  f1: {
    headline: 'Mortgages and savings move',
    summary: 'Sticky services inflation keeps rates higher for longer.',
    areas: [
      { kind: 'housing',  label: 'Mortgage rates',  detail: 'Long-end yields drift up; refis stay frozen',    arrow: 'up',   magnitude: 2 },
      { kind: 'finance',  label: 'Savings yields',  detail: 'CDs and money-market rates stay elevated',       arrow: 'up',   magnitude: 2 },
      { kind: 'shopping', label: 'Discretionary',   detail: 'Households pull back on big-ticket buys',        arrow: 'down', magnitude: 1 },
      { kind: 'jobs',     label: 'Hiring pace',     detail: 'Services hiring cools; goods stays flat',        arrow: 'down', magnitude: 1 },
      { kind: 'travel',   label: 'Insurance costs', detail: 'Auto and home premiums keep climbing',           arrow: 'up',   magnitude: 2 },
    ],
    trends: [
      { label: '30y mortgage', value: '6.9%',  delta:  0.6, series: [6.6, 6.7, 6.7, 6.8, 6.8, 6.8, 6.9, 6.9] },
      { label: 'Services CPI', value: '+5.1%', delta:  0.2, series: [4.8, 4.9, 4.9, 5.0, 5.0, 5.1, 5.1, 5.1] },
      { label: 'EUR/USD',      value: '1.072', delta: -0.8, series: [1.082, 1.080, 1.078, 1.076, 1.075, 1.074, 1.073, 1.072] },
    ],
    companies: [
      { ticker: 'JPM',   name: 'JPMorgan',         sector: 'Bank',     changePct:  0.9, series: [100, 100, 100, 100, 101, 101, 101, 100.9] },
      { ticker: 'XLF',   name: 'Financial Sel.',   sector: 'Bank ETF', changePct:  0.5, series: [100, 100, 100, 100, 100, 101, 100, 100.5] },
      { ticker: 'TLT',   name: '20+ yr Treasury',  sector: 'Bonds',    changePct: -1.6, series: [100, 100,  99,  99,  99,  98,  98,  98.4] },
      { ticker: 'XHB',   name: 'Homebuilders',     sector: 'Housing',  changePct: -1.2, series: [100, 100, 100,  99,  99,  99,  98,  98.8] },
    ],
  },
  f2: {
    headline: 'Coastal cities harden up',
    summary: 'Surge barriers and microgrids reach communities first; insurers shift terms.',
    areas: [
      { kind: 'insurance', label: 'Coastal premiums', detail: 'New flood-modeled premiums diverge by zone',  arrow: 'up',   magnitude: 3 },
      { kind: 'housing',   label: 'Floodplain values', detail: 'Mortgage availability tightens in red zones', arrow: 'down', magnitude: 2 },
      { kind: 'jobs',      label: 'Climate engineering', detail: 'Coastal & microgrid hiring accelerates',    arrow: 'up',   magnitude: 2 },
      { kind: 'health',    label: 'Storm-shelter access', detail: 'Microgrid-backed shelters expand',         arrow: 'up',   magnitude: 2 },
      { kind: 'energy',    label: 'Diesel backups',    detail: 'Hospital diesel use trends down',             arrow: 'down', magnitude: 1 },
    ],
    trends: [
      { label: 'Coastal premium', value: '+18%', delta: 18.0, series: [100, 104, 108, 111, 113, 115, 117, 118] },
      { label: 'Climate AUM',     value: '$2.4B', delta: 12.0, series: [2.0, 2.1, 2.2, 2.25, 2.3, 2.35, 2.38, 2.4] },
      { label: 'Diesel hours',    value: '-9%',  delta: -9.0, series: [100, 99, 98, 96, 94, 93, 92, 91] },
    ],
    companies: [
      { ticker: 'GE',    name: 'GE Vernova',       sector: 'Grid',       changePct:  1.8, series: [100, 100, 101, 101, 101, 102, 102, 101.8] },
      { ticker: 'AON',   name: 'Aon Re',           sector: 'Reinsurance',changePct:  0.9, series: [100, 100, 100, 100, 101, 101, 101, 100.9] },
      { ticker: 'CAT',   name: 'Caterpillar',      sector: 'Construction',changePct: 0.6, series: [100, 100, 100, 100, 100, 101, 100, 100.6] },
      { ticker: 'PHM',   name: 'PulteGroup',       sector: 'Homebuilder', changePct: -0.8, series: [100, 100, 100,  99,  99,  99,  99,  99.2] },
    ],
  },
  f3: {
    headline: 'Tour stop rolls into the city',
    summary: 'Local hospitality and brand sponsors win the weekend.',
    areas: [
      { kind: 'hotel',    label: 'Resort bookings',  detail: 'Sunday demand peaks at host-city hotels',  arrow: 'up',   magnitude: 2 },
      { kind: 'food',     label: 'Restaurants',      detail: 'Reservation lead times stretch through Sun', arrow: 'up',   magnitude: 2 },
      { kind: 'shopping', label: 'Pro-shop sales',   detail: 'Apparel and ball sales surge on the rookie', arrow: 'up',   magnitude: 3 },
      { kind: 'media',    label: 'Broadcast ratings',detail: '18-34 viewership lifts on social clips',     arrow: 'up',   magnitude: 2 },
      { kind: 'travel',   label: 'Airline traffic',  detail: 'Inbound flights run heavier than usual',     arrow: 'up',   magnitude: 1 },
    ],
    trends: [
      { label: 'Hotel ADR',  value: '$289', delta:  6.1, series: [270, 275, 278, 281, 283, 285, 287, 289] },
      { label: 'Pro-shop',   value: '+22%', delta: 22.0, series: [100, 105, 109, 113, 116, 119, 121, 122] },
      { label: 'Ratings 18-34', value: '+9%', delta: 9.0, series: [100, 102, 103, 104, 106, 107, 108, 109] },
    ],
    companies: [
      { ticker: 'NKE',   name: 'Nike',          sector: 'Apparel',  changePct:  0.7, series: [100, 100, 100, 101, 100, 101, 101, 100.7] },
      { ticker: 'CWH',   name: 'Callaway',      sector: 'Equipment', changePct: 2.6, series: [100, 100, 101, 101, 102, 102, 103, 102.6] },
      { ticker: 'MAR',   name: 'Marriott',      sector: 'Hospitality', changePct: 1.4, series: [100, 100, 101, 101, 101, 102, 101, 101.4] },
      { ticker: 'DAL',   name: 'Delta',         sector: 'Airline',  changePct:  0.8, series: [100, 100, 100, 100, 100, 101, 100, 100.8] },
    ],
  },
  f4: {
    headline: 'Ad pipes shift, not break',
    summary: 'Independent ad networks squeezed; first-party brands cushion the move.',
    areas: [
      { kind: 'tech',     label: 'Ad-tech vendors',  detail: 'Mid-tier networks lose targeting depth',       arrow: 'down', magnitude: 3 },
      { kind: 'shopping', label: 'Retargeting deals',detail: 'Discount ads find you less often',             arrow: 'down', magnitude: 2 },
      { kind: 'media',    label: 'Publisher yield',  detail: 'CPMs dip in opaque auction phases',            arrow: 'down', magnitude: 2 },
      { kind: 'jobs',     label: 'Privacy engineering', detail: 'Browser & SDK privacy hiring rises',         arrow: 'up',   magnitude: 2 },
      { kind: 'health',   label: 'Battery on phones',detail: 'On-device classification adds CPU cycles',     arrow: 'up',   magnitude: 1 },
    ],
    trends: [
      { label: 'Pub CPM',    value: '$3.20', delta: -4.5, series: [3.40, 3.36, 3.32, 3.28, 3.25, 3.22, 3.21, 3.20] },
      { label: 'CPC index',  value: '92',    delta: -3.1, series: [98, 97, 96, 95, 94, 93, 92, 92] },
      { label: 'Browser CPU',value: '+6%',   delta:  6.0, series: [100, 101, 102, 103, 104, 105, 105, 106] },
    ],
    companies: [
      { ticker: 'GOOGL', name: 'Alphabet',      sector: 'Browser',   changePct:  0.4, series: [100, 100, 100, 100, 100, 101, 100, 100.4] },
      { ticker: 'TTD',   name: 'Trade Desk',    sector: 'Ad-tech',   changePct: -2.8, series: [100, 100,  99,  99,  98,  98,  97,  97.2] },
      { ticker: 'CRTO',  name: 'Criteo',        sector: 'Ad-tech',   changePct: -3.4, series: [100,  99,  99,  98,  98,  97,  97,  96.6] },
      { ticker: 'PUBM',  name: 'PubMatic',      sector: 'Publisher', changePct: -1.7, series: [100, 100,  99,  99,  98,  98,  98,  98.3] },
    ],
  },
  f5: {
    headline: 'Newsroom budgets shift to people',
    summary: 'Training and rights spend climbs; archives need overhaul.',
    areas: [
      { kind: 'jobs',     label: 'Newsroom training', detail: 'Producer & editor upskilling budgets grow',  arrow: 'up',   magnitude: 3 },
      { kind: 'media',    label: 'Rights clearance',  detail: 'Outside legal time stretches deadlines',     arrow: 'up',   magnitude: 2 },
      { kind: 'tech',     label: 'Archive metadata',  detail: 'Asset systems need rebuilds for vertical',   arrow: 'up',   magnitude: 2 },
      { kind: 'shopping', label: 'Subscription churn',detail: 'Reader retention firms on better explainers',arrow: 'down', magnitude: 1 },
      { kind: 'finance',  label: 'Wire deal pricing', detail: 'Format-specific licensing complicates costs',arrow: 'up',   magnitude: 2 },
    ],
    trends: [
      { label: 'Train spend', value: '+34%', delta: 34.0, series: [100, 110, 117, 122, 126, 130, 132, 134] },
      { label: 'Clear time',  value: '+42%', delta: 42.0, series: [100, 110, 118, 125, 130, 135, 139, 142] },
      { label: 'Completion',  value: '78%',  delta:  6.8, series: [73, 74, 75, 76, 77, 77, 78, 78] },
    ],
    companies: [
      { ticker: 'NYT',   name: 'New York Times',  sector: 'Publisher', changePct:  0.4, series: [100, 100, 100, 100, 100, 101, 100, 100.4] },
      { ticker: 'NWSA',  name: 'News Corp',       sector: 'Publisher', changePct: -0.2, series: [100, 100, 100, 100, 100, 100, 100,  99.8] },
      { ticker: 'AKAM',  name: 'Akamai',          sector: 'CDN',       changePct:  1.1, series: [100, 100, 100, 101, 100, 101, 101, 101.1] },
      { ticker: 'ADBE',  name: 'Adobe',           sector: 'Tools',     changePct:  0.7, series: [100, 100, 100, 100, 100, 101, 101, 100.7] },
    ],
  },
}

function getImpactForStory(story: Story): ImpactReport | null {
  return IMPACT_BY_STORY_ID[story.id] ?? null
}

/** Curated deck for For You — Tinder-style discovery */
const FOR_YOU_DECK: Story[] = [
  // World (3)
  {
    id: 'fy1',
    title: 'Renewable ports race to electrify cranes',
    dek: 'Global ports are rapidly transitioning away from diesel-powered machinery to meet ambitious net-zero targets. This shift involves multi-billion dollar investments in shore-based power systems and high-capacity battery buffers, allowing vessels to shut down engines entirely while docked. By implementing these advanced technologies, major maritime hubs are significantly reducing their carbon footprints and eliminating harmful particulate emissions typically associated with diesel idle time.',
    image: 'https://picsum.photos/seed/nm-fy1/800/900',
    tag: 'World',
    readTime: '5 min',
    publisher: 'Maritime News',
    date: 'June 2, 2026',
    time: '10:45 AM'
  },
  // Tech (3)
  {
    id: 'fy2',
    title: 'Chip export rules ripple through cloud regions',
    dek: 'Stricter international export controls on high-performance semiconductors are forcing major cloud providers to re-evaluate their regional data center strategies. Hyperscalers are now shifting large training clusters to stay within complex compliance lanes, affecting the global availability of advanced AI resources. Industry analysts predict this race to secure sovereign compute will define the next decade of digital infrastructure.',
    image: 'https://picsum.photos/seed/nm-fy2/800/900',
    tag: 'Tech',
    readTime: '7 min',
    publisher: 'TechCrunch',
    date: 'June 2, 2026',
    time: '9:30 AM'
  },
  // Politics (3)
  {
    id: 'fy3',
    title: 'Coalition talks stall on housing compact',
    dek: 'Intense negotiations among political coalition leaders have hit a major roadblock over the proposed national housing compact. Regional leaders have opted to postpone the final vote after new fiscal estimates revealed a significant widening of the budget gap. The deadlock stems from a fundamental disagreement over balancing public funding with private incentives in a volatile real estate market.',
    image: 'https://picsum.photos/seed/nm-fy3/800/900',
    tag: 'Politics',
    readTime: '6 min',
    publisher: 'Associated Press',
    date: 'June 2, 2026',
    time: '11:15 AM'
  },
  // Sports (3)
  {
    id: 'fy4',
    title: 'League expands replay center for foul reviews',
    dek: 'In an effort to improve officiating accuracy and game flow, the league has officially opened its expanded global replay center. A centralized team of elite officials will now provide real-time advice on select endgame foul calls, aiming to eliminate human error during critical moments. The goal is to reach decisions in under sixty seconds without sacrificing precision.',
    image: 'https://picsum.photos/seed/nm-fy4/800/900',
    tag: 'Sports',
    readTime: '4 min',
    publisher: 'ESPN',
    date: 'June 2, 2026',
    time: '1:00 PM'
  },
  {
    id: 'fy5',
    title: 'Heat-health alerts now tie to transit delays',
    dek: 'A groundbreaking new public safety initiative has successfully integrated real-time heat-health alerts with metropolitan transit systems. Public agencies will now automatically slow headways and adjust service schedules whenever heat indexes cross dangerous thresholds, prioritizing commuter safety. This data-driven approach allows for dynamic routing and real-time communication during extreme weather events.',
    image: 'https://picsum.photos/seed/nm-fy5/800/900',
    tag: 'World',
    readTime: '5 min',
    publisher: 'Wired',
    date: 'June 2, 2026',
    time: '2:15 PM'
  },
  {
    id: 'fy6',
    title: 'EU AI Act guidance lands for foundation models',
    dek: 'The European Union has released comprehensive new guidelines for the regulation of large-scale foundation AI models. Developers now face stringent documentation requirements and safety audits before wide deployment. The guidance provides a clear roadmap for compliance, focusing on transparency and the mitigation of systemic risks while aiming to foster responsible innovation across member states.',
    image: 'https://picsum.photos/seed/nm-fy6/800/900',
    tag: 'Tech',
    readTime: '9 min',
    publisher: 'The Verge',
    date: 'June 2, 2026',
    time: '3:30 PM'
  },
  {
    id: 'fy7',
    title: 'Pacific trade deal inches toward ratification',
    dek: 'After years of stalemate, the expansive Pacific trade deal is finally nearing a historic ratification vote. While key agriculture chapters have cleared necessary committees, several contentious clauses regarding services and intellectual property remain under intense debate. The outcome will be a major indicator of global appetite for large-scale multilateral agreements in an era of protectionism.',
    image: 'https://picsum.photos/seed/nm-fy7/800/900',
    tag: 'Politics',
    readTime: '8 min',
    publisher: 'Financial Times',
    date: 'June 2, 2026',
    time: '8:00 AM'
  },
  {
    id: 'fy8',
    title: 'Marathon major sets course record despite humidity',
    dek: 'In a breathtaking display of athletics, the top-tier marathon major saw its course record shattered in nearly 90 percent humidity. The elite pack split early as heavy mist gave way to blistering sun, but the winning runner maintained a relentless pace. This victory serves as a testament to advancements in sports science and personalized training protocols under hostile conditions.',
    image: 'https://picsum.photos/seed/nm-fy8/800/900',
    tag: 'Sports',
    readTime: '3 min',
    publisher: "Runner's World",
    date: 'June 2, 2026',
    time: '6:45 AM'
  },
  // Third entry per tag — ensures flip always reveals new content
  {
    id: 'fy9',
    title: 'Desalination push tests coastal energy grids',
    dek: 'As freshwater scarcity worries grow, coastal regions are launching massive desalination projects. These new membrane-based plants require gigawatt-scale power partners, prompting a rethinking of regional energy grids and offshore wind integration. Successful implementation could secure the water future of millions, though the financial and logistical hurdles remain significant obstacles for local governments.',
    image: 'https://picsum.photos/seed/nm-fy9/800/900',
    tag: 'World',
    readTime: '6 min',
    publisher: 'Scientific American',
    date: 'June 2, 2026',
    time: '12:00 PM'
  },
  {
    id: 'fy10',
    title: 'Open-source LLM benchmarks spark reproducibility debate',
    dek: 'The scientific community is locked in a debate over the validity of current open-source language model benchmarks. New research has flagged data leakage in popular evaluation sets, raising questions about whether performance metrics accurately reflect true reasoning capabilities. Independent researchers are calling for a standardized auditing process and the creation of "blind" test sets.',
    image: 'https://picsum.photos/seed/nm-fy10/800/900',
    tag: 'Tech',
    readTime: '8 min',
    publisher: 'TechCrunch',
    date: 'June 2, 2026',
    time: '4:15 PM'
  },
  {
    id: 'fy11',
    title: 'Senate panel advances electoral count reform bill',
    dek: 'A powerful Senate panel has voted overwhelmingly to advance a bipartisan bill aimed at reforming the national electoral count process. Sponsors believe the updated rules will close historic ambiguities and prevent interference, ensuring a stable transition of power. Legal scholars have hailed the move as a critical safeguard for democratic institutions amid intense political polarization.',
    image: 'https://picsum.photos/seed/nm-fy11/800/900',
    tag: 'Politics',
    readTime: '5 min',
    publisher: 'Bloomberg',
    date: 'June 2, 2026',
    time: '7:30 AM'
  },
  {
    id: 'fy12',
    title: 'Transfer window data: clubs spend less, loan more',
    dek: 'New data reveals a significant shift in global club strategies, with record wage-bill pressures pushing teams away from permanent signings toward flexible loan deals. This "caution-first" approach is particularly evident among mid-tier clubs struggling with financial fair play regulations. Analysts predict this austerity could lead to a more balanced and competitive league in the long run.',
    image: 'https://picsum.photos/seed/nm-fy12/800/900',
    tag: 'Sports',
    readTime: '4 min',
    publisher: 'Sky Sports',
    date: 'June 2, 2026',
    time: '10:00 AM'
  },
]

const FEED: Story[] = [
  {
    id: 'f1',
    title: 'Markets digest mixed signals from central banks',
    dek: 'Global currency and bond markets are navigating a complex landscape of conflicting signals from major central banks. As goods inflation begins to cool, stickier services costs are keeping traders on edge, awaiting the next window of guidance to determine the likely pace and timing of upcoming interest rate adjustments.',
    image: 'https://picsum.photos/seed/newsmuncher-feed1/800/450',
    tag: 'World',
    readTime: '5 min',
    publisher: 'Bloomberg',
    date: 'June 2, 2026',
    time: '9:00 AM'
  },
  {
    id: 'f2',
    title: 'Climate fund allocates first tranche to coastal cities',
    dek: 'A major international climate resilience fund has officially released its first significant tranche of capital to support vulnerable coastal cities. These initial grants will prioritize critical infrastructure projects including storm surge barriers and community microgrids, aiming to protect millions of residents from the increasing risks of rising sea levels.',
    image: 'https://picsum.photos/seed/newsmuncher-feed2/800/450',
    tag: 'Politics',
    readTime: '6 min',
    publisher: 'Reuters',
    date: 'June 2, 2026',
    time: '8:45 AM'
  },
  {
    id: 'f3',
    title: 'Tour rookie carded a course record on moving day',
    dek: 'In an unforgettable third round, a tour rookie shocked the field by carding a course-record score on the notorious moving day. The performance has completely disrupted the status quo, setting up a volatile and highly anticipated final round on Sunday with several top names now scrambling to catch up.',
    image: 'https://picsum.photos/seed/newsmuncher-feed3/800/450',
    tag: 'Sports',
    readTime: '3 min',
    publisher: 'PGA Tour',
    date: 'June 2, 2026',
    time: '3:30 PM'
  },
  {
    id: 'f4',
    title: 'Browser vendors align on privacy-preserving ads trial',
    dek: 'In a significant move for the future of digital advertising, major browser vendors have reached a consensus on a phased trial for new privacy-preserving technologies. The staged rollout will begin in select global regions next quarter, aiming to balance the needs of publishers with growing public demands for individual data privacy.',
    image: 'https://picsum.photos/seed/newsmuncher-feed4/800/450',
    tag: 'Tech',
    readTime: '8 min',
    publisher: 'TechCrunch',
    date: 'June 2, 2026',
    time: '11:15 AM'
  },
  {
    id: 'f5',
    title: 'Weekend read: how wire services adapted to video-first newsrooms',
    dek: 'Our weekend feature explores the profound transformation of traditional wire services into modern, video-first newsrooms. From modernizing deep archives to upskilling legacy staff, we take a detailed look at the new pace of the live desk and how the industry is successfully navigating the shift toward short-form visual storytelling.',
    image: 'https://picsum.photos/seed/newsmuncher-feed5/800/450',
    tag: 'World',
    readTime: '12 min',
    publisher: 'Columbia Journalism Review',
    date: 'June 2, 2026',
    time: '6:00 AM'
  },
]

type TickerItem = {
  symbol: string
  pct: number
  up: boolean
}

const MARKET_TICKER: TickerItem[] = [
  { symbol: 'SPX', pct: 0.42, up: true },
  { symbol: 'NDX', pct: -0.18, up: false },
  { symbol: 'DJI', pct: 0.31, up: true },
  { symbol: 'RUT', pct: -0.52, up: false },
  { symbol: 'VIX', pct: -2.1, up: false },
  { symbol: 'BTC', pct: 1.24, up: true },
  { symbol: 'ETH', pct: -0.67, up: false },
  { symbol: 'GOLD', pct: 0.09, up: true },
  { symbol: 'OIL', pct: -0.84, up: false },
  { symbol: 'EUR/USD', pct: 0.15, up: true },
]

type CategorySize = 'normal' | 'tall' | 'wide'
interface Category { id: string; name: string; img: string; size: CategorySize }

const REGIONS = [
  { code: 'global', name: 'Global',         short: 'INT' },
  { code: 'us',     name: 'United States',  short: 'US'  },
  { code: 'gb',     name: 'United Kingdom', short: 'GB'  },
  { code: 'in',     name: 'India',          short: 'IN'  },
  { code: 'ca',     name: 'Canada',         short: 'CA'  },
  { code: 'au',     name: 'Australia',      short: 'AU'  },
  { code: 'de',     name: 'Germany',        short: 'DE'  },
  { code: 'fr',     name: 'France',         short: 'FR'  },
  { code: 'jp',     name: 'Japan',          short: 'JP'  },
  { code: 'sg',     name: 'Singapore',      short: 'SG'  },
  { code: 'ae',     name: 'UAE',            short: 'AE'  },
  { code: 'br',     name: 'Brazil',         short: 'BR'  },
  { code: 'ng',     name: 'Nigeria',        short: 'NG'  },
  { code: 'za',     name: 'South Africa',   short: 'ZA'  },
  { code: 'mx',     name: 'Mexico',         short: 'MX'  },
  { code: 'kr',     name: 'South Korea',    short: 'KR'  },
  { code: 'id',     name: 'Indonesia',      short: 'ID'  },
  { code: 'it',     name: 'Italy',          short: 'IT'  },
  { code: 'es',     name: 'Spain',          short: 'ES'  },
  { code: 'pk',     name: 'Pakistan',       short: 'PK'  },
] as const
type Region = typeof REGIONS[number]

type WeatherKind = 'sunny' | 'rain' | 'cloud' | 'night'

type HeaderWeather = {
  tempC: number
  kind: WeatherKind
  label: string
}

const REGION_WEATHER_BASE: Record<string, { tempC: number; kind: Exclude<WeatherKind, 'night'>; label: string }> = {
  global: { tempC: 24, kind: 'cloud', label: 'Cloudy' },
  us: { tempC: 20, kind: 'cloud', label: 'Cloudy' },
  gb: { tempC: 16, kind: 'rain', label: 'Rainy' },
  in: { tempC: 31, kind: 'sunny', label: 'Sunny' },
  ca: { tempC: 12, kind: 'cloud', label: 'Cloudy' },
  au: { tempC: 26, kind: 'sunny', label: 'Sunny' },
  de: { tempC: 15, kind: 'rain', label: 'Rainy' },
  fr: { tempC: 18, kind: 'cloud', label: 'Cloudy' },
  jp: { tempC: 22, kind: 'cloud', label: 'Cloudy' },
  sg: { tempC: 30, kind: 'rain', label: 'Rainy' },
  ae: { tempC: 37, kind: 'sunny', label: 'Sunny' },
  br: { tempC: 29, kind: 'rain', label: 'Rainy' },
  ng: { tempC: 32, kind: 'sunny', label: 'Sunny' },
  za: { tempC: 19, kind: 'cloud', label: 'Cloudy' },
  mx: { tempC: 28, kind: 'sunny', label: 'Sunny' },
  kr: { tempC: 21, kind: 'cloud', label: 'Cloudy' },
  id: { tempC: 31, kind: 'rain', label: 'Rainy' },
  it: { tempC: 23, kind: 'sunny', label: 'Sunny' },
  es: { tempC: 26, kind: 'sunny', label: 'Sunny' },
  pk: { tempC: 34, kind: 'sunny', label: 'Sunny' },
}

const REGION_UTC_OFFSETS: Record<string, number> = {
  global: 0,
  us: -5,
  gb: 0,
  in: 5.5,
  ca: -5,
  au: 10,
  de: 1,
  fr: 1,
  jp: 9,
  sg: 8,
  ae: 4,
  br: -3,
  ng: 1,
  za: 2,
  mx: -6,
  kr: 9,
  id: 7,
  it: 1,
  es: 1,
  pk: 5,
}

function getHeaderWeather(regionCode: string): HeaderWeather {
  const base = REGION_WEATHER_BASE[regionCode] ?? REGION_WEATHER_BASE.global
  const offset = REGION_UTC_OFFSETS[regionCode] ?? 0
  const utcHours = new Date().getUTCHours()
  const localHour = ((utcHours + offset) % 24 + 24) % 24
  const isNight = localHour < 6 || localHour >= 19
  return isNight
    ? { tempC: Math.max(8, base.tempC - 5), kind: 'night', label: 'Night' }
    : base
}

/** Render a flag image that works on all platforms (no emoji). */
function RegionFlag({ code, size = 20 }: { code: string; size?: number }) {
  if (code === 'global') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  }
  return (
    <img
      src={`https://flagcdn.com/24x18/${code}.png`}
      srcSet={`https://flagcdn.com/48x36/${code}.png 2x`}
      width={Math.round(size * 1.33)}
      height={size}
      alt=""
      aria-hidden
      style={{ display: 'block', borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
    />
  )
}

const CATEGORIES: Category[] = [
  { id: 'world',         name: 'World',           img: 'https://picsum.photos/seed/cat-world/600/700',    size: 'tall' },
  { id: 'business',      name: 'Business',        img: 'https://picsum.photos/seed/cat-biz/400/260',      size: 'normal' },
  { id: 'technology',    name: 'Technology',      img: 'https://picsum.photos/seed/cat-tech/400/260',     size: 'normal' },
  { id: 'sports',        name: 'Sports',          img: 'https://picsum.photos/seed/cat-sport/800/320',    size: 'wide' },
  { id: 'science',       name: 'Science',         img: 'https://picsum.photos/seed/cat-sci/400/260',      size: 'normal' },
  { id: 'health',        name: 'Health',          img: 'https://picsum.photos/seed/cat-health/400/700',   size: 'tall' },
  { id: 'arts',          name: 'Arts & Culture',  img: 'https://picsum.photos/seed/cat-arts/400/260',     size: 'normal' },
  { id: 'entertainment', name: 'Entertainment',   img: 'https://picsum.photos/seed/cat-ent/800/320',      size: 'wide' },
  { id: 'travel',        name: 'Travel',          img: 'https://picsum.photos/seed/cat-travel/400/700',   size: 'tall' },
  { id: 'food',          name: 'Food & Drink',    img: 'https://picsum.photos/seed/cat-food/400/260',     size: 'normal' },
  { id: 'politics',      name: 'Politics',        img: 'https://picsum.photos/seed/cat-pol/400/260',      size: 'normal' },
  { id: 'education',     name: 'Education',       img: 'https://picsum.photos/seed/cat-edu/400/260',      size: 'normal' },
  { id: 'finance',       name: 'Finance',         img: 'https://picsum.photos/seed/cat-fin/800/320',      size: 'wide' },
  { id: 'space',         name: 'Space',           img: 'https://picsum.photos/seed/cat-space/400/700',    size: 'tall' },
  { id: 'climate',       name: 'Climate',         img: 'https://picsum.photos/seed/cat-climate/400/260',  size: 'normal' },
  { id: 'gaming',        name: 'Gaming',          img: 'https://picsum.photos/seed/cat-game/400/260',     size: 'normal' },
]

function ArrowUp() {
  return (
    <svg className="market-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 14l5-5 5 5" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg className="market-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 10l5 5 5-5" />
    </svg>
  )
}

function MiniChart({ up }: { up: boolean }) {
  const stroke = up ? '#16a34a' : '#dc2626'
  const d = up
    ? 'M0 9 L5 7 L10 10 L15 4 L20 8 L24 5'
    : 'M0 4 L5 8 L10 5 L15 10 L20 6 L24 9'
  return (
    <svg className="market-spark" viewBox="0 0 24 12" aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MarketTickerItems({ items, keyPrefix }: { items: TickerItem[]; keyPrefix: string }) {
  return (
    <>
      {items.map((t, i) => (
        <span key={`${keyPrefix}-${t.symbol}-${i}`} className={`market-tick ${t.up ? 'market-tick--up' : 'market-tick--down'}`}>
          <span className="market-tick__sym">{t.symbol}</span>
          {t.up ? <ArrowUp /> : <ArrowDown />}
          <span className={t.up ? 'market-tick__pct market-tick__pct--up' : 'market-tick__pct market-tick__pct--down'}>
            {t.up ? '+' : ''}
            {t.pct.toFixed(2)}%
          </span>
          <MiniChart up={t.up} />
        </span>
      ))}
    </>
  )
}

function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}


function IconBookmarkOutline() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconBookmarkFilled() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconLike() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 16.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  )
}

function IconDislike() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 7.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  )
}

function IconComment() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconExpand() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function IconCollapse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="10" y1="14" x2="3" y2="21" />
    </svg>
  )
}


function IconBookmarkSmall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}


function IconQuiz() {
  return (
    <svg width="20" height="20" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M32 3C19.4 3 9.2 13.2 9.2 25.8c0 8 4.1 14.6 9.3 19.2 1.2 1.1 2.1 2.7 2.1 4.3V50h22.8v-.7c0-1.6.9-3.2 2.1-4.3 5.2-4.6 9.3-11.2 9.3-19.2C54.8 13.2 44.6 3 32 3Z" fill="#F9D400"/>
      <path d="M32 3C19.4 3 9.2 13.2 9.2 25.8c0 8 4.1 14.6 9.3 19.2 1.2 1.1 2.1 2.7 2.1 4.3V50h2.6v-.7c0-1.6-.9-3.2-2.1-4.3-5.2-4.6-9.3-11.2-9.3-19.2C11.8 13.7 21.5 3.8 33.4 3.1A26 26 0 0 0 32 3Z" fill="#F1EA61"/>
      <rect x="20.6" y="50" width="22.8" height="7.5" rx="2.6" fill="#0D5F7E"/>
      <rect x="23.8" y="57.5" width="16.4" height="5.6" rx="2.3" fill="#084C66"/>
      <path d="M28.4 26.6a3.8 3.8 0 1 1 7.2-2c0 1.8-1 2.7-2.1 3.4-1.3.9-2.2 1.6-2.2 3.4" stroke="#0D5F7E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="32" cy="36.9" r="2.1" fill="#0D5F7E"/>
      <path d="M4.5 23.2h4.7M6.2 33l4.5-1.7M6.2 13.5l4.5 1.7M54.8 23.2h4.7M53.3 31.3l4.5 1.7M53.3 15.2l4.5-1.7" stroke="#F9D400" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function IconThumbUp({ filled }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function IconThumbDown({ filled }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function IconReply() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  )
}

function IconChronology() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 8v4l3 2" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2" opacity="0.45" strokeWidth="1.5" />
    </svg>
  )
}

function IconAI() {
  const uid = useId().replace(/:/g, '')
  const gradId = `insights-ai-grad-${uid}`
  const fill = `url(#${gradId})`
  return (
    <svg className="insights-ai-mark" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2.5l1.1 3.4h3.6l-2.9 2.1 1.1 3.4L12 9.3 8.1 11.4l1.1-3.4-2.9-2.1h3.6L12 2.5z" fill={fill} stroke="none" />
      <path
        d="M12 14.5c2.2 0 4 1.4 4 3.2S14.2 21 12 21s-4-1.2-4-3.3 1.8-3.2 4-3.2Z"
        fill={fill}
        opacity="0.9"
      />
      <path
        d="M7 7.5h.01M17 16.5h.01M5 12.5h.01M19 12.5h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <defs>
        <linearGradient id={gradId} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0369a1" />
          <stop offset="0.5" stopColor="#0891b2" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function IconInsightsList() {
  const uid = useId().replace(/:/g, '')
  const gradId = `insights-list-grad-${uid}`
  return (
    <svg width="22" height="22" viewBox="0 0 512 512" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--insights-grad-start, #38bdf8)" />
          <stop offset="100%" stopColor="var(--insights-grad-end, #818cf8)" />
        </linearGradient>
      </defs>
      <circle cx="80" cy="112" r="64" fill={`url(#${gradId})`} />
      <path d="M60 112l12 12 24-24" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="180" y="80" width="280" height="64" rx="32" fill={`url(#${gradId})`} />
      
      <circle cx="80" cy="256" r="64" fill={`url(#${gradId})`} />
      <path d="M60 256l12 12 24-24" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="180" y="224" width="280" height="64" rx="32" fill={`url(#${gradId})`} />

      <circle cx="80" cy="400" r="64" fill={`url(#${gradId})`} />
      <path d="M60 400l12 12 24-24" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="180" y="368" width="280" height="64" rx="32" fill={`url(#${gradId})`} />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconAudio() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  )
}

function IconPlayLarge() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  )
}

function IconPauseLarge() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>
  )
}

/*
function IconSkipBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>
    </svg>
  )
}
*/

/*
function IconSkipForward() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>
    </svg>
  )
}
*/

/*
function IconStop() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}
*/

function IconHome({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
      <path d="M9.5 14h2v2.5h-2z" strokeWidth={active ? 1.85 : 1.75} />
      <path d="M14 10.5h2v2h-2z" strokeWidth={active ? 1.65 : 1.5} opacity="0.88" />
    </svg>
  )
}

function IconHeart({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
      <path
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.22 : 0}
        stroke="currentColor"
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.8 6.6a5.5 5.5 0 0 0-7.8 0L12 7.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z"
      />
    </svg>
  )
}


function IconProfile({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4.5c2.2 0 4 1.6 4 3.6 0 1.2-.6 2.3-1.5 3" strokeWidth={1.65} opacity="0.55" />
      <circle cx="12" cy="9.5" r="3.5" />
      <path d="M5 20.5c0-3.8 3-6.5 7-6.5s7 2.7 7 6.5" />
      <path d="M9 20.5h6" strokeWidth={1.6} opacity="0.45" />
    </svg>
  )
}

function IconGrid({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 1.9
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
    </svg>
  )
}

function IconMapNav({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.314-2.686-6-6-6Z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <circle cx="12" cy="8" r="2.2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.5 : 0} />
    </svg>
  )
}

function groupTimelineByYear(events: TimelineEvent[]) {
  const map = new Map<number, TimelineEvent[]>()
  for (const ev of events) {
    const y = new Date(ev.date + 'T12:00:00').getFullYear()
    const list = map.get(y) ?? []
    list.push(ev)
    map.set(y, list)
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0])
}

function formatTimelineDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ChronologyModal({ story, onClose }: { story: Story | null; onClose: () => void }) {
  const tl = story ? getChronologyForStory(story) : null

  const indexedYearGroups = useMemo(() => {
    if (!tl) return []
    let globalIndex = 0
    return groupTimelineByYear(tl.events).map(([year, yearEvents]) => ({
      year,
      items: yearEvents.map((ev) => ({ ev, globalIndex: globalIndex++ })),
    }))
  }, [tl])

  useEffect(() => {
    if (!story) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [story])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (story) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [story, onClose])

  if (!story) return null

  return (
    <div className="chrono-backdrop" role="presentation" onClick={onClose}>
      <div
        className="chrono-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chrono-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="chrono-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {!tl ? (
          <div className="chrono-modal__empty">
            <p className="chrono-modal__empty-title">No timeline yet</p>
            <p className="chrono-modal__empty-text">We don’t have a dated thread for this story. Try another article.</p>
          </div>
        ) : (
          <>
            <header className="chrono-modal__head">
              <p className="chrono-modal__eyebrow">
                <ArticleTag tag={tl.tag} />
              </p>
              <h2 id="chrono-modal-title" className="chrono-modal__title">
                {tl.topicTitle}
              </h2>
              <p className="chrono-modal__intro">{tl.intro}</p>
            </header>
            <div className="chrono-modal__scroll">
              <div className="chrono-track">
                <div className="chrono-track__line" aria-hidden />
                <div className="chrono-track__inner">
                  {indexedYearGroups.map(({ year, items }) => (
                    <section key={year} className="chrono-year" id={`chrono-year-${year}`}>
                      <h3 className="chrono-year__label">{year}</h3>
                      <ul className="chrono-year__list">
                        {items.map(({ ev, globalIndex }) => {
                          const bodyRight = globalIndex % 2 === 0
                          return (
                            <li
                              key={ev.date + ev.headline}
                              className={`chrono-event ${bodyRight ? 'chrono-event--body-right' : 'chrono-event--body-left'}${ev.image ? '' : ' chrono-event--no-media'}`}
                            >
                              {ev.image && (
                                <div className="chrono-event__media">
                                  <img
                                    className="chrono-event__img"
                                    src={ev.image}
                                    alt=""
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <div className="chrono-event__axis" aria-hidden>
                                <span className="chrono-event__dot" />
                              </div>
                              <div className="chrono-event__body">
                                <time className="chrono-event__date" dateTime={ev.date}>
                                  {formatTimelineDate(ev.date)}
                                </time>
                                <h4 className="chrono-event__headline">{ev.headline}</h4>
                                <p className="chrono-event__summary">{ev.summary}</p>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function IconCamera({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function IconFocus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  )
}

function FeedScreen({
  prefersReducedMotion,
  enableFeedCapture,
  onToggleFullscreen,
}: {
  prefersReducedMotion: boolean
  enableFeedCapture: boolean
  onToggleFullscreen: (isFullscreen: boolean) => void
}) {
  const deck = FOR_YOU_DECK
  const [idx, setIdx] = useState(0)
  const [flipIdx, setFlipIdx] = useState(0)
  const [cardAnim, setCardAnim] = useState<'idle' | 'flip-out' | 'flip-in'>('idle')
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  // Story being rendered into the off-screen stage for screenshot capture
  const [captureStory, setCaptureStory] = useState<Story | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onToggleFullscreen(expandedIdx !== null)
  }, [expandedIdx, onToggleFullscreen])

  // Restore app chrome (header + nav) when the feed unmounts
  useEffect(() => () => onToggleFullscreen(false), [onToggleFullscreen])

  // Once the off-screen capture card is in the DOM, rasterize it and download
  useEffect(() => {
    if (!captureStory) return
    const node = captureRef.current
    if (!node) return
    let cancelled = false
    setIsCapturing(true)
    ;(async () => {
      try {
        // Wait for the card image to finish decoding so it isn't blank
        const img = node.querySelector('img')
        if (img && !img.complete) {
          await new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          })
        }
        const dataUrl = await toPng(node, {
          width: node.offsetWidth,
          height: node.offsetHeight,
          pixelRatio: 2,
          cacheBust: true,
        })
        if (cancelled) return
        const link = document.createElement('a')
        link.download = `newsmuncher-${captureStory.id}.png`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error('Feed capture failed', err)
      } finally {
        if (!cancelled) {
          setIsCapturing(false)
          setCaptureStory(null)
        }
      }
    })()
    return () => { cancelled = true }
  }, [captureStory])

  const flipBusy = useRef(false)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const prevIdxRef = useRef(0)

  const currentBase = deck[idx]
  const sameTagDeck = useMemo(
    () => deck.filter(s => s.tag === currentBase.tag),
    [currentBase.tag]
  )
  // Watch which card scrolls into view and update the active index
  useEffect(() => {
    const container = stackRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const i = cardRefs.current.findIndex(r => r === entry.target)
            if (i !== -1 && i !== prevIdxRef.current) {
              prevIdxRef.current = i
              setIdx(i)
              setFlipIdx(0)
            }
          }
        }
      },
      { root: container, threshold: 0.5 }
    )
    cardRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  // Swipe left → similar article with page-flip animation
  const goSimilar = useCallback(() => {
    if (cardAnim !== 'idle' || flipBusy.current) return
    if (sameTagDeck.length < 2) return
    if (prefersReducedMotion) {
      setFlipIdx(fi => (fi + 1) % sameTagDeck.length)
      return
    }
    flipBusy.current = true
    setCardAnim('flip-out')
    setTimeout(() => {
      setFlipIdx(fi => (fi + 1) % sameTagDeck.length)
      setCardAnim('flip-in')
      setTimeout(() => {
        setCardAnim('idle')
        flipBusy.current = false
      }, 310)
    }, 230)
  }, [cardAnim, sameTagDeck.length, prefersReducedMotion])

  // Touch events for mobile
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    swipeStart.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!swipeStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - swipeStart.current.x
    const dy = t.clientY - swipeStart.current.y
    swipeStart.current = null
    const adx = Math.abs(dx), ady = Math.abs(dy)
    if (adx > 35 && adx > ady && dx < 0) goSimilar()
  }, [goSimilar])

  // Pointer events for desktop/mouse (skip touch pointers to avoid double-firing)
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    if (!swipeStart.current) return
    const dx = e.clientX - swipeStart.current.x
    const dy = e.clientY - swipeStart.current.y
    swipeStart.current = null
    const adx = Math.abs(dx), ady = Math.abs(dy)
    if (adx > 35 && adx > ady && dx < 0) goSimilar()
  }, [goSimilar])

  const animClass = cardAnim === 'flip-out' ? ' feed-card--flip-out'
    : cardAnim === 'flip-in' ? ' feed-card--flip-in'
    : ''

  return (
    <div className="feed-screen">
      {/* Scroll-snap card list — positioned to fill exactly between header and nav */}
      <div
        className="feed-stack"
        ref={stackRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { swipeStart.current = null }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { swipeStart.current = null }}
      >
        {deck.map((story, i) => {
          const isActive = i === idx
          const isFocused = i === focusedIdx
          const isExpanded = i === expandedIdx
          const isHiddenSibling =
            (focusedIdx !== null && !isFocused) || (expandedIdx !== null && !isExpanded)
          const shownStory = isActive
            ? (sameTagDeck[flipIdx % sameTagDeck.length] ?? story)
            : story
          return (
            <div
              key={i}
              className={`feed-card${isActive ? animClass : ''}${isFocused ? ' feed-card--focused' : ''}${isExpanded ? ' feed-card--expanded' : ''}${isHiddenSibling ? ' feed-card--hidden-sibling' : ''}`}
              ref={el => { cardRefs.current[i] = el }}
            >
              <img src={shownStory.image} alt="" className="feed-card__img" draggable={false} />
              <div className="feed-card__grad" />

              {/* Top overlay: category tag */}
              <div className="feed-card__top" aria-hidden>
                <span className="feed-card__cat">BRANCH REEL</span>
                {!isFocused && i === 0 && (
                  <span className="feed-card__hint">↓ scroll &nbsp;·&nbsp; ← similar</span>
                )}
              </div>

              {/* Collapse button for focused mode */}
              {isExpanded && (
                <button
                  type="button"
                  className="feed-card__collapse"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedIdx(null)
                  }}
                  aria-label="Exit full screen"
                >
                  <IconCollapse />
                </button>
              )}

              {/* Bottom info */}
              <div className="feed-card__info">
                <p className="feed-card__meta-line">@trending · {shownStory.readTime}</p>
                <h3 className="feed-card__title">{shownStory.title}</h3>
                
                {/* Publisher, Date & Time, Share Icon row */}
                <div className="feed-card__metadata-row">
                  <span className="feed-card__pub-name">{shownStory.publisher || 'Reuters'}</span>
                  <span className="feed-card__dot">·</span>
                  <span className="feed-card__pub-date">{shownStory.date || 'June 2, 2026'} · {shownStory.time || '10:00 AM'}</span>
                  <span className="feed-card__dot">·</span>
                  <button
                    type="button"
                    className="feed-card__inline-share"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(window.location.href)
                      alert(`Copied link to share: "${shownStory.title}"`)
                    }}
                    aria-label="Share story"
                  >
                    <IconShare />
                  </button>
                </div>

                <p className="feed-card__dek">{shownStory.dek}</p>
                
                <div className="feed-card__cta-row">
                  <div className="feed-card__actions">
                    <button type="button" className="feed-card__action-btn" aria-label="Like story">
                      <IconLike />
                    </button>
                    <button type="button" className="feed-card__action-btn" aria-label="Dislike story">
                      <IconDislike />
                    </button>
                    <button type="button" className="feed-card__action-btn" aria-label="View comments">
                      <IconComment />
                    </button>
                    {enableFeedCapture && (
                      <button
                        type="button"
                        className="feed-card__action-btn feed-card__action-btn--capture"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isCapturing) return
                          setCaptureStory(shownStory)
                        }}
                        disabled={isCapturing}
                        aria-label="Save card as image"
                      >
                        <IconCamera />
                      </button>
                    )}
                    <button
                      type="button"
                      className={`feed-card__action-btn feed-card__action-btn--focus${isFocused ? ' feed-card__action-btn--active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedIdx(null)
                        setFocusedIdx(isFocused ? null : i)
                      }}
                      aria-label="Focus thread"
                      aria-pressed={isFocused}
                    >
                      <IconFocus />
                    </button>
                    <button
                      type="button"
                      className={`feed-card__action-btn feed-card__action-btn--expand${isExpanded ? ' feed-card__action-btn--active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setFocusedIdx(null)
                        setExpandedIdx(isExpanded ? null : i)
                      }}
                      aria-label="Expand to full screen"
                      aria-pressed={isExpanded}
                    >
                      <IconExpand />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Off-screen stage used only to rasterize a clean "report" screenshot:
          phone-width, height grows to fit so nothing is cropped or clipped. */}
      {captureStory && (
        <div className="feed-capture-stage" aria-hidden>
          <div className="feed-capture-card" ref={captureRef}>
            <img
              src={captureStory.image}
              alt=""
              className="feed-capture-card__img"
              crossOrigin="anonymous"
            />
            <div className="feed-capture-card__body">
              <div className="feed-capture-card__tag">
                <ArticleTag tag={captureStory.tag} />
              </div>
              <h3 className="feed-capture-card__title">{captureStory.title}</h3>
              <p className="feed-capture-card__meta">
                {(captureStory.publisher || 'Reuters')} · {(captureStory.date || 'June 2, 2026')} · {(captureStory.time || '10:00 AM')}
              </p>
              <p className="feed-capture-card__dek">{captureStory.dek}</p>
              {STORY_CONTENT[captureStory.id]?.body && (
                <p className="feed-capture-card__report">{STORY_CONTENT[captureStory.id].body}</p>
              )}
              <div className="feed-capture-card__foot">
                <span className="feed-capture-card__brand">Newsmuncher</span>
                <span className="feed-capture-card__read">{captureStory.readTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type CityInsight = {
  name: string
  country: string
  locale: string
  currency: string
  knownFor: string
  tidbit: string
  weather: { tempC: number; condition: string; humidity: number; windKph: number }
  pollution: { aqi: number; pm25: number; status: 'Good' | 'Moderate' | 'Unhealthy' }
  crimeRatePct: number
  currentRentMonthly: number
  currentPropertyPerSqm: number
  institutions: string[]
  places: string[]
  crimeNews: { title: string; source: string; time: string; url: string }[]
  housing: { months: string[]; rentIndex: number[]; propertyIndex: number[] }
}

const CITY_INSIGHTS: CityInsight[] = [
  {
    name: 'Singapore',
    country: 'Singapore',
    locale: 'en-SG',
    currency: 'SGD',
    knownFor: 'Global finance, logistics, and world-class urban planning.',
    tidbit: 'Changi Airport consistently ranks among the best airports worldwide.',
    weather: { tempC: 31, condition: 'Humid tropical', humidity: 79, windKph: 14 },
    pollution: { aqi: 43, pm25: 12, status: 'Good' },
    crimeRatePct: 1.8,
    currentRentMonthly: 3600,
    currentPropertyPerSqm: 16800,
    institutions: ['National University of Singapore', 'Singapore Management University', 'A*STAR'],
    places: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa'],
    crimeNews: [
      { title: 'Police step up anti-scam operations in CBD', source: 'The Straits Times', time: '3h ago', url: 'https://news.google.com/search?q=Singapore%20crime' },
      { title: 'Transit theft cases dip after station patrol boost', source: 'CNA', time: '7h ago', url: 'https://news.google.com/search?q=Singapore%20police%20latest' },
      { title: 'Cybercrime taskforce reports new phishing trend', source: 'TODAY', time: '11h ago', url: 'https://news.google.com/search?q=Singapore%20cybercrime' },
      { title: 'Neighbourhood watch pilot expands to three districts', source: 'Mothership', time: '16h ago', url: 'https://news.google.com/search?q=Singapore%20public%20safety' },
      { title: 'Court sentences repeat fraud offender in loan scam', source: 'The Business Times', time: '1d ago', url: 'https://news.google.com/search?q=Singapore%20court%20crime' },
    ],
    housing: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      rentIndex: [100, 102, 103, 105, 106, 108],
      propertyIndex: [100, 101, 102, 103, 104, 105],
    },
  },
  {
    name: 'London',
    country: 'United Kingdom',
    locale: 'en-GB',
    currency: 'GBP',
    knownFor: 'Historic landmarks, global finance, media, and arts.',
    tidbit: 'The London Underground is the oldest underground railway network in the world.',
    weather: { tempC: 18, condition: 'Partly cloudy', humidity: 68, windKph: 21 },
    pollution: { aqi: 58, pm25: 18, status: 'Moderate' },
    crimeRatePct: 8.6,
    currentRentMonthly: 2450,
    currentPropertyPerSqm: 11300,
    institutions: ['Imperial College London', 'London School of Economics', 'UCL'],
    places: ['Tower Bridge', 'British Museum', 'Hyde Park'],
    crimeNews: [
      { title: 'Met Police announces focused operation in West End', source: 'BBC', time: '2h ago', url: 'https://news.google.com/search?q=London%20crime' },
      { title: 'Retail theft concerns rise across central boroughs', source: 'The Guardian', time: '6h ago', url: 'https://news.google.com/search?q=London%20public%20safety' },
      { title: 'Knife crime prevention funding increased for schools', source: 'Sky News', time: '9h ago', url: 'https://news.google.com/search?q=London%20knife%20crime' },
      { title: 'Transport police report decline in station assaults', source: 'Evening Standard', time: '13h ago', url: 'https://news.google.com/search?q=London%20transport%20police' },
      { title: 'Fraud crackdown leads to multiple arrests', source: 'Reuters', time: '1d ago', url: 'https://news.google.com/search?q=London%20fraud%20arrests' },
    ],
    housing: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      rentIndex: [100, 101, 103, 105, 107, 109],
      propertyIndex: [100, 100, 101, 102, 103, 104],
    },
  },
  {
    name: 'Bengaluru',
    country: 'India',
    locale: 'en-IN',
    currency: 'INR',
    knownFor: 'Tech ecosystem, startups, and a strong engineering talent pool.',
    tidbit: 'Often called the “Silicon Valley of India.”',
    weather: { tempC: 27, condition: 'Sunny intervals', humidity: 62, windKph: 12 },
    pollution: { aqi: 91, pm25: 34, status: 'Moderate' },
    crimeRatePct: 6.2,
    currentRentMonthly: 37000,
    currentPropertyPerSqm: 92000,
    institutions: ['Indian Institute of Science', 'IIM Bangalore', 'NIMHANS'],
    places: ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bangalore Palace'],
    crimeNews: [
      { title: 'City police roll out AI-assisted traffic surveillance', source: 'The Hindu', time: '1h ago', url: 'https://news.google.com/search?q=Bengaluru%20crime' },
      { title: 'Cybercrime cell flags surge in fake job scams', source: 'Deccan Herald', time: '4h ago', url: 'https://news.google.com/search?q=Bengaluru%20cybercrime' },
      { title: 'Apartment communities adopt coordinated safety plans', source: 'Indian Express', time: '8h ago', url: 'https://news.google.com/search?q=Bengaluru%20public%20safety' },
      { title: 'Property fraud arrests made in southeast district', source: 'Times of India', time: '14h ago', url: 'https://news.google.com/search?q=Bengaluru%20property%20fraud' },
      { title: 'Night patrol expansion announced for tech corridors', source: 'Hindustan Times', time: '1d ago', url: 'https://news.google.com/search?q=Bengaluru%20police%20latest' },
    ],
    housing: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      rentIndex: [100, 101, 102, 104, 106, 107],
      propertyIndex: [100, 101, 101, 102, 103, 104],
    },
  },
]

function CityHousingChart({ city }: { city: CityInsight }) {
  const width = 300
  const height = 120
  const padX = 10
  const padY = 12
  const all = [...city.housing.rentIndex, ...city.housing.propertyIndex]
  const min = Math.min(...all) - 1
  const max = Math.max(...all) + 1
  const toY = (v: number) => height - padY - ((v - min) / (max - min || 1)) * (height - padY * 2)
  const toX = (i: number) => padX + (i * (width - padX * 2)) / (city.housing.months.length - 1 || 1)
  const linePath = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')

  return (
    <div className="city-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="city-chart" role="img" aria-label="Rent and property trend chart">
        <path d={linePath(city.housing.rentIndex)} className="city-chart__line city-chart__line--rent" />
        <path d={linePath(city.housing.propertyIndex)} className="city-chart__line city-chart__line--property" />
      </svg>
      <div className="city-chart__labels">
        {city.housing.months.map((m) => <span key={m}>{m}</span>)}
      </div>
      <div className="city-chart__legend">
        <span><i className="city-chart__dot city-chart__dot--rent" /> Rent index</span>
        <span><i className="city-chart__dot city-chart__dot--property" /> Property index</span>
      </div>
    </div>
  )
}

function formatCityCurrency(city: CityInsight, value: number): string {
  return new Intl.NumberFormat(city.locale, {
    style: 'currency',
    currency: city.currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function CityMapScreen() {
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<CityInsight>(CITY_INSIGHTS[0])
  const [showResults, setShowResults] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return CITY_INSIGHTS
    const q = query.toLowerCase()
    return CITY_INSIGHTS.filter((c) => `${c.name} ${c.country}`.toLowerCase().includes(q))
  }, [query])

  const mapUrl = useMemo(
    () => `https://www.google.com/maps?q=${encodeURIComponent(`${selectedCity.name}, ${selectedCity.country}`)}&output=embed`,
    [selectedCity],
  )

  return (
    <section className="city-screen" aria-labelledby="city-insights-heading">
      <div className="city-hero">
        <div className="city-hero__mesh" aria-hidden />
        <div className="city-hero__inner">
          <span className="insights-ai-badge">
            <IconAI />
            <span>City Intel</span>
          </span>
          <h2 id="city-insights-heading" className="insights-title">Explore a city in real time</h2>
          <p className="insights-lede">Search for a city to see map context, safety signals, housing movement, weather, pollution, and local highlights.</p>
        </div>
      </div>

      <div className="city-search-wrap">
        <input
          className="city-search"
          type="search"
          placeholder="Search city (e.g. Singapore, London, Bengaluru)"
          value={query}
          onFocus={() => setShowResults(true)}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
          aria-label="Search city"
        />
        {showResults && (
          <ul className="city-search-results">
            {filtered.map((city) => (
              <li key={city.name}>
                <button
                  type="button"
                  className="city-search-item"
                  onClick={() => {
                    setSelectedCity(city)
                    setQuery(city.name)
                    setShowResults(false)
                  }}
                >
                  <strong>{city.name}</strong>
                  <span>{city.country}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="city-search-empty">No matching cities yet</li>}
          </ul>
        )}
      </div>

      <article className="city-card city-map-card">
        <div className="city-card__head">
          <h3>{selectedCity.name}, {selectedCity.country}</h3>
          <span className="section-pill">Live map</span>
        </div>
        <div className="city-map-frame">
          <iframe
            title={`Map of ${selectedCity.name}`}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </article>

      <article className="city-card">
        <h3>House rent and property trend</h3>
        <div className="city-price-strip">
          <div className="city-price-pill">
            <span className="city-price-pill__label">Current rent</span>
            <p className="city-price-pill__value">{formatCityCurrency(selectedCity, selectedCity.currentRentMonthly)}</p>
            <span className="city-price-pill__meta">{selectedCity.currency} · per month</span>
          </div>
          <div className="city-price-pill">
            <span className="city-price-pill__label">Current property</span>
            <p className="city-price-pill__value">{formatCityCurrency(selectedCity, selectedCity.currentPropertyPerSqm)}</p>
            <span className="city-price-pill__meta">{selectedCity.currency} · per m²</span>
          </div>
        </div>
        <CityHousingChart city={selectedCity} />
      </article>

      <article className="city-card">
        <h3>Crime rate and latest related news</h3>
        <div className="city-crime-meter">
          <span>Crime rate</span>
          <strong>{selectedCity.crimeRatePct.toFixed(1)}%</strong>
          <div className="city-crime-meter__bar">
            <span style={{ width: `${Math.min(100, selectedCity.crimeRatePct * 8)}%` }} />
          </div>
        </div>
        <ul className="city-news-list">
          {selectedCity.crimeNews.map((item) => (
            <li key={item.title}>
              <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
              <span>{item.source} · {item.time}</span>
            </li>
          ))}
        </ul>
      </article>

      <div className="city-grid">
        <article className="city-card">
          <h3>Weather now</h3>
          <p className="city-weather-temp">{selectedCity.weather.tempC}°C</p>
          <p className="city-sub">{selectedCity.weather.condition}</p>
          <p className="city-sub">Humidity {selectedCity.weather.humidity}% · Wind {selectedCity.weather.windKph} kph</p>
        </article>

        <article className="city-card">
          <h3>Pollution level</h3>
          <p className="city-weather-temp">AQI {selectedCity.pollution.aqi}</p>
          <p className={`city-sub city-aqi city-aqi--${selectedCity.pollution.status.toLowerCase()}`}>{selectedCity.pollution.status} · PM2.5 {selectedCity.pollution.pm25}</p>
        </article>
      </div>

      <article className="city-card">
        <h3>Famous institutions and places</h3>
        <div className="city-list-grid">
          <div>
            <p className="city-mini-head">Institutions</p>
            <ul>{selectedCity.institutions.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div>
            <p className="city-mini-head">Places</p>
            <ul>{selectedCity.places.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </div>
      </article>

      <article className="city-card">
        <h3>What the city is known for</h3>
        <p className="city-sub">{selectedCity.knownFor}</p>
        <p className="city-tidbit"><strong>Tidbit:</strong> {selectedCity.tidbit}</p>
      </article>
    </section>
  )
}

/* ── Finance screen ───────────────────────────────── */
type FinExchange = {
  code: string
  name: string
  region: string
  short: string
}

const FIN_EXCHANGES: FinExchange[] = [
  { code: 'NASDAQ',   name: 'Nasdaq',                  region: 'United States',   short: 'NDQ' },
  { code: 'NYSE',     name: 'New York Stock Exchange', region: 'United States',   short: 'NYS' },
  { code: 'LSE',      name: 'London Stock Exchange',   region: 'United Kingdom',  short: 'LSE' },
  { code: 'TSE',      name: 'Tokyo Stock Exchange',    region: 'Japan',           short: 'TSE' },
  { code: 'NSE',      name: 'National Stock Exchange', region: 'India',           short: 'NSE' },
  { code: 'BSE',      name: 'Bombay Stock Exchange',   region: 'India',           short: 'BSE' },
  { code: 'HKEX',     name: 'Hong Kong Exchange',      region: 'Hong Kong',       short: 'HKX' },
  { code: 'EURONEXT', name: 'Euronext',                region: 'European Union',  short: 'EUR' },
  { code: 'TSX',      name: 'Toronto Stock Exchange',  region: 'Canada',          short: 'TSX' },
  { code: 'SSE',      name: 'Shanghai Stock Exchange', region: 'China',           short: 'SSE' },
]

type IndexConstituent = {
  ticker: string
  name: string
  sector: string
  changePct: number
  series: number[]
}

type IndexInfo = {
  symbol: string
  fullName: string
  region: string
  description: string
  pct: number
  up: boolean
  level: string
  series: number[]
  constituents: IndexConstituent[]
}

const FINANCE_INDICES: IndexInfo[] = [
  {
    symbol: 'SPX',
    fullName: 'S&P 500',
    region: 'United States',
    description: '500 large-cap US stocks across all sectors.',
    pct: 0.42,
    up: true,
    level: '5,231.18',
    series: [5180, 5195, 5188, 5202, 5215, 5210, 5225, 5231],
    constituents: [
      { ticker: 'AAPL',  name: 'Apple',              sector: 'Technology',  changePct: 1.4,  series: [100, 100, 101, 101, 101, 102, 101, 101.4] },
      { ticker: 'MSFT',  name: 'Microsoft',          sector: 'Technology',  changePct: 0.8,  series: [100, 100, 100, 100, 100, 101, 100, 100.8] },
      { ticker: 'NVDA',  name: 'Nvidia',             sector: 'Semiconductors', changePct: 2.1, series: [100, 100, 101, 101, 102, 102, 102, 102.1] },
      { ticker: 'AMZN',  name: 'Amazon',             sector: 'Consumer',    changePct: 0.6,  series: [100, 100, 100, 100, 100, 101, 100, 100.6] },
      { ticker: 'JPM',   name: 'JPMorgan Chase',     sector: 'Financials',  changePct: 0.9,  series: [100, 100, 100, 100, 101, 101, 101, 100.9] },
      { ticker: 'XOM',   name: 'Exxon Mobil',        sector: 'Energy',      changePct: -0.7, series: [100, 100, 100, 100,  99,  99,  99,  99.3] },
      { ticker: 'JNJ',   name: 'Johnson & Johnson',  sector: 'Healthcare',  changePct: 0.3,  series: [100, 100, 100, 100, 100, 100, 100, 100.3] },
      { ticker: 'V',     name: 'Visa',               sector: 'Financials',  changePct: 1.0,  series: [100, 100, 100, 100, 101, 101, 101, 101.0] },
    ],
  },
  {
    symbol: 'NDX',
    fullName: 'Nasdaq 100',
    region: 'United States',
    description: '100 largest non-financial Nasdaq companies, tech-heavy.',
    pct: -0.18,
    up: false,
    level: '18,420.62',
    series: [18460, 18488, 18475, 18450, 18435, 18445, 18430, 18420],
    constituents: [
      { ticker: 'AAPL',  name: 'Apple',              sector: 'Technology',  changePct:  1.4, series: [100, 100, 101, 101, 101, 102, 101, 101.4] },
      { ticker: 'MSFT',  name: 'Microsoft',          sector: 'Technology',  changePct: -0.4, series: [100, 100, 100, 100, 100,  99, 100,  99.6] },
      { ticker: 'GOOGL', name: 'Alphabet',           sector: 'Internet',    changePct: -0.6, series: [100, 100, 100,  99,  99,  99,  99,  99.4] },
      { ticker: 'META',  name: 'Meta Platforms',     sector: 'Internet',    changePct: -0.9, series: [100, 100,  99,  99,  99,  98,  99,  99.1] },
      { ticker: 'NVDA',  name: 'Nvidia',             sector: 'Semiconductors', changePct: -0.8, series: [100, 100, 100, 100,  99,  99,  99,  99.2] },
      { ticker: 'TSLA',  name: 'Tesla',              sector: 'Auto',        changePct:  1.4, series: [100, 100, 101, 101, 101, 102, 101, 101.4] },
      { ticker: 'AVGO',  name: 'Broadcom',           sector: 'Semiconductors', changePct: -1.1, series: [100, 100, 100,  99,  99,  99,  98,  98.9] },
      { ticker: 'COST',  name: 'Costco',             sector: 'Retail',      changePct:  0.4, series: [100, 100, 100, 100, 100, 101, 100, 100.4] },
    ],
  },
  {
    symbol: 'DJI',
    fullName: 'Dow Jones Industrial',
    region: 'United States',
    description: '30 large, well-known US blue-chip companies.',
    pct: 0.31,
    up: true,
    level: '39,512.84',
    series: [39380, 39410, 39395, 39440, 39470, 39450, 39495, 39512],
    constituents: [
      { ticker: 'AAPL',  name: 'Apple',              sector: 'Technology',  changePct:  0.9, series: [100, 100, 100, 100, 101, 101, 101, 100.9] },
      { ticker: 'JPM',   name: 'JPMorgan Chase',     sector: 'Financials',  changePct:  0.9, series: [100, 100, 100, 100, 101, 101, 101, 100.9] },
      { ticker: 'CAT',   name: 'Caterpillar',        sector: 'Industrials', changePct:  0.6, series: [100, 100, 100, 100, 100, 101, 100, 100.6] },
      { ticker: 'BA',    name: 'Boeing',             sector: 'Industrials', changePct: -0.5, series: [100, 100, 100, 100, 100,  99,  99,  99.5] },
      { ticker: 'KO',    name: 'Coca-Cola',          sector: 'Consumer',    changePct:  0.2, series: [100, 100, 100, 100, 100, 100, 100, 100.2] },
      { ticker: 'WMT',   name: 'Walmart',            sector: 'Retail',      changePct:  0.7, series: [100, 100, 100, 100, 101, 101, 100, 100.7] },
      { ticker: 'V',     name: 'Visa',               sector: 'Financials',  changePct:  1.0, series: [100, 100, 100, 100, 101, 101, 101, 101.0] },
      { ticker: 'CVX',   name: 'Chevron',            sector: 'Energy',      changePct: -0.8, series: [100, 100, 100, 100,  99,  99,  99,  99.2] },
    ],
  },
  {
    symbol: 'RUT',
    fullName: 'Russell 2000',
    region: 'United States',
    description: '2,000 small-cap US companies — a domestic-economy proxy.',
    pct: -0.52,
    up: false,
    level: '2,058.46',
    series: [2078, 2082, 2075, 2070, 2068, 2062, 2060, 2058],
    constituents: [
      { ticker: 'SMCI',  name: 'Super Micro Computer', sector: 'Hardware',  changePct: -1.8, series: [100, 100,  99,  99,  98,  98,  98,  98.2] },
      { ticker: 'CVNA',  name: 'Carvana',            sector: 'Retail',      changePct: -2.4, series: [100,  99,  99,  98,  98,  97,  97,  97.6] },
      { ticker: 'IONQ',  name: 'IonQ',               sector: 'Quantum',     changePct:  1.2, series: [100, 100, 100, 101, 101, 101, 101, 101.2] },
      { ticker: 'PLTR',  name: 'Palantir',           sector: 'Software',    changePct:  0.8, series: [100, 100, 100, 100, 100, 101, 100, 100.8] },
      { ticker: 'CELH',  name: 'Celsius Holdings',   sector: 'Beverages',   changePct: -1.3, series: [100, 100, 100,  99,  99,  99,  99,  98.7] },
      { ticker: 'AXSM',  name: 'Axsome Therapeutics',sector: 'Biotech',     changePct: -0.6, series: [100, 100, 100, 100, 100,  99, 100,  99.4] },
      { ticker: 'INSM',  name: 'Insmed',             sector: 'Biotech',     changePct:  0.4, series: [100, 100, 100, 100, 100, 101, 100, 100.4] },
    ],
  },
  {
    symbol: 'FTSE',
    fullName: 'FTSE 100',
    region: 'United Kingdom',
    description: '100 largest London-listed companies by market cap.',
    pct: 0.18,
    up: true,
    level: '8,196.34',
    series: [8170, 8175, 8180, 8185, 8190, 8188, 8194, 8196],
    constituents: [
      { ticker: 'AZN.L', name: 'AstraZeneca',        sector: 'Pharma',      changePct:  0.5, series: [100, 100, 100, 100, 100, 101, 100, 100.5] },
      { ticker: 'SHEL.L',name: 'Shell',              sector: 'Energy',      changePct: -0.4, series: [100, 100, 100, 100, 100,  99, 100,  99.6] },
      { ticker: 'HSBA.L',name: 'HSBC',               sector: 'Financials',  changePct:  0.7, series: [100, 100, 100, 100, 101, 101, 100, 100.7] },
      { ticker: 'ULVR.L',name: 'Unilever',           sector: 'Consumer',    changePct:  0.2, series: [100, 100, 100, 100, 100, 100, 100, 100.2] },
      { ticker: 'BP.L',  name: 'BP',                 sector: 'Energy',      changePct: -0.6, series: [100, 100, 100, 100, 100,  99,  99,  99.4] },
      { ticker: 'GSK.L', name: 'GSK',                sector: 'Pharma',      changePct:  0.3, series: [100, 100, 100, 100, 100, 100, 100, 100.3] },
      { ticker: 'BARC.L',name: 'Barclays',           sector: 'Financials',  changePct:  0.9, series: [100, 100, 100, 100, 101, 101, 101, 100.9] },
    ],
  },
  {
    symbol: 'NIKKEI',
    fullName: 'Nikkei 225',
    region: 'Japan',
    description: '225 prominent Japanese companies on the Tokyo exchange.',
    pct: 0.74,
    up: true,
    level: '40,918.20',
    series: [40620, 40680, 40720, 40760, 40790, 40830, 40880, 40918],
    constituents: [
      { ticker: '7203.T',name: 'Toyota Motor',       sector: 'Auto',        changePct:  1.1, series: [100, 100, 100, 101, 101, 101, 101, 101.1] },
      { ticker: '6758.T',name: 'Sony Group',         sector: 'Electronics', changePct:  0.6, series: [100, 100, 100, 100, 100, 101, 100, 100.6] },
      { ticker: '9984.T',name: 'SoftBank Group',     sector: 'Conglomerate',changePct:  1.8, series: [100, 100, 101, 101, 101, 102, 101, 101.8] },
      { ticker: '6861.T',name: 'Keyence',            sector: 'Industrials', changePct:  0.4, series: [100, 100, 100, 100, 100, 101, 100, 100.4] },
      { ticker: '8035.T',name: 'Tokyo Electron',     sector: 'Semiconductors', changePct: 1.5, series: [100, 100, 101, 101, 101, 102, 101, 101.5] },
      { ticker: '9983.T',name: 'Fast Retailing',     sector: 'Retail',      changePct: -0.2, series: [100, 100, 100, 100, 100, 100, 100,  99.8] },
      { ticker: '6098.T',name: 'Recruit Holdings',   sector: 'Services',    changePct:  0.7, series: [100, 100, 100, 100, 101, 101, 100, 100.7] },
    ],
  },
]

type SearchInstrument = {
  symbol: string
  name: string
  type: 'Equity' | 'Index' | 'ETF' | 'Crypto' | 'Commodity' | 'Forex'
  exchange?: string
}

const SEARCH_INSTRUMENTS: SearchInstrument[] = [
  { symbol: 'AAPL',  name: 'Apple Inc.',           type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'MSFT',  name: 'Microsoft',            type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'NVDA',  name: 'Nvidia',               type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'AMZN',  name: 'Amazon',               type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet',             type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'META',  name: 'Meta Platforms',       type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'TSLA',  name: 'Tesla',                type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'JPM',   name: 'JPMorgan Chase',       type: 'Equity', exchange: 'NYSE' },
  { symbol: 'V',     name: 'Visa',                 type: 'Equity', exchange: 'NYSE' },
  { symbol: 'XOM',   name: 'Exxon Mobil',          type: 'Equity', exchange: 'NYSE' },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',    type: 'Equity', exchange: 'NYSE' },
  { symbol: 'WMT',   name: 'Walmart',              type: 'Equity', exchange: 'NYSE' },
  { symbol: 'BA',    name: 'Boeing',               type: 'Equity', exchange: 'NYSE' },
  { symbol: 'CAT',   name: 'Caterpillar',          type: 'Equity', exchange: 'NYSE' },
  { symbol: 'KO',    name: 'Coca-Cola',            type: 'Equity', exchange: 'NYSE' },
  { symbol: 'CVX',   name: 'Chevron',              type: 'Equity', exchange: 'NYSE' },
  { symbol: 'COIN',  name: 'Coinbase',             type: 'Equity', exchange: 'NASDAQ' },
  { symbol: 'PLTR',  name: 'Palantir',             type: 'Equity', exchange: 'NYSE' },
  { symbol: 'SPX',   name: 'S&P 500',              type: 'Index'  },
  { symbol: 'NDX',   name: 'Nasdaq 100',           type: 'Index'  },
  { symbol: 'DJI',   name: 'Dow Jones Industrial', type: 'Index'  },
  { symbol: 'RUT',   name: 'Russell 2000',         type: 'Index'  },
  { symbol: 'SPY',   name: 'SPDR S&P 500 ETF',     type: 'ETF'    },
  { symbol: 'QQQ',   name: 'Invesco QQQ ETF',      type: 'ETF'    },
  { symbol: 'BTC',   name: 'Bitcoin',              type: 'Crypto' },
  { symbol: 'ETH',   name: 'Ethereum',             type: 'Crypto' },
  { symbol: 'GOLD',  name: 'Gold spot',            type: 'Commodity' },
  { symbol: 'OIL',   name: 'WTI Crude Oil',        type: 'Commodity' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar',   type: 'Forex'  },
]

type EconKey = 'inflation' | 'jobs' | 'growth'
type EconRange = {
  min: number
  max: number
  targetLow: number
  targetHigh: number
  targetLabel: string
}
type EconIndicator = {
  id: EconKey
  label: string
  current: string
  currentValue: number
  trailing: string
  delta: number
  goodWhenUp: boolean
  range: EconRange
  story: string
  newsHeadline: string
  newsSource: string
  symbols: string[]
}

const ECONOMIC_INDICATORS: EconIndicator[] = [
  {
    id: 'inflation', label: 'CPI inflation', current: '3.2%', currentValue: 3.2, trailing: 'YoY · last month',
    delta: -0.4, goodWhenUp: false,
    range: { min: 0, max: 6, targetLow: 1.5, targetHigh: 2.5, targetLabel: 'Fed target 2%' },
    story: 'Headline disinflation continues; services prices remain sticky.',
    newsHeadline: 'Goods cool but services keep CPI above target',
    newsSource: 'Reuters', symbols: ['SPX', 'GOLD'],
  },
  {
    id: 'jobs', label: 'Unemployment', current: '4.1%', currentValue: 4.1, trailing: 'Headline · last month',
    delta: -0.2, goodWhenUp: false,
    range: { min: 2, max: 8, targetLow: 3.5, targetHigh: 5, targetLabel: 'Full-employment band' },
    story: 'Hiring softens but layoffs remain low; wage growth easing.',
    newsHeadline: 'Payrolls in line; wages cool slightly',
    newsSource: 'Bloomberg', symbols: ['JPM', 'WMT'],
  },
  {
    id: 'growth', label: 'GDP growth', current: '2.4%', currentValue: 2.4, trailing: 'Annualized · last quarter',
    delta: 0.3, goodWhenUp: true,
    range: { min: -2, max: 5, targetLow: 2, targetHigh: 3, targetLabel: 'Trend growth ~2.5%' },
    story: 'Consumer spending and capex still support modest expansion.',
    newsHeadline: 'GDP revised higher on capex strength',
    newsSource: 'WSJ', symbols: ['NDX', 'CAT', 'NVDA'],
  },
]

type SectorRow = {
  id: string
  name: string
  changePct: number
  weight: string
  cols: 1 | 2
  rows: 1 | 2
  topCompanies: { ticker: string; changePct: number }[]
  newsHeadline: string
  newsSource: string
}

const FIN_SECTORS: SectorRow[] = [
  { id: 'tech',       name: 'Technology',  changePct:  1.8, weight: '29%', cols: 2, rows: 2, topCompanies: [{ ticker: 'NVDA', changePct: 2.1 }, { ticker: 'AAPL', changePct: 1.4 }, { ticker: 'MSFT', changePct: 0.8 }], newsHeadline: 'AI capex still lifts the chip leaders', newsSource: 'Bloomberg' },
  { id: 'health',     name: 'Healthcare',  changePct:  0.6, weight: '12%', cols: 2, rows: 1, topCompanies: [{ ticker: 'JNJ',  changePct: 0.3 }, { ticker: 'AZN.L', changePct: 0.5 }, { ticker: 'GSK.L', changePct: 0.3 }], newsHeadline: 'Pharma defensives bid as macro softens', newsSource: 'Reuters' },
  { id: 'fin',        name: 'Financials',  changePct:  0.9, weight: '13%', cols: 2, rows: 1, topCompanies: [{ ticker: 'JPM',  changePct: 0.9 }, { ticker: 'V',    changePct: 1.0 }, { ticker: 'BARC.L', changePct: 0.9 }], newsHeadline: 'Bank shares climb on yield curve repricing', newsSource: 'FT' },
  { id: 'consumer',   name: 'Consumer',    changePct: -0.3, weight: '14%', cols: 1, rows: 2, topCompanies: [{ ticker: 'AMZN', changePct: 0.6 }, { ticker: 'KO',   changePct: 0.2 }, { ticker: 'WMT',   changePct: 0.7 }], newsHeadline: 'Discretionary mixed as weather hits foot traffic', newsSource: 'Bloomberg' },
  { id: 'industrial', name: 'Industrials', changePct:  0.4, weight: '9%',  cols: 1, rows: 2, topCompanies: [{ ticker: 'CAT',  changePct: 0.6 }, { ticker: 'BA',   changePct: -0.5 }, { ticker: 'KEY',   changePct: 0.4 }], newsHeadline: 'Backlogs steady; Boeing weighs on group', newsSource: 'WSJ' },
  { id: 'energy',     name: 'Energy',      changePct: -1.4, weight: '4%',  cols: 1, rows: 1, topCompanies: [{ ticker: 'XOM',  changePct: -0.7 }, { ticker: 'CVX', changePct: -0.8 }, { ticker: 'BP.L', changePct: -0.6 }], newsHeadline: 'Crude slides on demand revisions', newsSource: 'Reuters' },
  { id: 'realestate', name: 'Real estate', changePct: -0.6, weight: '3%',  cols: 1, rows: 1, topCompanies: [{ ticker: 'AMT',  changePct: -0.4 }, { ticker: 'PLD', changePct: -0.7 }, { ticker: 'EQIX', changePct: -0.3 }], newsHeadline: 'Higher-for-longer pressures REITs', newsSource: 'FT' },
  { id: 'utilities',  name: 'Utilities',   changePct:  0.2, weight: '3%',  cols: 1, rows: 1, topCompanies: [{ ticker: 'NEE',  changePct: 0.3 }, { ticker: 'DUK',  changePct: 0.1 }, { ticker: 'SO',   changePct: 0.2 }], newsHeadline: 'Regulated utilities steady on rate signals', newsSource: 'WSJ' },
  { id: 'materials',  name: 'Materials',   changePct: -0.8, weight: '3%',  cols: 1, rows: 1, topCompanies: [{ ticker: 'LIN',  changePct: -0.5 }, { ticker: 'FCX', changePct: -1.2 }, { ticker: 'NUE', changePct: -0.6 }], newsHeadline: 'Copper retreats on China demand reads', newsSource: 'Bloomberg' },
]

type CapTier = 'large' | 'mid' | 'small'
type CapStock = {
  ticker: string
  name: string
  marketCap: string
  changePct: number
  series: number[]
  initials: string
  bg: string
}

const CAP_STOCKS: Record<CapTier, CapStock[]> = {
  large: [
    { ticker: 'AAPL',  name: 'Apple',     marketCap: '$3.4T', changePct:  1.4, series: [100,100,101,101,101,102,101,101.4], initials: 'AA', bg: 'linear-gradient(135deg,#0f172a,#475569)' },
    { ticker: 'MSFT',  name: 'Microsoft', marketCap: '$3.1T', changePct:  0.8, series: [100,100,100,100,100,101,100,100.8], initials: 'MS', bg: 'linear-gradient(135deg,#0d9488,#0e7490)' },
    { ticker: 'NVDA',  name: 'Nvidia',    marketCap: '$2.7T', changePct:  2.1, series: [100,100,101,101,102,102,102,102.1], initials: 'NV', bg: 'linear-gradient(135deg,#16a34a,#0d9488)' },
    { ticker: 'AMZN',  name: 'Amazon',    marketCap: '$1.8T', changePct:  0.6, series: [100,100,100,100,100,101,100,100.6], initials: 'AM', bg: 'linear-gradient(135deg,#f97316,#dc2626)' },
    { ticker: 'GOOGL', name: 'Alphabet',  marketCap: '$1.9T', changePct: -0.6, series: [100,100,100,99,99,99,99,99.4],     initials: 'GO', bg: 'linear-gradient(135deg,#0369a1,#2563eb)' },
    { ticker: 'META',  name: 'Meta',      marketCap: '$1.2T', changePct: -0.9, series: [100,100,99,99,99,98,99,99.1],      initials: 'ME', bg: 'linear-gradient(135deg,#3b82f6,#6366f1)' },
  ],
  mid: [
    { ticker: 'SHOP',  name: 'Shopify',   marketCap: '$92B',  changePct:  1.2, series: [100,100,100,101,101,101,101,101.2], initials: 'SH', bg: 'linear-gradient(135deg,#16a34a,#22c55e)' },
    { ticker: 'SNOW',  name: 'Snowflake', marketCap: '$54B',  changePct: -1.3, series: [100,100,100,99,99,99,99,98.7],      initials: 'SN', bg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' },
    { ticker: 'DASH',  name: 'DoorDash',  marketCap: '$56B',  changePct:  0.8, series: [100,100,100,100,100,101,100,100.8], initials: 'DA', bg: 'linear-gradient(135deg,#dc2626,#ef4444)' },
    { ticker: 'COIN',  name: 'Coinbase',  marketCap: '$48B',  changePct:  2.4, series: [100,101,101,102,102,102,102,102.4], initials: 'CO', bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
    { ticker: 'PLTR',  name: 'Palantir',  marketCap: '$58B',  changePct:  0.8, series: [100,100,100,100,100,101,100,100.8], initials: 'PL', bg: 'linear-gradient(135deg,#0f172a,#334155)' },
    { ticker: 'NET',   name: 'Cloudflare',marketCap: '$30B',  changePct: -0.7, series: [100,100,100,100,99,99,99,99.3],     initials: 'NE', bg: 'linear-gradient(135deg,#f97316,#ea580c)' },
  ],
  small: [
    { ticker: 'IONQ',  name: 'IonQ',         marketCap: '$2.4B', changePct:  1.2, series: [100,100,100,101,101,101,101,101.2], initials: 'IO', bg: 'linear-gradient(135deg,#a855f7,#7e22ce)' },
    { ticker: 'CELH',  name: 'Celsius',      marketCap: '$5.8B', changePct: -1.3, series: [100,100,100,99,99,99,99,98.7],      initials: 'CE', bg: 'linear-gradient(135deg,#22c55e,#16a34a)' },
    { ticker: 'AXSM',  name: 'Axsome',       marketCap: '$3.1B', changePct: -0.6, series: [100,100,100,100,100,99,100,99.4],   initials: 'AX', bg: 'linear-gradient(135deg,#0d9488,#0e7490)' },
    { ticker: 'INSM',  name: 'Insmed',       marketCap: '$3.6B', changePct:  0.4, series: [100,100,100,100,100,101,100,100.4], initials: 'IN', bg: 'linear-gradient(135deg,#dc2626,#b91c1c)' },
    { ticker: 'CVNA',  name: 'Carvana',      marketCap: '$5.4B', changePct: -2.4, series: [100,99,99,98,98,97,97,97.6],        initials: 'CV', bg: 'linear-gradient(135deg,#0ea5e9,#0284c7)' },
    { ticker: 'SMCI',  name: 'Super Micro',  marketCap: '$28B',  changePct: -1.8, series: [100,100,99,99,98,98,98,98.2],       initials: 'SM', bg: 'linear-gradient(135deg,#16a34a,#15803d)' },
  ],
}

type NewsConn = {
  id: string
  tag: TagId
  headline: string
  symbols: string[]
  changePct: number
  series: number[]
  highlight: string
  what: string
  why: string
  how: string
  next: string
  source: string
}

const NEWS_CONNECTIONS: NewsConn[] = [
  {
    id: 'nc1', tag: 'Tech',
    headline: 'AI chip orders push NVDA to all-time high',
    symbols: ['NVDA', 'AVGO', 'MSFT'], changePct: 2.1,
    series: [100, 100, 101, 101, 102, 102, 102, 102.1],
    highlight: 'Hyperscaler capex revisions lift the leader and its supply chain.',
    what: 'NVDA closed at a record after raised AI capex guidance from two hyperscalers.',
    why: 'Demand for accelerator GPUs continues to outstrip supply, lifting margin guidance.',
    how: 'Sell-side teams updated FY guides; supply-chain peers (AVGO) followed.',
    next: 'Watch the next earnings call for FY revenue guide and customer concentration.',
    source: 'Bloomberg',
  },
  {
    id: 'nc2', tag: 'Politics',
    headline: 'Cross-border data bill clips ad-tech CPMs',
    symbols: ['META', 'GOOGL', 'TTD'], changePct: -0.9,
    series: [100, 100, 99, 99, 99, 98, 99, 99.1],
    highlight: 'Compliance overhead trims growth assumptions across the auction stack.',
    what: 'Ad-tech names dropped after committee vote on cross-border data flows.',
    why: 'Liability carve-outs were left ambiguous, raising compliance costs.',
    how: 'Sell-side trimmed ad-revenue forecasts; smaller networks hit hardest.',
    next: 'Second reading in autumn; watch language on liability and exemptions.',
    source: 'Financial Times',
  },
  {
    id: 'nc3', tag: 'World',
    headline: 'Arctic shipping pilots squeeze tanker spreads',
    symbols: ['XOM', 'CVX', 'SHEL.L'], changePct: -0.7,
    series: [100, 100, 100, 100, 99, 99, 99, 99.3],
    highlight: 'Shorter routes reduce floating storage and bunker demand.',
    what: 'Oil majors slipped after carriers reported measurable bunker savings.',
    why: 'Northern Sea Route trials shorten Asia–Europe legs versus Suez.',
    how: 'Refiners adjust crack spreads; freight derivatives reprice.',
    next: 'IMO corridor standards in autumn could expand or constrain traffic.',
    source: 'Reuters',
  },
  {
    id: 'nc4', tag: 'Tech',
    headline: 'Open-weight models lift on-device coding tools',
    symbols: ['MSFT', 'NVDA', 'GTLB'], changePct: -0.4,
    series: [100, 100, 100, 100, 100, 99, 100, 99.6],
    highlight: 'Local stacks pressure cloud GPU spend forecasts.',
    what: 'Cloud providers slipped as enterprises pilot laptop inference.',
    why: 'Quantized open models match commercial APIs on common code tasks.',
    how: 'Spend shifts from external APIs to one-time hardware refreshes.',
    next: 'Q3 maintainer release expected to improve tool-use reliability.',
    source: 'WSJ',
  },
]

type ReturnInst = {
  id: string
  name: string
  category: string
  pct: number
  risk: 1 | 2 | 3 | 4 | 5
  color: string
  trendNote: string
  newsSource: string
}

const RETURN_INSTRUMENTS: ReturnInst[] = [
  { id: 'fd',         name: 'Fixed deposit',    category: 'Cash & equivalents', pct: 5.5,  risk: 1, color: '#0d9488', trendNote: 'Banks holding rates higher for longer; renewals attractive.', newsSource: 'Reuters' },
  { id: 'bonds',      name: 'Government bonds', category: 'Fixed income',       pct: 4.6,  risk: 2, color: '#0369a1', trendNote: 'Term premium drifting; long bonds re-pricing.',                newsSource: 'Bloomberg' },
  { id: 'mf',         name: 'Mutual funds',     category: 'Diversified',        pct: 9.2,  risk: 3, color: '#9333ea', trendNote: 'Balanced funds benefit from broadening rally.',                newsSource: 'FT' },
  { id: 'equity',     name: 'Equity (S&P 500)', category: 'Stocks',             pct: 11.4, risk: 4, color: '#dc2626', trendNote: 'Earnings revisions positive; valuations stretched.',           newsSource: 'WSJ' },
  { id: 'gold',       name: 'Gold',             category: 'Commodity',          pct: 6.8,  risk: 2, color: '#f59e0b', trendNote: 'Central-bank buying steady; rate cuts a tailwind.',            newsSource: 'Reuters' },
  { id: 'realestate', name: 'Real estate',      category: 'Property',           pct: 7.4,  risk: 3, color: '#0891b2', trendNote: 'REIT yields recovering as the rate path clarifies.',          newsSource: 'Bloomberg' },
  { id: 'crypto',     name: 'Crypto (BTC)',     category: 'Digital assets',     pct: 18.5, risk: 5, color: '#f97316', trendNote: 'Spot-ETF flows continue; volatility elevated.',                newsSource: 'CoinDesk' },
]

type WatchStock = {
  ticker: string
  name: string
  changePct: number
  series: number[]
  initials: string
  bg: string
  articles: StockArticle[]
}

const STOCKS_TO_WATCH: WatchStock[] = [
  {
    ticker: 'NVDA', name: 'Nvidia', changePct: 2.1,
    series: [100,100,101,101,102,102,102,102.1],
    initials: 'NV', bg: 'linear-gradient(135deg,#16a34a,#0d9488)',
    articles: [
      {
        id: 'nvda-1', headline: 'Capex revisions lift FY estimates again', source: 'Bloomberg', publishedAgo: '2h ago',
        summary: 'Hyperscaler capex guides reset higher; sell-side follows within hours.',
        image: 'https://picsum.photos/seed/nm-nv1/120/120',
        body: 'Two large hyperscalers raised AI capex guidance for the coming year, citing GPU allocation visibility through FY27. Sell-side analysts trimmed their estimates higher within hours, with at least four desks bumping FY revenue.\nThe move rippled into the supply chain. Broadcom, which produces custom AI silicon for several of the same customers, traded up alongside the leader.',
        tree: {
          root: 'AI capex revisions',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['NVDA', 'AVGO', 'MSFT'] }),
            tBranch('b2', 'GPU demand', { metrics: [tMetric('Allocation', 2.1)] }),
            tBranch('b3', 'FY guides', { metrics: [tMetric('Revenue', 1.5), tMetric('Margin', 0.6)] }),
            tBranch('b4', 'Hyperscalers', { metrics: [tMetric('Capex', 1.2)] }),
          ],
          hub: 'What it means',
          summaries: ['Cycle keeps broadening', 'Concentration in focus', 'Supply chain co-rallies'],
        },
      },
      {
        id: 'nvda-2', headline: 'Customer concentration disclosure on the radar', source: 'Reuters', publishedAgo: '5h ago',
        summary: 'Filing language signals investor scrutiny of single-customer revenue share.',
        image: 'https://picsum.photos/seed/nm-nv2/120/120',
        body: 'Recent filings called out customer concentration more explicitly than in prior periods. The buyside has started modeling sensitivity to a 10% top-customer haircut.\nA disclosed concentration ratio could come up on the next earnings call. Analysts say the question on the buyside is no longer whether the disclosure tightens, but how the company frames mitigation.',
        tree: {
          root: 'Customer concentration',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['NVDA', 'MSFT'] }),
            tBranch('b2', 'Disclosure', { metrics: [tMetric('Top customer', -0.4)] }),
            tBranch('b3', 'Sensitivity', { metrics: [tMetric('-10% haircut', -1.0)] }),
            tBranch('b4', 'Earnings call', { metrics: [tMetric('Q&A focus', 0)] }),
          ],
          hub: 'Investor focus',
          summaries: ['Disclosure pressure rises', 'Sensitivity modelling expands', 'Risk premium adjusts'],
        },
      },
    ],
  },
  {
    ticker: 'TSLA', name: 'Tesla', changePct: 1.4,
    series: [100,100,101,101,101,102,101,101.4],
    initials: 'TS', bg: 'linear-gradient(135deg,#dc2626,#7f1d1d)',
    articles: [
      {
        id: 'tsla-1', headline: 'Mass-market trim leaks ahead of investor day', source: 'Reuters', publishedAgo: '3h ago',
        summary: 'Supplier filings hint at a sub-$30k variant entering the lineup this year.',
        image: 'https://picsum.photos/seed/nm-ts1/120/120',
        body: 'Two component suppliers disclosed parts orders consistent with a smaller, lower-priced variant of an existing platform. Investors expect the trim to be confirmed at the upcoming investor day.\nMargin watchers are mixed. The trim could lift volume meaningfully but pressures gross margin in the near term.',
        tree: {
          root: 'Mass-market trim',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['TSLA'] }),
            tBranch('b2', 'Supplier signal', { metrics: [tMetric('Order intake', 1.2)] }),
            tBranch('b3', 'Volume vs margin', { metrics: [tMetric('Volume', 1.4), tMetric('Margin', -0.6)] }),
            tBranch('b4', 'Investor day', { metrics: [tMetric('Catalyst', 0.5)] }),
          ],
          hub: 'Trade-off ahead',
          summaries: ['Volume tailwind builds', 'Near-term margin pressure', 'Catalyst at IR day'],
        },
      },
      {
        id: 'tsla-2', headline: 'Energy storage segment outpaces auto growth', source: 'WSJ', publishedAgo: '8h ago',
        summary: 'Megapack backlog now stretches into FY27; pricing power improving.',
        image: 'https://picsum.photos/seed/nm-ts2/120/120',
        body: 'The energy storage business booked another quarter of triple-digit revenue growth. Megapack backlog stretches into FY27 with pricing improving as supply tightens.\nAnalysts are starting to value the segment separately, which could lift the sum-of-parts case for the equity.',
        tree: {
          root: 'Energy storage growth',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['TSLA'] }),
            tBranch('b2', 'Megapack', { metrics: [tMetric('Backlog', 1.8), tMetric('Pricing', 0.6)] }),
            tBranch('b3', 'Sum-of-parts', { metrics: [tMetric('Re-rating', 1.0)] }),
          ],
          hub: 'Valuation lift',
          summaries: ['Backlog stretches to FY27', 'Pricing power improving', 'Sum-of-parts case strengthens'],
        },
      },
    ],
  },
  {
    ticker: 'COIN', name: 'Coinbase', changePct: 2.4,
    series: [100,101,101,102,102,102,102,102.4],
    initials: 'CO', bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    articles: [
      {
        id: 'coin-1', headline: 'Spot-ETF inflows hit a fresh weekly record', source: 'CoinDesk', publishedAgo: '1h ago',
        summary: 'BTC spot ETFs absorbed $2.1B last week; custody wins flow through to revenue.',
        body: 'Spot Bitcoin ETFs absorbed $2.1B in net inflows last week, the highest weekly print in three months. Coinbase is the custodian for most issuers and earns fees on assets in custody.\nA sustained inflow trend would support both fee revenue and on-chain transaction volumes through the next quarter.',
        tree: {
          root: 'Spot-ETF inflows',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['COIN'] }),
            tBranch('b2', 'BTC ETFs', { metrics: [tMetric('Weekly inflow', 2.1)] }),
            tBranch('b3', 'Custody fees', { metrics: [tMetric('Revenue lift', 1.3)] }),
            tBranch('b4', 'On-chain volume', { metrics: [tMetric('Q3 trend', 0.9)] }),
          ],
          hub: 'Revenue tailwind',
          summaries: ['Custody book expands', 'Fee revenue follows', 'Sustained inflows expected'],
        },
      },
      {
        id: 'coin-2', headline: 'International expansion clears two new licences', source: 'Bloomberg', publishedAgo: '6h ago',
        summary: 'Approvals in two large EU markets open the door to perpetual futures launches.',
        body: 'Coinbase received licences to operate in two additional EU markets this week. The approvals open the door to launching perpetual futures products for non-US customers.\nDerivatives are higher-margin than spot trading and could lift blended take rates if international adoption tracks management guidance.',
        tree: {
          root: 'EU licences',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['COIN'] }),
            tBranch('b2', 'Perpetual futures', { metrics: [tMetric('Take rate', 1.5)] }),
            tBranch('b3', 'EU markets', { metrics: [tMetric('Approval', 1.0)] }),
            tBranch('b4', 'Margin mix', { metrics: [tMetric('Blended', 0.8)] }),
          ],
          hub: 'Margin uplift',
          summaries: ['Two new EU markets', 'Higher-margin derivatives', 'International growth de-risked'],
        },
      },
    ],
  },
  {
    ticker: 'PLTR', name: 'Palantir', changePct: 0.8,
    series: [100,100,100,100,100,101,100,100.8],
    initials: 'PL', bg: 'linear-gradient(135deg,#0f172a,#334155)',
    articles: [
      {
        id: 'pltr-1', headline: 'Federal contract pipeline expands further', source: 'WSJ', publishedAgo: '4h ago',
        summary: 'Two new agency wins lift the visible federal backlog into next fiscal year.',
        body: 'Palantir disclosed two additional federal contract awards this week, both with multi-year option years. The wins lift visible federal backlog into the next government fiscal year.\nFederal revenue growth had moderated from prior peaks; the new awards begin to address that and push the consensus federal-vs-commercial split.',
        tree: {
          root: 'Federal pipeline',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['PLTR'] }),
            tBranch('b2', 'Backlog', { metrics: [tMetric('FY visibility', 1.3)] }),
            tBranch('b3', 'New wins', { metrics: [tMetric('Awards', 2.0), tMetric('Option years', 1.0)] }),
            tBranch('b4', 'Federal mix', { metrics: [tMetric('Re-rating', 0.6)] }),
          ],
          hub: 'Pipeline visibility',
          summaries: ['Backlog stretches forward', 'Multi-year options lock revenue', 'Federal narrative restored'],
        },
      },
      {
        id: 'pltr-2', headline: 'Commercial AIP traction in earnings preview', source: 'Bloomberg', publishedAgo: '9h ago',
        summary: 'Buyside notes flag accelerating mid-market adoption of the AIP platform.',
        body: 'Sell-side previews call out faster mid-market commercial adoption of the AIP platform than prior expectations. Pilot-to-paid conversion rates are reportedly up sharply.\nA strong commercial print on the next earnings call would shift the consensus narrative away from federal dependence.',
        tree: {
          root: 'Commercial AIP',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['PLTR'] }),
            tBranch('b2', 'Mid-market', { metrics: [tMetric('Adoption', 1.8)] }),
            tBranch('b3', 'Conversion', { metrics: [tMetric('Pilot-to-paid', 1.4)] }),
            tBranch('b4', 'Mix shift', { metrics: [tMetric('Commercial %', 0.9)] }),
          ],
          hub: 'Narrative shift',
          summaries: ['Commercial accelerating', 'Less federal dependence', 'Earnings catalyst near'],
        },
      },
    ],
  },
  {
    ticker: 'AAPL', name: 'Apple', changePct: 1.4,
    series: [100,100,101,101,101,102,101,101.4],
    initials: 'AA', bg: 'linear-gradient(135deg,#0f172a,#475569)',
    articles: [
      {
        id: 'aapl-1', headline: 'Vision platform developer count hits a milestone', source: 'The Verge', publishedAgo: '3h ago',
        summary: 'Active developer count for the spatial platform crossed a notable threshold.',
        body: 'Active developers building for the Vision platform crossed a milestone disclosed by management this week. Developer growth is one of the gating items for broader hardware adoption.\nThe headline supports the long-term spatial computing narrative even if near-term unit shipments remain modest.',
        tree: {
          root: 'Vision developers',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['AAPL'] }),
            tBranch('b2', 'Developer growth', { metrics: [tMetric('Active devs', 1.6)] }),
            tBranch('b3', 'Spatial platform', { metrics: [tMetric('Adoption', 0.8)] }),
            tBranch('b4', 'Hardware cycle', { metrics: [tMetric('Units', 0.3)] }),
          ],
          hub: 'Long-term thesis',
          summaries: ['Developer flywheel turns', 'Hardware adoption lags', 'Narrative reinforced'],
        },
      },
      {
        id: 'aapl-2', headline: 'Services revenue at all-time high again', source: 'Bloomberg', publishedAgo: '7h ago',
        summary: 'Subscription mix continues to lift gross margin and steady the cycle.',
        body: 'Services revenue printed at an all-time high for the quarter, helping smooth the hardware cycle. Subscription mix continues to expand as App Store, Cloud, and Apple Care all grow.\nGross margin benefits from the mix shift even as average selling prices on hardware soften.',
        tree: {
          root: 'Services revenue',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['AAPL'] }),
            tBranch('b2', 'Services mix', { metrics: [tMetric('Revenue', 1.4)] }),
            tBranch('b3', 'Gross margin', { metrics: [tMetric('Mix lift', 0.8)] }),
            tBranch('b4', 'Hardware ASP', { metrics: [tMetric('Trend', -0.3)] }),
          ],
          hub: 'Margin profile',
          summaries: ['ATH services print', 'Subscription compounding', 'Hardware ASP softens'],
        },
      },
    ],
  },
  {
    ticker: 'AMZN', name: 'Amazon', changePct: 0.6,
    series: [100,100,100,100,100,101,100,100.6],
    initials: 'AM', bg: 'linear-gradient(135deg,#f97316,#dc2626)',
    articles: [
      {
        id: 'amzn-1', headline: 'Logistics network flips to faster lanes', source: 'Bloomberg', publishedAgo: '4h ago',
        summary: 'Same-day fulfillment expansion lifts retail margins and customer cohorts.',
        body: 'Amazon expanded same-day fulfillment to additional metros, lifting both customer cohort retention and retail segment margins. The build-out also reduces last-mile dependency on third-party carriers.\nAnalysts read the move as further support for the retail margin expansion thesis underpinning consensus FY estimates.',
        tree: {
          root: 'Same-day expansion',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['AMZN'] }),
            tBranch('b2', 'Retail margin', { metrics: [tMetric('Lift', 1.0)] }),
            tBranch('b3', 'Last-mile', { metrics: [tMetric('3P dependence', -0.6)] }),
            tBranch('b4', 'Cohort', { metrics: [tMetric('Retention', 0.8)] }),
          ],
          hub: 'Margin path',
          summaries: ['Network rollout pays off', '3P dependence drops', 'Cohort metrics improve'],
        },
      },
      {
        id: 'amzn-2', headline: 'AWS backlog approaches record after AI deals', source: 'WSJ', publishedAgo: '11h ago',
        summary: 'Recent AI infrastructure agreements push the cloud backlog near prior peaks.',
        body: 'Two large AI infrastructure agreements pushed the AWS commitment backlog within striking distance of its prior peak. The deals lock in revenue visibility through the next two fiscal years.\nWith capex running elevated, the backlog data is what investors are pointing to as evidence of disciplined return on the spending.',
        tree: {
          root: 'AWS backlog',
          branches: [
            tBranch('b1', 'Companies', { symbols: ['AMZN', 'NVDA'] }),
            tBranch('b2', 'Backlog', { metrics: [tMetric('Commitments', 1.5)] }),
            tBranch('b3', 'Capex discipline', { metrics: [tMetric('ROI proof', 0.9)] }),
            tBranch('b4', 'AI deals', { metrics: [tMetric('Two new', 1.2)] }),
          ],
          hub: 'Visibility check',
          summaries: ['Backlog near peak', 'Capex justified', 'FY revenue locked'],
        },
      },
    ],
  },
]

type Fundamentals = {
  ticker: string
  name: string
  exchange: string
  sector: string
  price: number
  changePct: number
  marketCap: string
  pe: number
  eps: number
  dividend: string
  yearLow: number
  yearHigh: number
  series: number[]
  highlights: string[]
  initials: string
  bg: string
  related: string[]
}

const FUNDAMENTALS: Record<string, Fundamentals> = {
  AAPL:  { ticker: 'AAPL',  name: 'Apple Inc.',     exchange: 'NASDAQ', sector: 'Technology',     price: 234.55, changePct:  1.4, marketCap: '$3.4T', pe: 32.1, eps: 7.30,  dividend: '0.4%', yearLow: 164.08, yearHigh: 240.15, series: [220,222,225,228,232,235,231,234.5], highlights: ['Services revenue at all-time high', 'Vision developer count rising', 'Buyback authorization extended'], initials: 'AA', bg: 'linear-gradient(135deg,#0f172a,#475569)', related: ['MSFT', 'GOOGL', 'META', 'NVDA'] },
  MSFT:  { ticker: 'MSFT',  name: 'Microsoft',      exchange: 'NASDAQ', sector: 'Technology',     price: 412.20, changePct:  0.8, marketCap: '$3.1T', pe: 35.4, eps: 11.65, dividend: '0.7%', yearLow: 309.45, yearHigh: 425.90, series: [400,402,405,408,410,415,409,412.2], highlights: ['Azure AI revenue growth re-accelerating', 'Capex guide raised', 'Government cloud expanding'], initials: 'MS', bg: 'linear-gradient(135deg,#0d9488,#0e7490)', related: ['AAPL', 'GOOGL', 'AMZN', 'NVDA'] },
  NVDA:  { ticker: 'NVDA',  name: 'Nvidia',         exchange: 'NASDAQ', sector: 'Semiconductors', price: 985.10, changePct:  2.1, marketCap: '$2.7T', pe: 64.2, eps: 15.32, dividend: '0.0%', yearLow: 393.51, yearHigh: 992.80, series: [930,940,955,965,975,980,975,985.1], highlights: ['Data-center segment > 80% of revenue', 'Customer concentration disclosed', 'Next-gen accelerator on track'], initials: 'NV', bg: 'linear-gradient(135deg,#16a34a,#0d9488)', related: ['AVGO', 'AMD', 'MSFT', 'AMZN'] },
  AMZN:  { ticker: 'AMZN',  name: 'Amazon',         exchange: 'NASDAQ', sector: 'Consumer',       price: 198.34, changePct:  0.6, marketCap: '$1.8T', pe: 41.8, eps: 4.74,  dividend: '0.0%', yearLow: 118.35, yearHigh: 200.60, series: [192,195,196,197,198,199,197,198.3], highlights: ['AWS margin holding', 'Logistics network refresh underway', 'Ads business compounding'], initials: 'AM', bg: 'linear-gradient(135deg,#f97316,#dc2626)', related: ['MSFT', 'GOOGL', 'WMT', 'COST'] },
  GOOGL: { ticker: 'GOOGL', name: 'Alphabet',       exchange: 'NASDAQ', sector: 'Internet',       price: 162.80, changePct: -0.6, marketCap: '$1.9T', pe: 24.3, eps: 6.70,  dividend: '0.5%', yearLow: 121.46, yearHigh: 175.10, series: [165,164,163,163,163,162,163,162.8], highlights: ['Cloud profitable for full year', 'Search resilient vs. AI competitors', 'Capex elevated through year-end'], initials: 'GO', bg: 'linear-gradient(135deg,#0369a1,#2563eb)', related: ['META', 'MSFT', 'AAPL', 'AMZN'] },
  META:  { ticker: 'META',  name: 'Meta Platforms', exchange: 'NASDAQ', sector: 'Internet',       price: 478.20, changePct: -0.9, marketCap: '$1.2T', pe: 25.6, eps: 18.69, dividend: '0.4%', yearLow: 274.38, yearHigh: 542.80, series: [482,481,480,479,478,476,479,478.2], highlights: ['Reality Labs spend remains a drag', 'Reels monetization improving', 'Ad pricing tailwinds'], initials: 'ME', bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', related: ['GOOGL', 'AAPL', 'NVDA', 'MSFT'] },
  TSLA:  { ticker: 'TSLA',  name: 'Tesla',          exchange: 'NASDAQ', sector: 'Auto',           price: 178.90, changePct:  1.4, marketCap: '$565B', pe: 51.2, eps: 3.49,  dividend: '0.0%', yearLow: 138.80, yearHigh: 299.29, series: [175,176,177,178,178,179,177,178.9], highlights: ['Mass-market trim in pipeline', 'Energy storage growth accelerating', 'China deliveries volatile'], initials: 'TS', bg: 'linear-gradient(135deg,#dc2626,#7f1d1d)', related: ['NVDA', 'GOOGL', 'AAPL'] },
  JPM:   { ticker: 'JPM',   name: 'JPMorgan Chase', exchange: 'NYSE',   sector: 'Financials',     price: 218.50, changePct:  0.9, marketCap: '$623B', pe: 12.8, eps: 17.07, dividend: '2.3%', yearLow: 135.19, yearHigh: 220.40, series: [216,216,217,217,218,218,218,218.5], highlights: ['NII guide raised', 'Credit reserves stable', 'Capital ratios well above requirements'], initials: 'JP', bg: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', related: ['V', 'BAC', 'GS', 'WFC'] },
  V:     { ticker: 'V',     name: 'Visa',           exchange: 'NYSE',   sector: 'Financials',     price: 280.45, changePct:  1.0, marketCap: '$556B', pe: 30.5, eps: 9.20,  dividend: '0.7%', yearLow: 227.74, yearHigh: 290.95, series: [276,277,278,278,279,280,279,280.4], highlights: ['Cross-border volumes recovering', 'Tokenization tailwinds', 'New value-added services'], initials: 'VV', bg: 'linear-gradient(135deg,#1e3a8a,#3b82f6)', related: ['MA', 'JPM', 'PYPL', 'COIN'] },
  XOM:   { ticker: 'XOM',   name: 'Exxon Mobil',    exchange: 'NYSE',   sector: 'Energy',         price: 113.60, changePct: -0.7, marketCap: '$453B', pe: 13.6, eps: 8.35,  dividend: '3.4%', yearLow:  95.77, yearHigh: 123.75, series: [115,115,115,115,114,114,114,113.6], highlights: ['Permian capex on plan', 'Downstream margins normalizing', 'Buyback authorization intact'], initials: 'XO', bg: 'linear-gradient(135deg,#dc2626,#991b1b)', related: ['CVX', 'BP.L', 'SHEL.L'] },
  COIN:  { ticker: 'COIN',  name: 'Coinbase',       exchange: 'NASDAQ', sector: 'Financials',     price: 218.40, changePct:  2.4, marketCap: '$48B',  pe: 38.9, eps: 5.62,  dividend: '0.0%', yearLow:  60.16, yearHigh: 283.48, series: [212,214,215,216,217,218,217,218.4], highlights: ['Spot-ETF flows record', 'International expansion underway', 'Staking restored in some states'], initials: 'CO', bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', related: ['V', 'PYPL', 'NVDA'] },
  PLTR:  { ticker: 'PLTR',  name: 'Palantir',       exchange: 'NYSE',   sector: 'Software',       price:  24.80, changePct:  0.8, marketCap: '$58B',  pe: 65.7, eps: 0.38,  dividend: '0.0%', yearLow:  13.68, yearHigh:  29.90, series: [24.4,24.5,24.5,24.6,24.6,24.8,24.6,24.8], highlights: ['Federal pipeline expanding', 'Commercial AIP traction', 'Cash generation positive'], initials: 'PL', bg: 'linear-gradient(135deg,#0f172a,#334155)', related: ['NVDA', 'MSFT', 'AMZN', 'IONQ'] },
}

function getFundamentals(symbol: string): Fundamentals {
  return FUNDAMENTALS[symbol] ?? {
    ticker: symbol,
    name: symbol,
    exchange: 'NYSE',
    sector: 'Diversified',
    price: 100,
    changePct: 0.5,
    marketCap: '—',
    pe: 18,
    eps: 5.5,
    dividend: '1.2%',
    yearLow: 90,
    yearHigh: 115,
    series: [98, 99, 100, 100, 101, 100, 101, 100.5],
    highlights: [
      'No detailed fundamentals available for this ticker yet.',
      'Tap the watchlist or news feed for ticker-specific updates.',
    ],
    initials: symbol.replace(/[^A-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'XX',
    bg: 'linear-gradient(135deg,#0369a1,#0d9488)',
    related: [],
  }
}

const FundCtx = React.createContext<((sym: string) => void) | null>(null)
function useFund() { return useContext(FundCtx) }

const TICKER_DOMAIN: Record<string, string> = {
  AAPL: 'apple.com',
  MSFT: 'microsoft.com',
  NVDA: 'nvidia.com',
  AMZN: 'amazon.com',
  GOOGL: 'abc.xyz',
  META: 'meta.com',
  TSLA: 'tesla.com',
  SHOP: 'shopify.com',
  SNOW: 'snowflake.com',
  DASH: 'doordash.com',
  COIN: 'coinbase.com',
  PLTR: 'palantir.com',
  NET: 'cloudflare.com',
  IONQ: 'ionq.com',
  CELH: 'celsiusholdings.com',
  AXSM: 'axsome.com',
  INSM: 'insmed.com',
  CVNA: 'carvana.com',
  SMCI: 'supermicro.com',
  JPM: 'jpmorganchase.com',
  V: 'visa.com',
  XOM: 'exxonmobil.com',
  JNJ: 'jnj.com',
  WMT: 'walmart.com',
  BA: 'boeing.com',
  CAT: 'caterpillar.com',
  KO: 'coca-colacompany.com',
  CVX: 'chevron.com',
  AVGO: 'broadcom.com',
  COST: 'costco.com',
  'AZN.L': 'astrazeneca.com',
  'SHEL.L': 'shell.com',
  'HSBA.L': 'hsbc.com',
  'ULVR.L': 'unilever.com',
  'BP.L': 'bp.com',
  'GSK.L': 'gsk.com',
  'BARC.L': 'barclays.com',
  '7203.T': 'toyota-global.com',
  '6758.T': 'sony.com',
  '9984.T': 'softbank.jp',
  '6861.T': 'keyence.com',
  '8035.T': 'tel.com',
  '9983.T': 'fastretailing.com',
  '6098.T': 'recruit.co.jp',
}

function tickerLogoUrls(ticker: string): string[] {
  const urls: string[] = []
  const domain = TICKER_DOMAIN[ticker]
  if (domain) urls.push(`https://logo.clearbit.com/${domain}`)
  if (/^[A-Z]{1,5}$/.test(ticker)) {
    urls.push(`https://financialmodelingprep.com/image-stock/${ticker}.png`)
  }
  return urls
}

function CompanyLogo({ ticker, initials, bg, size = 40 }: { ticker?: string; initials: string; bg: string; size?: number }) {
  const urls = useMemo(() => (ticker ? tickerLogoUrls(ticker) : []), [ticker])
  const [idx, setIdx] = useState(0)
  useEffect(() => { setIdx(0) }, [ticker])
  const url = urls[idx]
  const showImg = !!url
  return (
    <span
      className={`co-logo${showImg ? ' co-logo--img' : ''}`}
      style={{ width: size, height: size, background: showImg ? '#fff' : bg, fontSize: size * 0.36 }}
      aria-hidden
    >
      {showImg ? (
        <img
          key={url}
          src={url}
          alt=""
          loading="lazy"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        initials
      )}
    </span>
  )
}

function TickerChip({ symbol, size = 'md' }: { symbol: string; size?: 'sm' | 'md' }) {
  const open = useFund()
  return (
    <button
      type="button"
      className={`ticker-chip ticker-chip--${size}`}
      onClick={(e) => { e.stopPropagation(); open?.(symbol) }}
      aria-label={`Open fundamentals for ${symbol}`}
    >
      <span className="ticker-chip__dollar" aria-hidden>$</span>
      <span className="ticker-chip__sym">{symbol}</span>
    </button>
  )
}

type StockTimeframe = '1D' | '1W' | '1M' | '6M' | 'YTD' | '1Y' | '5Y'

const STOCK_TIMEFRAMES: { id: StockTimeframe; label: string }[] = [
  { id: '1D',  label: '1D' },
  { id: '1W',  label: '1W' },
  { id: '1M',  label: '1M' },
  { id: '6M',  label: '6M' },
  { id: 'YTD', label: 'YTD' },
  { id: '1Y',  label: '1Y' },
  { id: '5Y',  label: '5Y' },
]

type TimeframeCfg = {
  n: number
  longTermNet: number
  noiseAmp: number
  xLabels: string[]
}

const STOCK_TIMEFRAME_CFG: Record<StockTimeframe, TimeframeCfg> = {
  '1D':  { n: 40, longTermNet: 0.012, noiseAmp: 0.004, xLabels: ['9:30', '11:00', '12:30', '14:00', '16:00'] },
  '1W':  { n: 30, longTermNet: 0.022, noiseAmp: 0.010, xLabels: ['May 14', 'May 15', 'May 18', 'May 19', 'May 20'] },
  '1M':  { n: 22, longTermNet: 0.038, noiseAmp: 0.018, xLabels: ['Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 20'] },
  '6M':  { n: 26, longTermNet: 0.078, noiseAmp: 0.034, xLabels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'May'] },
  'YTD': { n: 22, longTermNet: 0.064, noiseAmp: 0.028, xLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] },
  '1Y':  { n: 52, longTermNet: 0.165, noiseAmp: 0.050, xLabels: ["May '25", 'Aug', 'Nov', 'Feb', 'May'] },
  '5Y':  { n: 60, longTermNet: 0.620, noiseAmp: 0.110, xLabels: ['2021', '2022', '2023', '2024', '2025', '2026'] },
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function makeRng(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function generateStockSeries(symbol: string, timeframe: StockTimeframe, currentPrice: number): number[] {
  const cfg = STOCK_TIMEFRAME_CFG[timeframe]
  const rng = makeRng(hashSeed(symbol + ':' + timeframe))
  const walk: number[] = [0]
  for (let i = 1; i < cfg.n; i++) {
    walk.push(walk[i - 1] + (rng() - 0.5) * 2)
  }
  const min = Math.min(...walk)
  const max = Math.max(...walk)
  const noiseRange = max - min || 1
  const startPrice = currentPrice / (1 + cfg.longTermNet)
  const last = walk[walk.length - 1]
  const first = walk[0]
  return walk.map((v, i) => {
    const frac = i / (walk.length - 1)
    const linearBase = startPrice + frac * (currentPrice - startPrice)
    const linearRaw = first + frac * (last - first)
    const noise = (v - linearRaw) / noiseRange
    return linearBase + noise * currentPrice * cfg.noiseAmp
  })
}

function niceTicks(min: number, max: number, count = 4): number[] {
  const range = max - min || 1
  const step0 = range / count
  const pow = Math.pow(10, Math.floor(Math.log10(step0)))
  const norm = step0 / pow
  const stepMult = norm >= 5 ? 5 : norm >= 2 ? 2 : norm >= 1 ? 1 : 0.5
  const step = stepMult * pow
  const start = Math.ceil(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)))
  return ticks
}

function formatPriceTick(v: number): string {
  if (v >= 1000) return v.toFixed(0)
  if (v >= 100)  return v.toFixed(0)
  if (v >= 10)   return v.toFixed(1)
  return v.toFixed(2)
}

function StockPriceChart({ symbol, currentPrice }: { symbol: string; currentPrice: number }) {
  const [timeframe, setTimeframe] = useState<StockTimeframe>('1M')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const series = useMemo(
    () => generateStockSeries(symbol, timeframe, currentPrice),
    [symbol, timeframe, currentPrice],
  )

  const startPrice = series[0]
  const endPrice = series[series.length - 1]
  const tfChange = ((endPrice - startPrice) / startPrice) * 100
  const tfDirection: 'up' | 'down' | 'flat' =
    tfChange > 0.05 ? 'up' : tfChange < -0.05 ? 'down' : 'flat'

  const W = 360
  const H = 200
  const padL = 40
  const padR = 8
  const padT = 10
  const padB = 26
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const dataMin = Math.min(...series)
  const dataMax = Math.max(...series)
  const pad = (dataMax - dataMin) * 0.08 || dataMax * 0.01 || 1
  const yMin = dataMin - pad
  const yMax = dataMax + pad
  const yRange = yMax - yMin || 1
  const ticks = niceTicks(yMin, yMax, 4)

  const xAt = (i: number) => padL + (i / (series.length - 1 || 1)) * innerW
  const yAt = (v: number) => padT + (1 - (v - yMin) / yRange) * innerH

  const linePts = series.map((v, i) => `${xAt(i)},${yAt(v)}`)
  const linePath = `M${linePts.join(' L')}`
  const areaPath = `${linePath} L${xAt(series.length - 1)},${padT + innerH} L${xAt(0)},${padT + innerH} Z`

  const gradId = useId()
  const stroke = tfDirection === 'up' ? '#16a34a' : tfDirection === 'down' ? '#dc2626' : '#64748b'
  const fillTop = tfDirection === 'up' ? 'rgba(22,163,74,0.22)' : tfDirection === 'down' ? 'rgba(220,38,38,0.22)' : 'rgba(100,116,139,0.18)'
  const fillBot = tfDirection === 'up' ? 'rgba(22,163,74,0)'    : tfDirection === 'down' ? 'rgba(220,38,38,0)'    : 'rgba(100,116,139,0)'

  const handleMove = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xPx = e.clientX - rect.left
    const ratio = W / rect.width
    const svgX = xPx * ratio
    const frac = Math.max(0, Math.min(1, (svgX - padL) / innerW))
    const idx = Math.round(frac * (series.length - 1))
    setHoverIdx(idx)
  }, [series.length, innerW])

  const handleLeave = useCallback(() => setHoverIdx(null), [])

  const activeIdx = hoverIdx ?? series.length - 1
  const activePrice = series[activeIdx]
  const xLabels = STOCK_TIMEFRAME_CFG[timeframe].xLabels

  return (
    <section className="stock-chart" aria-label={`${symbol} price chart`}>
      <div className="stock-chart__head">
        <div className="stock-chart__meta">
          <span className="stock-chart__hover-price">${activePrice.toFixed(2)}</span>
          <span className={`stock-chart__hover-delta stock-chart__hover-delta--${tfDirection}`}>
            {tfChange > 0 ? '+' : ''}{tfChange.toFixed(2)}% · {timeframe}
          </span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="stock-chart__svg"
        role="img"
        aria-label={`${symbol} ${timeframe} price chart`}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={handleLeave}
        onPointerCancel={handleLeave}
      >
        <defs>
          <linearGradient id={`stockfill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillTop} />
            <stop offset="100%" stopColor={fillBot} />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={`grid-${t}`}>
            <line
              x1={padL} x2={padL + innerW}
              y1={yAt(t)} y2={yAt(t)}
              className="stock-chart__grid"
            />
            <text
              x={padL - 6} y={yAt(t)}
              className="stock-chart__y-label"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {formatPriceTick(t)}
            </text>
          </g>
        ))}

        <line
          x1={padL} x2={padL + innerW}
          y1={padT + innerH} y2={padT + innerH}
          className="stock-chart__axis"
        />

        <path d={areaPath} fill={`url(#stockfill-${gradId})`} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {xLabels.map((lbl, i) => {
          const x = padL + (i / (xLabels.length - 1)) * innerW
          return (
            <text
              key={`${lbl}-${i}`}
              x={x}
              y={padT + innerH + 16}
              className="stock-chart__x-label"
              textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
            >
              {lbl}
            </text>
          )
        })}

        {hoverIdx !== null && (
          <g pointerEvents="none">
            <line
              x1={xAt(hoverIdx)} x2={xAt(hoverIdx)}
              y1={padT} y2={padT + innerH}
              className="stock-chart__crosshair"
            />
            <circle
              cx={xAt(hoverIdx)} cy={yAt(activePrice)}
              r={4}
              fill={stroke}
              stroke="var(--bg)"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      <div className="stock-chart__tabs" role="tablist" aria-label="Timeframe">
        {STOCK_TIMEFRAMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={timeframe === t.id}
            className={`stock-chart__tab${timeframe === t.id ? ' stock-chart__tab--active' : ''}`}
            onClick={() => { setTimeframe(t.id); setHoverIdx(null) }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/* ── Stock detail screen ─────────────────────────── */

type StockSectionId =
  | 'overview' | 'chart' | 'analysis' | 'peers' | 'quarters'
  | 'pnl' | 'balance' | 'cashflow' | 'ratios' | 'investors' | 'documents'

const STOCK_SECTIONS: { id: StockSectionId; label: string }[] = [
  { id: 'overview',  label: 'Overview' },
  { id: 'chart',     label: 'Chart' },
  { id: 'analysis',  label: 'Analysis' },
  { id: 'peers',     label: 'Peers' },
  { id: 'quarters',  label: 'Quarters' },
  { id: 'pnl',       label: 'P&L' },
  { id: 'balance',   label: 'Balance' },
  { id: 'cashflow',  label: 'Cash Flow' },
  { id: 'ratios',    label: 'Ratios' },
  { id: 'investors', label: 'Investors' },
  { id: 'documents', label: 'Documents' },
]

const QUARTER_LABELS = [
  'Mar 2023','Jun 2023','Sep 2023','Dec 2023',
  'Mar 2024','Jun 2024','Sep 2024','Dec 2024',
  'Mar 2025','Jun 2025','Sep 2025','Dec 2025','Mar 2026',
]
const YEAR_LABELS = ['Mar 2017','Mar 2018','Mar 2019','Mar 2020','Mar 2021','Mar 2022','Mar 2023','Mar 2024','Mar 2025','Mar 2026']
const SHORT_YEAR_LABELS = YEAR_LABELS.slice(-9)

type QuarterRow = {
  sales: number; expenses: number; opProfit: number; opmPct: number
  otherInc: number; interest: number; depreciation: number
  pbt: number; taxPct: number; netProfit: number; eps: number
}
type YearRow = QuarterRow & { fy: string }
type BalanceRow = {
  fy: string
  equity: number; reserves: number; borrowings: number; otherLiab: number
  total: number
  fixedAssets: number; cwip: number; investments: number; otherAssets: number
}
type CashflowRow = { fy: string; operating: number; investing: number; financing: number; net: number }
type RatioRow = { fy: string; debtorDays: number; inventoryDays: number; ccc: number; roePct: number; rocePct: number }
type DetailPeer = {
  ticker: string; name: string; cmp: number; pe: number; marketCap: number
  divYieldPct: number; npQtr: number; profitVarPct: number; salesQtr: number; salesVarPct: number; rocePct: number
}
type ShareholdingSnapshot = { promoter: number; fii: number; dii: number; public: number; gov: number; others: number }
type DocumentItem = { type: 'Annual Report' | 'Concall' | 'Presentation' | 'Filing'; title: string; date: string }

type StockDetail = {
  ticker: string; name: string; exchange: string; sector: string; sectorPath: string[]
  website: string
  about: string; keyPoints: string[]
  price: number; changePct: number
  marketCap: string; pe: number; bookValue: number; divYieldPct: number
  rocePct: number; roePct: number; high52w: number; low52w: number; faceValue: number
  initials: string; bg: string
  pros: string[]; cons: string[]
  peers: DetailPeer[]
  quarters: QuarterRow[]
  pnl: YearRow[]
  balance: BalanceRow[]
  cashflow: CashflowRow[]
  ratios: RatioRow[]
  shareholding: {
    latest: ShareholdingSnapshot
    history: { label: string; snapshot: ShareholdingSnapshot }[]
  }
  documents: DocumentItem[]
  related: string[]
}

function parseMarketCapToCr(s: string): number {
  const m = s.match(/^\$?([\d.]+)\s*([TBM])?/i)
  if (!m) return 50000
  const val = parseFloat(m[1])
  const suf = (m[2] ?? '').toUpperCase()
  const usd = suf === 'T' ? val * 1_000_000 : suf === 'B' ? val * 1_000 : suf === 'M' ? val : val
  return Math.round(usd * 83)
}

function formatCr(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_00_000) return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function sectorPathFor(sector: string): string[] {
  const norm = sector.toLowerCase()
  if (norm.includes('semi')) return ['Technology', 'Semiconductors']
  if (norm.includes('tech') || norm.includes('software')) return ['Technology', 'Software & IT']
  if (norm.includes('internet')) return ['Technology', 'Internet & Media']
  if (norm.includes('financ')) return ['Financials', 'Diversified Financials']
  if (norm.includes('energy')) return ['Commodities', 'Energy']
  if (norm.includes('auto')) return ['Industrials', 'Automotive']
  if (norm.includes('consumer')) return ['Consumer', 'Consumer Discretionary']
  if (norm.includes('retail')) return ['Consumer', 'Retail']
  if (norm.includes('industrial')) return ['Industrials', 'Capital Goods']
  return ['Diversified', sector]
}

const STOCK_DETAIL_CACHE = new Map<string, StockDetail>()

function getStockDetail(symbol: string): StockDetail {
  const cached = STOCK_DETAIL_CACHE.get(symbol)
  if (cached) return cached
  const f = getFundamentals(symbol)
  const rng = makeRng(hashSeed('detail:' + symbol))

  const mcapCr = parseMarketCapToCr(f.marketCap)
  const baseSales = Math.max(150, Math.round(mcapCr * 0.18))
  const baseOpm = 0.12 + (rng() - 0.5) * 0.16

  const quarters: QuarterRow[] = QUARTER_LABELS.map((_, i) => {
    const t = (i - 6) / 12
    const growth = 1 + t * 0.18 + (rng() - 0.5) * 0.08
    const sales = Math.max(80, Math.round(baseSales * growth))
    const opmPct = Math.max(5, Math.min(38, baseOpm * 100 + (rng() - 0.5) * 4))
    const opProfit = Math.round(sales * opmPct / 100)
    const expenses = sales - opProfit
    const otherInc = Math.round((rng() - 0.4) * sales * 0.05)
    const interest = Math.max(0, Math.round(sales * 0.022 * (0.6 + rng() * 0.8)))
    const depreciation = Math.max(1, Math.round(sales * 0.038 * (0.7 + rng() * 0.6)))
    const pbt = opProfit + otherInc - interest - depreciation
    const taxPct = Math.max(15, Math.min(80, 30 + (rng() - 0.5) * 30))
    const netProfit = Math.round(pbt * (1 - taxPct / 100))
    const eps = Number((netProfit / Math.max(1, mcapCr / 100)).toFixed(2))
    return { sales, expenses, opProfit, opmPct: Math.round(opmPct), otherInc, interest, depreciation, pbt, taxPct: Math.round(taxPct), netProfit, eps }
  })

  const pnl: YearRow[] = YEAR_LABELS.map((fy, i) => {
    const t = (i - YEAR_LABELS.length / 2) / 5
    const growth = 1 + t * 0.55 + (rng() - 0.5) * 0.12
    const sales = Math.max(600, Math.round(baseSales * 4 * growth))
    const opmPct = Math.max(5, Math.min(40, baseOpm * 100 + (rng() - 0.5) * 5))
    const opProfit = Math.round(sales * opmPct / 100)
    const expenses = sales - opProfit
    const otherInc = Math.round((rng() - 0.3) * sales * 0.03)
    const interest = Math.max(0, Math.round(sales * 0.02 * (0.7 + rng() * 0.6)))
    const depreciation = Math.max(2, Math.round(sales * 0.035 * (0.8 + rng() * 0.4)))
    const pbt = opProfit + otherInc - interest - depreciation
    const taxPct = Math.max(15, Math.min(45, 28 + (rng() - 0.5) * 14))
    const netProfit = Math.round(pbt * (1 - taxPct / 100))
    const eps = Number((netProfit / Math.max(1, mcapCr / 100)).toFixed(2))
    return { fy, sales, expenses, opProfit, opmPct: Math.round(opmPct), otherInc, interest, depreciation, pbt, taxPct: Math.round(taxPct), netProfit, eps }
  })

  const balance: BalanceRow[] = SHORT_YEAR_LABELS.map((fy, i) => {
    const t = i / SHORT_YEAR_LABELS.length
    const total = Math.round(mcapCr * (0.6 + t * 0.5 + (rng() - 0.5) * 0.1))
    const equity = Math.round(total * 0.04)
    const reserves = Math.round(total * (0.35 + (rng() - 0.5) * 0.08))
    const borrowings = Math.round(total * (0.22 + (rng() - 0.5) * 0.1))
    const otherLiab = total - equity - reserves - borrowings
    const fixedAssets = Math.round(total * (0.42 + (rng() - 0.5) * 0.08))
    const cwip = Math.round(total * (0.05 + rng() * 0.04))
    const investments = Math.round(total * (0.18 + (rng() - 0.5) * 0.06))
    const otherAssets = total - fixedAssets - cwip - investments
    return { fy, equity, reserves, borrowings, otherLiab, total, fixedAssets, cwip, investments, otherAssets }
  })

  const cashflow: CashflowRow[] = SHORT_YEAR_LABELS.map((fy) => {
    const operating = Math.round(mcapCr * (0.06 + (rng() - 0.2) * 0.04))
    const investing = Math.round(-mcapCr * (0.04 + rng() * 0.03))
    const financing = Math.round((rng() - 0.5) * mcapCr * 0.05)
    const net = operating + investing + financing
    return { fy, operating, investing, financing, net }
  })

  const ratios: RatioRow[] = SHORT_YEAR_LABELS.map((fy) => ({
    fy,
    debtorDays: Math.round(35 + (rng() - 0.5) * 18),
    inventoryDays: Math.round(45 + (rng() - 0.5) * 22),
    ccc: Math.round(28 + (rng() - 0.5) * 20),
    roePct: Number((10 + (rng() - 0.3) * 14).toFixed(1)),
    rocePct: Number((12 + (rng() - 0.3) * 16).toFixed(1)),
  }))

  const peersBase = (f.related && f.related.length > 0)
    ? [...f.related, f.ticker]
    : [f.ticker, 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN'].slice(0, 6)
  const peers: DetailPeer[] = peersBase.slice(0, 7).map((sym) => {
    const pf = getFundamentals(sym)
    const pcap = parseMarketCapToCr(pf.marketCap)
    return {
      ticker: pf.ticker,
      name: pf.name,
      cmp: Number(pf.price.toFixed(2)),
      pe: Number(pf.pe.toFixed(2)),
      marketCap: pcap,
      divYieldPct: Number((parseFloat(pf.dividend) || 0).toFixed(2)),
      npQtr: Math.round(pcap * 0.012),
      profitVarPct: Number(((rng() - 0.3) * 80).toFixed(2)),
      salesQtr: Math.round(pcap * 0.05),
      salesVarPct: Number(((rng() - 0.3) * 40).toFixed(2)),
      rocePct: Number((8 + rng() * 20).toFixed(2)),
    }
  })

  const baseShare: ShareholdingSnapshot = {
    promoter: Math.round(42 + (rng() - 0.5) * 18),
    fii: Math.round(16 + (rng() - 0.5) * 10),
    dii: Math.round(14 + (rng() - 0.5) * 8),
    public: 0, gov: Math.round(rng() * 3), others: Math.round(rng() * 2),
  }
  baseShare.public = Math.max(0, 100 - baseShare.promoter - baseShare.fii - baseShare.dii - baseShare.gov - baseShare.others)
  const shareHistoryLabels = ['Mar 2024','Jun 2024','Sep 2024','Dec 2024','Mar 2025','Jun 2025','Sep 2025','Dec 2025','Mar 2026']
  const shareHistory = shareHistoryLabels.map((label, i) => {
    const drift = (i - shareHistoryLabels.length / 2) * 0.4
    const fii = Math.max(2, Math.round(baseShare.fii + drift + (rng() - 0.5) * 1.4))
    const dii = Math.max(2, Math.round(baseShare.dii - drift * 0.5 + (rng() - 0.5) * 1.2))
    const promoter = Math.max(20, Math.round(baseShare.promoter + (rng() - 0.5) * 1.2))
    const gov = baseShare.gov
    const others = baseShare.others
    const pub = Math.max(0, 100 - promoter - fii - dii - gov - others)
    return { label, snapshot: { promoter, fii, dii, public: pub, gov, others } }
  })

  const documents: DocumentItem[] = [
    { type: 'Annual Report',  title: `Annual Report FY 2024-25`, date: '15 Jul 2025' },
    { type: 'Annual Report',  title: `Annual Report FY 2023-24`, date: '12 Jul 2024' },
    { type: 'Concall',        title: 'Q4 FY26 earnings concall transcript', date: '6 May 2026' },
    { type: 'Presentation',   title: 'Q4 FY26 investor presentation', date: '4 May 2026' },
    { type: 'Concall',        title: 'Q3 FY26 earnings concall transcript', date: '3 Feb 2026' },
    { type: 'Presentation',   title: 'Q3 FY26 investor presentation', date: '1 Feb 2026' },
    { type: 'Filing',         title: 'Board meeting outcome — buyback consideration', date: '22 Apr 2026' },
    { type: 'Filing',         title: 'Disclosure under Reg. 30 — debt rating reaffirmed', date: '14 Mar 2026' },
    { type: 'Concall',        title: 'Q2 FY26 earnings concall transcript', date: '5 Nov 2025' },
    { type: 'Presentation',   title: 'Capital markets day — strategy 2030', date: '12 Sep 2025' },
  ]

  const pros: string[] = []
  const cons: string[] = []
  const latestQ = quarters[quarters.length - 1]
  const prevQ = quarters[quarters.length - 5]
  const profitGrowth = ((latestQ.netProfit - prevQ.netProfit) / Math.max(1, Math.abs(prevQ.netProfit))) * 100
  if (profitGrowth > 12) pros.push(`Company has delivered profit growth of ${profitGrowth.toFixed(1)}% over the last year.`)
  if (f.dividend && parseFloat(f.dividend) > 1.2) pros.push(`Company maintains a healthy dividend payout of ${f.dividend}.`)
  if (ratios[ratios.length - 1].rocePct > 18) pros.push(`Strong return on capital of ${ratios[ratios.length - 1].rocePct.toFixed(1)}%.`)
  if (latestQ.opmPct > 22) pros.push(`Operating margins remain elevated at ${latestQ.opmPct}%.`)
  if (pros.length === 0) pros.push('Company has been able to grow sales steadily through the cycle.')

  if (f.pe > 40) cons.push(`Stock trades at a rich P/E of ${f.pe.toFixed(1)}, leaving limited margin of safety.`)
  if (ratios[ratios.length - 1].roePct < 11) cons.push(`Return on equity has stayed muted around ${ratios[ratios.length - 1].roePct.toFixed(1)}%.`)
  if (balance[balance.length - 1].borrowings / balance[balance.length - 1].total > 0.28) cons.push('Debt-to-asset ratio is on the higher side relative to peers.')
  if (profitGrowth < 3) cons.push('Profit growth has been sluggish over the trailing twelve months.')
  if (cons.length === 0) cons.push('Valuation looks demanding compared to long-term averages.')

  const aboutTemplates: Record<string, string> = {
    Technology: `${f.name} is a global technology platform with deep distribution and a multi-product business mix. The company operates across geographies with a high-margin software and services tail.`,
    Semiconductors: `${f.name} designs and supplies semiconductor products used across data center, automotive, and consumer end markets, with deep customer relationships across the supply chain.`,
    Internet: `${f.name} operates a portfolio of consumer-internet properties and advertising businesses, generating cash flow from a long-tail of users and a smaller premium revenue base.`,
    Auto: `${f.name} designs, manufactures, and sells vehicles and energy products globally, with vertically-integrated operations across batteries, drivetrains, and software.`,
    Energy: `${f.name} is an integrated energy major with upstream production, midstream logistics, and downstream refining and marketing exposure across the globe.`,
    Financials: `${f.name} is a diversified financial-services franchise spanning lending, capital markets, and consumer payments.`,
    Consumer: `${f.name} operates large-scale consumer distribution and retail networks, supplemented by digital and advertising businesses.`,
  }
  const sectorKey = Object.keys(aboutTemplates).find((k) => f.sector.toLowerCase().includes(k.toLowerCase())) ?? 'Technology'
  const about = aboutTemplates[sectorKey]

  const detail: StockDetail = {
    ticker: f.ticker,
    name: f.name,
    exchange: f.exchange,
    sector: f.sector,
    sectorPath: sectorPathFor(f.sector),
    website: (TICKER_DOMAIN[f.ticker] ?? `${f.ticker.toLowerCase()}.com`),
    about,
    keyPoints: f.highlights,
    price: f.price,
    changePct: f.changePct,
    marketCap: f.marketCap,
    pe: f.pe,
    bookValue: Number((f.price / Math.max(1.2, 1 + f.pe / 30)).toFixed(2)),
    divYieldPct: parseFloat(f.dividend) || 0,
    rocePct: ratios[ratios.length - 1].rocePct,
    roePct: ratios[ratios.length - 1].roePct,
    high52w: f.yearHigh,
    low52w: f.yearLow,
    faceValue: 1,
    initials: f.initials,
    bg: f.bg,
    pros, cons,
    peers,
    quarters, pnl, balance, cashflow, ratios,
    shareholding: { latest: baseShare, history: shareHistory },
    documents,
    related: f.related,
  }
  STOCK_DETAIL_CACHE.set(symbol, detail)
  return detail
}

function ScrollTable({ headers, sticky = true, rows }: {
  headers: string[]
  sticky?: boolean
  rows: { label: string; values: (string | number)[]; bold?: boolean }[]
}) {
  return (
    <div className={`sd-table-wrap${sticky ? ' sd-table-wrap--sticky' : ''}`}>
      <table className="sd-table">
        <thead>
          <tr>
            <th className="sd-th sd-th--label" />
            {headers.map((h) => <th key={h} className="sd-th">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className={`sd-th sd-th--label sd-td-label${r.bold ? ' sd-td-label--bold' : ''}`}>{r.label}</th>
              {r.values.map((v, i) => (
                <td key={i} className={`sd-td${r.bold ? ' sd-td--bold' : ''}`}>{typeof v === 'number' ? v.toLocaleString('en-IN') : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockDetailScreen({ symbol, onClose, onOpenRelated }: { symbol: string | null; onClose: () => void; onOpenRelated: (sym: string) => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const tabbarRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Record<StockSectionId, HTMLElement | null>>({
    overview: null, chart: null, analysis: null, peers: null, quarters: null,
    pnl: null, balance: null, cashflow: null, ratios: null, investors: null, documents: null,
  })
  const [activeSection, setActiveSection] = useState<StockSectionId>('overview')

  useEffect(() => {
    if (!symbol) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [symbol])

  useEffect(() => {
    if (!symbol) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [symbol, onClose])

  useEffect(() => {
    if (!symbol) return
    setActiveSection('overview')
    requestAnimationFrame(() => { scrollRef.current?.scrollTo({ top: 0 }) })
  }, [symbol])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || !symbol) return
    const onScroll = () => {
      const rootTop = root.getBoundingClientRect().top
      const threshold = rootTop + 110
      let current: StockSectionId = 'overview'
      for (const s of STOCK_SECTIONS) {
        const el = sectionRefs.current[s.id]
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= threshold) current = s.id
      }
      setActiveSection((prev) => (prev === current ? prev : current))
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => root.removeEventListener('scroll', onScroll)
  }, [symbol])

  useEffect(() => {
    const tab = tabbarRef.current?.querySelector<HTMLElement>(`[data-tab="${activeSection}"]`)
    tab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeSection])

  const scrollToSection = useCallback((id: StockSectionId) => {
    const el = sectionRefs.current[id]
    const root = scrollRef.current
    if (!el || !root) return
    const elRect = el.getBoundingClientRect()
    const rootRect = root.getBoundingClientRect()
    const offset = root.scrollTop + (elRect.top - rootRect.top) - 96
    root.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
  }, [])

  if (!symbol) return null
  const d = getStockDetail(symbol)
  const direction: ImpactArrow = d.changePct > 0 ? 'up' : d.changePct < 0 ? 'down' : 'flat'

  const quartersHeaders = QUARTER_LABELS
  const pnlHeaders = YEAR_LABELS
  const balanceHeaders = SHORT_YEAR_LABELS
  const cashflowHeaders = SHORT_YEAR_LABELS
  const ratioHeaders = SHORT_YEAR_LABELS

  return createPortal(
    <div className="sd-screen" role="dialog" aria-modal="true" aria-label={`${d.name} stock details`}>
      <header className="sd-head">
        <button type="button" className="sd-head__back" onClick={onClose} aria-label="Back">
          <IconBack />
        </button>
        <div className="sd-head__id">
          <span className="sd-head__name">{d.name}</span>
          <span className="sd-head__sub">{d.exchange} · {d.ticker}</span>
        </div>
        <button type="button" className="sd-head__action" aria-label="Follow">＋</button>
      </header>

      <div className="sd-tabbar" ref={tabbarRef} role="tablist" aria-label="Stock sections">
        {STOCK_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            data-tab={s.id}
            aria-selected={activeSection === s.id}
            className={`sd-tab${activeSection === s.id ? ' sd-tab--active' : ''}`}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="sd-body" ref={scrollRef}>
        <section
          id="overview"
          ref={(el) => { sectionRefs.current.overview = el }}
          className="sd-section"
          aria-labelledby="sd-overview-title"
        >
          <div className="sd-overview-head">
            <CompanyLogo ticker={d.ticker} initials={d.initials} bg={d.bg} size={56} />
            <div className="sd-overview-head__id">
              <h2 id="sd-overview-title" className="sd-overview-head__name">{d.name}</h2>
              <p className="sd-overview-head__crumb">{d.sectorPath.join(' › ')}</p>
            </div>
          </div>
          <div className="sd-overview-price">
            <span className="sd-overview-price__amount">₹{d.price.toFixed(2)}</span>
            <span className={`sd-overview-price__change sd-overview-price__change--${direction}`}>
              {d.changePct > 0 ? '+' : ''}{d.changePct.toFixed(2)}%
            </span>
            <span className="sd-overview-price__meta">21 May · close price</span>
          </div>
          <div className="sd-overview-links">
            <a href={`https://${d.website}`} target="_blank" rel="noreferrer noopener" className="sd-overview-link" onClick={(e) => e.stopPropagation()}>
              {d.website}
            </a>
            <span className="sd-overview-chip">{d.exchange}: {d.ticker}</span>
          </div>

          <div className="sd-overview-grid">
            <div className="sd-stat"><span>Market Cap</span><strong>₹{formatCr(parseMarketCapToCr(d.marketCap))} Cr.</strong></div>
            <div className="sd-stat"><span>Current Price</span><strong>₹{d.price.toFixed(2)}</strong></div>
            <div className="sd-stat"><span>52w High / Low</span><strong>₹{d.high52w.toFixed(0)} / {d.low52w.toFixed(0)}</strong></div>
            <div className="sd-stat"><span>Stock P/E</span><strong>{d.pe.toFixed(2)}</strong></div>
            <div className="sd-stat"><span>Book Value</span><strong>₹{d.bookValue.toFixed(1)}</strong></div>
            <div className="sd-stat"><span>Dividend Yield</span><strong>{d.divYieldPct.toFixed(2)} %</strong></div>
            <div className="sd-stat"><span>ROCE</span><strong>{d.rocePct.toFixed(1)} %</strong></div>
            <div className="sd-stat"><span>ROE</span><strong>{d.roePct.toFixed(1)} %</strong></div>
            <div className="sd-stat"><span>Face Value</span><strong>₹{d.faceValue.toFixed(2)}</strong></div>
          </div>

          <div className="sd-overview-about">
            <h3 className="sd-section-label">About</h3>
            <p>{d.about}</p>
          </div>
          {d.keyPoints.length > 0 && (
            <div className="sd-overview-about">
              <h3 className="sd-section-label">Key points</h3>
              <ul className="sd-keypoints">
                {d.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </div>
          )}
        </section>

        <section
          id="chart"
          ref={(el) => { sectionRefs.current.chart = el }}
          className="sd-section"
          aria-labelledby="sd-chart-title"
        >
          <h3 id="sd-chart-title" className="sd-section-title">Chart</h3>
          <StockPriceChart symbol={d.ticker} currentPrice={d.price} />
        </section>

        <section
          id="analysis"
          ref={(el) => { sectionRefs.current.analysis = el }}
          className="sd-section"
          aria-labelledby="sd-analysis-title"
        >
          <h3 id="sd-analysis-title" className="sd-section-title">Analysis</h3>
          <div className="sd-analysis-grid">
            <article className="sd-pc sd-pc--pros">
              <h4 className="sd-pc__label">Pros</h4>
              <ul>{d.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </article>
            <article className="sd-pc sd-pc--cons">
              <h4 className="sd-pc__label">Cons</h4>
              <ul>{d.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </article>
          </div>
          <p className="sd-section-foot">* Pros and cons are derived from the latest quarterly financials.</p>
        </section>

        <section
          id="peers"
          ref={(el) => { sectionRefs.current.peers = el }}
          className="sd-section"
          aria-labelledby="sd-peers-title"
        >
          <h3 id="sd-peers-title" className="sd-section-title">Peer comparison</h3>
          <p className="sd-section-sub">{d.sectorPath.join(' › ')}</p>
          <div className="sd-table-wrap sd-table-wrap--sticky">
            <table className="sd-table sd-table--peers">
              <thead>
                <tr>
                  <th className="sd-th sd-th--label">Name</th>
                  <th className="sd-th">CMP</th>
                  <th className="sd-th">P/E</th>
                  <th className="sd-th">M.Cap Cr.</th>
                  <th className="sd-th">Div Yld %</th>
                  <th className="sd-th">NP Qtr</th>
                  <th className="sd-th">Profit Δ %</th>
                  <th className="sd-th">Sales Qtr</th>
                  <th className="sd-th">Sales Δ %</th>
                  <th className="sd-th">ROCE %</th>
                </tr>
              </thead>
              <tbody>
                {d.peers.map((p) => (
                  <tr key={p.ticker} className={p.ticker === d.ticker ? 'sd-tr--self' : ''}>
                    <th scope="row" className="sd-th sd-th--label sd-td-label">
                      <button type="button" className="sd-peer-name" onClick={() => onOpenRelated(p.ticker)}>{p.name}</button>
                    </th>
                    <td className="sd-td">{p.cmp.toLocaleString('en-IN')}</td>
                    <td className="sd-td">{p.pe.toFixed(2)}</td>
                    <td className="sd-td">{p.marketCap.toLocaleString('en-IN')}</td>
                    <td className="sd-td">{p.divYieldPct.toFixed(2)}</td>
                    <td className="sd-td">{p.npQtr.toLocaleString('en-IN')}</td>
                    <td className={`sd-td ${p.profitVarPct >= 0 ? 'sd-td--up' : 'sd-td--down'}`}>{p.profitVarPct.toFixed(2)}</td>
                    <td className="sd-td">{p.salesQtr.toLocaleString('en-IN')}</td>
                    <td className={`sd-td ${p.salesVarPct >= 0 ? 'sd-td--up' : 'sd-td--down'}`}>{p.salesVarPct.toFixed(2)}</td>
                    <td className="sd-td">{p.rocePct.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="quarters"
          ref={(el) => { sectionRefs.current.quarters = el }}
          className="sd-section"
          aria-labelledby="sd-quarters-title"
        >
          <h3 id="sd-quarters-title" className="sd-section-title">Quarterly Results</h3>
          <p className="sd-section-sub">Consolidated figures in ₹ crores.</p>
          <ScrollTable
            headers={quartersHeaders}
            rows={[
              { label: 'Sales',           values: d.quarters.map((q) => q.sales) },
              { label: 'Expenses',        values: d.quarters.map((q) => q.expenses) },
              { label: 'Operating Profit', bold: true, values: d.quarters.map((q) => q.opProfit) },
              { label: 'OPM %',           values: d.quarters.map((q) => `${q.opmPct}%`) },
              { label: 'Other Income',    values: d.quarters.map((q) => q.otherInc) },
              { label: 'Interest',        values: d.quarters.map((q) => q.interest) },
              { label: 'Depreciation',    values: d.quarters.map((q) => q.depreciation) },
              { label: 'Profit before tax', bold: true, values: d.quarters.map((q) => q.pbt) },
              { label: 'Tax %',           values: d.quarters.map((q) => `${q.taxPct}%`) },
              { label: 'Net Profit',  bold: true, values: d.quarters.map((q) => q.netProfit) },
              { label: 'EPS in ₹',        values: d.quarters.map((q) => q.eps.toFixed(2)) },
            ]}
          />
        </section>

        <section
          id="pnl"
          ref={(el) => { sectionRefs.current.pnl = el }}
          className="sd-section"
          aria-labelledby="sd-pnl-title"
        >
          <h3 id="sd-pnl-title" className="sd-section-title">Profit &amp; Loss</h3>
          <p className="sd-section-sub">Consolidated figures in ₹ crores.</p>
          <ScrollTable
            headers={pnlHeaders}
            rows={[
              { label: 'Sales',           values: d.pnl.map((q) => q.sales) },
              { label: 'Expenses',        values: d.pnl.map((q) => q.expenses) },
              { label: 'Operating Profit', bold: true, values: d.pnl.map((q) => q.opProfit) },
              { label: 'OPM %',           values: d.pnl.map((q) => `${q.opmPct}%`) },
              { label: 'Other Income',    values: d.pnl.map((q) => q.otherInc) },
              { label: 'Interest',        values: d.pnl.map((q) => q.interest) },
              { label: 'Depreciation',    values: d.pnl.map((q) => q.depreciation) },
              { label: 'Profit before tax', bold: true, values: d.pnl.map((q) => q.pbt) },
              { label: 'Tax %',           values: d.pnl.map((q) => `${q.taxPct}%`) },
              { label: 'Net Profit',  bold: true, values: d.pnl.map((q) => q.netProfit) },
              { label: 'EPS in ₹',        values: d.pnl.map((q) => q.eps.toFixed(2)) },
            ]}
          />
        </section>

        <section
          id="balance"
          ref={(el) => { sectionRefs.current.balance = el }}
          className="sd-section"
          aria-labelledby="sd-balance-title"
        >
          <h3 id="sd-balance-title" className="sd-section-title">Balance Sheet</h3>
          <p className="sd-section-sub">Consolidated figures in ₹ crores.</p>
          <ScrollTable
            headers={balanceHeaders}
            rows={[
              { label: 'Equity Capital',  values: d.balance.map((b) => b.equity) },
              { label: 'Reserves',        values: d.balance.map((b) => b.reserves) },
              { label: 'Borrowings',      values: d.balance.map((b) => b.borrowings) },
              { label: 'Other Liabilities', values: d.balance.map((b) => b.otherLiab) },
              { label: 'Total Liabilities', bold: true, values: d.balance.map((b) => b.total) },
              { label: 'Fixed Assets',    values: d.balance.map((b) => b.fixedAssets) },
              { label: 'CWIP',            values: d.balance.map((b) => b.cwip) },
              { label: 'Investments',     values: d.balance.map((b) => b.investments) },
              { label: 'Other Assets',    values: d.balance.map((b) => b.otherAssets) },
              { label: 'Total Assets',  bold: true, values: d.balance.map((b) => b.total) },
            ]}
          />
        </section>

        <section
          id="cashflow"
          ref={(el) => { sectionRefs.current.cashflow = el }}
          className="sd-section"
          aria-labelledby="sd-cashflow-title"
        >
          <h3 id="sd-cashflow-title" className="sd-section-title">Cash Flow</h3>
          <p className="sd-section-sub">Consolidated figures in ₹ crores.</p>
          <ScrollTable
            headers={cashflowHeaders}
            rows={[
              { label: 'Operating Activity', values: d.cashflow.map((c) => c.operating) },
              { label: 'Investing Activity', values: d.cashflow.map((c) => c.investing) },
              { label: 'Financing Activity', values: d.cashflow.map((c) => c.financing) },
              { label: 'Net Cash Flow', bold: true, values: d.cashflow.map((c) => c.net) },
            ]}
          />
        </section>

        <section
          id="ratios"
          ref={(el) => { sectionRefs.current.ratios = el }}
          className="sd-section"
          aria-labelledby="sd-ratios-title"
        >
          <h3 id="sd-ratios-title" className="sd-section-title">Ratios</h3>
          <ScrollTable
            headers={ratioHeaders}
            rows={[
              { label: 'Debtor Days',        values: d.ratios.map((r) => r.debtorDays) },
              { label: 'Inventory Days',     values: d.ratios.map((r) => r.inventoryDays) },
              { label: 'Cash Conv. Cycle',   values: d.ratios.map((r) => r.ccc) },
              { label: 'ROE %',              values: d.ratios.map((r) => r.roePct.toFixed(1)) },
              { label: 'ROCE %', bold: true, values: d.ratios.map((r) => r.rocePct.toFixed(1)) },
            ]}
          />
        </section>

        <section
          id="investors"
          ref={(el) => { sectionRefs.current.investors = el }}
          className="sd-section"
          aria-labelledby="sd-investors-title"
        >
          <h3 id="sd-investors-title" className="sd-section-title">Shareholding Pattern</h3>
          <div className="sd-share-bar" role="img" aria-label="Current shareholding split">
            <span className="sd-share-bar__seg sd-share-bar__seg--promoter" style={{ width: `${d.shareholding.latest.promoter}%` }}>Promoter {d.shareholding.latest.promoter}%</span>
            <span className="sd-share-bar__seg sd-share-bar__seg--fii"     style={{ width: `${d.shareholding.latest.fii}%` }}>FII {d.shareholding.latest.fii}%</span>
            <span className="sd-share-bar__seg sd-share-bar__seg--dii"     style={{ width: `${d.shareholding.latest.dii}%` }}>DII {d.shareholding.latest.dii}%</span>
            <span className="sd-share-bar__seg sd-share-bar__seg--public"  style={{ width: `${d.shareholding.latest.public}%` }}>Public {d.shareholding.latest.public}%</span>
          </div>
          <div className="sd-table-wrap sd-table-wrap--sticky">
            <table className="sd-table">
              <thead>
                <tr>
                  <th className="sd-th sd-th--label" />
                  {d.shareholding.history.map((h) => <th key={h.label} className="sd-th">{h.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className="sd-th sd-th--label sd-td-label">Promoters %</th>
                  {d.shareholding.history.map((h) => <td key={h.label} className="sd-td">{h.snapshot.promoter}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="sd-th sd-th--label sd-td-label">FIIs %</th>
                  {d.shareholding.history.map((h) => <td key={h.label} className="sd-td">{h.snapshot.fii}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="sd-th sd-th--label sd-td-label">DIIs %</th>
                  {d.shareholding.history.map((h) => <td key={h.label} className="sd-td">{h.snapshot.dii}</td>)}
                </tr>
                <tr>
                  <th scope="row" className="sd-th sd-th--label sd-td-label">Public %</th>
                  {d.shareholding.history.map((h) => <td key={h.label} className="sd-td">{h.snapshot.public}</td>)}
                </tr>
                {d.shareholding.latest.gov > 0 && (
                  <tr>
                    <th scope="row" className="sd-th sd-th--label sd-td-label">Government %</th>
                    {d.shareholding.history.map((h) => <td key={h.label} className="sd-td">{h.snapshot.gov}</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="documents"
          ref={(el) => { sectionRefs.current.documents = el }}
          className="sd-section"
          aria-labelledby="sd-documents-title"
        >
          <h3 id="sd-documents-title" className="sd-section-title">Documents</h3>
          <ul className="sd-docs">
            {d.documents.map((doc, i) => (
              <li key={i} className="sd-doc">
                <span className={`sd-doc__type sd-doc__type--${doc.type.replace(/\s+/g, '-').toLowerCase()}`}>{doc.type}</span>
                <span className="sd-doc__title">{doc.title}</span>
                <span className="sd-doc__date">{doc.date}</span>
              </li>
            ))}
          </ul>
        </section>

        {d.related.length > 0 && (
          <section className="sd-section sd-section--related">
            <h3 className="sd-section-title">Related stocks</h3>
            <ul className="sd-related">
              {d.related.map((sym) => {
                const r = getFundamentals(sym)
                const rd: ImpactArrow = r.changePct > 0 ? 'up' : r.changePct < 0 ? 'down' : 'flat'
                return (
                  <li key={sym}>
                    <button type="button" className="sd-related__btn" onClick={() => onOpenRelated(sym)}>
                      <CompanyLogo ticker={r.ticker} initials={r.initials} bg={r.bg} size={32} />
                      <span className="sd-related__id">
                        <span className="sd-related__sym">${r.ticker}</span>
                        <span className="sd-related__name">{r.name}</span>
                      </span>
                      <span className={`sd-related__pct sd-related__pct--${rd}`}>
                        {r.changePct > 0 ? '+' : ''}{r.changePct.toFixed(1)}%
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Bottom spacer so last section can scroll above tab strip cleanly */}
        <div className="sd-spacer" aria-hidden />
      </div>
    </div>,
    document.body,
  )
}

function ExchangeSheet({
  selected,
  onSelect,
  onClose,
}: {
  selected: FinExchange
  onSelect: (e: FinExchange) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => FIN_EXCHANGES.filter((e) => `${e.name} ${e.region} ${e.code}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  )
  return (
    <div className="region-backdrop" role="dialog" aria-modal aria-label="Select exchange" onClick={onClose}>
      <div className="region-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="region-sheet__handle" aria-hidden />
        <div className="region-sheet__head">
          <h3 className="region-sheet__title">Select exchange</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="region-sheet__search-wrap">
          <span className="region-sheet__search-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            className="region-search"
            type="search"
            placeholder="Search exchanges…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search exchanges"
          />
        </div>
        <ul className="region-list" role="listbox">
          {filtered.map((e) => (
            <li key={e.code} role="option" aria-selected={e.code === selected.code}>
              <button
                type="button"
                className={`region-item${e.code === selected.code ? ' region-item--active' : ''}`}
                onClick={() => { onSelect(e); onClose() }}
              >
                <span className="exchange-item__short" aria-hidden>{e.short}</span>
                <span className="exchange-item__name">
                  <strong>{e.name}</strong>
                  <small>{e.region}</small>
                </span>
                {e.code === selected.code && (
                  <svg className="region-item__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="city-search-empty">No matching exchange</li>}
        </ul>
      </div>
    </div>
  )
}

function RangeBar({
  value,
  range,
  goodWhenUp,
}: {
  value: number
  range: EconRange
  goodWhenUp: boolean
}) {
  const span = range.max - range.min
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  const valuePct = clamp(((value - range.min) / span) * 100)
  const tLowPct = clamp(((range.targetLow - range.min) / span) * 100)
  const tHighPct = clamp(((range.targetHigh - range.min) / span) * 100)
  const tWidthPct = Math.max(0, tHighPct - tLowPct)
  const tCenterPct = (tLowPct + tHighPct) / 2

  const inTarget = value >= range.targetLow && value <= range.targetHigh
  const aboveTarget = value > range.targetHigh
  const state: 'in' | 'good' | 'bad' =
    inTarget ? 'in' : aboveTarget === goodWhenUp ? 'good' : 'bad'

  return (
    <div className={`range-bar range-bar--${state}`}>
      <div className="range-bar__track" role="img" aria-label={`${value}% in range ${range.min}%–${range.max}%`}>
        <div
          className="range-bar__band"
          style={{ left: `${tLowPct}%`, width: `${tWidthPct}%` }}
          aria-hidden
        />
        <div className="range-bar__marker" style={{ left: `${valuePct}%` }} aria-hidden>
          <span className={`range-bar__value range-bar__value--${state}`}>{value.toFixed(1)}%</span>
        </div>
      </div>
      <div className="range-bar__scale">
        <span className="range-bar__min">{range.min}%</span>
        <span className="range-bar__target" style={{ left: `${tCenterPct}%` }}>
          {range.targetLabel}
        </span>
        <span className="range-bar__max">{range.max}%</span>
      </div>
    </div>
  )
}

function EconomicPulse() {
  return (
    <article className="fin-card econ-pulse" id="fin-section-econ">
      <div className="fin-card__head">
        <h3>Economic pulse</h3>
        <span className="section-pill">Macro</span>
      </div>
      <ul className="econ-list">
        {ECONOMIC_INDICATORS.map((e) => {
          const isGood = e.goodWhenUp ? e.delta > 0 : e.delta < 0
          return (
            <li key={e.id} className={`econ-row econ-row--${isGood ? 'good' : 'bad'}`}>
              <div className="econ-row__head">
                <div className="econ-row__id">
                  <p className="econ-row__label">{e.label}</p>
                  <p className="econ-row__trailing">{e.trailing}</p>
                </div>
                <div className="econ-row__metric">
                  <span className="econ-row__value">{e.current}</span>
                  <span className={`econ-row__delta econ-row__delta--${isGood ? 'good' : 'bad'}`}>
                    {e.delta > 0 ? '▲' : e.delta < 0 ? '▼' : '·'} {e.delta > 0 ? '+' : ''}{e.delta.toFixed(1)} pp
                  </span>
                </div>
              </div>
              <RangeBar value={e.currentValue} range={e.range} goodWhenUp={e.goodWhenUp} />
              <p className="econ-row__story">{e.story}</p>
              <div className="econ-row__news">
                <span className="econ-row__news-label">Source</span>
                <a href="#" className="econ-row__news-link" onClick={(ev) => ev.preventDefault()}>{e.newsHeadline}</a>
                <span className="econ-row__news-source"> · {e.newsSource}</span>
              </div>
              <div className="econ-row__symbols">
                {e.symbols.map((s) => <TickerChip key={s} symbol={s} size="sm" />)}
              </div>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

function sectorTone(pct: number): string {
  if (pct >= 1.5) return 'sector-tile--up3'
  if (pct >= 0.5) return 'sector-tile--up2'
  if (pct > 0)    return 'sector-tile--up1'
  if (pct === 0)  return 'sector-tile--flat'
  if (pct > -0.5) return 'sector-tile--down1'
  if (pct > -1.5) return 'sector-tile--down2'
  return 'sector-tile--down3'
}

function SectorHealth() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = activeId ? FIN_SECTORS.find((s) => s.id === activeId) ?? null : null
  return (
    <article className="fin-card" id="fin-section-sector">
      <div className="fin-card__head">
        <h3>Sector health</h3>
        <span className="section-pill">Treemap</span>
      </div>
      <p className="fin-card__hint">Tile size = relative weight · color = today's move. Tap for details.</p>
      <ul className="sector-tree" role="list">
        {FIN_SECTORS.map((s) => {
          const isActive = s.id === activeId
          const area = s.cols * s.rows
          const sizeClass = area >= 4 ? 'sector-tile--lg' : area >= 2 ? 'sector-tile--md' : 'sector-tile--sm'
          const lead = s.topCompanies[0]
          return (
            <li
              key={s.id}
              style={{ gridColumn: `span ${s.cols}`, gridRow: `span ${s.rows}` }}
            >
              <button
                type="button"
                className={`sector-tile ${sectorTone(s.changePct)} ${sizeClass}${isActive ? ' sector-tile--active' : ''}`}
                onClick={() => setActiveId(isActive ? null : s.id)}
                aria-pressed={isActive}
              >
                <span className="sector-tile__head">
                  <span className="sector-tile__name">{s.name}</span>
                  {area >= 2 && <span className="sector-tile__weight">{s.weight}</span>}
                </span>
                <span className="sector-tile__pct">{s.changePct > 0 ? '+' : ''}{s.changePct.toFixed(1)}%</span>
                {area >= 4 && lead && (
                  <span className="sector-tile__lead">
                    <span className="sector-tile__lead-sym">{lead.ticker}</span>
                    <span className="sector-tile__lead-pct">{lead.changePct > 0 ? '+' : ''}{lead.changePct.toFixed(1)}%</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      {active && (
        <div className="sector-detail">
          <div className="sector-detail__head">
            <h4>{active.name}</h4>
            <span className={`sector-detail__pct sector-detail__pct--${active.changePct >= 0 ? 'up' : 'down'}`}>
              {active.changePct > 0 ? '+' : ''}{active.changePct.toFixed(1)}%
            </span>
          </div>
          <ul className="sector-detail__list">
            {active.topCompanies.map((c) => (
              <li key={c.ticker} className="sector-detail__row">
                <TickerChip symbol={c.ticker} />
                <span className={`sector-detail__row-pct sector-detail__row-pct--${c.changePct >= 0 ? 'up' : 'down'}`}>
                  {c.changePct > 0 ? '+' : ''}{c.changePct.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
          <p className="sector-detail__news">
            <span className="sector-detail__news-label">Related</span>
            <a href="#" className="sector-detail__news-link" onClick={(ev) => ev.preventDefault()}>{active.newsHeadline}</a>
            <span className="sector-detail__news-src"> · {active.newsSource}</span>
          </p>
        </div>
      )}
    </article>
  )
}

function parseMarketCap(cap: string): number {
  const m = cap.match(/([0-9.]+)\s*([TBM])/i)
  if (!m) return 0
  const num = parseFloat(m[1])
  const unit = m[2].toUpperCase()
  return unit === 'T' ? num * 1000 : unit === 'B' ? num : num / 1000
}

function capTone(pct: number): string {
  if (pct >= 1.5) return 'cap-seg--up3'
  if (pct >= 0.5) return 'cap-seg--up2'
  if (pct > 0)    return 'cap-seg--up1'
  if (pct === 0)  return 'cap-seg--flat'
  if (pct > -0.5) return 'cap-seg--down1'
  if (pct > -1.5) return 'cap-seg--down2'
  return 'cap-seg--down3'
}

function StackedCapBar({ tier, stocks }: { tier: CapTier; stocks: CapStock[] }) {
  const open = useFund()
  const [hovered, setHovered] = useState<string | null>(null)
  const totals = useMemo(() => stocks.map((s) => parseMarketCap(s.marketCap)), [stocks])
  const sum = totals.reduce((a, b) => a + b, 0) || 1
  const tierTotalText = sum >= 1000 ? `$${(sum / 1000).toFixed(1)}T` : `$${sum.toFixed(0)}B`
  const label = tier === 'large' ? 'Large cap' : tier === 'mid' ? 'Mid cap' : 'Small cap'

  return (
    <div className="cap-bar">
      <div className="cap-bar__head">
        <span className="cap-bar__label">{label}</span>
        <span className="cap-bar__total">{tierTotalText} combined</span>
      </div>

      <div
        className="cap-bar__track"
        role="group"
        aria-label={`${label} stacked bar by market cap`}
      >
        {stocks.map((s, i) => {
          const widthPct = (totals[i] / sum) * 100
          const isActive = hovered === s.ticker
          return (
            <button
              key={s.ticker}
              type="button"
              className={`cap-seg ${capTone(s.changePct)}${isActive ? ' cap-seg--active' : ''}`}
              style={{ flex: `${totals[i]} 0 0%` }}
              onClick={() => open?.(s.ticker)}
              onMouseEnter={() => setHovered(s.ticker)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.ticker)}
              onBlur={() => setHovered(null)}
              aria-label={`${s.ticker} ${s.name}, ${s.marketCap}, ${s.changePct > 0 ? '+' : ''}${s.changePct.toFixed(1)}%`}
            >
              {widthPct >= 9 && (
                <span className="cap-seg__logo-wrap" aria-hidden>
                  <CompanyLogo ticker={s.ticker} initials={s.initials} bg={s.bg} size={22} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <ul className="cap-bar__legend cap-bar__legend--grid">
        {stocks.map((s) => {
          const direction: ImpactArrow = s.changePct > 0 ? 'up' : s.changePct < 0 ? 'down' : 'flat'
          const isActive = hovered === s.ticker
          return (
            <li
              key={s.ticker}
              className={`cap-legend cap-legend--${direction}${isActive ? ' cap-legend--active' : ''}`}
              onMouseEnter={() => setHovered(s.ticker)}
              onMouseLeave={() => setHovered(null)}
            >
              <button
                type="button"
                className="cap-legend__btn"
                onClick={() => open?.(s.ticker)}
                onFocus={() => setHovered(s.ticker)}
                onBlur={() => setHovered(null)}
              >
                <CompanyLogo ticker={s.ticker} initials={s.initials} bg={s.bg} size={28} />
                <span className="cap-legend__id">
                  <span className="cap-legend__sym">{s.ticker}</span>
                  <span className="cap-legend__name">{s.name}</span>
                </span>
                <span className="cap-legend__cap">{s.marketCap}</span>
                <span className={`cap-legend__pct cap-legend__pct--${direction}`}>
                  {s.changePct > 0 ? '+' : ''}{s.changePct.toFixed(1)}%
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const CAP_TIER_ARTICLES: Record<CapTier, StockArticle[]> = {
  large: [
    {
      id: 'lg-1', headline: 'AI capex spending lifts mega-cap tech again', source: 'Bloomberg', publishedAgo: '2h ago',
      summary: 'Hyperscaler guides reset higher; chips and cloud names co-rally.',
      image: 'https://picsum.photos/seed/nmf-lg1/120/120',
      body: 'Two large hyperscalers raised AI capex outlooks, lifting Nvidia and the broader supply chain. Microsoft and Amazon reaffirmed their own infrastructure plans alongside.\nThe co-rally suggests the cycle continues to broaden beyond the single chip leader, with cloud platform vendors now full participants in the upside.',
      tree: {
        root: 'AI capex cycle',
        branches: [
          tBranch('b1', 'Companies', { symbols: ['NVDA', 'MSFT', 'AMZN'] }),
          tBranch('b2', 'Hyperscaler capex', { metrics: [tMetric('Outlook', 1.4)] }),
          tBranch('b3', 'Chip leaders', { metrics: [tMetric('Revenue', 2.1)] }),
          tBranch('b4', 'Cloud partners', { metrics: [tMetric('Co-rally', 0.8)] }),
        ],
        hub: 'Cycle broadens',
        summaries: ['Beyond single leader', 'Cloud names participate', 'Sustained capex visibility'],
      },
    },
    {
      id: 'lg-2', headline: 'Ad-tech cohort cools on cross-border data bill', source: 'Reuters', publishedAgo: '6h ago',
      summary: 'Compliance overhead trims FY revenue assumptions; smallest networks hit hardest.',
      image: 'https://picsum.photos/seed/nmf-lg2/120/120',
      body: 'Alphabet and Meta drifted lower as committee language on cross-border data flows raised compliance costs across the auction stack. Sell-side trimmed ad-revenue forecasts.\nLarger names absorb compliance more easily; smaller ad-tech vendors face the steepest cost-of-revenue impact.',
      tree: {
        root: 'Ad-tech compliance',
        branches: [
          tBranch('b1', 'Companies', { symbols: ['GOOGL', 'META'] }),
          tBranch('b2', 'Compliance cost', { metrics: [tMetric('Auction stack', -0.9)] }),
          tBranch('b3', 'Revenue', { metrics: [tMetric('FY trim', -0.6)] }),
          tBranch('b4', 'Committee vote', { metrics: [tMetric('Bill progress', -0.4)] }),
        ],
        hub: 'Cost-of-revenue rises',
        summaries: ['Smaller networks hit hardest', 'Larger names absorb cost', 'Second reading next quarter'],
      },
    },
  ],
  mid: [
    {
      id: 'md-1', headline: 'Coinbase international roadmap clears two licences', source: 'CoinDesk', publishedAgo: '3h ago',
      summary: 'EU approvals open the door to perpetual futures launches.',
      image: 'https://picsum.photos/seed/nmf-md1/120/120',
      body: 'Coinbase received approval to operate in two additional EU markets, enabling perpetual futures launches for non-US customers. Higher-margin derivatives should lift blended take rates.\nThe approvals also de-risk the international growth narrative which had stalled earlier in the year.',
      tree: {
        root: 'COIN international',
        branches: [
          tBranch('b1', 'Companies', { symbols: ['COIN'] }),
          tBranch('b2', 'Perpetual futures', { metrics: [tMetric('Take rate', 1.5)] }),
          tBranch('b3', 'EU markets', { metrics: [tMetric('Licences', 2.0)] }),
          tBranch('b4', 'De-risk', { metrics: [tMetric('Narrative', 1.0)] }),
        ],
        hub: 'Margin uplift',
        summaries: ['Two EU markets', 'Higher-margin product', 'International growth restored'],
      },
    },
    {
      id: 'md-2', headline: 'DoorDash logistics expansion lifts delivery cohort', source: 'WSJ', publishedAgo: '7h ago',
      summary: 'Same-day expansion patterns echo across delivery economics.',
      image: 'https://picsum.photos/seed/nmf-md2/120/120',
      body: 'DoorDash extended same-day fulfillment partnerships with two large national retailers, lifting unit economics on the non-restaurant side of the business. The deals broaden a moat against pure marketplaces.\nThe expansion gives DoorDash more pricing power on the merchant side as the network density compounds.',
      tree: {
        root: 'Delivery cohort',
        branches: [
          tBranch('b1', 'Companies', { symbols: ['DASH', 'AMZN'] }),
          tBranch('b2', 'Same-day', { metrics: [tMetric('Coverage', 1.4)] }),
          tBranch('b3', 'Retail deals', { metrics: [tMetric('Two new', 1.2)] }),
          tBranch('b4', 'Unit economics', { metrics: [tMetric('Non-restaurant', 0.8)] }),
        ],
        hub: 'Moat widens',
        summaries: ['Pricing power expands', 'Network density grows', 'Merchant-side leverage'],
      },
    },
  ],
  small: [
    {
      id: 'sm-1', headline: 'Super Micro under pressure on guidance reset', source: 'Reuters', publishedAgo: '1h ago',
      summary: 'AI server demand normalizes; FY revenue guide trimmed.',
      image: 'https://picsum.photos/seed/nmf-sm1/120/120',
      body: 'Super Micro pre-announced an FY revenue guide below consensus as AI server demand normalizes from peak ordering levels. Channel checks suggest customers have right-sized inventory.\nThe reset reins in expectations; the longer-term thesis remains intact but unit growth is now back to single digits.',
      tree: {
        root: 'SMCI guide reset',
        branches: [
          tBranch('b1', 'Companies', { symbols: ['SMCI', 'NVDA'] }),
          tBranch('b2', 'FY revenue', { metrics: [tMetric('Guide', -1.8)] }),
          tBranch('b3', 'AI server demand', { metrics: [tMetric('Normalize', -0.9)] }),
          tBranch('b4', 'Inventory', { metrics: [tMetric('Right-sized', -0.4)] }),
        ],
        hub: 'Reset expectations',
        summaries: ['Single-digit unit growth', 'Long-term thesis intact', 'Channel inventory eased'],
      },
    },
    {
      id: 'sm-2', headline: 'Quantum hardware pilots gain federal traction', source: 'WSJ', publishedAgo: '8h ago',
      summary: 'IonQ pilots expand at two federal agencies; pipeline visibility improving.',
      body: 'IonQ disclosed two federal pilot expansions at agencies running national-security workloads. The pilots are not yet revenue but signal pipeline visibility.\nQuantum hardware names remain speculative; sustained federal pilot growth is the cleanest near-term signal.',
      tree: {
        root: 'Quantum pilots',
        branches: [
          tBranch('b1', 'Companies', { symbols: ['IONQ', 'PLTR'] }),
          tBranch('b2', 'Federal pilots', { metrics: [tMetric('New wins', 2.0)] }),
          tBranch('b3', 'Pipeline', { metrics: [tMetric('Visibility', 1.2)] }),
          tBranch('b4', 'Revenue', { metrics: [tMetric('Conversion', 0.0)] }),
        ],
        hub: 'Speculative signal',
        summaries: ['Pilots not yet revenue', 'Pipeline broadens', 'Federal traction confirmed'],
      },
    },
  ],
}

function IndustryMovers() {
  const openArticle = useArticleOpen()
  return (
    <article className="fin-card" id="fin-section-industry">
      <div className="fin-card__head">
        <h3>Industry movers</h3>
        <span className="section-pill">Cap-weighted</span>
      </div>
      <p className="fin-card__hint">Segment width = market cap · color = today's move. Tap a segment for fundamentals.</p>
      {(['large', 'mid', 'small'] as CapTier[]).map((tier) => (
        <div key={tier} className="cap-tier-block">
          <StackedCapBar tier={tier} stocks={CAP_STOCKS[tier]} />
          <div className="cap-tier-news">
            <p className="cap-tier-news__label">News in this tier</p>
            <ul className="cap-tier-news__list">
              {CAP_TIER_ARTICLES[tier].map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="news-card"
                    onClick={() => openArticle?.(a)}
                  >
                    <p className="news-card__source">{a.source} · {a.publishedAgo}</p>
                    <div className="news-card__main">
                      <div className="news-card__content">
                        <p className="news-card__headline">{a.headline}</p>
                        <p className="news-card__summary">{a.summary}</p>
                      </div>
                      {useNewsImages().show && a.image && <img src={a.image} className="news-card__image" alt="" />}
                    </div>
                    <ul className="news-card__symbols">
                      {Array.from(new Set(a.tree.branches.flatMap((b) => b.symbols ?? []))).slice(0, 4).map((s) => (
                        <li key={s}><TickerChip symbol={s} size="sm" /></li>
                      ))}
                    </ul>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </article>
  )
}

function NewsConnections() {
  return (
    <article className="fin-card" id="fin-section-news">
      <div className="fin-card__head">
        <h3>News &amp; market</h3>
        <span className="section-pill">Connections</span>
      </div>
      <ul className="news-conn-list">
        {NEWS_CONNECTIONS.map((n) => {
          const direction: ImpactArrow = n.changePct > 0 ? 'up' : n.changePct < 0 ? 'down' : 'flat'
          return (
            <li key={n.id} className={`news-conn news-conn--${direction}`}>
              <header className="news-conn__head">
                <ArticleTag tag={n.tag} />
                <span className={`news-conn__delta news-conn__delta--${direction}`}>
                  {n.changePct > 0 ? '+' : ''}{n.changePct.toFixed(1)}%
                </span>
              </header>
              <h4 className="news-conn__title">{n.headline}</h4>
              <div className="news-conn__symbols">
                {n.symbols.map((s) => <TickerChip key={s} symbol={s} size="sm" />)}
              </div>
              <ImpactSparkline series={n.series} direction={direction} height={32} />
              <p className="news-conn__highlight"><strong>Highlight ·</strong> {n.highlight}</p>
              <div className="news-conn__grid">
                <div className="news-conn__cell"><span>What happened</span><p>{n.what}</p></div>
                <div className="news-conn__cell"><span>Why it happened</span><p>{n.why}</p></div>
                <div className="news-conn__cell"><span>How it played out</span><p>{n.how}</p></div>
                <div className="news-conn__cell"><span>What is expected next</span><p>{n.next}</p></div>
              </div>
              <p className="news-conn__source">Source · {n.source}</p>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

const RETURN_HORIZONS = [1, 3, 5, 10] as const

function ReturnEstimator() {
  const [amountStr, setAmountStr] = useState('')
  const [years, setYears] = useState<number>(5)
  const [submitted, setSubmitted] = useState(false)

  const amount = Number(amountStr.replace(/[^0-9.]/g, ''))
  const valid = amount > 0

  const results = useMemo(() => {
    if (!valid) return []
    return RETURN_INSTRUMENTS.map((r) => {
      const finalValue = amount * Math.pow(1 + r.pct / 100, years)
      return { ...r, finalValue }
    }).sort((a, b) => b.finalValue - a.finalValue)
  }, [amount, years, valid])

  const winner = results[0]?.id

  return (
    <article className="fin-card" id="fin-section-returns">
      <div className="fin-card__head">
        <h3>Return estimator</h3>
        <span className="section-pill">Projection</span>
      </div>
      <p className="fin-card__hint">Enter a hypothetical amount to compare projected returns across instruments.</p>

      <label className="ret-input-wrap">
        <span className="ret-input-prefix" aria-hidden>$</span>
        <input
          type="text"
          inputMode="decimal"
          className="ret-input"
          placeholder="Investment amount"
          value={amountStr}
          onChange={(e) => { setAmountStr(e.target.value); setSubmitted(false) }}
          aria-label="Investment amount"
        />
      </label>

      <div className="ret-horizon">
        <span className="ret-horizon__label">Horizon</span>
        <div className="ret-horizon__chips" role="radiogroup" aria-label="Time horizon">
          {RETURN_HORIZONS.map((y) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={years === y}
              className={`ret-horizon__chip${years === y ? ' ret-horizon__chip--active' : ''}`}
              onClick={() => { setYears(y); setSubmitted(false) }}
            >
              {y}y
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="ret-cta"
        disabled={!valid}
        onClick={() => setSubmitted(true)}
      >
        {submitted ? 'Update projection' : 'Estimate returns'}
      </button>

      {submitted && valid && (
        <div className="ret-results" aria-live="polite">
          <p className="ret-results__intro">
            Projected value of <strong>${amount.toLocaleString()}</strong> after <strong>{years} year{years > 1 ? 's' : ''}</strong>
          </p>
          <ul className="ret-results__list">
            {results.map((r) => (
              <li key={r.id} className={`ret-result${winner === r.id ? ' ret-result--winner' : ''}`}>
                <div className="ret-result__top">
                  <div>
                    <span className="ret-result__name">{r.name}</span>
                    <span className="ret-result__cat">{r.category}</span>
                  </div>
                  {winner === r.id && <span className="ret-result__badge">Best return</span>}
                </div>
                <div className="ret-result__bar" aria-hidden>
                  <span style={{ width: `${Math.min(100, (r.pct / 20) * 100)}%`, background: r.color }} />
                </div>
                <div className="ret-result__metrics">
                  <span className="ret-result__metric"><strong>{r.pct.toFixed(1)}%</strong>annual</span>
                  <span className="ret-result__metric"><strong>${Math.round(r.finalValue).toLocaleString()}</strong>future value</span>
                  <span className="ret-result__metric ret-result__metric--risk">
                    <strong>Risk</strong>
                    <span className="ret-result__risk-bars" aria-label={`Risk ${r.risk} of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= r.risk ? 'on' : ''} />)}
                    </span>
                  </span>
                </div>
                <p className="ret-result__trend">
                  <span>Trend ·</span> {r.trendNote}
                  <span className="ret-result__trend-src"> · {r.newsSource}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

type TreeMetric = {
  label: string
  direction: 'up' | 'down' | 'flat'
  pct: number
}

type TreeBranch = {
  id: string
  title: string
  metrics?: TreeMetric[]
  symbols?: string[]
}

type StoryTree = {
  root: string
  branches: TreeBranch[]
  hub: string
  summaries: string[]
}

function tMetric(label: string, pct: number): TreeMetric {
  return { label, direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat', pct }
}

function tBranch(id: string, title: string, opts: { metrics?: TreeMetric[]; symbols?: string[] } = {}): TreeBranch {
  return { id, title, ...opts }
}

type StockArticle = {
  id: string
  headline: string
  source: string
  publishedAgo: string
  summary: string
  body: string
  tree: StoryTree
  image?: string
}

const ArticleCtx = React.createContext<((a: StockArticle) => void) | null>(null)
function useArticleOpen() { return useContext(ArticleCtx) }

const NewsImagesCtx = React.createContext<{ show: boolean; setShow: (v: boolean) => void }>({ show: true, setShow: () => {} })
function useNewsImages() { return useContext(NewsImagesCtx) }

const TREE_ZOOM_MIN = 0.5
const TREE_ZOOM_MAX = 2.5
const TREE_DRAG_THRESHOLD = 6

function StoryTreeView({ tree }: { tree: StoryTree }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const branchRefs = useRef<(HTMLDivElement | null)[]>([])
  const summaryRefs = useRef<(HTMLDivElement | null)[]>([])

  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [paths, setPaths] = useState<string[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; dragging: boolean } | null>(null)
  const pinchRef = useRef<{ initial: number; baseScale: number } | null>(null)

  useLayoutEffect(() => {
    const vp = viewportRef.current
    if (!vp) return

    const offsetIn = (el: HTMLElement | null, root: HTMLElement, side: 'top' | 'bottom') => {
      if (!el) return null
      let x = el.offsetLeft + el.offsetWidth / 2
      let y = side === 'top' ? el.offsetTop : el.offsetTop + el.offsetHeight
      let p: HTMLElement | null = el.offsetParent as HTMLElement | null
      while (p && p !== root) {
        x += p.offsetLeft
        y += p.offsetTop
        p = p.offsetParent as HTMLElement | null
      }
      return { x, y }
    }

    const compute = () => {
      setSize({ w: vp.offsetWidth, h: vp.offsetHeight })

      const newPaths: string[] = []
      const rb = offsetIn(rootRef.current, vp, 'bottom')
      const ht = offsetIn(hubRef.current, vp, 'top')
      const hb = offsetIn(hubRef.current, vp, 'bottom')

      if (rb) {
        branchRefs.current.forEach((el) => {
          const p = offsetIn(el, vp, 'top')
          if (p) {
            const my = (rb.y + p.y) / 2
            newPaths.push(`M${rb.x},${rb.y} C${rb.x},${my} ${p.x},${my} ${p.x},${p.y}`)
          }
        })
      }
      if (ht) {
        branchRefs.current.forEach((el) => {
          const p = offsetIn(el, vp, 'bottom')
          if (p) {
            const my = (p.y + ht.y) / 2
            newPaths.push(`M${p.x},${p.y} C${p.x},${my} ${ht.x},${my} ${ht.x},${ht.y}`)
          }
        })
      }
      if (hb) {
        summaryRefs.current.forEach((el) => {
          const p = offsetIn(el, vp, 'top')
          if (p) {
            const my = (hb.y + p.y) / 2
            newPaths.push(`M${hb.x},${hb.y} C${hb.x},${my} ${p.x},${my} ${p.x},${p.y}`)
          }
        })
      }

      setPaths(newPaths)
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(vp)
    return () => ro.disconnect()
  }, [tree])

  const onWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = -e.deltaY * 0.0015
    setScale((s) => Math.min(TREE_ZOOM_MAX, Math.max(TREE_ZOOM_MIN, s + delta)))
  }, [])

  const startDrag = (clientX: number, clientY: number) => {
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      baseX: pos.x,
      baseY: pos.y,
      dragging: false,
    }
  }

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragRef.current) return
    const dx = clientX - dragRef.current.startX
    const dy = clientY - dragRef.current.startY
    if (!dragRef.current.dragging && Math.hypot(dx, dy) > TREE_DRAG_THRESHOLD) {
      dragRef.current.dragging = true
    }
    if (dragRef.current.dragging) {
      setPos({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy })
    }
  }

  const endDrag = () => {
    if (dragRef.current?.dragging) {
      setTimeout(() => { dragRef.current = null }, 0)
    } else {
      dragRef.current = null
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    startDrag(e.clientX, e.clientY)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    moveDrag(e.clientX, e.clientY)
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    endDrag()
  }

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { initial: Math.hypot(dx, dy), baseScale: scale }
      dragRef.current = null
    }
  }

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && dragRef.current) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const d = Math.hypot(dx, dy)
      const next = (d / pinchRef.current.initial) * pinchRef.current.baseScale
      setScale(Math.min(TREE_ZOOM_MAX, Math.max(TREE_ZOOM_MIN, next)))
    }
  }

  const onTouchEnd = () => {
    pinchRef.current = null
    endDrag()
  }

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current?.dragging) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }) }
  const zoomIn = () => setScale((s) => Math.min(TREE_ZOOM_MAX, s + 0.2))
  const zoomOut = () => setScale((s) => Math.max(TREE_ZOOM_MIN, s - 0.2))

  return (
    <div
      className={`story-tree${dragRef.current?.dragging ? ' story-tree--dragging' : ''}`}
      ref={containerRef}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      <div
        className="story-tree__viewport"
        ref={viewportRef}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
      >
        <svg className="story-tree__svg" width={size.w} height={size.h} aria-hidden>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.4} />
          ))}
        </svg>

        <div className="story-tree__row story-tree__row--root">
          <div ref={rootRef} className="tree-root">{tree.root}</div>
        </div>

        <div className="story-tree__row story-tree__row--branches">
          {tree.branches.map((b, i) => (
            <div
              key={b.id}
              ref={(el) => { branchRefs.current[i] = el }}
              className="tree-branch"
            >
              <h4 className="tree-branch__title">{b.title}</h4>
              {b.metrics && b.metrics.length > 0 && (
                <ul className="tree-branch__metrics">
                  {b.metrics.map((m, j) => (
                    <li key={j} className={`tree-metric tree-metric--${m.direction}`}>
                      <span className="tree-metric__label">{m.label}</span>
                      <span className="tree-metric__value">
                        {m.direction === 'up' ? '▲' : m.direction === 'down' ? '▼' : '·'} {m.pct > 0 ? '+' : ''}{m.pct.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {b.symbols && b.symbols.length > 0 && (
                <ul className="tree-branch__symbols">
                  {b.symbols.map((s, k) => (
                    <li key={k}><TickerChip symbol={s} size="sm" /></li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="story-tree__row story-tree__row--hub">
          <div ref={hubRef} className="tree-hub">{tree.hub}</div>
        </div>

        <div className="story-tree__row story-tree__row--summaries">
          {tree.summaries.map((s, i) => (
            <div
              key={i}
              ref={(el) => { summaryRefs.current[i] = el }}
              className="tree-summary"
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className="story-tree__controls" aria-label="Zoom controls">
        <button type="button" className="story-tree__ctl" onClick={zoomIn} aria-label="Zoom in">+</button>
        <button type="button" className="story-tree__ctl" onClick={zoomOut} aria-label="Zoom out">−</button>
        <button type="button" className="story-tree__ctl" onClick={reset} aria-label="Reset view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v6h-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ArticleDetailScreen({ article, onClose }: { article: StockArticle | null; onClose: () => void }) {
  useEffect(() => {
    if (!article) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [article])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (article) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [article, onClose])

  const symbols = useMemo(() => {
    if (!article) return [] as string[]
    const set = new Set<string>()
    article.tree.branches.forEach((b) => b.symbols?.forEach((s) => set.add(s)))
    return [...set]
  }, [article])

  if (!article) return null

  const paragraphs = article.body.split('\n').map((p) => p.trim()).filter(Boolean)

  return createPortal(
    <div className="article-screen" role="dialog" aria-modal="true" aria-label={article.headline}>
      <header className="article-screen__head">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Back">
          <IconBack />
        </button>
        <span className="article-screen__source">{article.source} · {article.publishedAgo}</span>
        <div style={{ width: 44 }} />
      </header>
      <div className="article-screen__body">
        <h2 className="article-screen__headline">{article.headline}</h2>
        {symbols.length > 0 && (
          <div className="article-screen__symbols">
            {symbols.map((s) => <TickerChip key={s} symbol={s} size="sm" />)}
          </div>
        )}
        <p className="article-screen__summary">{article.summary}</p>
        {paragraphs.map((p, i) => (
          <p key={i} className="article-screen__para">{p}</p>
        ))}
        <section className="article-screen__map">
          <div className="article-screen__map-head">
            <h3 className="article-screen__map-title">Story network</h3>
            <p className="article-screen__map-hint">Pinch / scroll to zoom · drag to pan · tap a ticker for fundamentals.</p>
          </div>
          <StoryTreeView tree={article.tree} />
        </section>
      </div>
    </div>,
    document.body,
  )
}

type MoverTab = 'trending' | 'index' | 'gainers' | 'losers'

type MoverRow = {
  ticker: string
  name: string
  changePct: number
  series: number[]
  initials: string
  bg: string
}

function buildMoverPool(): MoverRow[] {
  const seen = new Set<string>()
  const out: MoverRow[] = []
  const push = (r: MoverRow) => {
    if (seen.has(r.ticker)) return
    seen.add(r.ticker)
    out.push(r)
  }
  STOCKS_TO_WATCH.forEach((s) => push({ ticker: s.ticker, name: s.name, changePct: s.changePct, series: s.series, initials: s.initials, bg: s.bg }))
  ;(['large', 'mid', 'small'] as CapTier[]).forEach((tier) => {
    CAP_STOCKS[tier].forEach((s) => push({ ticker: s.ticker, name: s.name, changePct: s.changePct, series: s.series, initials: s.initials, bg: s.bg }))
  })
  return out
}

function MarketMovers() {
  const [tab, setTab] = useState<MoverTab>('trending')
  const open = useFund()
  const openArticle = useArticleOpen()
  const pool = useMemo(buildMoverPool, [])
  const gainers = useMemo(() => [...pool].sort((a, b) => b.changePct - a.changePct).slice(0, 6), [pool])
  const losers  = useMemo(() => [...pool].sort((a, b) => a.changePct - b.changePct).slice(0, 6), [pool])

  const tabs: { id: MoverTab; label: string }[] = [
    { id: 'trending', label: 'Trending' },
    { id: 'index',    label: 'Index' },
    { id: 'gainers',  label: 'Gainers' },
    { id: 'losers',   label: 'Losers' },
  ]

  return (
    <article className="fin-card" id="fin-section-movers">
      <div className="fin-card__head">
        <h3>Markets</h3>
        <span className="section-pill">Live</span>
      </div>
      <div className="mm-tabs" role="tablist" aria-label="Market tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`mm-tab${tab === t.id ? ' mm-tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'index' && (
        <ul className="fin-index-row" aria-label="Indices">
          {FINANCE_INDICES.map((idx) => {
            const direction: ImpactArrow = idx.up ? 'up' : 'down'
            return (
              <li key={idx.symbol}>
                <button
                  type="button"
                  className={`fin-index-card fin-index-card--${direction}`}
                  onClick={() => open?.(idx.symbol)}
                  aria-label={`Open ${idx.fullName} fundamentals`}
                >
                  <div className="fin-index-card__top">
                    <span className="fin-index-card__sym">{idx.symbol}</span>
                    <span className="fin-index-card__region">{idx.region}</span>
                  </div>
                  <span className="fin-index-card__name">{idx.fullName}</span>
                  <div className="fin-index-card__metrics">
                    <span className="fin-index-card__level">{idx.level}</span>
                    <span className={`fin-index-card__pct fin-index-card__pct--${direction}`}>
                      {idx.up ? <ArrowUp /> : <ArrowDown />}
                      {idx.up ? '+' : ''}{idx.pct.toFixed(2)}%
                    </span>
                  </div>
                  <ImpactSparkline series={idx.series} direction={direction} height={42} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {tab === 'trending' && (
        <ul className="watch-list">
          {STOCKS_TO_WATCH.map((s) => {
            const direction: ImpactArrow = s.changePct > 0 ? 'up' : s.changePct < 0 ? 'down' : 'flat'
            return (
              <li key={s.ticker} className={`watch-card watch-card--${direction}`}>
                <div className="watch-card__top">
                  <CompanyLogo ticker={s.ticker} initials={s.initials} bg={s.bg} size={42} />
                  <div className="watch-card__id">
                    <TickerChip symbol={s.ticker} size="sm" />
                    <span className="watch-card__name">{s.name}</span>
                  </div>
                  <span className={`watch-card__delta watch-card__delta--${direction}`}>
                    {s.changePct > 0 ? '+' : ''}{s.changePct.toFixed(1)}%
                  </span>
                </div>
                <ImpactSparkline series={s.series} direction={direction} height={32} />
                <ul className="watch-articles" aria-label={`Articles about ${s.name}`}>
                  {s.articles.map((a) => (
                    <li key={a.id}>
                    <button
                      type="button"
                      className="watch-article"
                      onClick={() => openArticle?.(a)}
                    >
                      <div className="watch-article__main">
                        <div className="watch-article__content">
                          <span className="watch-article__meta">
                            <span className="watch-article__source">{a.source}</span>
                            <span className="watch-article__time">· {a.publishedAgo}</span>
                          </span>
                          <span className="watch-article__headline">{a.headline}</span>
                        </div>
                        {useNewsImages().show && a.image && <img src={a.image} className="watch-article__image" alt="" />}
                      </div>
                    </button>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}

      {tab !== 'trending' && (
        <ul className="mm-list">
          {(tab === 'gainers' ? gainers : losers).map((s, i) => {
            const direction: ImpactArrow = s.changePct > 0 ? 'up' : s.changePct < 0 ? 'down' : 'flat'
            return (
              <li key={s.ticker} className={`mm-row mm-row--${direction}`}>
                <span className="mm-row__rank">{i + 1}</span>
                <CompanyLogo ticker={s.ticker} initials={s.initials} bg={s.bg} size={36} />
                <div className="mm-row__id">
                  <TickerChip symbol={s.ticker} size="sm" />
                  <span className="mm-row__name">{s.name}</span>
                </div>
                <ImpactSparkline series={s.series} direction={direction} height={26} />
                <span className={`mm-row__delta mm-row__delta--${direction}`}>
                  {s.changePct > 0 ? '+' : ''}{s.changePct.toFixed(1)}%
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

type FinNavSection = {
  id: string
  label: string
}

const FIN_NAV_SECTIONS: FinNavSection[] = [
  { id: 'fin-section-movers',   label: 'Markets' },
  { id: 'fin-section-econ',     label: 'Economic pulse' },
  { id: 'fin-section-sector',   label: 'Sector health' },
  { id: 'fin-section-industry', label: 'Industry movers' },
  { id: 'fin-section-news',     label: 'News & market' },
  { id: 'fin-section-returns',  label: 'Return estimator' },
  { id: 'fin-section-tips',     label: 'Pro tips' },
]

/* ── Pro Tips library ─────────────────────────────── */
type ProTipCategory = 'indicator' | 'pattern' | 'order' | 'strategy' | 'fundamental'

type ProTip = {
  id: string
  title: string
  category: ProTipCategory
  hook: string
  body: string
  exampleSymbol: string
  exampleNote: string
}

const PRO_TIP_CATEGORIES: { id: ProTipCategory; label: string }[] = [
  { id: 'indicator',   label: 'Indicators' },
  { id: 'pattern',     label: 'Chart patterns' },
  { id: 'order',       label: 'Order types' },
  { id: 'strategy',    label: 'Strategies' },
  { id: 'fundamental', label: 'Fundamentals' },
]

const PRO_TIPS: ProTip[] = [
  // Indicators
  {
    id: 'macd', title: 'MACD', category: 'indicator',
    hook: 'A momentum signal built from two moving averages crossing each other.',
    body: 'MACD (Moving Average Convergence Divergence) compares a fast EMA against a slower one. When the fast line crosses above the slow line, momentum is shifting positive — a "bullish crossover". When it crosses below, momentum is turning negative. The histogram (the gap between MACD and its signal line) flags shifts even earlier. MACD works best on liquid, trending stocks; it gives false signals in choppy, sideways markets.',
    exampleSymbol: 'NVDA',
    exampleNote: 'NVDA flashed a bullish MACD crossover in early March; the stock added roughly 15% over the following four weeks.',
  },
  {
    id: 'rsi', title: 'RSI', category: 'indicator',
    hook: 'A 0–100 score that flags when a stock is overbought or oversold.',
    body: 'RSI (Relative Strength Index) measures the magnitude of recent price moves. Above 70 the stock is "overbought" (a pullback may be due); below 30 it is "oversold" (a bounce may follow). RSI does not predict direction on its own — strong trends can keep RSI extreme for weeks. Pair it with trend signals like moving averages for confirmation.',
    exampleSymbol: 'TSLA',
    exampleNote: 'TSLA hit RSI 78 last month; it consolidated for two weeks before the next leg higher rather than reversing outright.',
  },
  {
    id: 'ma', title: 'Moving averages', category: 'indicator',
    hook: 'Smoothed price lines that strip out daily noise to show the underlying trend.',
    body: 'A simple moving average (SMA) is the average closing price over N days. The 50-day and 200-day SMAs are the most-watched. When price holds above the 200-day SMA, the long-term trend is up; below it the trend is down. The "golden cross" (50-day crossing above 200-day) is a long-term bullish signal; the "death cross" is its bearish counterpart.',
    exampleSymbol: 'AAPL',
    exampleNote: 'AAPL has been holding above its 200-day SMA for most of the past year — a structurally bullish backdrop for the stock.',
  },
  {
    id: 'bollinger', title: 'Bollinger Bands', category: 'indicator',
    hook: 'Price envelopes that widen when volatility rises and pinch when it falls.',
    body: 'Bollinger Bands plot a moving average plus and minus two standard deviations. Roughly 95% of price action stays inside the bands. Tight bands (a "squeeze") often precede a sharp move; wide bands signal high volatility. Touching the upper band is not automatically a sell — in strong uptrends, price can ride the band for days.',
    exampleSymbol: 'COIN',
    exampleNote: 'COIN went through a Bollinger squeeze in February before the spot-ETF news broke and price expanded sharply through the upper band.',
  },
  {
    id: 'volume', title: 'Volume', category: 'indicator',
    hook: 'How many shares change hands. Confirms or contradicts what the price is doing.',
    body: 'Volume is the number of shares traded in a session. A breakout on heavy volume is more credible than one on thin volume. A sharp drop on light volume is often a buying opportunity; a drop on heavy volume can signal real distribution. Volume by itself is not a buy/sell signal — it adds conviction (or doubt) to other signals.',
    exampleSymbol: 'PLTR',
    exampleNote: 'PLTR\'s recent breakout came on volume 2.5× its 20-day average — the kind of confirmation that supports follow-through.',
  },

  // Chart patterns
  {
    id: 'candlestick', title: 'Candlestick basics', category: 'pattern',
    hook: 'Each candle tells you four prices at once: open, high, low, close.',
    body: 'A candlestick has a body (open to close) and wicks (high and low). Green/white means close above open (buyers won the session); red/black means close below open (sellers won). The body shows conviction; the wicks show rejection. Long lower wicks suggest dip-buyers stepped in; long upper wicks suggest sellers showed up at higher prices.',
    exampleSymbol: 'AMZN',
    exampleNote: 'AMZN printed a long lower wick on a recent down-day — buyers absorbed the morning sell-off and the stock closed near session highs.',
  },
  {
    id: 'doji-hammer', title: 'Doji & hammer', category: 'pattern',
    hook: 'Two reversal candles to know: indecision (doji) and a buyer rejection (hammer).',
    body: 'A doji has a tiny body — open and close are close together — signalling indecision after a trend. A hammer has a small body at the top with a long lower wick, showing buyers reclaimed control after sellers pushed price down. Both are most meaningful at extremes — bottoms after a downtrend, or tops after an uptrend.',
    exampleSymbol: 'META',
    exampleNote: 'META printed a clear hammer at its 200-day SMA last quarter — that low has held since.',
  },
  {
    id: 'head-shoulders', title: 'Head & shoulders', category: 'pattern',
    hook: 'A classic three-peak topping pattern — left shoulder, higher head, right shoulder.',
    body: 'Head & shoulders is a reversal pattern that appears after an uptrend: a peak, a higher peak, then a lower peak. The "neckline" connects the two troughs in between. A break below the neckline confirms the pattern and projects a price target down by the height of the head. The inverse pattern (upside down) signals a bullish reversal at bottoms.',
    exampleSymbol: 'TSLA',
    exampleNote: 'TSLA traced an inverse head & shoulders into its November low; the breakout above the neckline kicked off the rally that followed.',
  },

  // Order types
  {
    id: 'market-limit', title: 'Market vs. limit order', category: 'order',
    hook: 'Two ways to buy: "right now at any price" vs. "only at this price or better".',
    body: 'A market order executes immediately at whatever price is available — fast, but you may pay slippage in fast markets. A limit order specifies the maximum price you\'ll pay (or minimum you\'ll accept on a sell). It may not fill if the market never reaches your price. Use market orders when speed matters; use limit orders when price matters more than fill certainty.',
    exampleSymbol: 'NVDA',
    exampleNote: 'On NVDA, where bid-ask can widen on news, a limit order avoids paying $5–$10 of slippage during volatile minutes.',
  },
  {
    id: 'stop-loss', title: 'Stop loss', category: 'order',
    hook: 'A pre-set sell trigger that limits how much you can lose on a position.',
    body: 'A stop loss converts to a market order once the trigger price is hit. Set it where your thesis is broken — not at an arbitrary percentage. A stop too tight will be hit on normal noise; too loose, and the loss compounds. A "trailing stop" follows the stock up as it rises, locking in gains on the way back down.',
    exampleSymbol: 'COIN',
    exampleNote: 'A COIN long with a 12% stop below the breakout level lets you ride volatility without bailing on every shake-out.',
  },

  // Strategies
  {
    id: 'short-selling', title: 'Short selling', category: 'strategy',
    hook: 'Profit when a stock falls — by borrowing shares to sell, then buying back lower.',
    body: 'You borrow shares from a broker, sell them at the current price, and buy them back later (hopefully cheaper) to return them. The difference is your profit. Risk is asymmetric: gains capped at 100% (stock goes to zero), losses unlimited (stock can keep rising). Shorting also costs borrow fees, and short squeezes can force exits at the worst possible time.',
    exampleSymbol: 'SMCI',
    exampleNote: 'SMCI shorts who covered into the recent guidance reset captured a 30%+ drawdown — but the path was punctuated by sharp short squeezes.',
  },
  {
    id: 'put-options', title: 'Put options', category: 'strategy',
    hook: 'A contract that profits when a stock falls below a strike price by expiry.',
    body: 'A put gives the buyer the right (not obligation) to sell shares at a fixed strike price by an expiry date. If the stock falls below the strike, the put gains value. Maximum loss is the premium paid; maximum gain is the strike (if the stock goes to zero). Puts are used both as bearish bets and as portfolio insurance against drawdowns.',
    exampleSymbol: 'TSLA',
    exampleNote: 'A TSLA $150 put bought before earnings cost ~$3; it printed $9 when the stock dropped to $140 the next morning.',
  },
  {
    id: 'call-options', title: 'Call options', category: 'strategy',
    hook: 'A contract that profits when a stock rises above a strike price by expiry.',
    body: 'A call gives the buyer the right to buy shares at a fixed strike price by expiry. If the stock rises above the strike, the call gains value. Maximum loss is the premium paid; maximum gain is unlimited. Calls offer leveraged upside on a small outlay, but time decay (theta) eats the option as expiry approaches if the stock doesn\'t move.',
    exampleSymbol: 'NVDA',
    exampleNote: 'A weekly NVDA call bought into a known catalyst can multiply 5-10× on a strong move — or expire worthless if the catalyst disappoints.',
  },

  // Fundamentals
  {
    id: 'pe-ratio', title: 'P/E ratio', category: 'fundamental',
    hook: 'Price divided by earnings per share. How much you pay for $1 of profit.',
    body: 'P/E = stock price ÷ earnings per share (EPS). A P/E of 20 means investors pay $20 for every $1 of annual earnings. High P/E suggests growth expectations; low P/E suggests skepticism (or a value opportunity). Compare P/E to peers in the same sector — a software P/E of 30 is normal; for an oil major it would be high.',
    exampleSymbol: 'AAPL',
    exampleNote: 'AAPL trades at ~32× earnings — premium to the broader market because investors price in services growth, not just hardware.',
  },
  {
    id: 'dividend-yield', title: 'Dividend yield', category: 'fundamental',
    hook: 'Annual dividend divided by stock price. The cash return you collect just for holding.',
    body: 'Dividend yield = annual dividend per share ÷ stock price, expressed as a percentage. A 3% yield means you collect $3 in dividends for every $100 invested. Steady yields signal a mature, cash-generative business; very high yields can signal stress (the price has fallen, which inflates the ratio). Watch the payout ratio — dividends paid out of free cash flow are sustainable; out of debt are not.',
    exampleSymbol: 'XOM',
    exampleNote: 'XOM yields ~3.4% — well-covered by free cash flow even at lower oil prices, which is why income investors hold it.',
  },
  {
    id: 'beta', title: 'Beta', category: 'fundamental',
    hook: 'How much a stock typically moves relative to the broader market.',
    body: 'Beta of 1.0 means the stock moves in line with the market (S&P 500). Beta of 1.5 means it moves 50% more than the market — up and down. Beta of 0.5 means it moves only half as much. High-beta stocks (tech, small-cap) amplify both rallies and drawdowns; low-beta stocks (utilities, consumer staples) cushion volatility but lag in bull markets.',
    exampleSymbol: 'NVDA',
    exampleNote: 'NVDA\'s beta is roughly 1.7 — when the market rises 1%, it tends to rise about 1.7%; the asymmetry cuts both ways.',
  },
]

const ProTipCtx = React.createContext<((tip: ProTip) => void) | null>(null)
function useProTipOpen() { return useContext(ProTipCtx) }

function ProTips() {
  const [filter, setFilter] = useState<ProTipCategory | 'all'>('all')
  const open = useProTipOpen()
  const filtered = useMemo(() => {
    return filter === 'all' ? PRO_TIPS : PRO_TIPS.filter((t) => t.category === filter)
  }, [filter])

  return (
    <article className="fin-card" id="fin-section-tips">
      <div className="fin-card__head">
        <h3>Pro tips</h3>
        <span className="section-pill">Library</span>
      </div>
      <p className="fin-card__hint">Plain-English explainers with stock examples. Tap a card to read the full tip.</p>

      <div className="tips-filters" role="tablist" aria-label="Tip categories">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          className={`tips-filter${filter === 'all' ? ' tips-filter--active' : ''}`}
          onClick={() => setFilter('all')}
        >All</button>
        {PRO_TIP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filter === c.id}
            className={`tips-filter${filter === c.id ? ' tips-filter--active' : ''}`}
            onClick={() => setFilter(c.id)}
          >{c.label}</button>
        ))}
      </div>

      <ul className="tips-grid">
        {filtered.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className={`tip-card tip-card--${t.category}`}
              onClick={() => open?.(t)}
            >
              <span className={`tip-card__cat tip-card__cat--${t.category}`}>
                {PRO_TIP_CATEGORIES.find((c) => c.id === t.category)?.label}
              </span>
              <h4 className="tip-card__title">{t.title}</h4>
              <p className="tip-card__hook">{t.hook}</p>
              <span className="tip-card__example">${t.exampleSymbol}</span>
            </button>
          </li>
        ))}
      </ul>
    </article>
  )
}

function ProTipDetailScreen({ tip, onClose }: { tip: ProTip | null; onClose: () => void }) {
  useEffect(() => {
    if (!tip) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [tip])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (tip) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tip, onClose])

  if (!tip) return null

  const fund = getFundamentals(tip.exampleSymbol)
  const direction: ImpactArrow = fund.changePct > 0 ? 'up' : fund.changePct < 0 ? 'down' : 'flat'
  const categoryLabel = PRO_TIP_CATEGORIES.find((c) => c.id === tip.category)?.label

  return createPortal(
    <div className="article-screen" role="dialog" aria-modal="true" aria-label={tip.title}>
      <header className="article-screen__head">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Back">
          <IconBack />
        </button>
        <span className="article-screen__source">Pro tip · {categoryLabel}</span>
        <div style={{ width: 44 }} />
      </header>
      <div className="article-screen__body">
        <h2 className="article-screen__headline">{tip.title}</h2>
        <p className="article-screen__summary">{tip.hook}</p>
        <p className="article-screen__para">{tip.body}</p>
        <section className="tip-example">
          <div className="tip-example__head">
            <CompanyLogo ticker={fund.ticker} initials={fund.initials} bg={fund.bg} size={36} />
            <div className="tip-example__id">
              <p className="tip-example__label">Stock example</p>
              <TickerChip symbol={tip.exampleSymbol} size="md" />
            </div>
            <span className={`tip-example__delta tip-example__delta--${direction}`}>
              {fund.changePct > 0 ? '+' : ''}{fund.changePct.toFixed(2)}%
            </span>
          </div>
          <ImpactSparkline series={fund.series} direction={direction} height={48} />
          <p className="tip-example__note">{tip.exampleNote}</p>
        </section>
      </div>
    </div>,
    document.body,
  )
}

/* ── Quick guide (first-time walkthrough) ─────────── */
type GuideStep = {
  title: string
  body: string
  scrollTo?: string
  emoji?: string
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'Welcome to Finance',
    body: 'A quick tour of how the screen works. You can dismiss this any time and reopen it from the floating menu.',
    emoji: '👋',
  },
  {
    title: 'Pick an exchange & search',
    body: 'Use the pill at the top-left to switch exchanges. The search bar finds stocks, indices, ETFs, crypto, and currencies. Tap a result to see its fundamentals.',
    emoji: '🔍',
  },
  {
    title: 'Markets tabs',
    body: 'Browse Trending, Index constituents, Top gainers, and Top losers. Tap any ticker to open its fundamentals drawer.',
    scrollTo: 'fin-section-movers',
    emoji: '📊',
  },
  {
    title: 'Sector heatmap',
    body: 'Sectors sized by weight, colored by today\'s move. Tap a tile to see top names and related news.',
    scrollTo: 'fin-section-sector',
    emoji: '🟩',
  },
  {
    title: 'Industry movers',
    body: 'Stacked bars by market cap. Tap a segment for fundamentals; news cards below explain the moves.',
    scrollTo: 'fin-section-industry',
    emoji: '📈',
  },
  {
    title: 'Estimate returns',
    body: 'Type an amount, pick a horizon, and compare projected returns across instruments — bonds, FDs, equities, gold, crypto.',
    scrollTo: 'fin-section-returns',
    emoji: '💰',
  },
  {
    title: 'Pro tips library',
    body: 'A growing library of plain-English explainers — MACD, candlesticks, options, P/E, and more — each with a stock example.',
    scrollTo: 'fin-section-tips',
    emoji: '💡',
  },
  {
    title: 'Tickers everywhere',
    body: 'Anywhere you see a $TICKER pill, tapping it opens that stock\'s fundamentals — including related stocks at the bottom for quick exploration.',
    emoji: '✨',
  },
]

function FinanceGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const total = GUIDE_STEPS.length
  const current = GUIDE_STEPS[step]
  const isLast = step === total - 1

  const scroll = () => {
    if (current.scrollTo) {
      const el = document.getElementById(current.scrollTo)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return createPortal(
    <div className="guide-backdrop" role="dialog" aria-modal="true" aria-label="Quick guide" onClick={onClose}>
      <div className="guide-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="guide-card__close" onClick={onClose} aria-label="Close guide">×</button>
        <div className="guide-card__progress" aria-hidden>
          {GUIDE_STEPS.map((_, i) => (
            <span key={i} className={`guide-card__dot${i === step ? ' guide-card__dot--active' : ''}${i < step ? ' guide-card__dot--past' : ''}`} />
          ))}
        </div>
        {current.emoji && <span className="guide-card__emoji" aria-hidden>{current.emoji}</span>}
        <h3 className="guide-card__title">{current.title}</h3>
        <p className="guide-card__body">{current.body}</p>
        {current.scrollTo && (
          <button type="button" className="guide-card__scroll" onClick={scroll}>
            Show me on screen
          </button>
        )}
        <div className="guide-card__actions">
          <button
            type="button"
            className="guide-card__btn guide-card__btn--ghost"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
          >
            {step === 0 ? 'Skip' : 'Back'}
          </button>
          <span className="guide-card__count">{step + 1} / {total}</span>
          <button
            type="button"
            className="guide-card__btn"
            onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function FinanceFab({ onOpenGuide }: { onOpenGuide: () => void }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const goto = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setOpen(false)
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="fin-fab__scrim"
          aria-label="Close section menu"
          onClick={() => setOpen(false)}
        />
      )}
      <div className={`fin-fab${open ? ' fin-fab--open' : ''}`}>
        {open && (
          <ul className="fin-fab__menu" role="menu" aria-label="Jump to section">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="fin-fab__item fin-fab__item--guide"
                onClick={() => { setOpen(false); onOpenGuide() }}
              >
                <span className="fin-fab__item-icon" aria-hidden>?</span>
                Quick guide
              </button>
            </li>
            {FIN_NAV_SECTIONS.map((s) => (
              <li key={s.id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="fin-fab__item"
                  onClick={() => goto(s.id)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="fin-fab__btn"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={open ? 'Close section menu' : 'Open section menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}

/* ── Finance bottom tabs ─────────────────────────── */

type FinTab = 'home' | 'list' | 'search' | 'props' | 'learn'

function IconFinHome({ active }: { active?: boolean }) {
  const w = active ? 2.3 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 19h18" />
      <rect x="5"  y="11" width="3" height="6" rx="0.6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.22 : 0} />
      <rect x="10.5" y="7"  width="3" height="10" rx="0.6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.22 : 0} />
      <rect x="16" y="4"  width="3" height="13" rx="0.6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.22 : 0} />
    </svg>
  )
}

function IconFinList({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.16 : 0} />
      <path d="M8 4v3M16 4v3" />
      <path d="M8 11h5" strokeWidth={1.7} />
      <path d="M8 15h8" strokeWidth={1.7} />
    </svg>
  )
}

function IconFinSearch({ active }: { active?: boolean }) {
  const w = active ? 2.3 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.16 : 0} />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function IconFinProps({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 7h7" />
      <path d="M16 7h3" />
      <circle cx="14" cy="7" r="2.4" fill={active ? 'currentColor' : 'var(--bg, #fff)'} fillOpacity={active ? 0.3 : 1} />
      <path d="M5 17h3" />
      <path d="M12 17h7" />
      <circle cx="10" cy="17" r="2.4" fill={active ? 'currentColor' : 'var(--bg, #fff)'} fillOpacity={active ? 0.3 : 1} />
    </svg>
  )
}

function IconFinLearn({ active }: { active?: boolean }) {
  const w = active ? 2.2 : 2
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9 12 4l9 5-9 5-9-5Z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} />
      <path d="M7 11.5V16c2 1.5 8 1.5 10 0v-4.5" />
      <path d="M21 9v5" strokeWidth={1.7} />
    </svg>
  )
}

function FinanceTabbar({ active, onChange }: { active: FinTab; onChange: (t: FinTab) => void }) {
  const tabs: { id: FinTab; label: string; Icon: (p: { active?: boolean }) => React.ReactElement }[] = [
    { id: 'home',   label: 'Home',   Icon: IconFinHome },
    { id: 'list',   label: 'Lists',  Icon: IconFinList },
    { id: 'search', label: 'Search', Icon: IconFinSearch },
    { id: 'props',  label: 'Props',  Icon: IconFinProps },
    { id: 'learn',  label: 'Learn',  Icon: IconFinLearn },
  ]
  return (
    <nav className="fin-tabbar" aria-label="Finance navigation">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`fin-tab${active === id ? ' fin-tab--active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          <Icon active={active === id} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

/* ── Watchlists screen ───────────────────────────── */

type Watchlist = { id: string; name: string; tickers: string[] }

const WL_STORAGE_KEY = 'nm_fin_watchlists'

function loadWatchlists(): Watchlist[] {
  try {
    const raw = localStorage.getItem(WL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Watchlist[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return [{ id: 'default', name: 'My watchlist', tickers: ['AAPL', 'NVDA', 'TSLA'] }]
}

function WatchlistsScreen() {
  const openTicker = useFund()
  const [lists, setLists] = useState<Watchlist[]>(loadWatchlists)
  const [activeId, setActiveId] = useState<string>(() => lists[0]?.id ?? 'default')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addQuery, setAddQuery] = useState('')

  const persist = useCallback((next: Watchlist[]) => {
    setLists(next)
    try { localStorage.setItem(WL_STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const active = lists.find((l) => l.id === activeId) ?? lists[0] ?? null

  const createList = (name: string) => {
    const n = name.trim()
    if (!n) return
    const list: Watchlist = { id: `wl-${Date.now()}`, name: n, tickers: [] }
    persist([...lists, list])
    setActiveId(list.id)
    setCreating(false)
    setNewName('')
  }

  const removeList = (id: string) => {
    const next = lists.filter((l) => l.id !== id)
    if (next.length === 0) {
      persist([{ id: 'default', name: 'My watchlist', tickers: [] }])
      setActiveId('default')
      return
    }
    persist(next)
    if (activeId === id) setActiveId(next[0].id)
  }

  const removeTicker = (sym: string) => {
    if (!active) return
    persist(lists.map((l) => l.id === active.id ? { ...l, tickers: l.tickers.filter((t) => t !== sym) } : l))
  }

  const addTicker = (sym: string) => {
    if (!active) return
    if (active.tickers.includes(sym)) return
    persist(lists.map((l) => l.id === active.id ? { ...l, tickers: [...l.tickers, sym] } : l))
  }

  const searchResults = useMemo(() => {
    const q = addQuery.trim().toLowerCase()
    if (!q) return SEARCH_INSTRUMENTS.slice(0, 10)
    return SEARCH_INSTRUMENTS.filter((i) =>
      i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q),
    ).slice(0, 16)
  }, [addQuery])

  return (
    <section className="fin-screen-page">
      <header className="fin-screen-page__head">
        <h2 className="fin-screen-page__title">Watchlists</h2>
        <p className="fin-screen-page__sub">Track favorite tickers across as many lists as you like.</p>
      </header>

      <div className="watchlist-tabs" role="tablist" aria-label="Watchlists">
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={active?.id === l.id}
            className={`watchlist-tab${active?.id === l.id ? ' watchlist-tab--active' : ''}`}
            onClick={() => setActiveId(l.id)}
          >
            <span>{l.name}</span>
            <span className="watchlist-tab__count">{l.tickers.length}</span>
          </button>
        ))}
        <button
          type="button"
          className="watchlist-tab watchlist-tab--new"
          onClick={() => setCreating(true)}
          aria-label="Create new list"
        >+ New list</button>
      </div>

      {creating && (
        <div className="watchlist-create">
          <input
            type="text"
            autoFocus
            value={newName}
            placeholder="e.g. Tech bets"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createList(newName)
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            className="watchlist-create__input"
          />
          <button type="button" className="watchlist-create__btn" onClick={() => createList(newName)}>Create</button>
          <button type="button" className="watchlist-create__btn watchlist-create__btn--ghost" onClick={() => { setCreating(false); setNewName('') }}>Cancel</button>
        </div>
      )}

      {active && (
        <div className="watchlist-body">
          <div className="watchlist-body__head">
            <h3 className="watchlist-body__name">{active.name}</h3>
            <div className="watchlist-body__actions">
              <button type="button" className="watchlist-add-btn" onClick={() => setAddOpen(true)}>+ Add ticker</button>
              {lists.length > 1 && (
                <button type="button" className="watchlist-del-btn" onClick={() => removeList(active.id)}>Delete list</button>
              )}
            </div>
          </div>

          {active.tickers.length === 0 ? (
            <div className="watchlist-empty">
              <p>No tickers in this list yet.</p>
              <p>Tap <strong>+ Add ticker</strong> to find one.</p>
            </div>
          ) : (
            <ul className="watchlist-items">
              {active.tickers.map((sym) => {
                const f = getFundamentals(sym)
                const direction: ImpactArrow = f.changePct > 0 ? 'up' : f.changePct < 0 ? 'down' : 'flat'
                return (
                  <li key={sym} className={`watchlist-item watchlist-item--${direction}`}>
                    <button type="button" className="watchlist-item__main" onClick={() => openTicker?.(sym)}>
                      <CompanyLogo ticker={f.ticker} initials={f.initials} bg={f.bg} size={38} />
                      <span className="watchlist-item__id">
                        <span className="watchlist-item__sym">${f.ticker}</span>
                        <span className="watchlist-item__name">{f.name}</span>
                      </span>
                      <ImpactSparkline series={f.series} direction={direction} height={28} />
                      <span className="watchlist-item__meta">
                        <span className="watchlist-item__price">${f.price.toFixed(2)}</span>
                        <span className={`watchlist-item__delta watchlist-item__delta--${direction}`}>
                          {f.changePct > 0 ? '+' : ''}{f.changePct.toFixed(2)}%
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="watchlist-item__rm"
                      aria-label={`Remove ${sym}`}
                      onClick={() => removeTicker(sym)}
                    >×</button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {addOpen && active && (
        <div className="watchlist-add-sheet" role="dialog" aria-modal="true" aria-label={`Add ticker to ${active.name}`}>
          <div className="watchlist-add-sheet__head">
            <h4>Add to "{active.name}"</h4>
            <button type="button" className="watchlist-add-sheet__close" aria-label="Close" onClick={() => { setAddOpen(false); setAddQuery('') }}>×</button>
          </div>
          <input
            autoFocus
            type="search"
            value={addQuery}
            placeholder="Search ticker or company…"
            onChange={(e) => setAddQuery(e.target.value)}
            className="watchlist-add-sheet__input"
          />
          <ul className="watchlist-add-sheet__results">
            {searchResults.map((r) => {
              const inList = active.tickers.includes(r.symbol)
              return (
                <li key={r.symbol}>
                  <button
                    type="button"
                    disabled={inList}
                    className={`watchlist-add-sheet__row${inList ? ' watchlist-add-sheet__row--in' : ''}`}
                    onClick={() => { addTicker(r.symbol); setAddOpen(false); setAddQuery('') }}
                  >
                    <span className="watchlist-add-sheet__sym">{r.symbol}</span>
                    <span className="watchlist-add-sheet__name">{r.name}</span>
                    <span className="watchlist-add-sheet__type">{r.type}</span>
                    {inList && <span className="watchlist-add-sheet__check" aria-hidden>✓</span>}
                  </button>
                </li>
              )
            })}
            {searchResults.length === 0 && <li className="fin-search-page__empty">No matches</li>}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ── Search screen ───────────────────────────────── */

const RECENT_SEARCH_KEY = 'nm_fin_recent_searches'
const FREQUENT_SEARCH_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'AMZN', 'MSFT', 'META', 'GOOGL', 'COIN', 'PLTR']

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCH_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return []
}

function FinSearchScreen() {
  const open = useFund()
  const [q, setQ] = useState('')
  const [recents, setRecents] = useState<string[]>(loadRecentSearches)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const record = useCallback((sym: string) => {
    setRecents((prev) => {
      const next = [sym, ...prev.filter((s) => s !== sym)].slice(0, 10)
      try { localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const clearRecents = () => {
    setRecents([])
    try { localStorage.removeItem(RECENT_SEARCH_KEY) } catch { /* ignore */ }
  }

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    return SEARCH_INSTRUMENTS.filter((i) =>
      i.symbol.toLowerCase().includes(query) || i.name.toLowerCase().includes(query),
    ).slice(0, 24)
  }, [q])

  const onPick = (sym: string) => {
    record(sym)
    open?.(sym)
  }

  return (
    <section className="fin-screen-page fin-search-page">
      <div className="fin-search-page__input-wrap">
        <span className="fin-search-page__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="fin-search-page__input"
          placeholder="Search tickers, indices, ETFs…"
          aria-label="Search financial instruments"
          enterKeyHint="search"
        />
        {q && (
          <button
            type="button"
            className="fin-search-page__clear"
            onClick={() => { setQ(''); inputRef.current?.focus() }}
            aria-label="Clear"
          >×</button>
        )}
      </div>

      {q.trim() ? (
        <ul className="fin-search-page__results">
          {results.length === 0 ? (
            <li className="fin-search-page__empty">No matches</li>
          ) : results.map((r) => (
            <li key={r.symbol}>
              <button type="button" className="fin-search-page__row" onClick={() => onPick(r.symbol)}>
                <span className="fin-search-page__row-sym">{r.symbol}</span>
                <span className="fin-search-page__row-name">{r.name}</span>
                <span className={`fin-search-page__row-type fin-search-page__row-type--${r.type.toLowerCase()}`}>{r.type}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {recents.length > 0 && (
            <section className="fin-search-section">
              <div className="fin-search-section__head">
                <h3>Recent</h3>
                <button type="button" className="fin-search-section__clear" onClick={clearRecents}>Clear</button>
              </div>
              <ul className="fin-search-page__recents">
                {recents.map((sym) => (
                  <li key={sym}>
                    <button type="button" className="fin-search-page__pill" onClick={() => onPick(sym)}>
                      <span className="fin-search-page__pill-sym">${sym}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="fin-search-section">
            <div className="fin-search-section__head">
              <h3>Frequently searched</h3>
            </div>
            <div className="fin-search-page__grid">
              {FREQUENT_SEARCH_TICKERS.map((sym) => {
                const f = getFundamentals(sym)
                const direction: ImpactArrow = f.changePct > 0 ? 'up' : f.changePct < 0 ? 'down' : 'flat'
                return (
                  <button
                    key={sym}
                    type="button"
                    className={`fin-search-page__tile fin-search-page__tile--${direction}`}
                    onClick={() => onPick(sym)}
                  >
                    <CompanyLogo ticker={f.ticker} initials={f.initials} bg={f.bg} size={32} />
                    <span className="fin-search-page__tile-sym">{f.ticker}</span>
                    <span className="fin-search-page__tile-name">{f.name}</span>
                    <span className={`fin-search-page__tile-delta fin-search-page__tile-delta--${direction}`}>
                      {f.changePct > 0 ? '+' : ''}{f.changePct.toFixed(1)}%
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      )}
    </section>
  )
}

/* ── Props (tools) screen ────────────────────────── */

type FinToolRule = 'goldenCross' | 'rsiOversold' | 'macdBullish' | 'darvas' | 'bearishCross' | 'volumeSurge' | 'magicFormula' | 'piotroski'

type FinTool = {
  id: string
  name: string
  category: 'Trend' | 'Momentum' | 'Volume' | 'Quality'
  description: string
  rule: FinToolRule
}

const FIN_TOOLS: FinTool[] = [
  { id: 'golden',    name: 'Golden Crossover',    category: 'Trend',    description: '50-day moving average crosses above the 200-day from below.', rule: 'goldenCross' },
  { id: 'rsi',       name: 'RSI · Oversold',      category: 'Momentum', description: 'Relative strength below 30 — often due for a technical bounce.', rule: 'rsiOversold' },
  { id: 'macd',      name: 'MACD · Bullish',      category: 'Momentum', description: 'MACD line crosses above its signal line — momentum is shifting up.', rule: 'macdBullish' },
  { id: 'darvas',    name: 'Darvas Scan',         category: 'Trend',    description: 'Within 10% of the 52-week high on rising volume.', rule: 'darvas' },
  { id: 'bearish',   name: 'Bearish Crossovers',  category: 'Trend',    description: '50-day MA cuts the 200-day MA from above.', rule: 'bearishCross' },
  { id: 'volume',    name: 'Price · Volume Action', category: 'Volume', description: 'Weekly volume up more than 5× with positive price action.', rule: 'volumeSurge' },
  { id: 'magic',     name: 'Magic Formula',       category: 'Quality',  description: 'Greenblatt: combines earnings yield and return on capital.', rule: 'magicFormula' },
  { id: 'piotroski', name: 'Piotroski Scan',      category: 'Quality',  description: 'F-Score of 9 across profitability, leverage, and operations.', rule: 'piotroski' },
]

const TOOL_CATEGORY_COLOR: Record<FinTool['category'], string> = {
  Trend:    '#0369a1',
  Momentum: '#f59e0b',
  Volume:   '#6366f1',
  Quality:  '#0d9488',
}

function applyTool(rule: FinToolRule, pool: MoverRow[]): MoverRow[] {
  switch (rule) {
    case 'goldenCross':
    case 'macdBullish':
    case 'volumeSurge':
      return [...pool].filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 8)
    case 'bearishCross':
      return [...pool].filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 8)
    case 'rsiOversold':
      return [...pool].sort((a, b) => a.changePct - b.changePct).slice(0, 8)
    case 'darvas':
      return [...pool].sort((a, b) => b.changePct - a.changePct).slice(0, 6)
    case 'magicFormula':
    case 'piotroski':
      return [...pool].sort((a, b) => {
        const af = getFundamentals(a.ticker)
        const bf = getFundamentals(b.ticker)
        const ay = af.eps / Math.max(af.pe, 1)
        const by = bf.eps / Math.max(bf.pe, 1)
        return by - ay
      }).slice(0, 8)
  }
}

function FinFilterBar({ value, onChange, placeholder, ariaLabel }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  ariaLabel: string
}) {
  return (
    <div className="fin-filter-bar">
      <span className="fin-filter-bar__icon" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="search"
        className="fin-filter-bar__input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        enterKeyHint="search"
      />
      {value && (
        <button
          type="button"
          className="fin-filter-bar__clear"
          onClick={() => onChange('')}
          aria-label="Clear filter"
        >×</button>
      )}
    </div>
  )
}

function PropsScreen() {
  const open = useFund()
  const pool = useMemo(buildMoverPool, [])
  const [activeTool, setActiveTool] = useState<FinTool | null>(null)
  const [q, setQ] = useState('')

  const visibleTools = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return FIN_TOOLS
    return FIN_TOOLS.filter((t) =>
      t.name.toLowerCase().includes(needle) ||
      t.category.toLowerCase().includes(needle) ||
      t.description.toLowerCase().includes(needle),
    )
  }, [q])

  useEffect(() => {
    if (!activeTool) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveTool(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTool])

  const matches = activeTool ? applyTool(activeTool.rule, pool) : []

  return (
    <section className="fin-screen-page">
      <header className="fin-screen-page__head">
        <h2 className="fin-screen-page__title">Props</h2>
        <p className="fin-screen-page__sub">Apply screening tools and see the companies that match right now.</p>
      </header>

      <FinFilterBar
        value={q}
        onChange={setQ}
        placeholder="Filter tools — golden cross, RSI, magic formula…"
        ariaLabel="Filter screening tools"
      />

      {visibleTools.length === 0 ? (
        <div className="fin-filter-empty">
          No tools match <strong>"{q}"</strong>.
        </div>
      ) : (
      <ul className="props-grid">
        {visibleTools.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              className="prop-card"
              onClick={() => setActiveTool(t)}
              style={{ ['--prop-accent' as never]: TOOL_CATEGORY_COLOR[t.category] }}
            >
              <span className="prop-card__cat">{t.category}</span>
              <h4 className="prop-card__name">{t.name}</h4>
              <p className="prop-card__desc">{t.description}</p>
              <span className="prop-card__arrow" aria-hidden>→</span>
            </button>
          </li>
        ))}
      </ul>
      )}

      {activeTool && createPortal(
        <div className="prop-sheet" role="dialog" aria-modal="true" aria-label={`Matches for ${activeTool.name}`}>
          <div className="prop-sheet__head">
            <div className="prop-sheet__head-text">
              <span className="prop-sheet__cat" style={{ color: TOOL_CATEGORY_COLOR[activeTool.category] }}>{activeTool.category}</span>
              <h3 className="prop-sheet__name">{activeTool.name}</h3>
              <p className="prop-sheet__desc">{activeTool.description}</p>
              <p className="prop-sheet__count">{matches.length} matches</p>
            </div>
            <button type="button" className="prop-sheet__close" aria-label="Close" onClick={() => setActiveTool(null)}>×</button>
          </div>
          <ul className="prop-sheet__results">
            {matches.map((m) => {
              const direction: ImpactArrow = m.changePct > 0 ? 'up' : m.changePct < 0 ? 'down' : 'flat'
              return (
                <li key={m.ticker} className={`prop-result prop-result--${direction}`}>
                  <button
                    type="button"
                    className="prop-result__btn"
                    onClick={() => { open?.(m.ticker); setActiveTool(null) }}
                  >
                    <CompanyLogo ticker={m.ticker} initials={m.initials} bg={m.bg} size={36} />
                    <span className="prop-result__id">
                      <span className="prop-result__sym">${m.ticker}</span>
                      <span className="prop-result__name">{m.name}</span>
                    </span>
                    <ImpactSparkline series={m.series} direction={direction} height={26} />
                    <span className={`prop-result__delta prop-result__delta--${direction}`}>
                      {m.changePct > 0 ? '+' : ''}{m.changePct.toFixed(1)}%
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>,
        document.body,
      )}
    </section>
  )
}

/* ── Learn screen ────────────────────────────────── */

type LearnRoadmap = {
  id: string
  title: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Specialist'
  hours: number
  summary: string
  accent: string
  courses: { id: string; title: string; minutes: number; lessons: number }[]
}

const LEARN_ROADMAPS: LearnRoadmap[] = [
  {
    id: 'foundations',
    title: 'Investing foundations',
    level: 'Beginner',
    hours: 6,
    summary: 'Build the mental model behind stocks, indices, and how exchanges actually work.',
    accent: '#0369a1',
    courses: [
      { id: 'f1', title: 'What is a stock, really?',   minutes: 18, lessons: 4 },
      { id: 'f2', title: 'How prices get set',         minutes: 22, lessons: 5 },
      { id: 'f3', title: 'Reading a ticker',           minutes: 14, lessons: 3 },
      { id: 'f4', title: 'Indices, ETFs, and funds',   minutes: 32, lessons: 6 },
    ],
  },
  {
    id: 'value',
    title: 'Value investing',
    level: 'Intermediate',
    hours: 9,
    summary: 'From Graham’s margin of safety to modern quality compounding.',
    accent: '#0d9488',
    courses: [
      { id: 'v1', title: 'Margin of safety',           minutes: 26, lessons: 5 },
      { id: 'v2', title: 'Reading a 10-K without dying', minutes: 38, lessons: 7 },
      { id: 'v3', title: 'DCF without lying to yourself', minutes: 44, lessons: 8 },
      { id: 'v4', title: 'Moats and quality businesses', minutes: 30, lessons: 6 },
    ],
  },
  {
    id: 'technical',
    title: 'Technical analysis',
    level: 'Intermediate',
    hours: 7,
    summary: 'Chart patterns, indicators, and how traders read the tape.',
    accent: '#f59e0b',
    courses: [
      { id: 't1', title: 'Candlestick basics',          minutes: 20, lessons: 4 },
      { id: 't2', title: 'Moving averages and crossovers', minutes: 24, lessons: 5 },
      { id: 't3', title: 'RSI, MACD, and momentum',     minutes: 28, lessons: 6 },
      { id: 't4', title: 'Support, resistance, breakouts', minutes: 32, lessons: 6 },
    ],
  },
  {
    id: 'macro',
    title: 'Macro and rates',
    level: 'Advanced',
    hours: 8,
    summary: 'How central bank policy, inflation, and currencies bend markets.',
    accent: '#6366f1',
    courses: [
      { id: 'm1', title: 'The yield curve, decoded',    minutes: 30, lessons: 5 },
      { id: 'm2', title: 'Why rate cuts move equities', minutes: 26, lessons: 5 },
      { id: 'm3', title: 'FX 101 for stock investors',  minutes: 22, lessons: 4 },
      { id: 'm4', title: 'Reading the Fed',             minutes: 38, lessons: 7 },
    ],
  },
  {
    id: 'crypto',
    title: 'Crypto and digital assets',
    level: 'Specialist',
    hours: 5,
    summary: 'Wallets, on-chain primitives, and how crypto interacts with traditional markets.',
    accent: '#dc2626',
    courses: [
      { id: 'c1', title: 'Wallets and custody',         minutes: 16, lessons: 4 },
      { id: 'c2', title: 'L1s, L2s, and rollups',       minutes: 28, lessons: 6 },
      { id: 'c3', title: 'Stablecoins and yield',       minutes: 22, lessons: 5 },
      { id: 'c4', title: 'Spot ETFs and on-chain flows',minutes: 24, lessons: 5 },
    ],
  },
]

function LearnScreen() {
  const [activeId, setActiveId] = useState<string>(LEARN_ROADMAPS[0].id)
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()

  const visibleRoadmaps = useMemo(() => {
    if (!needle) return LEARN_ROADMAPS
    return LEARN_ROADMAPS.filter((r) =>
      r.title.toLowerCase().includes(needle) ||
      r.level.toLowerCase().includes(needle) ||
      r.summary.toLowerCase().includes(needle) ||
      r.courses.some((c) => c.title.toLowerCase().includes(needle)),
    )
  }, [needle])

  useEffect(() => {
    if (visibleRoadmaps.length === 0) return
    if (!visibleRoadmaps.some((r) => r.id === activeId)) {
      setActiveId(visibleRoadmaps[0].id)
    }
  }, [visibleRoadmaps, activeId])

  const active = visibleRoadmaps.find((r) => r.id === activeId) ?? visibleRoadmaps[0] ?? null
  const visibleCourses = needle && active
    ? active.courses.filter((c) => c.title.toLowerCase().includes(needle) || active.title.toLowerCase().includes(needle))
    : active?.courses ?? []

  return (
    <section className="fin-screen-page">
      <header className="fin-screen-page__head">
        <h2 className="fin-screen-page__title">Learn</h2>
        <p className="fin-screen-page__sub">Pick a roadmap, follow the lessons. Hands-on courses with worked examples.</p>
      </header>

      <FinFilterBar
        value={q}
        onChange={setQ}
        placeholder="Search roadmaps and courses…"
        ariaLabel="Search learn content"
      />

      {visibleRoadmaps.length === 0 ? (
        <div className="fin-filter-empty">
          Nothing in Learn matches <strong>"{q}"</strong>.
        </div>
      ) : (
        <>
          <ul className="learn-roadmaps">
            {visibleRoadmaps.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`learn-roadmap${activeId === r.id ? ' learn-roadmap--active' : ''}`}
                  onClick={() => setActiveId(r.id)}
                  style={{ ['--learn-accent' as never]: r.accent }}
                >
                  <span className="learn-roadmap__level">{r.level}</span>
                  <h4 className="learn-roadmap__title">{r.title}</h4>
                  <p className="learn-roadmap__summary">{r.summary}</p>
                  <p className="learn-roadmap__meta">{r.hours}h · {r.courses.length} courses</p>
                </button>
              </li>
            ))}
          </ul>

          {active && (
            <div
              className="learn-courses"
              style={{ ['--learn-accent' as never]: active.accent }}
            >
              <div className="learn-courses__head">
                <span className="learn-courses__eyebrow">Roadmap</span>
                <h3 className="learn-courses__title">{active.title}</h3>
              </div>
              <ol className="learn-courses__list">
                {visibleCourses.map((c, i) => (
                  <li key={c.id} className="learn-course">
                    <span className="learn-course__num">{String(i + 1).padStart(2, '0')}</span>
                    <div className="learn-course__body">
                      <h4 className="learn-course__title">{c.title}</h4>
                      <p className="learn-course__meta">{c.lessons} lessons · {c.minutes} min</p>
                    </div>
                    <button type="button" className="learn-course__btn" aria-label={`Start ${c.title}`}>Start</button>
                  </li>
                ))}
                {visibleCourses.length === 0 && (
                  <li className="learn-course learn-course--empty">No matching lessons in this roadmap.</li>
                )}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function FinanceScreen() {
  const [finTab, setFinTab] = useState<FinTab>('home')
  const [exchange, setExchange] = useState<FinExchange>(FIN_EXCHANGES[0])
  const [showExchangeSheet, setShowExchangeSheet] = useState(false)
  const [drawerSym, setDrawerSym] = useState<string | null>(null)
  const [activeArticle, setActiveArticle] = useState<StockArticle | null>(null)
  const [activeTip, setActiveTip] = useState<ProTip | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showNewsImages, setShowNewsImages] = useState(true)

  const openTicker = useCallback((s: string) => setDrawerSym(s), [])
  const openArticle = useCallback((a: StockArticle) => setActiveArticle(a), [])
  const openTip = useCallback((t: ProTip) => setActiveTip(t), [])

  useEffect(() => {
    try {
      if (!localStorage.getItem('nm_finance_guide_seen')) {
        setShowGuide(true)
        localStorage.setItem('nm_finance_guide_seen', '1')
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <ProTipCtx.Provider value={openTip}>
    <ArticleCtx.Provider value={openArticle}>
    <FundCtx.Provider value={openTicker}>
    <NewsImagesCtx.Provider value={{ show: showNewsImages, setShow: setShowNewsImages }}>
      <section className="finance-screen" aria-label="Finance">
        {finTab === 'home' && (
          <>
            <div className="finance-toolbar">
              <button
                type="button"
                className="finance-exchange-pill"
                onClick={() => setShowExchangeSheet(true)}
                aria-label={`Exchange: ${exchange.name}. Tap to change.`}
              >
                <span className="finance-exchange-pill__short">{exchange.short}</span>
                <span className="finance-exchange-pill__name">{exchange.name}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="fin-search-trigger"
                onClick={() => setFinTab('search')}
                aria-label="Open search"
              >
                <span className="fin-search-trigger__icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <span className="fin-search-trigger__text">Search markets, tickers…</span>
              </button>
            </div>

            <MarketMovers />
            <EconomicPulse />
            <SectorHealth />
            <IndustryMovers />
            <NewsConnections />
            <ReturnEstimator />
            <ProTips />

            <div className="finance-settings">
              <div className="finance-settings__head">
                <h3>Display settings</h3>
              </div>
              <div className="fin-switch-row">
                <span className="fin-switch__label">Show news thumbnails</span>
                <button
                  type="button"
                  className={`fin-switch${showNewsImages ? ' fin-switch--on' : ''}`}
                  onClick={() => setShowNewsImages(!showNewsImages)}
                  aria-pressed={showNewsImages}
                >
                  <span className="fin-switch__slider" />
                </button>
              </div>
            </div>
          </>
        )}

        {finTab === 'list'   && <WatchlistsScreen />}
        {finTab === 'search' && <FinSearchScreen />}
        {finTab === 'props'  && <PropsScreen />}
        {finTab === 'learn'  && <LearnScreen />}
      </section>

      {finTab === 'home' && <FinanceFab onOpenGuide={() => setShowGuide(true)} />}
      <FinanceTabbar active={finTab} onChange={setFinTab} />

      {showExchangeSheet && (
        <ExchangeSheet
          selected={exchange}
          onSelect={setExchange}
          onClose={() => setShowExchangeSheet(false)}
        />
      )}
      <StockDetailScreen symbol={drawerSym} onClose={() => setDrawerSym(null)} onOpenRelated={(sym) => setDrawerSym(sym)} />
    </NewsImagesCtx.Provider>
    </FundCtx.Provider>
    <ArticleDetailScreen article={activeArticle} onClose={() => setActiveArticle(null)} />
    </ArticleCtx.Provider>
    <ProTipDetailScreen tip={activeTip} onClose={() => setActiveTip(null)} />
    {showGuide && <FinanceGuide onClose={() => setShowGuide(false)} />}
    </ProTipCtx.Provider>
  )
}

/* ── Categories page datasets ─────────────────────── */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  world: "Global dispatches, critical updates, and perspectives from every corner.",
  business: "Corporate strategies, market shakeups, and the future of enterprise.",
  technology: "Deep-dives into AI, hardware breakthroughs, and digital sovereignty.",
  sports: "Tactical breakdowns, tournament records, and player stories.",
  science: "From quantum anomalies to molecular engineering breakthroughs.",
  health: "Wellness science, medical breakthroughs, and longevity protocols.",
  arts: "Curated movements in photography, heritage, and modern literature.",
  entertainment: "Streaming battles, silver screen reviews, and box office trends.",
  travel: "Sustainable journeys, hidden destinations, and aviation policy.",
  food: "Fine dining innovations, culinary heritage, and food systems.",
  politics: "Policy debates, electoral counts, and voter sentiment shifts.",
  education: "EdTech evolution, university research, and student policies.",
  finance: "Market updates, crypto volatility, and macroeconomic shifts.",
  space: "Mars colonization efforts, satellite arrays, and exoplanet searches.",
  climate: "Carbon capture models, clean grids, and ecological policies.",
  gaming: "Console wars, esports rankings, and indie developers in focus.",
}

const SUB_CATEGORIES: Record<string, string[]> = {
  world: ['Global Trade', 'Diplomacy', 'Europe', 'Asia-Pacific', 'Middle East', 'Americas', 'Africa', 'United Nations', 'Geopolitics', 'Human Rights', 'Global Health', 'Conflict Zones', 'Alliances', 'Foreign Aid', 'Borders'],
  business: ['Startups', 'Retail & Consumer', 'M&A', 'Real Estate', 'Gig Economy', 'Regulation', 'E-commerce', 'Supply Chains', 'Corporate Governance', 'Productivity', 'Marketing', 'Logistics', 'Enterprise Tech', 'Labor Unions', 'Franchising'],
  technology: ['Artificial Intelligence', 'Cybersecurity', 'Semiconductors', 'SaaS', 'Web3', 'Gadgets', 'Quantum Computing', 'Cloud Infrastructure', 'Robotics', 'Virtual Reality', 'Biotechnology', 'Telecommunications', 'Open Source', 'Data Privacy', 'Green Tech'],
  sports: ['Football / Soccer', 'Basketball', 'Motorsport & F1', 'Tennis', 'Athletics', 'Golf', 'Cricket', 'Baseball', 'American Football', 'Olympics', 'Extreme Sports', 'Sports Analytics', 'Esports', 'Nutrition & Training', 'Rugby'],
  science: ['Space Exploration', 'Biotech', 'Genetics', 'Neuroscience', 'Quantum Physics', 'Climate Science', 'Evolutionary Biology', 'Chemistry', 'Astronomy', 'Material Science', 'Paleontology', 'Oceanography', 'Mathematics', 'Particle Physics', 'Virology'],
  health: ['Wellness & Mind', 'Nutrition', 'Public Health', 'Longevity', 'Mental Health', 'Medical Tech', 'Fitness & Training', 'Sleep Science', 'Preventative Care', 'Pharmaceuticals', 'Pediatrics', 'Chronic Illness', 'Biohacking', 'Alternative Medicine', 'Dental Care'],
  arts: ['Modern Art', 'Literature', 'Theater & Stage', 'Photography', 'Architecture', 'Heritage', 'Sculpture', 'Design & Typography', 'Art History', 'Classical Music', 'Museums', 'Performing Arts', 'Galleries', 'Poetry', 'Cultural Festivals'],
  entertainment: ['Streaming Wars', 'Box Office', 'Pop Music', 'Celebrity Culture', 'Indie Cinema', 'Gaming Industry', 'Podcasting', 'Television', 'Anime & Manga', 'Live Concerts', 'Standup Comedy', 'Film Festivals', 'Award Shows', 'Reality TV', 'Vlogging'],
  travel: ['Eco Tourism', 'Hotels & Resorts', 'Adventure Travel', 'Airline News', 'Solo Journeys', 'City Guides', 'Backpacking', 'Luxury Travel', 'Cruises', 'Road Trips', 'Travel Gear', 'Visa & Customs', 'Train Travel', 'Heritage Sites', 'Hidden Gems'],
  food: ['Café Culture', 'Fine Dining', 'Baking & Pastry', 'Wine & Spirits', 'Street Food', 'Food Systems', 'Craft Beer', 'Vegan & Plant-Based', 'Recipes', 'Food Science', 'Cooking Tech', 'Agriculture', 'Sweets & Desserts', 'Mixology', 'Seafood'],
  politics: ['Elections 2026', 'Federal Policy', 'Supreme Court', 'Foreign Affairs', 'State Legislate', 'Voter Sentiment', 'Campaign Finance', 'Lobbying', 'Public Opinion', 'Civil Liberties', 'Local Councils', 'Immigration Policy', 'Trade Policies', 'Bipartisanship', 'Political Theory'],
  education: ['EdTech', 'Higher Education', 'Alternative Schools', 'Student Debt', 'Early Learning', 'STEM', 'K-12 Education', 'Online Learning', 'Language Studies', 'Vocational Training', 'Academic Research', 'Special Education', 'Public Schools', 'Scholarships', 'Homeschooling'],
  finance: ['Stock Markets', 'Cryptocurrency', 'Personal Finance', 'Venture Capital', 'Interest Rates', 'Banking News', 'Commodities', 'Real Estate Investing', 'Taxation', 'Retirement Planning', 'Exchange Rates', 'Fintech', 'Central Banks', 'Mutual Funds', 'Insurance'],
  space: ['Mars Missions', 'Commercial Spaceflight', 'Astrophotography', 'Exoplanets', 'Satellite Constellations', 'Deep Space', 'Lunar Bases', 'Asteroid Mining', 'Rocket Tech', 'Astronaut Training', 'Space Law', 'Cosmology', 'Space Telescopes', 'Astrobiology', 'Space Debris'],
  climate: ['Carbon Capture', 'Electric Vehicles', 'Renewables', 'Extreme Weather', 'Policy & Subsidies', 'Conservation', 'Solar Technology', 'Wind Power', 'Ocean Conservation', 'Reforestation', 'Biodiversity', 'Green Hydrogen', 'Circular Economy', 'Grid Modernization', 'Climate Activism'],
  gaming: ['Esports', 'Console Wars', 'Indie Spotlights', 'Mobile Gaming', 'PC Hardware', 'Game Engines', 'Retro Gaming', 'Virtual Reality', 'Board Games', 'Streamers & Creators', 'Speedrunning', 'Game Design', 'RPG & MMO', 'FPS & Strategy', 'Clubs & Communities'],
}

const CATEGORY_TAGS = [
  { id: 'all', name: '✨ All' },
  { id: 'trending-ai', name: '🔥 AI & Tech', categoryId: 'technology', isTrending: true },
  { id: 'trending-climate', name: '⚡️ Clean Energy', categoryId: 'climate', isTrending: true },
  { id: 'trending-finance', name: '📈 Inflation', categoryId: 'finance', isTrending: true },
  { id: 'trending-sports', name: '⚽️ World Cup', categoryId: 'sports', isTrending: true },
  { id: 'trending-space', name: '🪐 Space Exploration', categoryId: 'space', isTrending: true },
  { id: 'world', name: 'World', categoryId: 'world' },
  { id: 'business', name: 'Business', categoryId: 'business' },
  { id: 'technology', name: 'Technology', categoryId: 'technology' },
  { id: 'sports', name: 'Sports', categoryId: 'sports' },
  { id: 'science', name: 'Science', categoryId: 'science' },
  { id: 'health', name: 'Health', categoryId: 'health' },
  { id: 'arts', name: 'Arts & Culture', categoryId: 'arts' },
  { id: 'entertainment', name: 'Entertainment', categoryId: 'entertainment' },
  { id: 'travel', name: 'Travel', categoryId: 'travel' },
  { id: 'food', name: 'Food & Drink', categoryId: 'food' },
  { id: 'politics', name: 'Politics', categoryId: 'politics' },
  { id: 'education', name: 'Education', categoryId: 'education' },
  { id: 'finance', name: 'Finance', categoryId: 'finance' },
  { id: 'space', name: 'Space', categoryId: 'space' },
  { id: 'climate', name: 'Climate', categoryId: 'climate' },
  { id: 'gaming', name: 'Gaming', categoryId: 'gaming' },
]

/* ── Categories page ──────────────────────────────── */
function CategoriesPage() {
  const [query, setQuery] = useState('')
  const [activeTagId, setActiveTagId] = useState('all')
  const [popoverCategory, setPopoverCategory] = useState<Category | null>(null)
  const [subQuery, setSubQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 2000)
      return () => clearTimeout(t)
    }
  }, [toastMessage])

  // Get active category ID from tag
  const activeTag = CATEGORY_TAGS.find(t => t.id === activeTagId)
  const activeCategoryIdFromTag = activeTag?.categoryId || null

  const filtered = useMemo(() => {
    return CATEGORIES.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(query.toLowerCase())
      const matchesTag = !activeCategoryIdFromTag || c.id === activeCategoryIdFromTag
      return matchesSearch && matchesTag
    })
  }, [query, activeCategoryIdFromTag])

  // Handle clicking on a category tile
  const handleCategoryClick = (cat: Category) => {
    setPopoverCategory(cat)
    setSubQuery('') // Reset sub query when opening new category
  }

  // Handle clicking a tag
  const handleTagClick = (tagId: string, categoryId?: string) => {
    setActiveTagId(tagId)
    setPopoverCategory(null)
    setSubQuery('')
    
    // Automatically trigger popover on tag click
    if (categoryId) {
      const cat = CATEGORIES.find(c => c.id === categoryId)
      if (cat) {
        setTimeout(() => {
          setPopoverCategory(cat)
          setSubQuery('')
        }, 100)
      }
    }
  }

  const handleSubCategoryClick = (categoryName: string, subName: string) => {
    setToastMessage(`Exploring ${subName} under ${categoryName}...`)
  }

  const filteredSubCategories = useMemo(() => {
    if (!popoverCategory) return []
    const list = SUB_CATEGORIES[popoverCategory.id] || []
    return list.filter(sub => sub.toLowerCase().includes(subQuery.toLowerCase()))
  }, [popoverCategory, subQuery])

  return (
    <section className="cat-page">
      {/* Top Search Row */}
      <div className="cat-header-actions">
        <div className="cat-search-wrap">
          <span className="cat-search-icon" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            className="cat-search"
            type="search"
            placeholder="Search categories…"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              if (activeTagId !== 'all') setActiveTagId('all')
            }}
            aria-label="Search categories"
          />
        </div>
      </div>

      {/* Horizontal Scrollable Tags Panel */}
      <div className="cat-tags-panel">
        {CATEGORY_TAGS.map(tag => {
          const isActive = tag.id === activeTagId
          return (
            <button
              key={tag.id}
              type="button"
              className={`cat-tag-btn ${isActive ? 'cat-tag-btn--active' : ''} ${tag.isTrending ? 'cat-tag-btn--trending' : ''}`}
              onClick={() => handleTagClick(tag.id, tag.categoryId)}
            >
              {tag.name}
            </button>
          )
        })}
      </div>

      {/* Categories Grid */}
      <div className="cat-grid">
        {filtered.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`cat-tile cat-tile--${cat.size}`}
            aria-label={cat.name}
            onClick={() => handleCategoryClick(cat)}
          >
            <img src={cat.img} alt="" className="cat-tile__img" loading="lazy" />
            <div className="cat-tile__overlay" aria-hidden />
            <span className="cat-tile__name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Popover Bottom Sheet Drawer */}
      {popoverCategory && (
        <div className="cat-backdrop" onClick={() => setPopoverCategory(null)}>
          <div className="cat-sheet" onClick={e => e.stopPropagation()}>
            <div className="cat-sheet__handle-wrap" onClick={() => setPopoverCategory(null)}>
              <div className="cat-sheet__handle" />
            </div>
            
            <div className="cat-sheet__content">
              <div className="cat-sheet__header">
                <div className="cat-sheet__title-group">
                  <h3 className="cat-sheet__title">{popoverCategory.name}</h3>
                  <p className="cat-sheet__desc">{CATEGORY_DESCRIPTIONS[popoverCategory.id]}</p>
                </div>
                <button
                  type="button"
                  className="cat-sheet__close"
                  onClick={() => setPopoverCategory(null)}
                  aria-label="Close drawer"
                >
                  <IconClose />
                </button>
              </div>

              {/* Sub-Category Search Input */}
              <div className="cat-sheet__search-wrap">
                <span className="cat-sheet__search-icon" aria-hidden>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  className="cat-sheet__search"
                  type="search"
                  placeholder={`Search ${popoverCategory.name} sub-categories…`}
                  value={subQuery}
                  onChange={e => setSubQuery(e.target.value)}
                  aria-label={`Search ${popoverCategory.name} sub-categories`}
                />
                {subQuery && (
                  <button
                    type="button"
                    className="cat-sheet__search-clear"
                    onClick={() => setSubQuery('')}
                    aria-label="Clear sub-category search"
                  >
                    <IconClose />
                  </button>
                )}
              </div>

              <div className="cat-sheet__image-container">
                <img src={popoverCategory.img} alt="" className="cat-sheet__img" />
                <div className="cat-sheet__img-overlay" />
              </div>

              {filteredSubCategories.length > 0 ? (
                <div className="cat-sheet__sub-grid">
                  {filteredSubCategories.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      className="cat-sheet__chip"
                      onClick={() => handleSubCategoryClick(popoverCategory.name, sub)}
                    >
                      <span>{sub}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="cat-sheet__empty">
                  <span>No sub-categories match "{subQuery}"</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transient Micro-Toast Notification */}
      {toastMessage && (
        <div className="cat-toast" role="status">
          <span className="cat-toast__icon">✨</span>
          <span className="cat-toast__message">{toastMessage}</span>
        </div>
      )}
    </section>
  )
}

/* ── Reaction bar ─────────────────────────────────── */
type Refinement = { id: string; label: string }

const REACTION_REFINEMENTS: Record<TagId, { like: Refinement[]; dislike: Refinement[] }> = {
  World: {
    like: [
      { id: 'ground',  label: 'On-the-ground reporting' },
      { id: 'maps',    label: 'Maps & data' },
      { id: 'history', label: 'Historical context' },
      { id: 'voices',  label: 'Voices affected' },
    ],
    dislike: [
      { id: 'distant',    label: 'Feels too distant' },
      { id: 'covered',    label: 'Already covered' },
      { id: 'jargon',     label: 'Too much jargon' },
      { id: 'unbalanced', label: 'Lacks balance' },
    ],
  },
  Politics: {
    like: [
      { id: 'policy',   label: 'Policy detail' },
      { id: 'voter',    label: 'Voter angle' },
      { id: 'analysis', label: 'Cross-bench analysis' },
      { id: 'decider',  label: 'Who decides what' },
    ],
    dislike: [
      { id: 'partisan',    label: 'Too partisan' },
      { id: 'speculation', label: 'Speculation-heavy' },
      { id: 'inside',      label: 'Inside-baseball' },
      { id: 'old',         label: 'Old news' },
    ],
  },
  Sports: {
    like: [
      { id: 'tactics',  label: 'Tactical breakdown' },
      { id: 'profile',  label: 'Player profiles' },
      { id: 'stats',    label: 'Stats deep-dive' },
      { id: 'offfield', label: 'Off-field stories' },
    ],
    dislike: [
      { id: 'matchbymatch', label: 'Match-by-match focus' },
      { id: 'hype',         label: 'Too much hype' },
      { id: 'lightstats',   label: 'Light on stats' },
      { id: 'roster',       label: 'Roster news only' },
    ],
  },
  Tech: {
    like: [
      { id: 'handson', label: 'Hands-on detail' },
      { id: 'impact',  label: 'Industry impact' },
      { id: 'founder', label: 'Founder/team angle' },
      { id: 'bench',   label: 'Benchmarks' },
    ],
    dislike: [
      { id: 'toodeep',     label: 'Too technical' },
      { id: 'covered',     label: 'Already covered' },
      { id: 'speculative', label: 'Speculative' },
      { id: 'vendor',      label: 'Vendor-heavy' },
    ],
  },
}

function refinementLabel(tag: TagId, reaction: 'like' | 'dislike', id: string): string | null {
  const list = REACTION_REFINEMENTS[tag][reaction]
  return list.find((r) => r.id === id)?.label ?? null
}

type ReactionPhase = 'ask' | 'success' | 'refine' | 'done'

function ReactionBar({ story, getReaction, setReaction, getRefinement, setRefinement }: {
  story: Story
  getReaction: (id: string) => Reaction
  setReaction: (id: string, r: Reaction) => void
  getRefinement: (id: string) => string | null
  setRefinement: (id: string, key: string | null) => void
}) {
  const reaction = getReaction(story.id)
  const refinement = getRefinement(story.id)

  // Initial phase: collapsed if a reaction was previously recorded, else open
  const computeInitialPhase = (): ReactionPhase => (reaction == null ? 'ask' : 'done')
  const [phase, setPhase] = useState<ReactionPhase>(computeInitialPhase)

  // Reset transient phase when navigating between stories
  const lastStoryRef = useRef<string>(story.id)
  useEffect(() => {
    if (lastStoryRef.current !== story.id) {
      lastStoryRef.current = story.id
      setPhase(reaction == null ? 'ask' : 'done')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id])

  // Auto-advance from 'success' to 'refine' after a short beat
  useEffect(() => {
    if (phase !== 'success') return
    const t = setTimeout(() => setPhase('refine'), 700)
    return () => clearTimeout(t)
  }, [phase])

  const choose = (r: 'like' | 'dislike') => {
    if (reaction === r) {
      // Clicking the same chip again — clear and reset
      setReaction(story.id, null)
      setPhase('ask')
      return
    }
    setReaction(story.id, r)
    setPhase('success')
  }

  const pickRefinement = (key: string) => {
    setRefinement(story.id, key)
    setPhase('done')
  }

  const skipRefinement = () => {
    setRefinement(story.id, null)
    setPhase('done')
  }

  const reset = () => {
    setReaction(story.id, null)
    setPhase('ask')
  }

  const refineOptions = reaction
    ? REACTION_REFINEMENTS[story.tag][reaction]
    : []

  const doneLabel = reaction
    ? (reaction === 'like' ? 'More like this' : 'Less like this')
    : ''
  const doneRefineLabel =
    reaction && refinement ? refinementLabel(story.tag, reaction, refinement) : null

  return (
    <div className="reaction-bar">
      {phase === 'ask' && (
        <div className="reaction-bar__phase reaction-bar__phase--ask">
          <p className="reaction-label">Was this relevant to you?</p>
          <div className="reaction-btns">
            <button
              type="button"
              className={`reaction-btn${reaction === 'like' ? ' reaction-btn--like-active' : ''}`}
              onClick={() => choose('like')}
              aria-label="More like this"
              aria-pressed={reaction === 'like'}
            >
              <IconThumbUp filled={reaction === 'like'} />
              <span>More like this</span>
            </button>
            <button
              type="button"
              className={`reaction-btn${reaction === 'dislike' ? ' reaction-btn--dislike-active' : ''}`}
              onClick={() => choose('dislike')}
              aria-label="Less like this"
              aria-pressed={reaction === 'dislike'}
            >
              <IconThumbDown filled={reaction === 'dislike'} />
              <span>Less like this</span>
            </button>
          </div>
        </div>
      )}

      {phase === 'success' && reaction && (
        <div
          className={`reaction-bar__phase reaction-bar__phase--success reaction-bar__phase--success-${reaction}`}
          role="status"
          aria-live="polite"
        >
          <span className="reaction-bar__check" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 12 10 17 19 7" />
            </svg>
          </span>
          <p className="reaction-bar__msg">
            {reaction === 'like' ? 'Got it — more like this' : 'Got it — less like this'}
          </p>
        </div>
      )}

      {phase === 'refine' && reaction && (
        <div className="reaction-bar__phase reaction-bar__phase--refine">
          <p className="reaction-label">
            {reaction === 'like' ? 'What stood out?' : 'What put you off?'}
          </p>
          <div className="reaction-refine-options" role="group">
            {refineOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`reaction-refine-chip reaction-refine-chip--${reaction}`}
                onClick={() => pickRefinement(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button type="button" className="reaction-bar__skip" onClick={skipRefinement}>
            Skip
          </button>
        </div>
      )}

      {phase === 'done' && reaction && (
        <div className={`reaction-bar__phase reaction-bar__phase--done reaction-bar__phase--done-${reaction}`}>
          <span className="reaction-bar__check reaction-bar__check--sm" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="5 12 10 17 19 7" />
            </svg>
          </span>
          <p className="reaction-bar__done-text">
            <span className="reaction-bar__done-primary">{doneLabel}</span>
            {doneRefineLabel && (
              <>
                <span className="reaction-bar__done-sep" aria-hidden> · </span>
                <span className="reaction-bar__done-refine">{doneRefineLabel}</span>
              </>
            )}
          </p>
          <button type="button" className="reaction-bar__change" onClick={reset}>
            Change
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Comments section ─────────────────────────────── */
function CommentAvatar({ initials, size = 'md' }: { initials: string; size?: 'md' | 'sm' }) {
  return <div className={`cmt-avatar cmt-avatar--${size}`}>{initials}</div>
}

function CommentsSection({ storyId }: { storyId: string }) {
  const { comments, addComment, addReply } = useComments(storyId)
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const submitComment = () => {
    const t = draft.trim()
    if (!t) return
    addComment(t)
    setDraft('')
  }

  const submitReply = (commentId: string) => {
    const t = (replyDrafts[commentId] ?? '').trim()
    if (!t) return
    addReply(commentId, t)
    setReplyDrafts((p) => ({ ...p, [commentId]: '' }))
    setReplyTo(null)
  }

  return (
    <section className="comments-section">
      <h3 className="comments-heading">
        Comments
        {comments.length > 0 && <span className="comments-count">{comments.length}</span>}
      </h3>

      {/* compose */}
      <div className="cmt-compose">
        <CommentAvatar initials="Y" />
        <div className="cmt-compose__input-wrap">
          <textarea
            className="cmt-input"
            placeholder="Add a comment…"
            value={draft}
            rows={1}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
          />
          {draft.trim() && (
            <button type="button" className="cmt-send-btn" onClick={submitComment} aria-label="Post comment">
              <IconSend />
            </button>
          )}
        </div>
      </div>

      {comments.length === 0 && (
        <p className="comments-empty">Be the first to comment on this story.</p>
      )}

      <ul className="cmt-list">
        {comments.map((c) => (
          <li key={c.id} className="cmt-item">
            <CommentAvatar initials={c.initials} />
            <div className="cmt-item__body">
              <div className="cmt-item__header">
                <span className="cmt-author">{c.author}</span>
                <span className="cmt-time">{formatBookmarkTime(c.timestamp)}</span>
              </div>
              <p className="cmt-text">{c.text}</p>
              <button
                type="button"
                className={`cmt-reply-trigger${replyTo === c.id ? ' cmt-reply-trigger--active' : ''}`}
                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              >
                <IconReply /> Reply
              </button>

              {/* threaded replies */}
              {(c.replies.length > 0 || replyTo === c.id) && (
                <ul className="cmt-replies">
                  {c.replies.map((r) => (
                    <li key={r.id} className="cmt-reply">
                      <CommentAvatar initials={r.initials} size="sm" />
                      <div className="cmt-item__body">
                        <div className="cmt-item__header">
                          <span className="cmt-author">{r.author}</span>
                          <span className="cmt-time">{formatBookmarkTime(r.timestamp)}</span>
                        </div>
                        <p className="cmt-text">{r.text}</p>
                      </div>
                    </li>
                  ))}

                  {replyTo === c.id && (
                    <li className="cmt-reply cmt-reply--compose">
                      <CommentAvatar initials="Y" size="sm" />
                      <div className="cmt-compose__input-wrap">
                        <input
                          className="cmt-input cmt-input--reply"
                          placeholder="Write a reply…"
                          value={replyDrafts[c.id] ?? ''}
                          onChange={(e) => setReplyDrafts((p) => ({ ...p, [c.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitReply(c.id) }}
                          autoFocus
                        />
                        {(replyDrafts[c.id] ?? '').trim() && (
                          <button type="button" className="cmt-send-btn" onClick={() => submitReply(c.id)} aria-label="Post reply">
                            <IconSend />
                          </button>
                        )}
                      </div>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BookmarksList({
  bookmarks,
  onOpenStory,
  onRemove,
}: {
  bookmarks: Bookmark[]
  onOpenStory: (story: Story, scrollTo?: TextBookmarkSelection) => void
  onRemove: (id: string) => void
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="bm-empty">
        <div className="bm-empty__icon" aria-hidden>
          <IconBookmarkOutline />
        </div>
        <p className="bm-empty__title">No bookmarks yet</p>
        <p className="bm-empty__sub">
          Tap the bookmark icon while reading an article, or select text to save a passage.
        </p>
      </div>
    )
  }

  return (
    <ul className="bm-list">
      {bookmarks.map((bm) => (
        <li key={bm.id} className="bm-item">
          <button
            type="button"
            className="bm-item__body"
            onClick={() => onOpenStory(
              storyFromBookmark(bm),
              bm.selectedText
                ? {
                    selectedText: bm.selectedText,
                    paragraphIndex: bm.paragraphIndex,
                    startOffset: bm.startOffset,
                  }
                : undefined,
            )}
            aria-label={`Open article: ${bm.storyTitle}`}
          >
            <img src={bm.storyImage} alt="" className="bm-item__img" loading="lazy" />
            <div className="bm-item__content">
              <ArticleTag tag={bm.storyTag} />
              <p className="bm-item__title">{bm.storyTitle}</p>
              {bm.selectedText ? (
                <blockquote className="bm-item__quote">"{bm.selectedText}"</blockquote>
              ) : (
                <p className="bm-item__dek">{bm.storyDek}</p>
              )}
              <span className="bm-item__meta">{formatBookmarkTime(bm.savedAt)}</span>
            </div>
          </button>
          <button
            type="button"
            className="bm-item__remove"
            onClick={() => onRemove(bm.id)}
            aria-label="Remove bookmark"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

/* ── Region selector sheet ───────────────────────── */
function RegionSheet({
  selected,
  onSelect,
  onClose,
}: {
  selected: Region
  onSelect: (r: Region) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => REGIONS.filter(r => r.name.toLowerCase().includes(query.toLowerCase())),
    [query]
  )
  return (
    <div className="region-backdrop" role="dialog" aria-modal aria-label="Select region" onClick={onClose}>
      <div className="region-sheet" onClick={e => e.stopPropagation()}>
        <div className="region-sheet__handle" aria-hidden />
        <div className="region-sheet__head">
          <h3 className="region-sheet__title">Select Region</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="region-sheet__search-wrap">
          <span className="region-sheet__search-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            className="region-search"
            type="search"
            placeholder="Search countries…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search countries"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
        <ul className="region-list" role="listbox">
          {filtered.map(r => (
            <li key={r.code} role="option" aria-selected={r.code === selected.code}>
              <button
                type="button"
                className={`region-item${r.code === selected.code ? ' region-item--active' : ''}`}
                onClick={() => { onSelect(r); onClose() }}
              >
                <span className="region-item__flag"><RegionFlag code={r.code} size={20} /></span>
                <span className="region-item__name">{r.name}</span>
                {r.code === selected.code && (
                  <svg className="region-item__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ——————————————————————————————————————
   Themes — default / vintage / custom / anime / cartoon
—————————————————————————————————————— */
type ThemeId = 'default' | 'vintage' | 'custom' | 'anime' | 'cartoon'

type CustomPalette = {
  id: string
  name: string
  bg: string
  surface: string
  text: string
  textMuted: string
  blue: string
  blueSoft: string
  border: string
}

const CUSTOM_PALETTES: CustomPalette[] = [
  { id: 'ocean',  name: 'Ocean Breeze',  bg: '#f0f9ff', surface: '#e0f2fe', text: '#0c4a6e', textMuted: '#0369a1', blue: '#0284c7', blueSoft: '#bae6fd', border: '#bae6fd' },
  { id: 'forest', name: 'Forest Calm',   bg: '#f0fdf4', surface: '#dcfce7', text: '#14532d', textMuted: '#166534', blue: '#16a34a', blueSoft: '#bbf7d0', border: '#bbf7d0' },
  { id: 'rose',   name: 'Rose Quartz',   bg: '#fff1f2', surface: '#ffe4e6', text: '#881337', textMuted: '#9f1239', blue: '#e11d48', blueSoft: '#fecdd3', border: '#fecdd3' },
  { id: 'amber',  name: 'Amber Glow',    bg: '#fffbeb', surface: '#fef3c7', text: '#78350f', textMuted: '#92400e', blue: '#d97706', blueSoft: '#fde68a', border: '#fde68a' },
  { id: 'lilac',  name: 'Lilac Dream',   bg: '#faf5ff', surface: '#f3e8ff', text: '#581c87', textMuted: '#7c3aed', blue: '#9333ea', blueSoft: '#e9d5ff', border: '#e9d5ff' },
  { id: 'slate',  name: 'Midnight Slate', bg: '#0f172a', surface: '#1e293b', text: '#f1f5f9', textMuted: '#94a3b8', blue: '#38bdf8', blueSoft: '#0c4a6e', border: '#334155' },
]

const THEME_KEY = 'nm_theme_v1'
const PALETTE_KEY = 'nm_palette_v1'

function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'default' || saved === 'vintage' || saved === 'custom' || saved === 'anime' || saved === 'cartoon') return saved
    } catch { /* ignore */ }
    return 'default'
  })
  const [paletteId, setPaletteIdState] = useState<string>(() => {
    try { return localStorage.getItem(PALETTE_KEY) ?? CUSTOM_PALETTES[0].id } catch { return CUSTOM_PALETTES[0].id }
  })

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    if (theme === 'custom') {
      const p = CUSTOM_PALETTES.find((x) => x.id === paletteId) ?? CUSTOM_PALETTES[0]
      root.style.setProperty('--bg', p.bg)
      root.style.setProperty('--surface', p.surface)
      root.style.setProperty('--text', p.text)
      root.style.setProperty('--text-muted', p.textMuted)
      root.style.setProperty('--blue', p.blue)
      root.style.setProperty('--blue-soft', p.blueSoft)
      root.style.setProperty('--border', p.border)
      root.dataset.palette = p.id
    } else {
      root.style.removeProperty('--bg')
      root.style.removeProperty('--surface')
      root.style.removeProperty('--text')
      root.style.removeProperty('--text-muted')
      root.style.removeProperty('--blue')
      root.style.removeProperty('--blue-soft')
      root.style.removeProperty('--border')
      delete root.dataset.palette
    }
  }, [theme, paletteId])

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t)
    try { localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
  }, [])

  const setPaletteId = useCallback((id: string) => {
    setPaletteIdState(id)
    try { localStorage.setItem(PALETTE_KEY, id) } catch { /* ignore */ }
  }, [])

  return { theme, setTheme, paletteId, setPaletteId }
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

/* ——————————————————————————————————————
   Brand — Newsmuncher (default) / bitstale (trial)
—————————————————————————————————————— */
type BrandId = 'newsmuncher' | 'bitstale' | 'reportale' | 'snippets' | 'truestory'

const BRAND_KEY = 'nm_brand_v1'

const BRANDS: { id: BrandId; name: string; description: string }[] = [
  { id: 'newsmuncher', name: 'Newsmuncher', description: 'Original wordmark' },
  { id: 'bitstale',    name: 'bitsTale',    description: 'Lightning-Z mark, byte vibe' },
  { id: 'reportale',   name: 'Reportale',   description: 'Signal-bar mark, on-the-air feel' },
  { id: 'snippets',    name: 'Snippeds',    description: 'Stacked-card mark, quick reads' },
  { id: 'truestory',   name: 'TrueStory',   description: 'Verified-shield mark, trust angle' },
]

const BRAND_IDS: BrandId[] = ['newsmuncher', 'bitstale', 'reportale', 'snippets', 'truestory']

function useBrand() {
  const [brand, setBrandState] = useState<BrandId>(() => {
    try {
      const saved = localStorage.getItem(BRAND_KEY)
      if (saved && (BRAND_IDS as string[]).includes(saved)) return saved as BrandId
    } catch { /* ignore */ }
    return 'newsmuncher'
  })

  useEffect(() => {
    document.title = brand === 'bitstale' ? 'bitstale' : 'Newsmuncher'
  }, [brand])

  const setBrand = useCallback((b: BrandId) => {
    setBrandState(b)
    try { localStorage.setItem(BRAND_KEY, b) } catch { /* ignore */ }
  }, [])

  return { brand, setBrand }
}

const FEED_CAPTURE_KEY = 'nm_feed_capture'

/** Persisted toggle for the "Feed Capture" feature (screenshot a feed card). */
function useFeedCapture() {
  const [feedCapture, setFeedCaptureState] = useState<boolean>(() => {
    try { return localStorage.getItem(FEED_CAPTURE_KEY) === '1' } catch { return false }
  })

  const setFeedCapture = useCallback((on: boolean) => {
    setFeedCaptureState(on)
    try { localStorage.setItem(FEED_CAPTURE_KEY, on ? '1' : '0') } catch { /* ignore */ }
  }, [])

  return { feedCapture, setFeedCapture }
}

/** Lightning-Z glyph lifted from /public/favicon.svg, simplified for inline use. */
function BitstaleMark({ size = 22 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `bitstale-grad-${uid}`
  return (
    <svg width={size} height={size * (46 / 48)} viewBox="0 0 48 46" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="55%" stopColor="#7e14ff" />
          <stop offset="100%" stopColor="#47bfff" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
      />
    </svg>
  )
}

/** Three signal bars + a pulse dot — a reporter's-on-the-air feel. */
function ReporTaleMark({ size = 22 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `reportale-grad-${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <rect x="4"  y="22" width="6" height="22" rx="2" fill={`url(#${gradId})`} />
      <rect x="14" y="14" width="6" height="30" rx="2" fill={`url(#${gradId})`} />
      <rect x="24" y="6"  width="6" height="38" rx="2" fill={`url(#${gradId})`} />
      <circle cx="40" cy="14" r="6" fill={`url(#${gradId})`} />
    </svg>
  )
}

/** Three stacked rounded rectangles — a deck-of-cards feel for short reads. */
function SnippetsMark({ size = 22 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `snippets-grad-${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="55%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <rect x="14" y="4"  width="28" height="28" rx="5" fill="none" stroke={`url(#${gradId})`} strokeWidth="3" opacity="0.45" />
      <rect x="9"  y="9"  width="28" height="28" rx="5" fill="none" stroke={`url(#${gradId})`} strokeWidth="3" opacity="0.7" />
      <rect x="4"  y="14" width="28" height="28" rx="5" fill={`url(#${gradId})`} />
    </svg>
  )
}

/** Shield-with-check — "verified true story" badge. */
function TrueStoryMark({ size = 22 }: { size?: number }) {
  const uid = useId().replace(/:/g, '')
  const gradId = `truestory-grad-${uid}`
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="55%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M24 4 L8 10 V24 C8 34 14 41 24 44 C34 41 40 34 40 24 V10 Z"
      />
      <path
        d="M15 24 L22 30 L33 18"
        stroke="#fff"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

const NEWSMUNCHER_TAGLINE = 'Big stories, small bites.'

const BRAND_DISPLAY: Record<Exclude<BrandId, 'newsmuncher'>, { word: string; tagline: string; className: string; Mark: React.ComponentType<{ size?: number }> }> = {
  bitstale:  { word: 'bitsTale',  tagline: 'Stories at the speed of bits.',  className: 'logo--bitstale',  Mark: BitstaleMark },
  reportale: { word: 'Reportale', tagline: 'From the wire to the world.',    className: 'logo--reportale', Mark: ReporTaleMark },
  snippets:  { word: 'Snippeds',  tagline: 'Cut to the story.',              className: 'logo--snippets',  Mark: SnippetsMark },
  truestory: { word: 'TrueStory', tagline: 'Reported, not rumored.',         className: 'logo--truestory', Mark: TrueStoryMark },
}

function brandTagline(brand: BrandId): string {
  return brand === 'newsmuncher' ? NEWSMUNCHER_TAGLINE : BRAND_DISPLAY[brand].tagline
}

function BrandLogo({ brand }: { brand: BrandId }) {
  if (brand === 'newsmuncher') {
    return (
      <h1 className="logo logo--with-tagline">
        <span className="logo__word">Newsmuncher</span>
        <span className="logo__tagline">{NEWSMUNCHER_TAGLINE}</span>
      </h1>
    )
  }
  const cfg = BRAND_DISPLAY[brand]
  return (
    <h1 className={`logo logo--brand logo--with-tagline ${cfg.className}`} aria-label={cfg.word}>
      <span className="logo-brand__row">
        <span className="logo-brand__icon"><cfg.Mark /></span>
        <span className="logo-brand__word">{cfg.word}</span>
      </span>
      <span className="logo__tagline">{cfg.tagline}</span>
    </h1>
  )
}

function AppFooter({ brand }: { brand: BrandId }) {
  const word = brand === 'newsmuncher' ? 'Newsmuncher' : BRAND_DISPLAY[brand].word
  const tagline = brandTagline(brand)
  const Mark = brand === 'newsmuncher' ? null : BRAND_DISPLAY[brand].Mark
  const year = new Date().getFullYear()
  return (
    <footer className={`app-footer${brand !== 'newsmuncher' ? ` app-footer--brand ${BRAND_DISPLAY[brand].className.replace('logo--', 'app-footer--')}` : ''}`}>
      <div className="app-footer__brand">
        {Mark && <span className="app-footer__icon"><Mark size={28} /></span>}
        <span className="app-footer__word">{word}</span>
      </div>
      <p className="app-footer__tagline">{tagline}</p>
      <ul className="app-footer__links" aria-label="Footer links">
        <li><a href="#" onClick={(e) => e.preventDefault()}>About</a></li>
        <li><a href="#" onClick={(e) => e.preventDefault()}>Privacy</a></li>
        <li><a href="#" onClick={(e) => e.preventDefault()}>Terms</a></li>
        <li><a href="#" onClick={(e) => e.preventDefault()}>Contact</a></li>
      </ul>
      <p className="app-footer__copy">© {year} {word}. All rights reserved.</p>
    </footer>
  )
}

const THEME_OPTIONS: { id: ThemeId; name: string; description: string }[] = [
  { id: 'default', name: 'Default', description: 'Clean, modern look' },
  { id: 'vintage', name: 'Vintage', description: 'Warm parchment, retro print feel' },
  { id: 'custom',  name: 'Custom',  description: 'Pick a palette that fits your mood' },
  { id: 'anime',   name: 'Anime',   description: 'Teal pastels with anime texture' },
  { id: 'cartoon', name: 'Cartoon', description: 'Sunny yellow & white, comic-book pop' },
]

function MenuSheet({
  theme,
  paletteId,
  onSelectTheme,
  onSelectPalette,
  brand,
  onSelectBrand,
  feedCapture,
  onToggleFeedCapture,
  weather,
  regionName,
  onClose,
}: {
  theme: ThemeId
  paletteId: string
  onSelectTheme: (t: ThemeId) => void
  onSelectPalette: (id: string) => void
  brand: BrandId
  onSelectBrand: (b: BrandId) => void
  feedCapture: boolean
  onToggleFeedCapture: (on: boolean) => void
  weather: HeaderWeather
  regionName: string
  onClose: () => void
}) {
  return (
    <div className="region-backdrop" role="dialog" aria-modal aria-label="Menu" onClick={onClose}>
      <div className="region-sheet theme-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="region-sheet__handle" aria-hidden />
        <div className="region-sheet__head">
          <h3 className="region-sheet__title">Menu</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="theme-sheet__body">
          <section className="menu-section">
            <p className="menu-section__label">Weather</p>
            <div className="menu-weather">
              <HeaderWeatherBadge weather={weather} />
              <div className="menu-weather__text">
                <p className="menu-weather__temp">{weather.tempC}°C · {weather.label}</p>
                <p className="menu-weather__region">{regionName}</p>
              </div>
            </div>
          </section>
          <section className="menu-section">
            <p className="menu-section__label">Brand</p>
            <div className="theme-grid" role="radiogroup" aria-label="Brand">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={brand === b.id}
                  className={`theme-tile theme-tile--brand-${b.id}${brand === b.id ? ' theme-tile--active' : ''}`}
                  onClick={() => onSelectBrand(b.id)}
                >
                  <span className="theme-tile__brand-row">
                    {b.id !== 'newsmuncher' && (() => {
                      const Mark = BRAND_DISPLAY[b.id as Exclude<BrandId, 'newsmuncher'>].Mark
                      return <Mark size={18} />
                    })()}
                    <span className="theme-tile__name">{b.name}</span>
                  </span>
                  <span className="theme-tile__desc">{b.description}</span>
                  {brand === b.id && (
                    <span className="theme-tile__check" aria-hidden>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="5 12 10 17 19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="menu-section">
            <p className="menu-section__label">Feed</p>
            <div className="fin-switch-row">
              <span className="fin-switch__label">Feed capture</span>
              <button
                type="button"
                className={`fin-switch${feedCapture ? ' fin-switch--on' : ''}`}
                onClick={() => onToggleFeedCapture(!feedCapture)}
                aria-pressed={feedCapture}
                aria-label="Toggle feed capture"
              >
                <span className="fin-switch__slider" />
              </button>
            </div>
            <p className="menu-section__hint">Adds a camera button on each feed card to save it as an image.</p>
          </section>

          <section className="menu-section">
            <p className="menu-section__label">Theme</p>
          <div className="theme-grid" role="radiogroup" aria-label="Themes">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={theme === opt.id}
                className={`theme-tile theme-tile--${opt.id}${theme === opt.id ? ' theme-tile--active' : ''}`}
                onClick={() => onSelectTheme(opt.id)}
              >
                <span className="theme-tile__name">{opt.name}</span>
                <span className="theme-tile__desc">{opt.description}</span>
                {theme === opt.id && (
                  <span className="theme-tile__check" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="5 12 10 17 19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          {theme === 'custom' && (
            <div className="theme-palette-wrap">
              <p className="theme-palette__label">Pick a palette</p>
              <div className="theme-palette-grid" role="radiogroup" aria-label="Custom palettes">
                {CUSTOM_PALETTES.map((p) => {
                  const active = p.id === paletteId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`theme-palette-chip${active ? ' theme-palette-chip--active' : ''}`}
                      onClick={() => onSelectPalette(p.id)}
                    >
                      <span className="theme-palette-chip__swatches" aria-hidden>
                        <span style={{ background: p.bg }} />
                        <span style={{ background: p.surface }} />
                        <span style={{ background: p.blue }} />
                        <span style={{ background: p.blueSoft }} />
                      </span>
                      <span className="theme-palette-chip__name">{p.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          </section>
        </div>
      </div>
    </div>
  )
}

function HeaderWeatherBadge({ weather }: { weather: HeaderWeather }) {
  return (
    <div className={`weather-chip weather-chip--${weather.kind}`} aria-label={`${weather.tempC}°C, ${weather.label}`}>
      <span className="weather-chip__icon" aria-hidden>
        {weather.kind === 'sunny' && (
          <span className="weather-icon weather-icon--sun">
            <span className="weather-sun__core" />
            <span className="weather-sun__rays" />
          </span>
        )}
        {weather.kind === 'rain' && (
          <span className="weather-icon weather-icon--rain">
            <span className="weather-cloud" />
            <span className="weather-rain__drops">
              <i />
              <i />
              <i />
            </span>
          </span>
        )}
        {weather.kind === 'cloud' && (
          <span className="weather-icon weather-icon--cloud">
            <span className="weather-cloud" />
          </span>
        )}
        {weather.kind === 'night' && (
          <span className="weather-icon weather-icon--night">
            <span className="weather-moon" />
            <span className="weather-stars">
              <i />
              <i />
            </span>
          </span>
        )}
      </span>
      <span className="weather-chip__temp">{weather.tempC}°</span>
    </div>
  )
}

export default function App() {
  const [category, setCategory] = useState<(typeof CATEGORY_CHIPS)[number]>('World')
  const [nav, setNav] = useState<'home' | 'foryou' | 'category' | 'insights' | 'profile'>('home')
  const [selectedRegion, setSelectedRegion] = useState<Region>(REGIONS[0])
  const [showRegionSheet, setShowRegionSheet] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [detailStory, setDetailStory] = useState<Story | null>(null)
  const [detailScrollTo, setDetailScrollTo] = useState<TextBookmarkSelection | null>(null)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showFinance, setShowFinance] = useState(false)
  const [readStory, setReadStory] = useState<Story | null>(null)
  const [chronologyStory, setChronologyStory] = useState<Story | null>(null)
  const [feedFullscreen, setFeedFullscreen] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const heroSlideRefs = useRef<(HTMLDivElement | null)[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()
  const headerWeather = useMemo(() => getHeaderWeather(selectedRegion.code), [selectedRegion.code])
  const { bookmarks, addBookmark, removeBookmark, isArticleBookmarked, toggleArticleBookmark, getTextBookmark } = useBookmarks()
  const { getReaction, setReaction, getRefinement, setRefinement } = useReactions()
  const { theme, setTheme, paletteId, setPaletteId } = useTheme()
  const { brand, setBrand } = useBrand()
  const { feedCapture, setFeedCapture } = useFeedCapture()
  const [showMenuSheet, setShowMenuSheet] = useState(false)

  const setHeroSlideRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    heroSlideRefs.current[index] = el
  }, [])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const slide = heroSlideRefs.current[heroIndex]
    if (!scroller || !slide) return
    const syncHeight = () => {
      scroller.style.height = `${slide.offsetHeight}px`
    }
    syncHeight()
    const ro = new ResizeObserver(syncHeight)
    ro.observe(slide)
    return () => {
      ro.disconnect()
      scroller.style.height = ''
    }
  }, [heroIndex])

  const feedForCategory = useMemo(() => {
    const matched = FEED.filter((item) => item.tag === category)
    return matched.length ? matched : FEED
  }, [category])

  const onHeroScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const w = el.offsetWidth
    const i = Math.round(el.scrollLeft / w)
    setHeroIndex(Math.min(Math.max(i, 0), TOP_STORIES.length - 1))
  }, [])

  useEffect(() => {
    if (nav !== 'home' || TOP_STORIES.length <= 1) return
    const id = window.setInterval(() => {
      setHeroIndex((prev) => {
        const next = (prev + 1) % TOP_STORIES.length
        const el = scrollerRef.current
        if (el) {
          requestAnimationFrame(() => {
            el.scrollTo({ left: next * el.offsetWidth, behavior: 'smooth' })
          })
        }
        return next
      })
    }, HERO_AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [nav])

  const goToSlide = (i: number) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' })
    setHeroIndex(i)
  }

  return (
    <div className="shell">
      {!feedFullscreen && (
      <header className={`header${detailStory ? ' header--detail' : ''}`}>
        <div className="header-row">
          {detailStory ? (
            <>
              <button type="button" className="icon-btn" aria-label="Back" onClick={() => { setDetailStory(null); setDetailScrollTo(null); setNav('home') }}>
                <IconBack />
              </button>
              <span className="logo header-detail-tag">
                <ArticleTag tag={detailStory.tag} />
              </span>
              <div className="header-actions">
                <button
                  type="button"
                  className={`icon-btn${bookmarks.length > 0 ? ' icon-btn--badge' : ''}`}
                  aria-label="Saved bookmarks"
                  onClick={() => { setDetailStory(null); setDetailScrollTo(null); setShowBookmarks(true) }}
                  data-count={bookmarks.length > 0 ? bookmarks.length : undefined}
                >
                  <IconBookmarkOutline />
                </button>
              </div>
            </>
          ) : showBookmarks ? (
            <>
              <button type="button" className="icon-btn" aria-label="Back" onClick={() => { setShowBookmarks(false); setNav('home') }}>
                <IconBack />
              </button>
              <h2 className="logo">Saved</h2>
              <div style={{ width: 44 }} />
            </>
          ) : showFinance ? (
            <>
              <button type="button" className="icon-btn" aria-label="Back" onClick={() => { setShowFinance(false); setNav('home') }}>
                <IconBack />
              </button>
              <h2 className="logo">Finance</h2>
              <div style={{ width: 44 }} />
            </>
          ) : (
            <>
              <button
                type="button"
                className="icon-btn"
                aria-label="Open menu"
                onClick={() => setShowMenuSheet(true)}
              >
                <IconMenu />
              </button>
              <BrandLogo brand={brand} />
              <div className="header-actions">
                <button
                  type="button"
                  className="region-pill"
                  onClick={() => setShowRegionSheet(true)}
                  aria-label={`Region: ${selectedRegion.name}. Tap to change.`}
                >
                  <span className="region-pill__flag"><RegionFlag code={selectedRegion.code} size={16} /></span>
                  <span className="region-pill__code">{selectedRegion.short}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`icon-btn${bookmarks.length > 0 ? ' icon-btn--badge' : ''}`}
                  aria-label="Saved bookmarks"
                  onClick={() => setShowBookmarks(true)}
                  data-count={bookmarks.length > 0 ? bookmarks.length : undefined}
                >
                  <IconBookmarkOutline />
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      )}

      <main className={`main${detailStory ? ' main--detail' :(showBookmarks || showFinance || nav !== 'home') ? ' main--single' : ''}${nav === 'foryou' && !detailStory && !showBookmarks && !showFinance ? ' main--feed' : ''}${showFinance ? ' main--finance' : ''}`}>
        {detailStory && (
          <NewsDetailScreen
            story={detailStory}
            onTimeline={getChronologyForStory(detailStory) ? () => setChronologyStory(detailStory) : null}
            onAddBookmark={(selection) => addBookmark(detailStory, selection)}
            isBookmarked={isArticleBookmarked(detailStory.id)}
            onToggleBookmark={() => toggleArticleBookmark(detailStory)}
            textBookmark={(() => {
              const bm = getTextBookmark(detailStory.id)
              return bm?.selectedText
                ? {
                    selectedText: bm.selectedText,
                    paragraphIndex: bm.paragraphIndex,
                    startOffset: bm.startOffset,
                  }
                : null
            })()}
            scrollToHighlight={!!detailScrollTo}
            getReaction={getReaction}
            setReaction={setReaction}
            getRefinement={getRefinement}
            setRefinement={setRefinement}
          />
        )}
        {!detailStory && !showBookmarks && showFinance && (
          <FinanceScreen />
        )}
        {!detailStory && showBookmarks && (
          <div className="bm-screen">
            <BookmarksList
              bookmarks={bookmarks}
              onOpenStory={(story, scrollTo) => {
                setDetailScrollTo(scrollTo ?? null)
                setDetailStory(story)
              }}
              onRemove={removeBookmark}
            />
          </div>
        )}
        {!detailStory && !showBookmarks && !showFinance && nav === 'home' && (
          <>
        <div className="chips-row">
          {CATEGORY_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? 'chip--active' : ''}`}
              onClick={() => setCategory(c)}
            >
              <span className="chip__icon" aria-hidden>
                <TagIcon tag={c} />
              </span>
              {c}
            </button>
          ))}
        </div>

        <section className="section" aria-labelledby="top-stories-heading">
          <div className="section-head">
            <h2 id="top-stories-heading" className="section-title">
              Top Stories
            </h2>
            <span className="section-pill">Live</span>
          </div>

          <div className="hero-wrap">
            <div
              ref={scrollerRef}
              className="hero-scroller"
              onScroll={onHeroScroll}
              role="region"
              aria-roledescription="carousel"
              aria-label="Featured stories"
            >
              {TOP_STORIES.map((story, slideIdx) => (
                <div
                  key={story.id}
                  ref={setHeroSlideRef(slideIdx)}
                  className="hero-slide"
                  aria-hidden={slideIdx !== heroIndex}
                >
                  <article className="hero-card">
                    <button
                      type="button"
                      className="hero-card-image-wrap hero-card-image-wrap--btn"
                      onClick={() => setDetailStory(story)}
                      aria-label={`Open article: ${story.title}`}
                      tabIndex={slideIdx === heroIndex ? 0 : -1}
                    >
                      <img src={story.image} alt="" className="hero-card-image" loading={slideIdx === 0 ? 'eager' : 'lazy'} />
                      <span className="hero-card-tag">
                        <ArticleTag tag={story.tag} />
                      </span>
                    </button>
                    <div className="hero-card-body">
                      <HeroReadingContent
                        title={story.title}
                        dek={story.dek}
                        isActive={slideIdx === heroIndex}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                      <div className="hero-card-actions">
                        <button
                          type="button"
                          className="hero-action-btn"
                          onClick={() => setDetailStory(story)}
                          aria-label="Read through full article"
                        >
                          <IconReadThrough />
                          <span>Read through</span>
                        </button>
                        {getChronologyForStory(story) && (
                          <button
                            type="button"
                            className="hero-action-btn"
                            onClick={() => setChronologyStory(story)}
                            aria-label="Story timeline"
                          >
                            <IconChronology />
                            <span>Timeline</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="hero-action-btn"
                          onClick={() => toggleArticleBookmark(story)}
                          aria-label={isArticleBookmarked(story.id) ? 'Remove bookmark' : 'Bookmark this article'}
                          aria-pressed={isArticleBookmarked(story.id)}
                        >
                          {isArticleBookmarked(story.id) ? <IconBookmarkFilled /> : <IconBookmarkOutline />}
                        </button>
                      </div>
                      <span className="hero-card-meta">{story.readTime}</span>
                    </div>
                  </article>
                </div>
              ))}
            </div>
            <div className="hero-dots" role="tablist" aria-label="Carousel slides">
              {TOP_STORIES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === heroIndex}
                  className={`hero-dot ${i === heroIndex ? 'hero-dot--active' : ''}`}
                  onClick={() => goToSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="market-section" aria-label="Finance ticker">
          <button
            type="button"
            className="market-bar market-bar--btn"
            onClick={() => setShowFinance(true)}
            aria-label="Open finance screen"
          >
            <span className="market-bar__label">Finance</span>
            <span className="market-marquee" aria-hidden="true">
              <span className="market-marquee__track">
                <span className="market-marquee__half">
                  <MarketTickerItems items={MARKET_TICKER} keyPrefix="a" />
                </span>
                <span className="market-marquee__half">
                  <MarketTickerItems items={MARKET_TICKER} keyPrefix="b" />
                </span>
              </span>
            </span>
            <span className="market-bar__chevron" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        </section>

        <section className="section feed-section" aria-labelledby="feed-heading">
          <h2 id="feed-heading" className="section-title section-title--solo">
            Latest headlines
          </h2>
          <ul className="feed-list">
            {feedForCategory.map((item) => (
              <li key={item.id}>
                <article className="feed-card feed-card--tappable" onClick={() => setDetailStory(item)}>
                  <div className="feed-card-image-wrap">
                    <img src={item.image} alt="" className="feed-card-image" loading="lazy" />
                  </div>
                  <div className="feed-card-content">
                    <ArticleTag tag={item.tag} />
                    <h3 className="feed-card-title">{item.title}</h3>
                    
                    {/* Publisher, Date & Time, Share Icon row */}
                    <div className="feed-card-metadata-row">
                      <span className="feed-card-pub-name">{item.publisher || 'Reuters'}</span>
                      <span className="feed-card-dot">·</span>
                      <span className="feed-card-pub-date">{item.date || 'June 2, 2026'} · {item.time || '10:00 AM'}</span>
                      <span className="feed-card-dot">·</span>
                      <button
                        type="button"
                        className="feed-card-inline-share"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(window.location.href)
                          alert(`Copied link to share: "${item.title}"`)
                        }}
                        aria-label="Share story"
                      >
                        <IconShare />
                      </button>
                    </div>

                    <p className="feed-card-dek">{item.dek}</p>
                    <div className="feed-card-foot">
                      <span>{item.readTime}</span>
                      <span className="feed-card-foot__actions">
                        {getChronologyForStory(item) && (
                          <button
                            type="button"
                            className="feed-card-chrono"
                            onClick={(e) => { e.stopPropagation(); setChronologyStory(item) }}
                            aria-label={`Timeline: ${item.title}`}
                          >
                            <IconChronology />
                          </button>
                        )}
                        <button
                          type="button"
                          className="feed-card-chrono"
                          onClick={(e) => { e.stopPropagation(); toggleArticleBookmark(item) }}
                          aria-label={isArticleBookmarked(item.id) ? `Remove bookmark: ${item.title}` : `Bookmark: ${item.title}`}
                          aria-pressed={isArticleBookmarked(item.id)}
                        >
                          {isArticleBookmarked(item.id) ? <IconBookmarkFilled /> : <IconBookmarkOutline />}
                        </button>
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
          </>
        )}

        {!detailStory && !showBookmarks && !showFinance && nav === 'foryou' && (
          <FeedScreen prefersReducedMotion={prefersReducedMotion} enableFeedCapture={feedCapture} onToggleFullscreen={setFeedFullscreen} />
        )}

        {!detailStory && !showBookmarks && !showFinance && nav === 'category' && <CategoriesPage />}

        {!detailStory && !showBookmarks && !showFinance && nav === 'insights' && <CityMapScreen />}

        {!detailStory && !showBookmarks && !showFinance && nav === 'profile' && (
          <section className="placeholder-screen" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="placeholder-screen__title">
              Profile
            </h2>
            <p className="placeholder-screen__text">Saved stories and preferences will appear here.</p>
          </section>
        )}

        {!detailStory && !showBookmarks && !showFinance && nav !== 'foryou' && (
          <AppFooter brand={brand} />
        )}
      </main>

      {showRegionSheet && (
        <RegionSheet
          selected={selectedRegion}
          onSelect={setSelectedRegion}
          onClose={() => setShowRegionSheet(false)}
        />
      )}

      {showMenuSheet && (
        <MenuSheet
          theme={theme}
          paletteId={paletteId}
          onSelectTheme={setTheme}
          onSelectPalette={setPaletteId}
          brand={brand}
          onSelectBrand={setBrand}
          feedCapture={feedCapture}
          onToggleFeedCapture={setFeedCapture}
          weather={headerWeather}
          regionName={selectedRegion.name}
          onClose={() => setShowMenuSheet(false)}
        />
      )}

      <ArticleReadModal story={readStory} onClose={() => setReadStory(null)} prefersReducedMotion={prefersReducedMotion} />
      <ShortsStack story={null} onClose={() => {}} prefersReducedMotion={prefersReducedMotion} />
      <ChronologyModal story={chronologyStory} onClose={() => setChronologyStory(null)} />

      {!showFinance && !feedFullscreen && (
      <nav className="bottom-nav" aria-label="Primary">
        <button type="button" className={`nav-item ${nav === 'home' ? 'nav-item--active' : ''}`} onClick={() => setNav('home')}>
          <IconHome active={nav === 'home'} />
          <span>Home</span>
        </button>
        <button type="button" className={`nav-item ${nav === 'foryou' ? 'nav-item--active' : ''}`} onClick={() => setNav('foryou')}>
          <IconHeart active={nav === 'foryou'} />
          <span>Feed</span>
        </button>
        <button type="button" className={`nav-item nav-item--center ${nav === 'category' ? 'nav-item--active' : ''}`} onClick={() => setNav('category')}>
          <span className="nav-item__pill">
            <IconGrid active={nav === 'category'} />
          </span>
          <span>Category</span>
        </button>
        <button type="button" className={`nav-item ${nav === 'insights' ? 'nav-item--active' : ''}`} onClick={() => setNav('insights')}>
          <IconMapNav active={nav === 'insights'} />
          <span>Map</span>
        </button>
        <button type="button" className={`nav-item ${nav === 'profile' ? 'nav-item--active' : ''}`} onClick={() => setNav('profile')}>
          <IconProfile active={nav === 'profile'} />
          <span>Log in</span>
        </button>
      </nav>
      )}
    </div>
  )
}
