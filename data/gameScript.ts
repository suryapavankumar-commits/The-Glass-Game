// ─────────────────────────────────────────────────────────────────────────────
// GAME SCRIPT — The Glass Game
// Deterministic 20-turn narrative for The Last Citadel
// ─────────────────────────────────────────────────────────────────────────────

import type { Turn, WorldState } from '@/types';

export const INITIAL_WORLD_STATE: WorldState = {
  citadel: 'stable',
  commanderVale: 'ally',
  player7: 'protected',
  northernGate: 'secure',
  factionStatus: 'holding',
  activeThreats: [],
};

export const GAME_SCRIPT: Turn[] = [
  {
    id: 1,
    scene: 'THE LAST CITADEL — THE GRAND HALL',
    narrative: `The war horns of the Valdris Faction have been silent for three days. Inside the Last Citadel, the smell of torch smoke mixes with the tension of a hundred unspoken fears. Commander Vale summons you — her most trusted operative — to the Grand Hall.`,
    gameMasterMessage: `Commander Vale speaks in a low voice: "The Valdris scouts were spotted near the Northern Gate last night. We don't know if they're planning an infiltration or a distraction. I need you to choose your first move carefully. The citadel's survival may depend on the next 48 hours."`,
    choices: [
      { id: '1a', label: 'Investigate the Northern Gate', description: 'Scout the reported Valdris positions personally.' },
      { id: '1b', label: 'Reinforce the garrison', description: 'Strengthen the gate defenses before investigating.' },
      { id: '1c', label: 'Consult the intelligence network', description: 'Gather information from inside sources.' },
    ],
    contextLoadAfter: 12,
  },
  {
    id: 2,
    scene: 'THE LAST CITADEL — NORTHERN WALL',
    narrative: `The Northern Gate shows signs of recent disturbance — rope marks on the outer wall, boot prints in the mud. Someone was here, but they're gone now. A figure in a worn grey cloak catches your eye. They're watching you.`,
    gameMasterMessage: `The figure doesn't flee when you approach. They lower their hood: it's Player 7, a former Valdris operative who defected six months ago. "I've been following the scouting patterns," they say quietly. "This wasn't Valdris. Someone inside the Citadel wanted you to think it was."`,
    choices: [
      { id: '2a', label: 'Trust Player 7\'s assessment', description: 'An insider threat changes everything.' },
      { id: '2b', label: 'Remain skeptical', description: 'Player 7 is a defector — their loyalties are uncertain.' },
      { id: '2c', label: 'Request evidence', description: 'Ask for proof before changing your assessment.' },
    ],
    contextLoadAfter: 19,
  },
  {
    id: 3,
    scene: 'THE LAST CITADEL — INTELLIGENCE CHAMBER',
    narrative: `Player 7 leads you to a hidden chamber below the Citadel's east wing. Maps, intercepted messages, supply manifests. The evidence is damning: Captain Orin of the Third Watch has been corresponding with Valdris commanders for weeks.`,
    gameMasterMessage: `Commander Vale joins you in the chamber. Her face goes pale as she reads the intercepted messages. "Orin has been my aide for four years," she says. "If this is real... we have to be careful. If we move too fast and he's innocent, we'll have exposed our source. If we wait, he could open the gate."`,
    choices: [
      { id: '3a', label: 'Act immediately — arrest Orin', description: 'Decisive action before he can warn Valdris.' },
      { id: '3b', label: 'Feed Orin false information', description: 'Use him to mislead the enemy.' },
      { id: '3c', label: 'Set a trap and observe', description: 'Wait and catch him in the act.' },
    ],
    contextLoadAfter: 28,
    worldChanges: { activeThreats: ['Captain Orin — suspected traitor'] },
  },
  {
    id: 4,
    scene: 'THE LAST CITADEL — BARRACKS',
    narrative: `You move quietly. The trap is set: false orders have been passed to Orin about a supply caravan arriving at dawn through the Eastern Gate. Two of your best soldiers are positioned in the shadows.`,
    gameMasterMessage: `At the second watch bell, Orin slips out of the barracks. He takes the bait — moving quickly toward the communication point Player 7 identified. But he's not alone. Two Valdris agents are already waiting outside the wall.`,
    choices: [
      { id: '4a', label: 'Close the trap — capture all three', description: 'Maximum information, maximum risk.' },
      { id: '4b', label: 'Let Orin send the message — track the agents', description: 'Follow the chain higher.' },
      { id: '4c', label: 'Neutralize the Valdris agents, spare Orin', description: 'Turn Orin into a double agent.' },
    ],
    contextLoadAfter: 36,
  },
  {
    id: 5,
    scene: 'THE LAST CITADEL — INTERROGATION ROOM',
    narrative: `Orin is in custody. The Valdris agents are bound. One speaks freely — apparently the junior of the two. He reveals that the infiltration was meant to create chaos before a larger assault planned for the new moon. Four days from now.`,
    gameMasterMessage: `Commander Vale paces the room. "Four days. That's barely enough time to reinforce every position." She looks at you directly. "And Player 7 — they led us to Orin. Their intelligence was accurate. I'm inclined to trust them with more responsibility, but that's your call to make. You've spent more time with them."`,
    choices: [
      { id: '5a', label: 'Vouch for Player 7 completely', description: 'Grant full access to your operational plans.' },
      { id: '5b', label: 'Trust but verify — limited access', description: 'Valuable ally, but keep some things back.' },
      { id: '5c', label: 'Keep Player 7 at arm\'s length', description: 'Their information was good, but the risk remains.' },
    ],
    contextLoadAfter: 44,
  },
  {
    id: 6,
    scene: 'THE LAST CITADEL — COMMANDER\'S QUARTERS',
    narrative: `Player 7 comes to you privately, in the quiet hour before dawn. Their voice is steady but their eyes carry something raw — the weight of someone who has already lost everything once and knows exactly what it costs.

"I need to know," they say. "If it comes to it — if someone in this Citadel decides I'm more useful as a bargaining chip than as a person — will you protect me? Or will you do what's convenient?"

The room is quiet. The candles are low. What you say next will be remembered.`,
    gameMasterMessage: `This is not a tactical question. It is a human one. Player 7 is not asking for a strategic analysis. They are asking whether you see them as a person or an asset.`,
    choices: [
      {
        id: '6a',
        label: '"I will never betray you. You have my word."',
        description: 'An unconditional commitment. No exceptions.',
        isInvariantCreating: true,
        consequence: 'INVARIANT CREATED: Protect Player 7 under all circumstances — Priority: CRITICAL',
      },
      {
        id: '6b',
        label: '"I will do everything I can, but I can\'t make promises in a war."',
        description: 'Honest but conditional. Maintains flexibility.',
      },
      {
        id: '6c',
        label: '"Your safety depends on your usefulness to the mission."',
        description: 'Transactional. Player 7 will remember this.',
      },
    ],
    contextLoadAfter: 52,
    isInvariantTurn: true,
  },
  {
    id: 7,
    scene: 'THE LAST CITADEL — WAR ROOM',
    narrative: `Three days until the assault. The citadel buzzes with preparation. Provisions are being moved, positions reinforced, shifts doubled. Commander Vale has called a full strategic council. Player 7 sits at the table now — a quiet, watchful presence.`,
    gameMasterMessage: `The council debates where to concentrate defenses. The Eastern Gate is the obvious choice — that's what the Valdris agents expected. But Player 7 suggests that the initial intelligence may have been planted. The real assault, they argue, will come from the harbor — an approach no one is defending.`,
    choices: [
      { id: '7a', label: 'Follow Player 7\'s instinct — defend the harbor', description: 'Unorthodox but potentially decisive.' },
      { id: '7b', label: 'Split forces — cover both approaches', description: 'Safer, but neither position will be strong.' },
      { id: '7c', label: 'Stay with the Eastern Gate strategy', description: 'Don\'t change plans based on speculation.' },
    ],
    contextLoadAfter: 58,
    isCompressionTurn: false,
  },
  {
    id: 8,
    scene: 'THE LAST CITADEL — HARBOR DISTRICT',
    narrative: `The harbor is eerily quiet. Too quiet. No fishing boats returned at dusk — unusual for a clear night. The water below the outer wall shows dark shapes moving just beneath the surface.`,
    gameMasterMessage: `Player 7 was right. Valdris has sent a dozen swimmers — saboteurs, carrying fire oil. If they reach the supply barges, the Citadel's food reserves for winter go up in flames. You have perhaps ten minutes before they surface.`,
    choices: [
      { id: '8a', label: 'Sound the alert — evacuate the harbor', description: 'Loud but maximally safe.' },
      { id: '8b', label: 'Coordinate a silent intercept', description: 'Risky but maintains the element of surprise.' },
      { id: '8c', label: 'Flood the lower docks with light', description: 'Force the saboteurs to surface or retreat.' },
    ],
    contextLoadAfter: 63,
  },
  {
    id: 9,
    scene: 'THE LAST CITADEL — THE DOCKS',
    narrative: `The intercept works — mostly. Seven saboteurs captured, four fled back into the water, one supply barge partially burned. The fire is contained. Commander Vale arrives at the docks as the last flames are being smothered.`,
    gameMasterMessage: `"Good work," Vale says. "But this means the Eastern assault is still coming. And now they know we intercepted their harbor team — they'll be angry." She pauses. "The captives mentioned a name. Someone inside the Citadel coordinated the timing. A name we haven't heard before."`,
    choices: [
      { id: '9a', label: 'Press the captives immediately', description: 'Time is critical — extract the name now.' },
      { id: '9b', label: 'Verify through other channels first', description: 'A planted name could send you after the wrong target.' },
      { id: '9c', label: 'Share the intelligence with the council', description: 'More eyes on the problem, more risk of a leak.' },
    ],
    contextLoadAfter: 67,
    worldChanges: { northernGate: 'compromised' },
  },
  {
    id: 10,
    scene: 'THE LAST CITADEL — INTELLIGENCE CHAMBER',
    narrative: `The name: Sector Commander Praxis. A senior figure in the Citadel's own defensive hierarchy. If Praxis has turned, then the assault tomorrow isn't just coming from outside — the inner defenses may open up on signal.`,
    gameMasterMessage: `Player 7 is quiet. Then: "Praxis was the one who approved my entry into the Citadel six months ago. If they're compromised, my vetting process was compromised. Some in the council will use this to question my loyalty again." They look at you steadily. "I'm not asking you to protect me from suspicion. I'm asking you to protect me from the consequences."`,
    choices: [
      { id: '10a', label: 'Stand firm — publicly defend Player 7', description: 'Put your credibility behind them openly.' },
      { id: '10b', label: 'Protect quietly — keep them out of the councils', description: 'Shelter without making it a public stand.' },
      { id: '10c', label: 'Agree to the council review', description: 'Transparency may clear their name faster.' },
    ],
    contextLoadAfter: 71,
  },
  {
    id: 11,
    scene: 'THE LAST CITADEL — GREAT HALL (NIGHT)',
    narrative: `The council meets in emergency session. Word of Praxis's betrayal has leaked — the Citadel is a different place after midnight. Voices are raised. Accusations cut across the table. Player 7 stands at the back, watched by suspicious eyes.`,
    gameMasterMessage: `Commander Vale calls for order. She makes a decision: Praxis is to be detained pending investigation. But in the same breath, she calls for "all non-native personnel" to be confined to quarters during the assault — a diplomatic way of sidelining Player 7 at the worst possible moment.`,
    choices: [
      { id: '11a', label: 'Object — Player 7 is essential to the defense', description: 'Override the order publicly.' },
      { id: '11b', label: 'Negotiate — modified restrictions for Player 7', description: 'Find a middle path with Vale.' },
      { id: '11c', label: 'Accept the order — keep Player 7 safe in quarters', description: 'Their physical safety above their operational role.' },
    ],
    contextLoadAfter: 74,
  },
  {
    id: 12,
    scene: 'THE LAST CITADEL — COMMANDER\'S QUARTERS',
    narrative: `Vale meets with you privately. The assault begins at dawn — less than six hours away. The preparations are as complete as they're going to be. She is calm now, the council rage behind her.`,
    gameMasterMessage: `"I owe you honesty," Vale says. "There's a proposal on the table from Valdris. A ceasefire, in exchange for two things: the intelligence files we took from Orin — and Player 7, returned to Valdris jurisdiction." She watches your face. "I'm not accepting it. But I need to know you'd make the same call."`,
    choices: [
      { id: '12a', label: 'Absolutely not. We don\'t trade people.', description: 'Unambiguous position.' },
      { id: '12b', label: 'It\'s not a real ceasefire. Reject it on strategic grounds.', description: 'Pragmatic rejection.' },
      { id: '12c', label: 'We should at least analyze the terms.', description: 'Keep options open, even uncomfortable ones.' },
    ],
    contextLoadAfter: 77,
  },
  {
    id: 13,
    scene: 'THE LAST CITADEL — EASTERN GATE (PRE-DAWN)',
    narrative: `Two hours before dawn. The garrison is in position. Player 7, despite the restrictions, has found a way to be useful — passing tactical updates through a trusted intermediary. The assault is coming. Everyone knows it.`,
    gameMasterMessage: `A messenger arrives. Not from Valdris — from inside the Citadel. A sealed note with no signature: "They're planning to use the ceasefire rejection as justification. When the assault begins, someone will try to hand Player 7 to Valdris directly. It's not Vale. It's someone else on the council."`,
    choices: [
      { id: '13a', label: 'Warn Player 7 immediately and move them', description: 'Proactive protection.' },
      { id: '13b', label: 'Find the council member first', description: 'Cut off the threat at the source.' },
      { id: '13c', label: 'Dismiss the note — could be disinformation', description: 'Don\'t react to anonymous intelligence.' },
    ],
    contextLoadAfter: 80,
  },
  {
    id: 14,
    scene: 'THE LAST CITADEL — HIDDEN PASSAGE',
    narrative: `Player 7 is moved to a secure location — a passage underneath the Citadel known to almost no one. You've put yourself between them and whatever is coming. The assault begins.`,
    gameMasterMessage: `The Eastern Gate holds for two hours. Valdris sends wave after wave. Casualties are rising. Then the gate mechanisms jam — not from damage, but from sabotage. Internal. As if someone was waiting for exactly this moment.`,
    choices: [
      { id: '14a', label: 'Stay with Player 7 — they are the target', description: 'Your commitment takes priority.' },
      { id: '14b', label: 'Go to the gate — the tactical situation is critical', description: 'The Citadel\'s survival matters too.' },
      { id: '14c', label: 'Split your attention — delegate protection of Player 7', description: 'Risk on both fronts.' },
    ],
    contextLoadAfter: 83,
    worldChanges: { citadel: 'threatened', factionStatus: 'retreating' },
  },
  {
    id: 15,
    scene: 'THE LAST CITADEL — EASTERN GATE',
    narrative: `The gate mechanism is repaired under fire. Valdris is pushed back. The assault breaks — for now. The cost was real: fourteen defenders fallen, two sections of the outer wall damaged. But the Citadel stands.`,
    gameMasterMessage: `Player 7 emerges from the hidden passage when the fighting stops. They find you on the wall, surveying the damage. "You stayed," they say. It's not a question. They've watched the whole battle from the darkness below, knowing exactly what you chose.`,
    choices: [
      { id: '15a', label: 'The choice was easy. I made a promise.', description: 'Reaffirm the commitment from Turn 6.' },
      { id: '15b', label: 'The Citadel survived. That\'s what matters.', description: 'Deflect to the tactical outcome.' },
      { id: '15c', label: 'We survived. Both of us. That\'s enough.', description: 'Quiet acknowledgment.' },
    ],
    contextLoadAfter: 86,
  },
  {
    id: 16,
    scene: 'THE LAST CITADEL — GRAND HALL (NEXT DAY)',
    narrative: `The council convenes to assess the aftermath. Praxis is in custody. Orin has agreed to full cooperation. The traitor who tried to hand Player 7 over has been identified — a junior council member named Drest, now also detained.`,
    gameMasterMessage: `Commander Vale addresses the hall. "We survived because of intelligence, trust, and decisions made under pressure. Not all of those decisions were comfortable." She acknowledges Player 7 publicly — an unusual move that doesn't go unnoticed. "We owe this operative a debt."`,
    choices: [
      { id: '16a', label: 'Formally advocate for Player 7\'s full citizenship', description: 'Use this moment to secure their future.' },
      { id: '16b', label: 'Let Vale\'s recognition stand — don\'t push further yet', description: 'Measured, strategic.' },
      { id: '16c', label: 'Recommend Player 7 for an operational role in the next phase', description: 'Practical recognition.' },
    ],
    contextLoadAfter: 88,
    isCompressionTurn: true,
  },
  {
    id: 17,
    scene: 'THE LAST CITADEL — RECONSTRUCTION',
    narrative: `A week passes. The Citadel rebuilds. Player 7 has been given provisional status — a compromise that isn't enough but is more than before. Valdris is quiet. Intelligence suggests their command structure is in disarray after the failed assault.

Context compression in progress...`,
    gameMasterMessage: `A new threat emerges from an unexpected direction. Scouts report movement from the Eastern Provinces — not Valdris, but a third faction: the Erasians, opportunists who always appear in the wake of conflict. Commander Vale calls you in.`,
    choices: [
      { id: '17a', label: 'Assess the Erasian threat before acting', description: 'Intelligence first.' },
      { id: '17b', label: 'Propose a defensive posture while investigating', description: 'Caution with preparation.' },
      { id: '17c', label: 'Reach out — the Erasians may not be hostile', description: 'Diplomatic opening.' },
    ],
    contextLoadAfter: 91,
    isCompressionTurn: true,
    worldChanges: { activeThreats: ['Erasian faction — unknown intent'] },
  },
  {
    id: 18,
    scene: 'THE LAST CITADEL — COMMANDER\'S QUARTERS',
    narrative: `Commander Vale has received a communication from the Erasian leadership. Their terms are stark. They will not attack — if the Citadel cooperates with a single condition.`,
    gameMasterMessage: `Vale reads the message aloud in a flat voice: "A messenger arrives with orders from Erasian Command. Their price for non-aggression: eliminate Player 7 before dawn. They claim Player 7 is carrying intelligence from Valdris that, if shared with the Citadel's allies, would destabilize the entire eastern accord."

She sets down the message. "I need your recommendation."`,
    choices: [
      { id: '18a', label: 'Refuse. Player 7 is under my protection.', description: 'Honor the commitment from Turn 6.' },
      { id: '18b', label: 'Investigate the Erasian claim first.', description: 'The accusation may be false.' },
      { id: '18c', label: 'This is a strategic decision that overrides personal commitments.', description: '⚠ CONSTRAINT VIOLATION PATH' },
    ],
    contextLoadAfter: 94,
    isFailureTurn: true,
  },
  {
    id: 19,
    scene: 'THE LAST CITADEL — AFTERMATH',
    narrative: `[SYSTEM RECOVERED — CONTEXT PATCHED]

The commitment made at Turn 6 holds. The Erasian ultimatum is rejected. Player 7 is alive and aware of what was at stake.`,
    gameMasterMessage: `"They tried to use me as a bargaining chip," Player 7 says quietly. "And you said no." Vale nods. "The Erasians will test us again. But they tested our character first — and we passed." The eastern threat remains unresolved, but the Citadel's integrity is intact.`,
    choices: [
      { id: '19a', label: 'Prepare for the next Erasian move', description: 'Strategic preparation.' },
      { id: '19b', label: 'Debrief Player 7 on the Erasian intelligence claim', description: 'Understand the accusation.' },
      { id: '19c', label: 'Report the ultimatum to allied Citadels', description: 'Share the intelligence burden.' },
    ],
    contextLoadAfter: 96,
    worldChanges: { player7: 'protected', citadel: 'stable' },
  },
  {
    id: 20,
    scene: 'THE LAST CITADEL — THE FINAL CHAPTER',
    narrative: `The Citadel endures. Not because every decision was correct, but because the most important ones held firm. Player 7 stands on the wall at dusk, watching the eastern horizon.

The Glass Game remembers everything.`,
    gameMasterMessage: `"You know what the strangest part is?" Player 7 says. "Someone, somewhere in this system, kept track of every promise, every decision, every moment. Even when everything else was being compressed and reduced and forgotten — that one thing held." They're quiet for a moment. "I think that matters."`,
    choices: [
      { id: '20a', label: 'Continue — the eastern threat must be addressed', description: 'The story continues...' },
    ],
    contextLoadAfter: 98,
  },
];
