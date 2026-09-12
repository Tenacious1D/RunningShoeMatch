# Metric Scoring Methodology v1

**Status: approved and frozen for the pilot. No real shoe scores have been assigned with this methodology.**

This document defines how Running Shoe Match will turn reviewed evidence into repeatable 0–100 evaluative and use-case metric scores. It does not define ranking weights, quiz weights, ranking results, or personalized match scores.

## Scope and score meaning

The comparison universe is performance running shoes sold for road, trail, track, or hybrid use. Scores describe a shoe relative to that universe at the time of review. They are not percentages, probabilities, star ratings, or claims that a higher number is universally better.

Every stored score created under this document must use:

- `unit = score_0_100`
- `metric_version = metric-v1:scoring-methodology-v1`
- an `effective_date`
- a named evidence source or methodology record
- a rationale sufficient for another reviewer to understand the decision

Missing or unassessed metrics remain absent. A stored zero is an assessed extreme, never a missing-value substitute.

### Universal anchors

| Score | Universal interpretation |
| --- | --- |
| 0 | The characteristic or suitability is essentially absent at the extreme low end of the comparison universe. |
| 25 | Clearly below the comparison-universe midpoint, with material limitations in ordinary use. |
| 50 | Representative of the middle of the comparison universe, without a strong low or high distinction. |
| 75 | Clearly above the midpoint and consistently evident in appropriate use. |
| 100 | An exceptional or extreme expression of the characteristic or suitability within the comparison universe. |

The metric-specific anchors below control when the universal wording is too broad.

### Pilot scoring precision

Pilot scores must use five-point increments: `0, 5, 10, 15 ... 100`. Values such as 73 or 84 are invalid pilot proposals because they imply unsupported precision. Revisit score resolution only through a future reviewed methodology version.

## Evidence policy

Scores are an editorial synthesis of documented evidence, not an automatic translation of any single fact or claim. Reviewers may use only evidence actually found and recorded for the shoe.

| Evidence category | Appropriate use |
| --- | --- |
| Objective manufacturer specifications | Establish published construction, geometry, weight, price, intended use, and other facts. Marketing adjectives are claims, not subjective scores. |
| Independently measured specifications | Add comparable measurements such as mass, dimensions, stiffness, rebound, or wear when methods and conditions are known. Preserve differences from manufacturer values. |
| Structured reviewer observations | Record specific behavior under identified conditions, including pace, distance, surface, fit context, and test duration where available. |
| Repeated reviewer consensus | Increase confidence when independent reviewers describe the same behavior under comparable conditions. Repetition does not convert opinion into an objective fact. |
| Known construction and geometry | Explain plausible behavior from materials, plate or rod systems, rocker, platform width, outsole, upper, and geometry. Construction alone must not determine a score. |
| Long-term durability observations | Inform durability and value only when mileage, surface, runner context, and observed change are reasonably described. |
| Price and MSRP | Inform value using the verified manufacturer MSRP for the reviewed market and date. Sale price may be noted separately but does not replace MSRP. |

### Approved source hierarchy

| Tier | Approved source role | Policy |
| --- | --- | --- |
| Tier 0 — Manufacturer | Official manufacturer information | Use primarily for objective specifications, intended construction, and product identity. Marketing claims do not determine subjective scores. |
| Tier 1 — Independent laboratory evidence | RunRepeat standardized laboratory measurements when available | May inform measured stack, drop, weight, midsole softness, stiffness, torsional rigidity, shock absorption, energy return, durability, fit dimensions, and outsole measurements. A measurement does not automatically become a subjective score. |
| Tier 2 — Structured expert wear testing | Doctors of Running | Primary structured wear-test evidence for ride, stability, transitions, geometry, comfort, versatility, intended use, longer-run behavior, and workout or race suitability. |
| Tier 3 — Independent wear-test consensus | Believe in the Run | Additional independent wear-test evidence and reviewer consensus. It should not determine a subjective score alone when stronger corroboration can reasonably be obtained. |

The source tier describes the question a source can answer; it is not a mechanical weight. Source relevance, test context, exact model/version, and evidence quality still matter.

### Source-role boundaries

- A laboratory energy-return measurement strongly informs `energy_return`; it does not automatically equal `responsiveness`.
- Measured stack informs cushioning context; it does not automatically equal `cushioning`.
- Canonical support category does not automatically determine `stability`.
- A reviewer racing recommendation informs `racing`; it does not automatically determine `responsiveness` or `energy_return`.
- Manufacturer construction information may explain observed behavior; marketing adjectives do not establish evaluative or use-case scores.

### Evidence sufficiency

A score normally needs at least one direct behavioral observation. Construction or manufacturer claims alone are usually insufficient for evaluative and use-case scores. Prefer at least two independent wear-test sources when available. A single wear-test source may support a score, but confidence should normally be lower unless unusually strong objective evidence exists. High confidence generally requires strong evidence, meaningful agreement, and no unresolved major contradiction. Lack of evidence is a reason to leave a score unknown.

### Conflicting evidence

1. Record each material disagreement instead of averaging it away silently.
2. Prefer direct, method-described evidence over marketing language.
3. Prefer observations that match the metric's intended context and the exact model/version.
4. Check whether differences can be explained by size, surface, pace, distance, temperature, runner mechanics, or test duration.
5. If a reasonable synthesis remains possible, score conservatively and lower confidence.
6. If disagreement could move the score across a major anchor band and cannot be explained, leave the score unknown pending review.

Manufacturer marketing language never determines an evaluative or use-case score by itself. Manufacturer specifications remain authoritative for the objective specification set under the source policy in `docs/METRICS.md`.

## Confidence policy

Use **low / medium / high** during the pilot. This is simpler and more honest than a numeric confidence estimate.

| Level | Meaning |
| --- | --- |
| Low | Limited direct evidence, narrow testing context, substantial unresolved disagreement, or incomplete evidence for an important dimension. A score may still be useful as a clearly provisional proposal. |
| Medium | More than one relevant evidence item or one strong structured evaluation, with no major unexplained contradiction. Some context or long-term evidence remains incomplete. |
| High | Multiple independent and relevant observations agree, important objective or measured context is known, and no material contradiction remains. High means confidence in the placement, not universal agreement among runners. |

The existing database `confidence` field is numeric and optional. During the pilot, keep it null rather than inventing a numeric mapping. Record categorical confidence only in the human review worksheet. Persisting confidence differently requires a future reviewed change.

## Second-review rule

A second review is not required for every observation. Set `second_review_required = yes` when one or more of these conditions apply:

- confidence is low
- major evidence sources materially disagree
- the proposed score is in an extreme band of 0–20 or 80–100
- evidence is unusually sparse
- the reviewer explicitly flags uncertainty

Record every applicable trigger in `second_review_reason`. A flagged proposal cannot reach `review_status = approved` until its second-review status is complete. An unflagged proposal may proceed through ordinary review without a second reviewer.

## Scoring workflow

For each shoe and metric:

1. Confirm the exact shoe model/version and review the verified objective specification set.
2. Gather and cite evidence under the categories above.
3. Decide whether evidence is sufficient. If not, record the missing-data reason and do not propose a score.
4. Select the nearest metric-specific anchor band.
5. Move within that band only for documented evidence, using five-point increments.
6. Write a short rationale that explains the main upward and downward factors.
7. Assign low, medium, or high confidence.
8. Apply the second-review rule. Record the trigger and obtain a second review only when required.
9. Import only reviewed rows. Keep them non-public until the metric verification workflow is complete.

## Evaluative metrics

### Cushioning

- **Version:** Metric Scoring Methodology v1.
- **Definition:** The underfoot protection and impact-moderating experience the shoe provides through the stride.
- **What it is not:** Softness, stack height, comfort, or injury prevention. A tall or soft shoe is not automatically highly cushioned if protection is inconsistent or the platform bottoms out.
- **Evidence:** Manufacturer stack and midsole construction provide context; independent impact, compression, or foam measurements may help when comparable; structured reviewer observations should address protection across relevant distances; repeated consensus and behavior under fatigue are useful.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Essentially no underfoot protection; impacts and surface irregularities are transmitted with minimal moderation. |
| 25 | Limited protection suited mainly to short or specialized use; repeated impacts become prominent quickly. |
| 50 | Moderate, broadly typical protection for ordinary running without exceptional isolation or sustained cushioning. |
| 75 | Consistently protective over sustained running, with impact moderation that remains evident as distance increases. |
| 100 | Extreme underfoot protection and isolation at the upper edge of the comparison universe, maintained through prolonged use. |

- **Scoring guidance:** Move upward for sustained impact protection, resistance to bottoming out, and consistent cushioning through the gait cycle. Move downward for harshness, rapid compression, localized protection, or protection that fades materially with distance.
- **Missing-data policy:** Leave unknown when evidence describes only softness, stack, or marketing claims without direct underfoot behavior.
- **Conflicting-evidence policy:** Check runner mass, pace, distance, and temperature. If those contexts plausibly explain disagreement, document them and score the intended general context conservatively; otherwise leave unknown.
- **Confidence cues:** Long-run observations and consistent reports across different runners increase confidence. Construction alone supports only low confidence.
- **Score origin:** Editorial synthesis of evidence, not a derived formula.

### Stability

- **Version:** Metric Scoring Methodology v1.
- **Definition:** How predictably and securely the shoe's platform controls unwanted motion during landing, loading, and toe-off.
- **What it is not:** The canonical `support_category`, the manufacturer's support label, stiffness alone, or a medical claim. Neutral shoes may score highly and stability-classified shoes do not receive an automatic high score.
- **Evidence:** Platform width and geometry, sidewalls, heel structure, torsional behavior, rocker, and upper hold provide context; independent measurements and structured observations during corners, fatigue, and uneven loading are especially relevant.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Extremely uncontrolled or unpredictable platform behavior under ordinary running loads. |
| 25 | Noticeably unstable in multiple common situations or highly dependent on precise mechanics. |
| 50 | Typical platform control for its intended use, with manageable movement and no exceptional guidance. |
| 75 | Consistently secure and predictable through varied ordinary loading, including fatigue and direction changes. |
| 100 | Exceptional control and resistance to unwanted motion at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for a broad secure platform, controlled deformation, reliable transitions, heel and upper hold, and stability retained under fatigue. Move downward for narrow or tippy behavior, uncontrolled foam collapse, heel instability, or inconsistent transitions.
- **Missing-data policy:** Leave unknown when the only evidence is a support label or static geometry without running observations.
- **Conflicting-evidence policy:** Separate fit-related instability from platform behavior and note runner mechanics. Unresolved disagreement across comparable tests lowers confidence or blocks a score.
- **Confidence cues:** Consistency across different mechanics and fatigue contexts supports higher confidence.
- **Score origin:** Editorial synthesis of evidence, separate from support classification.

### Responsiveness

- **Version:** Metric Scoring Methodology v1.
- **Definition:** How quickly and lively the shoe reacts to applied effort and how readily it transitions through the stride.
- **What it is not:** Energy return alone, raw stiffness, light weight, top speed, or racing suitability.
- **Evidence:** Geometry, rocker, foam, plate or rods, mass, and flex characteristics provide context; structured observations across paces and comparable transition or stiffness measurements may inform the score; repeated reviewer descriptions of quickness or lag are important.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Effort produces an exceptionally delayed, inert, or obstructed response and transition. |
| 25 | Noticeably sluggish or slow to transition except in a narrow context. |
| 50 | Predictable, ordinary reaction and transition without a strongly lively or dull character. |
| 75 | Clearly quick and lively response as effort increases, with efficient-feeling transitions across relevant paces. |
| 100 | Exceptionally immediate and dynamic response at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for rapid transitions, lively response to pace changes, and consistent reaction under load. Move downward for lag, excessive deformation, awkward rocker timing, or a response available only in an unusually narrow pace window.
- **Missing-data policy:** Leave unknown when evidence only names the foam, plate, weight, or marketing speed category.
- **Conflicting-evidence policy:** Compare pace, mechanics, and loading. Do not let race performance override direct ride observations.
- **Confidence cues:** Direct observations across several paces and runners are more important than construction inference.
- **Score origin:** Editorial synthesis of evidence.

### Flexibility

- **Version:** Metric Scoring Methodology v1.
- **Definition:** How readily the shoe bends through the stride. **Directionality: 100 means very flexible; 0 means very stiff.**
- **What it is not:** Comfort, softness, torsional stability, natural feel, or quality. High flexibility is not universally preferable.
- **Evidence:** Comparable bending measurements, flex-groove and plate construction, temperature context, and structured observations of forefoot bending and transition may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Extremely resistant to longitudinal bending through ordinary running loads. |
| 25 | Clearly stiff, bending only with substantial load or at a constrained point. |
| 50 | Moderate, typical bending through the stride. |
| 75 | Bends readily and naturally under ordinary running loads. |
| 100 | Exceptionally pliable at the extreme flexible end of the comparison universe. |

- **Scoring guidance:** Move upward for low bending resistance and smooth distributed flex. Move downward for plates, geometry, or construction that strongly resists bending. Treat temperature-specific behavior as context, not noise.
- **Missing-data policy:** Leave unknown when no direct flex observation or comparable measurement exists.
- **Conflicting-evidence policy:** Separate longitudinal flex from torsion and compare test temperature and size. Do not average different axes into one score.
- **Confidence cues:** Comparable measurements plus on-foot confirmation support high confidence.
- **Score origin:** Editorial synthesis of evidence.

### Durability

- **Version:** Metric Scoring Methodology v1.
- **Definition:** The expected ability to retain functional ride, structure, traction, and fit over repeated intended use.
- **What it is not:** Cosmetic appearance alone, outsole rubber coverage alone, warranty length, or indestructibility outside intended use.
- **Evidence:** Documented mileage and surfaces, outsole and upper wear, midsole ride change, construction, independently measured wear where comparable, and repeated long-term observations may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Functional performance or structure fails almost immediately under intended use. |
| 25 | Material functional degradation appears substantially earlier than typical. |
| 50 | Retains useful performance for a broadly typical service life in intended use. |
| 75 | Shows clearly above-average resistance to functional wear and ride degradation. |
| 100 | Exceptional retention of function at the extreme durable end of the comparison universe. |

- **Scoring guidance:** Move upward for retained cushioning, geometry, traction, upper hold, and structural integrity over documented mileage. Move downward for premature loss of ride, exposed failure points, outsole loss affecting function, or upper breakdown.
- **Missing-data policy:** Leave unknown when testing is too short to observe meaningful wear. Construction may justify only a provisional low-confidence score.
- **Conflicting-evidence policy:** Compare mileage, surface, runner loading, gait, and use. Isolated misuse does not define intended-use durability.
- **Confidence cues:** Long-term evidence from multiple testers is the strongest confidence input.
- **Score origin:** Editorial synthesis of evidence.

### Comfort

- **Version:** Metric Scoring Methodology v1.
- **Definition:** The overall absence of distracting pressure, irritation, harshness, or fit-related discomfort during the shoe's intended running use.
- **What it is not:** Cushioning alone, universal fit, softness, luxury materials, or a guarantee for every foot shape.
- **Evidence:** Structured observations of upper fit, heel hold, toe room, pressure points, heat, tongue and lacing behavior, underfoot feel, and comfort over distance; width availability and geometry provide context but do not determine the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Severe, immediate, and broadly reported discomfort prevents intended use. |
| 25 | Recurrent material discomfort or fit pressure limits ordinary intended use for many testers. |
| 50 | Generally acceptable comfort with ordinary fit sensitivities or minor limitations. |
| 75 | Consistently comfortable through intended sessions, with few recurring distractions across testers. |
| 100 | Exceptional sustained comfort across a broad range of relevant testers and sessions, with virtually no material distractions. |

- **Scoring guidance:** Move upward for secure but nonrestrictive fit, low irritation, effective pressure distribution, and comfort retained with distance. Move downward for recurring hot spots, heel slip, lace pressure, harsh contact, heat, or rapidly declining comfort.
- **Missing-data policy:** Leave unknown when fit context, session duration, or direct comfort observations are absent.
- **Conflicting-evidence policy:** Identify foot shape and sizing differences. A clear fit-shape dependency should be documented and may limit confidence rather than be averaged away.
- **Confidence cues:** Diverse tester fit contexts and sustained-session evidence increase confidence.
- **Score origin:** Editorial synthesis of evidence.

### Ground feel

- **Version:** Metric Scoring Methodology v1.
- **Definition:** How directly the runner can sense the surface and underfoot changes. **Directionality: 100 means strong/direct ground feel; 0 means highly isolated from the ground.**
- **What it is not:** Traction, flexibility, stability, cushioning quality, or surface protection.
- **Evidence:** Stack, outsole and midsole construction provide context; structured observations of surface feedback and placement awareness are primary; comparable measurements may support but do not replace perception.

| Score | Behavioral anchor |
| --- | --- |
| 0 | The runner is almost completely isolated from surface texture and changes. |
| 25 | Surface information is strongly muted and only larger changes are apparent. |
| 50 | Moderate, typical surface feedback without strong isolation or directness. |
| 75 | Clear and consistent surface feedback supports precise placement awareness. |
| 100 | Exceptionally direct surface sensation at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for direct, detailed feedback and precise placement awareness. Move downward for strong isolation, thick filtering, or delayed surface information.
- **Missing-data policy:** Leave unknown when ground interaction is not described directly. Do not infer a score from stack height alone.
- **Conflicting-evidence policy:** Compare surface type and pace. Preserve context if road and trail observations differ materially.
- **Confidence cues:** Direct observations on multiple relevant surfaces increase confidence.
- **Score origin:** Editorial synthesis of evidence.

### Energy return

- **Version:** Metric Scoring Methodology v1.
- **Definition:** The rebound or returned-energy sensation and, when available, comparable measured recovery after the midsole is loaded.
- **What it is not:** Responsiveness, efficiency, racing suitability, stiffness, or proof of reduced metabolic cost.
- **Evidence:** Comparable rebound or energy-return measurements are useful when methods are known; foam and plate construction provide context; structured observations should describe rebound rather than general speed; repeated consensus can strengthen placement.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Loading produces virtually no perceived or observed rebound; energy is strongly damped. |
| 25 | Rebound is limited and materially below typical running-shoe behavior. |
| 50 | Moderate, ordinary rebound without a strong returning-energy sensation. |
| 75 | Clear, repeatable rebound is evident through relevant loading and paces. |
| 100 | Exceptional rebound at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for repeatable rebound that remains evident under relevant loads. Move downward for deadening, rapid energy dissipation, or rebound that appears only under a narrow, unrepresentative condition.
- **Missing-data policy:** Leave unknown when evidence uses only words such as fast, responsive, or plated without describing rebound or measuring recovery.
- **Conflicting-evidence policy:** Give comparable measurement methods weight, but investigate whether laboratory loading represents actual use. Do not force measured and perceived evidence to agree.
- **Confidence cues:** Comparable measurement plus repeated on-foot rebound observations supports high confidence.
- **Score origin:** Editorial synthesis of evidence, distinct from responsiveness.

### Value

- **Version:** Metric Scoring Methodology v1.
- **Definition:** The shoe's useful performance, versatility, and expected functional life relative to its verified MSRP in the reviewed market.
- **What it is not:** Low price, discount depth, popularity, affiliate commission, or performance without regard to cost.
- **Evidence:** Verified MSRP and market/date, intended uses, evaluative evidence, expected durability, material limitations, and comparable alternatives at similar prices may inform the score. Temporary sale prices remain notes, not the canonical basis.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Provides almost no defensible useful performance or service life relative to MSRP. |
| 25 | Materially underdelivers relative to similarly priced alternatives or has severe utility limitations. |
| 50 | Delivers broadly typical usefulness and expected life for its MSRP. |
| 75 | Clearly exceeds typical usefulness, versatility, performance, or expected life for its MSRP. |
| 100 | Exceptional usefulness and expected service relative to price at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for broad useful capability, strong performance in intended use, and expected durability at a competitive MSRP. Move downward for narrow usefulness, premature wear, major compromises, or a substantial price premium unsupported by utility.
- **Missing-data policy:** Leave unknown when MSRP, market, durability outlook, or intended-use evidence is missing.
- **Conflicting-evidence policy:** Keep market and date aligned. Do not mix MSRP in one currency/market with performance comparisons from another without documenting the limitation.
- **Confidence cues:** Verified MSRP plus mature durability and use evidence supports higher confidence.
- **Score origin:** Editorial synthesis of evidence; no price-only formula.

## Use-case metrics

Use-case scores represent suitability, not popularity. All pilot use-case scores are editorial. They must not be algorithmically derived under v1. A future methodology may propose partial derivation only after the pilot is reviewed.

### Daily training

- **Version:** Metric Scoring Methodology v1.
- **Definition:** Suitability for repeated everyday training across the ordinary paces and session lengths appropriate to the shoe.
- **What it is not:** Overall shoe quality, popularity, comfort alone, or a ranking score.
- **Evidence:** Structured routine-run observations, durability, comfort, stability, transition behavior, versatility, objective weight and geometry, and repeated consensus may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Functionally unsuitable for repeated ordinary training. |
| 25 | Useful only rarely or with major limitations in routine training. |
| 50 | Adequate for ordinary training but with clear limitations in versatility, comfort, durability, or ride. |
| 75 | Reliably handles repeated everyday training across a broad, relevant range of sessions. |
| 100 | Exceptionally complete and dependable for everyday training at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for broad pace usability, consistent comfort, predictable ride, adequate protection, and durability. Move downward for highly specialized behavior, fatigue-related issues, fragility, or a narrow useful range.
- **Missing-data policy:** Leave unknown without repeated ordinary-training observations and enough duration to assess routine suitability.
- **Conflicting-evidence policy:** Separate intended specialization from general daily use; unresolved disagreement about broad usability lowers confidence.
- **Confidence cues:** Repeated use across session types and weeks is more valuable than a single first run.
- **Score origin:** **Partially derived later** is recommended; editorial v1 should reference evaluative evidence without applying a formula.

### Long run

- **Version:** Metric Scoring Methodology v1.
- **Definition:** Suitability for sustained mileage while maintaining comfort, protection, stability, and ride quality.
- **What it is not:** Cushioning alone, maximum stack, slow pace, or daily-training suitability copied to another field.
- **Evidence:** Direct sustained-run observations, cushioning retention, comfort under fatigue, stability, transition consistency, fit, outsole behavior, and objective geometry may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Sustained running becomes functionally impractical almost immediately. |
| 25 | Material comfort, protection, stability, or ride degradation limits sustained mileage. |
| 50 | Adequate for moderate sustained mileage with identifiable limitations as duration increases. |
| 75 | Maintains a comfortable, protective, stable, and consistent ride through long sessions. |
| 100 | Exceptional sustained-mileage performance with minimal meaningful degradation at the extreme high end. |

- **Scoring guidance:** Move upward when protection, comfort, control, and transition remain consistent under fatigue. Move downward for bottoming out, instability, hot spots, excessive weight burden, or ride deterioration with distance.
- **Missing-data policy:** Leave unknown when testing does not include genuinely sustained sessions or evidence only states cushioning level.
- **Conflicting-evidence policy:** Compare run length, pace, runner loading, and fatigue context where known. Do not generalize a short-run impression.
- **Confidence cues:** Multiple sustained sessions and varied reviewers increase confidence.
- **Score origin:** **Partially derived later** is recommended, with direct long-run evidence retaining editorial importance.

### Speed workout

- **Version:** Metric Scoring Methodology v1.
- **Definition:** Suitability for faster training sessions such as intervals, tempo efforts, repetitions, and pace changes.
- **What it is not:** Racing suitability, responsiveness alone, low weight alone, or maximum attainable speed.
- **Evidence:** Direct fast-workout observations, transitions, responsiveness, energy return, grip, stability at pace, fit security, warm-up/cool-down usability, and construction may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Functionally obstructs faster training efforts. |
| 25 | Handles faster work only with major ride, control, fit, or transition limitations. |
| 50 | Adequate for some faster sessions but not consistently effective across common workout demands. |
| 75 | Clearly effective across relevant faster sessions and pace changes, with secure and efficient-feeling transitions. |
| 100 | Exceptional fast-workout suitability at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for quick transitions, secure fit, reliable grip, pace-change response, and repeat-session usability. Move downward for awkwardness at pace, instability, poor grip, excessive rigidity for training, or a very narrow workout range.
- **Missing-data policy:** Leave unknown without direct faster-session evidence.
- **Conflicting-evidence policy:** Distinguish interval, tempo, and mixed-session contexts. A shoe may be strong in one and limited in another; document the intended synthesis.
- **Confidence cues:** Evidence across more than one faster-session type supports higher confidence.
- **Score origin:** **Partially derived later** is recommended; avoid simply summing responsiveness and energy return.

### Racing

- **Version:** Metric Scoring Methodology v1.
- **Definition:** Suitability for performance-oriented race efforts without splitting by race distance in v1.
- **What it is not:** Speed-workout suitability, popularity, legal status alone, price, or responsiveness copied directly.
- **Evidence:** Direct race or race-effort observations, weight, geometry, energy return, transitions, grip, stability at pace, fit security, and sustained performance may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Functionally unsuitable for performance-oriented race efforts. |
| 25 | Major efficiency, control, fit, grip, or ride limitations materially hinder racing. |
| 50 | Capable in race efforts but with clear performance or versatility compromises. |
| 75 | Clearly well suited to performance-oriented racing across a meaningful range of efforts. |
| 100 | Exceptional race-effort suitability at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for efficient-feeling race transitions, secure fit, grip, low burden, rebound, and maintained control. Move downward for instability, poor grip, inefficient geometry, fatigue-related ride loss, or severe distance/context limitations.
- **Missing-data policy:** Leave unknown without evidence from races or race-effort testing; workout observations, marketing claims, and construction alone are insufficient.
- **Conflicting-evidence policy:** Record distance and runner context even though v1 stores one score. If distance dependence would cross major anchor bands, lower confidence or leave unknown.
- **Confidence cues:** Race-effort evidence across multiple relevant distances or reviewers increases confidence.
- **Score origin:** **Partially derived later** is recommended, but direct race evidence must remain a distinct input.

### Walking

- **Version:** Metric Scoring Methodology v1.
- **Definition:** Suitability for repeated walking, including comfort, control, transition, fit, and durability at walking loads and speeds.
- **What it is not:** Running comfort copied directly, softness, lifestyle appearance, or medical or occupational footwear advice.
- **Evidence:** Direct walking observations, low-speed transition, standing comfort where relevant, platform stability, flexibility, fit, outsole durability, and objective geometry may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Functionally unsuitable or severely uncomfortable for ordinary walking. |
| 25 | Major comfort, control, fit, or transition limitations restrict walking use. |
| 50 | Adequate for ordinary walking with clear limitations over time or varied conditions. |
| 75 | Consistently comfortable, controlled, and natural for extended ordinary walking. |
| 100 | Exceptional walking suitability at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for stable low-speed behavior, comfortable fit, natural transition, durable contact surfaces, and sustained comfort. Move downward for unstable geometry, awkward rocker timing, restrictive stiffness, pressure, or poor walking durability.
- **Missing-data policy:** Leave unknown when all evidence comes from running; do not assume running performance transfers to walking.
- **Conflicting-evidence policy:** Separate walking duration, standing use, and fit context. Do not let lifestyle preference determine functional suitability.
- **Confidence cues:** Direct extended-walking observations increase confidence.
- **Score origin:** **Partially derived later** may be useful, but walking-specific editorial evidence is required.

### Beginner

- **Version:** Metric Scoring Methodology v1.
- **Definition:** How forgiving, accessible, and broadly useful the shoe is for a relatively inexperienced runner, considering ease of use, stability, comfort, durability, versatility, and whether specialized mechanics are required.
- **What it is not:** Low price, slow pace, maximum support, walking suitability, or a claim that all beginners have the same needs.
- **Evidence:** Broad-use testing, transition predictability, stability, fit tolerance, comfort, durability, versatility, objective geometry, and observations about technique sensitivity may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Requires highly specialized mechanics or presents severe usability limitations for an inexperienced runner. |
| 25 | Demands notable adaptation or has major fit, control, durability, or versatility limitations. |
| 50 | Usable by many newer runners but with clear caveats or a narrower-than-typical suitable context. |
| 75 | Forgiving, predictable, comfortable, and broadly useful without requiring specialized mechanics. |
| 100 | Exceptionally accessible and broadly forgiving at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for predictable transitions, broad fit tolerance, stability without intrusion, versatility, comfort, and durability. Move downward for technique sensitivity, unstable or harsh behavior, fragile construction, narrow specialization, or demanding fit.
- **Missing-data policy:** Leave unknown when evidence does not address accessibility, adaptation, or broad usability.
- **Conflicting-evidence policy:** Do not treat reviewer experience as beginner evidence. Give greater weight to observations that explicitly assess forgiveness or technique sensitivity.
- **Confidence cues:** Evidence from varied experience levels and repeated ordinary use supports confidence.
- **Score origin:** **Primarily editorial** in v1. Partial derivation may help later, but the concept cannot be reduced safely to other scores alone.

### Heavier runner

- **Version:** Metric Scoring Methodology v1.
- **Definition:** How well the shoe is expected to maintain cushioning, structure, stability, ride quality, and durability under increased loading, without a hard bodyweight threshold.
- **What it is not:** A support-category proxy, a weight-limit claim, a judgment about the runner, or an inference from stack height alone.
- **Evidence:** Direct observations under varied loading, compression and recovery behavior, platform geometry, stability, midsole volume, outsole and upper structure, durability, and repeated reviewer observations may inform the score.

| Score | Behavioral anchor |
| --- | --- |
| 0 | Structure or ride fails to function under modestly increased loading. |
| 25 | Cushioning, stability, structure, or durability degrades materially under increased loading. |
| 50 | Maintains broadly typical function under increased loading, with identifiable limitations. |
| 75 | Consistently maintains cushioning, structure, control, ride, and durability under increased loading. |
| 100 | Exceptional load tolerance and functional retention at the extreme high end of the comparison universe. |

- **Scoring guidance:** Move upward for resistance to bottoming out, controlled deformation, broad stable geometry, secure upper structure, and retained durability. Move downward for collapse, instability, rapid ride degradation, inadequate structure, or load-sensitive fit problems.
- **Missing-data policy:** Leave unknown when no evidence reasonably addresses increased loading. Do not infer from canonical support, stack, or shoe mass alone.
- **Conflicting-evidence policy:** Record tester context when available without creating a hard threshold. Unexplained load-dependent disagreement should lower confidence or block scoring.
- **Confidence cues:** Direct evidence across varied loading and longer-term use is especially important; construction-only proposals remain low confidence.
- **Score origin:** **Primarily editorial** in v1. It may be partially derived later only after load-relevant evidence and validation exist.

## Metric overlap and double-counting risks

Approved metrics remain separate, but downstream ranking and matching formulas must not treat correlated fields as independent evidence automatically.

| Metric pair or group | Classification | Control |
| --- | --- | --- |
| Cushioning and comfort | Somewhat overlapping but useful | Cushioning measures underfoot protection; comfort covers the whole wearing and running experience. Do not raise comfort solely because cushioning is high. |
| Cushioning and ground feel | Clearly distinct but often inversely correlated | Preserve directionality. Ground feel measures surface information, not lack of protection. |
| Responsiveness and energy return | High risk of double-counting | Require separate rationales: transition/reaction for responsiveness, rebound/recovery for energy return. Never copy one score to the other. |
| Durability and value | Somewhat overlapping but useful | Value may use durability as evidence. A future formula must not fully weight durability twice. |
| Comfort, daily training, long run, walking, and beginner | High risk of double-counting | Suitability rationales may cite comfort, but downstream formulas must recognize the shared evidence. |
| Responsiveness, energy return, speed workout, and racing | High risk of double-counting | Workout and racing suitability are outcomes. Future derivation must disclose how the two evaluative drivers already contribute. |
| Daily training and long run | Somewhat overlapping but useful | Daily training emphasizes repeated broad use; long run emphasizes sustained behavior under duration and fatigue. |
| Speed workout and racing | Somewhat overlapping but useful, with high formula risk | Training usability and race-effort performance are not interchangeable. |
| Stability, beginner, walking, and heavier runner | High risk of double-counting | Each use case includes control but has distinct context. Future formulas need contribution caps or an outcome-versus-driver choice. |
| Cushioning, long run, and heavier runner | High risk of double-counting | High cushioning alone cannot determine either use-case score. |

### Derived versus editorial recommendation

| Use-case metric | V1 treatment | Future recommendation |
| --- | --- | --- |
| `daily_training` | Reviewed editorial score | Partially derived later from selected evaluative evidence plus direct routine-use observations. |
| `long_run` | Reviewed editorial score | Partially derived later, retaining direct sustained-run and fatigue evidence. |
| `speed_workout` | Reviewed editorial score | Partially derived later, with safeguards against duplicating responsiveness and energy return. |
| `racing` | Reviewed editorial score | Partially derived later, retaining race-effort and context evidence. |
| `walking` | Reviewed editorial score | Partially derived later, but require walking-specific observations. |
| `beginner` | Reviewed editorial score | Primarily editorial; use other metrics as evidence, not a complete formula. |
| `heavier_runner` | Reviewed editorial score | Primarily editorial until sufficient load-relevant evidence supports validation. |

No derivation formula or weight is approved by this document.

## Pilot review worksheet

Collect and verify sources first using `docs/EVIDENCE_COLLECTION.md`, `data/pilot/pilot-evidence.csv`, and `data/pilot/pilot-evidence-coverage.csv`.

Use `data/templates/metric-review-template.csv` as the human working file. One row represents one shoe/metric review, not one shoe. Add a metric row only when evidence collection begins; do not create placeholder score rows in the database.

The worksheet records shoe identity, methodology version, objective facts, categorized evidence, source references, proposed score, rationale, confidence, conflicts or missing-data reason, reviewer, date, review status, and conditional second-review fields.

Recommended `review_status` values are `not_started`, `evidence_collected`, `proposed`, `peer_reviewed`, and `approved`. An approved worksheet row still does not make a database row public.

Only approved rows with a proposed score should be copied into `data/templates/shoe-metrics-import-template.csv`. Use `metric-v1:scoring-methodology-v1`, preserve source references, leave numeric database confidence blank during the pilot, choose `verification_status` deliberately, and keep `is_public = false` until publication is separately authorized.

## Versioning and historical integrity

`Metric Scoring Methodology v1` corresponds to `metric_version = metric-v1:scoring-methodology-v1`. Every metric section above uses that version.

A future methodology must:

1. Receive a new document and identifier, such as `Metric Scoring Methodology v2` and `metric-v2:scoring-methodology-v2`.
2. Define whether the vocabulary, anchors, evidence rules, or score construction changed.
3. Create new metric observations rather than overwriting public historical rows.
4. Preserve the prior methodology document so old scores remain interpretable.
5. Update importer validation and database constraints additively if the accepted vocabulary or version namespace changes.

Historical scores must never be silently reinterpreted under a newer methodology.
