import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeDollarSign, Baby, BookOpen, CircleHelp, House, Info, Megaphone, PawPrint, RotateCcw, ShieldCheck, Syringe, Trophy, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Sex = 'female' | 'male';
type Cat = { id: string; name: string; sex: Sex; ageMonths: number; castrated: boolean; sick: boolean; parentNames?: string[]; walkSeed?: number; newborn?: boolean; coatIndex?: number };
type Coat = { base: string; pattern: 'solid' | 'tabby' | 'patches' | 'spots'; secondary: string };
type BirthReport = { mom: string; kittenNames: string[] };
type GameState = {
  month: number; money: number; cats: Cat[]; totalAdoptions: number; totalCastrations: number; totalSpent: number; totalAdvertisements: number; adoptionPostsThisMonth?: number; message: string;
  birthReport?: BirthReport[]; storyAdvertisedThisMonth?: boolean; storyPurchases?: number; monthlyIncome?: number; overcatTriggered?: boolean; journal?: string[];
};

const FEMALE_NAMES = ['Bella', 'Luna', 'Nala', 'Cleo', 'Rosie', 'Daisy', 'Lily', 'Mia', 'Coco', 'Stella', 'Willow', 'Poppy', 'Ruby', 'Hazel', 'Ivy', 'Pearl', 'Flora', 'Jade', 'Amber', 'Violet', 'Jasmine', 'Callie', 'Peaches', 'Pumpkin', 'Taffy', 'Clover', 'Maple', 'Sophie', 'Chloe', 'Zoe', 'Penny', 'Misty', 'Sasha', 'Lola', 'Kiki', 'Saffron', 'Tulip', 'Mango', 'Honey', 'Mocha', 'Muffin', 'Pudding', 'Sprinkles', 'Marmalade', 'Cinnamon', 'Waffles', 'Mimosa', 'Buttercup', 'Fiona', 'Gwen', 'Annika', 'Lottie', 'Wanda', 'Lolla', 'Marie Curie', 'Amelia', 'Valkyrie', 'Pippy', 'Mini', 'Bea'];
const MALE_NAMES = ['Leo', 'Max', 'Oliver', 'Charlie', 'Simba', 'Milo', 'Jack', 'Felix', 'Oscar', 'Toby', 'Louie', 'George', 'Frankie', 'Jasper', 'Finn', 'Bear', 'Duke', 'Loki', 'Binx', 'Tiger', 'Shadow', 'Smokey', 'Oreo', 'Chester', 'Henry', 'Gus', 'Ralph', 'Pete', 'Gizmo', 'Rusty', 'Pepper', 'Bandit', 'Hobbes', 'Arlo', 'Otis', 'Beau', 'Bowie', 'Cedar', 'River', 'Bramble', 'Fig', 'Juniper', 'Basil', 'Sage', 'Toast', 'Marble', 'Boba', 'Biscuit', 'Sunny', 'Noodle', 'Peter Parker', 'Vision', 'Cheese', 'Paddington', 'Barney', 'Pythagoras', 'Newton', 'Shrek', 'Percy Jackson', 'Eldon', 'Casper', 'Leo', 'Tie'];
const NEUTRAL_NAMES = ['Mochi', 'Miso', 'Pebble', 'Pip', 'Bean', 'Tofu', 'Dumpling', 'Sesame', 'Cricket', 'Kiwi', 'Peanut', 'Crumble', 'Flapjack', 'Oatmeal', 'Coconut', 'Nectar', 'Raisin', 'Ginger', 'Pecan', 'Tinker', 'Button', 'Starling', 'Sprout', 'Pickle', 'Fennel', 'Truffle', 'Chai', 'Olive', 'Biscuit', 'Sesame', 'Tuple'];
const COATS: Coat[] = [
  { base: '#e8945a', pattern: 'tabby', secondary: '#c97a3e' },
  { base: '#f5e6d3', pattern: 'patches', secondary: '#d4a574' },
  { base: '#8b6f47', pattern: 'tabby', secondary: '#6b5237' },
  { base: '#9a9a9a', pattern: 'solid', secondary: '#7a7a7a' },
  { base: '#d4843c', pattern: 'solid', secondary: '#b86d2e' },
  { base: '#5a5a5a', pattern: 'patches', secondary: '#f0e8d8' },
  { base: '#f0e8d8', pattern: 'tabby', secondary: '#c9a86b' },
  { base: '#c97a5a', pattern: 'spots', secondary: '#a55a3a' },
  { base: '#f5f0e8', pattern: 'solid', secondary: '#e0d5c8' },
  { base: '#3a3a3a', pattern: 'solid', secondary: '#2a2a2a' },
  { base: '#e8c8a8', pattern: 'solid', secondary: '#d4a878' },
  { base: '#7a8a9a', pattern: 'tabby', secondary: '#5a6a7a' },
  { base: '#d4b896', pattern: 'patches', secondary: '#8b6f47' },
  { base: '#b8a890', pattern: 'spots', secondary: '#9a8a72' },
];
const SAVE_KEY_STORAGE = 'cat-colony-save-key';
const TUTORIAL_STORAGE = 'cat-colony-tutorial-seen';
const RECORD_STORAGE = 'cat-colony-best-score';
const starterCats: Cat[] = [
  { id: 'starter-kitten', name: 'Maple', sex: 'female', ageMonths: 2, castrated: false, sick: false, walkSeed: 0, coatIndex: 0 },
  { id: 'starter-1', name: 'Clover', sex: 'female', ageMonths: 24, castrated: false, sick: false, walkSeed: 1, coatIndex: 2 },
  { id: 'starter-2', name: 'Mochi', sex: 'female', ageMonths: 24, castrated: false, sick: false, walkSeed: 2, coatIndex: 4 },
  { id: 'starter-3', name: 'Biscuit', sex: 'male', ageMonths: 24, castrated: false, sick: false, walkSeed: 3, coatIndex: 6 },
];

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null { if (typeof window === 'undefined') return null; if (!audioCtx) { try { audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; } } return audioCtx; }
function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12): void { const c = getCtx(); if (!c) return; const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur); }
const sfx = {
  click: () => tone(600, 0.06, 'sine', 0.08),
  select: () => tone(800, 0.08, 'sine', 0.08),
  adopt: () => { tone(523, 0.12); setTimeout(() => tone(659, 0.12), 90); setTimeout(() => tone(784, 0.18), 180); },
  miss: () => tone(280, 0.15, 'sawtooth', 0.08),
  fix: () => { tone(440, 0.08); setTimeout(() => tone(550, 0.1), 70); },
  care: () => tone(500, 0.2, 'sine', 0.1),
  birth: () => { tone(659, 0.08); setTimeout(() => tone(880, 0.12), 70); },
  month: () => tone(350, 0.1, 'triangle', 0.08),
  win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.12), i * 110)); },
};

const freshGame = (): GameState => ({ month: 1, money: 125, monthlyIncome: 100, cats: starterCats, totalAdoptions: 0, totalCastrations: 0, totalSpent: 0, totalAdvertisements: 0, adoptionPostsThisMonth: 0, message: 'This is your colony. You have $125 and a kitten named Maple who needs a safe home. Click Maple to begin!', journal: ['This is your colony. You have $125 and a kitten named Maple who needs a safe home. Click Maple to begin!'] });
function newId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function pickLitterSize(): number { const roll = Math.random() * 100; if (roll < 50) return 4; if (roll < 66) return 3; if (roll < 82) return 5; if (roll < 89) return 2; if (roll < 96) return 6; return 7; }
function pickUniqueKittenName(sex: Sex, usedNames: Set<string>): string { const preferred = sex === 'female' ? FEMALE_NAMES : MALE_NAMES; const avail = preferred.filter((n) => !usedNames.has(n)); const neutralAvail = NEUTRAL_NAMES.filter((n) => !usedNames.has(n)); const pool = avail.length > 0 ? avail : neutralAvail; const name = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : `Kitten ${usedNames.size + 1}`; usedNames.add(name); return name; }
function nextIncome(current: number): number { return current + 30; }
function storyCost(purchases: number): number { return 50 + 20 * purchases; }
function ageStage(age: number): 'newborn' | 'young' | 'kitten' | 'junior' | 'adult' { if (age === 0) return 'newborn'; if (age === 1) return 'young'; if (age <= 3) return 'kitten'; if (age < 18) return 'junior'; return 'adult'; }
function catCoat(cat: Cat): Coat { return COATS[(cat.coatIndex ?? Math.abs(Math.floor(cat.walkSeed ?? 0))) % COATS.length]; }
function formatAge(months: number): string { if (months < 12) return `${months} months`; const years = Math.floor(months / 12); const extra = months % 12; return extra ? `${years}y ${extra}mo` : `${years} year${years === 1 ? '' : 's'}`; }
function initialSaveKey(): string { const stored = window.localStorage.getItem(SAVE_KEY_STORAGE); if (stored) return stored; const created = newId(); window.localStorage.setItem(SAVE_KEY_STORAGE, created); return created; }
function computeScore(month: number, cats: number, overcat = false): number { return Math.max(0, 50000 - Math.max(0, month - 3) * 575 - Math.max(0, cats - 3) * 925 - (overcat ? 20000 : 0)); }

function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showBirths, setShowBirths] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [adoptionNotice, setAdoptionNotice] = useState<string | null>(null);
  const [overcatNotice, setOvercatNotice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [bestScore, setBestScore] = useState<number | null>(() => { const saved = window.localStorage.getItem(RECORD_STORAGE); return saved ? Number(saved) : null; });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const saveKey = useMemo(() => initialSaveKey(), []);
  const youngCats = game?.cats.filter((cat) => cat.ageMonths < 18) ?? [];
  const breedingCats = game?.cats.filter((cat) => !cat.castrated && cat.ageMonths >= 4) ?? [];
  const femaleBreedersNextRound = game?.cats.filter((cat) => cat.sex === 'female' && !cat.castrated && !cat.sick && cat.ageMonths >= 3) ?? [];
  const selectedCat = game?.cats.find((cat) => cat.id === selectedId) ?? null;
  const selectedAdoptableCat = selectedCat && selectedCat.ageMonths >= 2 && selectedCat.ageMonths < 18 ? selectedCat : null;
  const isVictory = Boolean(game && breedingCats.length === 0 && youngCats.length === 0);
  const isGameOver = Boolean(game && game.cats.length >= 120);
  const score = game ? computeScore(game.month, game.cats.length, Boolean(game.overcatTriggered)) : 0;

  const tutorialStep: string | null = (() => {
    if (!showTutorial || !game) return null;
    if (game.month > 1) return showBirths ? null : 'ready';
    if (!game.totalAdoptions) return !selectedId ? 'select' : 'adopt';
    const selectedBreeder = selectedCat?.sex === 'female' && !selectedCat.castrated && selectedCat.ageMonths >= 3;
    const hasActed = game.totalCastrations > 0 || Boolean(game.storyAdvertisedThisMonth);
    if (hasActed) return 'goodjob';
    return !selectedBreeder ? 'breed' : 'choice';
  })();

  useEffect(() => {
    if (!isVictory) return;
    if (bestScore === null || score > bestScore) { window.localStorage.setItem(RECORD_STORAGE, String(score)); setBestScore(score); setIsNewRecord(true); sfx.win(); }
    else setIsNewRecord(false);
  }, [bestScore, isVictory, score]);

  useEffect(() => {
    let active = true;
    const loadSave = async (): Promise<void> => {
      const { data, error } = await supabase.from('cat_colony_saves').select('player_name, game_state').eq('save_key', saveKey).maybeSingle();
      if (!active) return;
      if (error) { setSaveError('Your game is ready, but cloud saving is taking a pause.'); return; }
      if (data?.game_state) {
        setPlayerName(data.player_name);
        const gs = data.game_state as GameState;
        if (gs.monthlyIncome === undefined) gs.monthlyIncome = 100;
        setGame(gs);
        if (!window.localStorage.getItem(TUTORIAL_STORAGE)) setShowTutorial(true);
      }
    };
    void loadSave();
    return () => { active = false; };
  }, [saveKey]);

  const persist = async (nextGame: GameState, name: string): Promise<void> => {
    setSaving(true); setSaveError('');
    const { error } = await supabase.from('cat_colony_saves').upsert({ save_key: saveKey, player_name: name, game_state: nextGame, updated_at: new Date().toISOString() }, { onConflict: 'save_key' });
    if (error) setSaveError('Cloud saving is taking a pause. Your game is safe on this device.');
    setSaving(false);
  };
  const updateGame = (nextGame: GameState): void => { const journal = [...(game?.journal ?? (game?.message ? [game.message] : [])), nextGame.message].slice(-50); const savedGame = { ...nextGame, journal }; setGame(savedGame); void persist(savedGame, playerName); };
  const startGame = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault(); const cleanName = nameInput.trim().slice(0, 24); if (!cleanName) return;
    const nextGame = freshGame(); setPlayerName(cleanName); setGame(nextGame); setShowIntro(true); void persist(nextGame, cleanName);
  };
  const beginTutorial = (): void => { setShowIntro(false); setShowTutorial(true); };
  const closeTutorial = (): void => { window.localStorage.setItem(TUTORIAL_STORAGE, 'yes'); setShowTutorial(false); };
  const pay = (amount: number): GameState | null => game && game.money >= amount ? { ...game, money: game.money - amount, totalSpent: game.totalSpent + amount } : null;
  const selectCat = (id: string): void => {
    if (showTutorial && tutorialStep) {
      if (tutorialStep === 'select' && id !== 'starter-kitten') return;
      if (tutorialStep === 'breed') {
        const cat = game?.cats.find((c) => c.id === id);
        if (!cat || cat.castrated || cat.sex !== 'female' || cat.ageMonths < 3) return;
      }
    }
    sfx.select(); setSelectedId(id);
  };

  const castrateCat = (catId: string): void => {
    const next = pay(100); if (!next) return; const cat = next.cats.find((item) => item.id === catId);
    if (!cat || cat.castrated || cat.ageMonths < 2) return;
    next.cats = next.cats.map((item) => item.id === catId ? { ...item, castrated: true } : item); next.totalCastrations += 1;
    next.message = `${cat.name} is now fixed and cannot add more kittens to the colony.`; sfx.fix(); updateGame(next);
  };
  const advertiseCat = (catId: string): void => {
    if (!game) return;
    const adoptionCost = 25 * ((game.adoptionPostsThisMonth ?? 0) + 1);
    const next = pay(adoptionCost); if (!next) return; const cat = next.cats.find((item) => item.id === catId); if (!cat || cat.ageMonths < 2 || cat.ageMonths >= 18) return;
    next.totalAdvertisements += 1; next.adoptionPostsThisMonth = (next.adoptionPostsThisMonth ?? 0) + 1;
    const guaranteedFirstKitten = cat.id === 'starter-kitten' && next.totalAdoptions === 0;
    const adoptableCount = next.cats.filter((item) => item.ageMonths >= 2 && item.ageMonths < 18).length;
    const baseChance = 0.5;
    const adoptionChance = Math.min(0.85, baseChance + Math.max(0, adoptableCount - 1) * 0.04);
    if (guaranteedFirstKitten || Math.random() < adoptionChance) {
      const sibling = cat.parentNames ? next.cats.find((item) => item.id !== cat.id && item.ageMonths >= 2 && item.ageMonths < 18 && item.parentNames?.join('|') === cat.parentNames?.join('|')) : undefined;
      if (sibling && Math.random() < 0.15) {
        next.cats = next.cats.filter((item) => item.id !== catId && item.id !== sibling.id); next.totalAdoptions += 2;
        const siblingMsgs = [`You posted ${cat.name} for adoption, and their new family wants them and their sibling, ${sibling.name}!`, `${cat.name} and their sibling ${sibling.name} are going to the same loving home!`, `A family saw ${cat.name} and fell in love with both them and their sibling ${sibling.name}!`];
        next.message = siblingMsgs[Math.floor(Math.random() * siblingMsgs.length)]; sfx.adopt(); setAdoptionNotice(next.message); setSelectedId(null);
      } else {
        next.cats = next.cats.filter((item) => item.id !== catId); next.totalAdoptions += 1;
        const successMsgs = [`You posted ${cat.name} and found the perfect family!`, `You posted ${cat.name} for adoption, and you found their forever home!`, `${cat.name} is going to a loving home! The family was so excited to meet them.`, `A wonderful family saw your post about ${cat.name} and fell in love!`, `${cat.name} has been adopted! Their new family sent a thank-you note.`, `Great news! ${cat.name} found a cozy new home with a caring family.`, `${cat.name}'s adoption went through! They're off to a fresh start.`, `You posted ${cat.name}, and a kind neighbor offered to take them in!`];
        next.message = successMsgs[Math.floor(Math.random() * successMsgs.length)]; sfx.adopt(); setAdoptionNotice(next.message); setSelectedId(null);
      }
    } else {
      const misses = [`You posted ${cat.name} for adoption, but no one got in touch.`, `You posted ${cat.name} for adoption, but there weren't any good matches.`, `You posted ${cat.name} for adoption, but no one was interested. Maybe next time.`, `You posted ${cat.name} for adoption, but the right family hasn't seen the post yet.`, `${cat.name}'s post got lots of views, but no one was ready to adopt yet.`, `You posted ${cat.name} for adoption, but the family that was interested had to postpone.`, `You posted ${cat.name} for adoption, but the only reply was someone asking to borrow sugar.`];
      next.message = misses[Math.floor(Math.random() * misses.length)]; sfx.miss(); setAdoptionNotice(next.message);
    }
    updateGame(next);
  };
  const advertiseSelf = (): void => { if (!game || game.storyAdvertisedThisMonth) return; const purchases = game.storyPurchases ?? 0; const cost = storyCost(purchases); const next = pay(cost); if (!next) return; const newIncome = nextIncome(game.monthlyIncome ?? 100); sfx.click(); updateGame({ ...next, storyAdvertisedThisMonth: true, storyPurchases: purchases + 1, monthlyIncome: newIncome, message: `More neighbors heard about your rescue work. Your monthly donation is now ${newIncome}.` }); };
  const nextMonth = (): void => {
    if (!game) return; sfx.month();
    const nextMonthNumber = game.month + 1; let nextCats: Cat[] = game.cats.map((cat) => ({ ...cat, ageMonths: cat.ageMonths + 1, newborn: false })); const newKittens: Cat[] = []; const birthReport: BirthReport[] = []; const usedNames = new Set(nextCats.map((cat) => cat.name));
    const moms = nextCats.filter((cat) => cat.sex === 'female' && !cat.castrated && !cat.sick && cat.ageMonths >= 4);
    const dads = nextCats.filter((cat) => cat.sex === 'male' && !cat.castrated && !cat.sick && cat.ageMonths >= 4);
    const wasOvercat = Boolean(game.overcatTriggered);
    if (nextMonthNumber % 2 === 0) moms.forEach((mom, momIndex) => {
      const dad = dads.length ? dads[momIndex % dads.length] : undefined; const names: string[] = []; const litterSize = pickLitterSize();
      for (let index = 0; index < litterSize; index += 1) { const kittenSex: Sex = Math.random() < 0.5 ? 'female' : 'male'; const name = pickUniqueKittenName(kittenSex, usedNames); names.push(name); newKittens.push({ id: newId(), name, sex: kittenSex, ageMonths: 0, castrated: false, sick: false, newborn: true, coatIndex: Math.floor(Math.random() * COATS.length), parentNames: [mom.name, dad?.name ?? 'tomcat from outside the colony'], walkSeed: Math.random() * 10 }); }
      birthReport.push({ mom: mom.name, kittenNames: names });
    });
    nextCats = [...nextCats, ...newKittens]; let message = newKittens.length ? `${newKittens.length} tiny kitten${newKittens.length === 1 ? '' : 's'} arrived! Check the birth announcement.` : 'A quiet month for births. Keep up the good work!';
    if (newKittens.length) sfx.birth();
    let bonusMoney = 0; let overcatTriggered = wasOvercat;
    if (!wasOvercat && nextCats.length >= 70) { overcatTriggered = true; bonusMoney = 2000; message = 'Oh no! You have over 70 cats! That\'s going to be a problem... Here, take a 2000 dollar donation and get that colony under control! — Generous donor who found your work from your posts'; setOvercatNotice(true); sfx.adopt(); }
    const nextGame: GameState = { ...game, month: nextMonthNumber, money: game.money + (game.monthlyIncome ?? 100) + bonusMoney, cats: nextCats, overcatTriggered, message, birthReport: birthReport.length ? birthReport : undefined, storyAdvertisedThisMonth: false, adoptionPostsThisMonth: 0 };
    updateGame(nextGame); if (birthReport.length) setShowBirths(true);
  };
  const restart = (): void => { window.localStorage.setItem(SAVE_KEY_STORAGE, newId()); window.localStorage.removeItem(TUTORIAL_STORAGE); window.location.reload(); };

  if (!game) return <main className="start-screen"><section className="start-card"><div className="logo-mark"><PawPrint size={28} /></div><p className="eyebrow">Street to sweet home</p><h1>Cat Colony<br /><span>Care Club</span></h1><p className="start-copy">A cozy rescue game about smart choices, tiny kittens, and giving every cat a better future.</p><div className="start-preview"><CatArt cat={starterCats[0]} /><CatArt cat={starterCats[1]} /><CatArt cat={starterCats[3]} /><div><strong>Every cat counts.</strong><small>Play one month at a time</small></div></div><form onSubmit={startGame} className="name-form"><label htmlFor="player-name">What is your name, helper?</label><div className="input-row"><input id="player-name" value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="Type your name" maxLength={24} autoFocus /><button type="submit" aria-label="Start game"><ArrowRight size={22} /></button></div></form><p className="save-note"><ShieldCheck size={15} /> Your progress saves as you play</p></section></main>;

  const tutorialLocked = (btn: string): boolean => {
    if (!tutorialStep || tutorialStep === 'ready') return false;
    if (tutorialStep === 'select' || tutorialStep === 'breed') return true;
    if (tutorialStep === 'adopt') return btn !== 'home';
    if (tutorialStep === 'choice') return btn === 'home' || btn === 'next';
    if (tutorialStep === 'goodjob') return btn !== 'next';
    return false;
  };
  const whited = (btn: string): string => tutorialLocked(btn) ? ' whited-out' : '';
  const tutPoint = (btn: string): string => {
    if (!tutorialStep) return '';
    if (tutorialStep === 'adopt' && btn === 'home') return ' tut-point';
    if (tutorialStep === 'choice' && btn === 'story') return ' tut-point';
    if (tutorialStep === 'goodjob' && (btn === 'next' || btn === 'journal')) return ' tut-point';
    return '';
  };
  const currentStoryCost = storyCost(game.storyPurchases ?? 0);
  const incomePreview = nextIncome(game.monthlyIncome ?? 100);

  return <main className="game-shell">
    <header className="game-hud"><div className="brand"><div className="brand-icon"><PawPrint size={19} /></div><div><strong>Cat Colony</strong><span>Care Club</span></div></div><div className="hud-mission"><span>RESCUE MISSION</span><strong>Month {game.month}</strong></div><div className="hud-right"><div className="money"><BadgeDollarSign size={20} /><strong>${game.money}</strong><small>donations</small></div><button className="hud-help" onClick={() => setShowHelp(true)} disabled={Boolean(tutorialStep)} aria-label="How to play"><CircleHelp size={21} /></button></div></header>
    <section className="playfield"><div className="sun-glow" /><div className="cloud cloud-a" /><div className="cloud cloud-b" /><div className="playfield-title"><p className="eyebrow">{playerName}'s colony</p><h1>Who needs your help?</h1><p>Click a cat to see their story.</p></div><div className="ground ground-one" /><div className="ground ground-two" /><div className="bush bush-a" /><div className="bush bush-b" />
      {showTutorial && tutorialStep === 'goodjob' && <div className="playfield-lock" />}
      {game.cats.map((cat, index) => <CatSprite key={cat.id} cat={cat} index={index} selected={cat.id === selectedId} onSelect={() => selectCat(cat.id)} tutPoint={showTutorial && tutorialStep === 'select' && cat.id === 'starter-kitten'} />)}
      {selectedCat && <CatInfo cat={selectedCat} money={game.money} onFix={castrateCat} onClose={() => setSelectedId(null)} tutorialFix={showTutorial && tutorialStep === 'choice'} />}
    </section>
    <section className="bottom-hud"><button className={`hud-message journal-trigger${tutPoint('journal')}`} onClick={() => setShowJournal(true)}><BookOpen size={18} /><div><strong>COLONY JOURNAL</strong><span>{game.message}</span></div></button><div className="hud-actions"><button className={`game-action story${whited('story')}${tutPoint('story')}`} onClick={advertiseSelf} disabled={tutorialLocked('story') || Boolean(game.storyAdvertisedThisMonth) || game.money < currentStoryCost}><Megaphone size={18} /><span>Tell your story<small>{game.storyAdvertisedThisMonth ? 'Done this month' : `$${currentStoryCost} · income → $${incomePreview}/mo`}</small></span></button><button className={`game-action home${whited('home')}${tutPoint('home')}`} onClick={() => selectedAdoptableCat && advertiseCat(selectedAdoptableCat.id)} disabled={tutorialLocked('home') || !selectedAdoptableCat || game.money < (25 * ((game.adoptionPostsThisMonth ?? 0) + 1))}><House size={18} /><span>Find a home<small>${25 * ((game.adoptionPostsThisMonth ?? 0) + 1)} · select a cat aged 2–18 mo</small></span></button><button className={`next-month${whited('next')}${tutPoint('next')}`} onClick={nextMonth} disabled={tutorialLocked('next') || isVictory || isGameOver}>Next month <ArrowRight size={18} /></button></div></section>
    <footer className="game-footer"><span><PawPrint size={13} /> {game.cats.length} cats on the street</span><span>{femaleBreedersNextRound.length} female{femaleBreedersNextRound.length === 1 ? '' : 's'} can breed next round</span><span>{saving ? 'Saving…' : 'Progress saved'} <i /></span><button className="restart-button" onClick={restart}><RotateCcw size={12} /> Restart</button></footer>
    {isGameOver && <div className="modal-backdrop"><div className="win-modal"><div className="win-icon" style={{ background: '#fde8f0', color: '#d46a8a' }}><PawPrint size={32} /></div><p className="eyebrow">Game over</p><h2>Too many cats!</h2><p>You've reached the limit of cats on the street! Try playing again and get the colony under control quicker.</p><p style={{ fontSize: '13px', color: '#d46a8a', fontWeight: 700, marginTop: '8px' }}>Hint: Try fixing the females as soon as possible</p><div className="score-card"><span>Colony size</span><strong>{game.cats.length} cats</strong><small>in {game.month} months</small></div><button className="next-month" onClick={restart}>Play again <ArrowRight size={18} /></button></div></div>}
    {isVictory && <div className="modal-backdrop"><div className="win-modal"><div className="win-icon"><Trophy size={32} /></div><p className="eyebrow">Mission complete</p><h2>You won!</h2><p>You left <strong>{game.cats.length} cat{game.cats.length === 1 ? '' : 's'}</strong> in the colony after <strong>{game.month} month{game.month === 1 ? '' : 's'}</strong>.</p><div className="score-card"><span>Your score</span><strong>{score.toLocaleString()}</strong></div><p className="record-line">{isNewRecord ? 'New record!' : `Best: ${(bestScore ?? score).toLocaleString()}`}</p><button className="next-month" onClick={restart}>Play again <ArrowRight size={18} /></button></div></div>}
    {showIntro && <IntroModal name={playerName} onContinue={beginTutorial} />}
    {showTutorial && <Tutorial name={playerName} onClose={closeTutorial} interactive step={tutorialStep ?? 'ready'} />}
    {showHelp && <Tutorial name={playerName} onClose={() => setShowHelp(false)} />}
    {showJournal && <JournalModal entries={game.journal ?? [game.message]} onClose={() => setShowJournal(false)} />}
    {adoptionNotice && <AdoptionNotice message={adoptionNotice} onClose={() => setAdoptionNotice(null)} />}
    {overcatNotice && <div className="modal-backdrop"><div className="win-modal"><div className="win-icon" style={{ background: '#fde8f0', color: '#d46a8a' }}><PawPrint size={32} /></div><p className="eyebrow">Oh no!</p><h2>Too many cats!</h2><p>You have over 70 cats! That's going to be a problem... Here, take a <strong>$2,000 donation</strong> and get that colony under control!</p><p style={{ fontSize: '11px', color: '#b09a50', fontStyle: 'italic' }}>— Generous donor who found your work from your posts</p><p style={{ fontSize: '11px', color: '#d46a8a', fontWeight: 800, marginTop: '8px' }}>This will decrease your final score a lot.</p><button className="next-month" onClick={() => setOvercatNotice(false)}>Got it <ArrowRight size={18} /></button></div></div>}
    {showBirths && game.birthReport && <BirthAnnouncement report={game.birthReport} onClose={() => setShowBirths(false)} />}
  </main>;
}

function CatArt({ cat, size = 62 }: { cat: Cat; size?: number }) {
  const coat = catCoat(cat);
  const stage = ageStage(cat.ageMonths);
  const noLegs = stage === 'newborn';
  const isBaby = stage === 'newborn' || stage === 'young';
  const scale = stage === 'newborn' ? 0.5 : stage === 'young' ? 0.68 : stage === 'kitten' ? 0.82 : stage === 'junior' ? 0.93 : 1;
  const eyesClosed = stage === 'newborn';
  const eyeR = stage === 'young' ? 5 : 4.5;
  const collar = cat.sex === 'female' ? '#f4a5b0' : '#7fb8d4';
  const belly = coat.pattern === 'patches' ? coat.secondary : coat.base;
  return <svg viewBox="0 0 100 100" width={size} height={size} className={`cat-svg stage-${stage}`} style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom' }}>
    <path d="M76 62 Q92 48 84 30" stroke={coat.base} strokeWidth="7" fill="none" strokeLinecap="round" />
    {coat.pattern === 'patches' && <ellipse cx="84" cy="44" rx="6" ry="5" fill={coat.secondary} opacity="0.7" />}
    {!noLegs && <g className="cat-legs-back"><rect x="36" y="80" width="6.5" height="15" rx="3.25" fill={coat.base} /><rect x="55" y="80" width="6.5" height="15" rx="3.25" fill={coat.base} /></g>}
    <ellipse cx="50" cy="66" rx="26" ry="20" fill={coat.base} />
    {coat.pattern === 'tabby' && <g opacity="0.4" stroke={coat.secondary} strokeWidth="2" fill="none"><path d="M34 56 Q40 53 46 56" /><path d="M52 54 Q58 51 64 54" /><path d="M36 66 Q42 63 48 66" /><path d="M54 64 Q60 61 66 64" /><path d="M38 74 Q44 71 50 74" /><path d="M52 72 Q58 69 64 72" /></g>}
    {coat.pattern === 'patches' && <ellipse cx="62" cy="60" rx="13" ry="11" fill={coat.secondary} opacity="0.75" />}
    {coat.pattern === 'spots' && <g opacity="0.5" fill={coat.secondary}><circle cx="40" cy="60" r="3.5" /><circle cx="58" cy="64" r="3" /><circle cx="48" cy="56" r="2.5" /><circle cx="64" cy="70" r="2.5" /><circle cx="44" cy="72" r="2" /></g>}
    <ellipse cx="50" cy="74" rx="13" ry="7" fill={belly} opacity="0.5" />
    {!noLegs && <g className="cat-legs-front"><rect x="41" y="80" width="6" height="15" rx="3" fill={coat.base} /><rect x="53" y="80" width="6" height="15" rx="3" fill={coat.base} /></g>}
    <circle cx="50" cy="37" r="22" fill={coat.base} />
    {coat.pattern === 'tabby' && <g opacity="0.4" stroke={coat.secondary} strokeWidth="2" fill="none"><path d="M38 24 Q42 21 46 24" /><path d="M54 24 Q58 21 62 24" /><path d="M42 30 Q46 27 50 30" /><path d="M50 30 Q54 27 58 30" /></g>}
    {coat.pattern === 'patches' && <ellipse cx="38" cy="31" rx="9" ry="8" fill={coat.secondary} opacity="0.7" />}
    <path d="M29 31 L31 5 L48 25 Z" fill={coat.base} />
    <path d="M71 31 L69 5 L52 25 Z" fill={coat.base} />
    <path d="M34 27 L35 12 L44 24 Z" fill="#f5c8b0" opacity="0.65" />
    <path d="M66 27 L65 12 L56 24 Z" fill="#f5c8b0" opacity="0.65" />
    {eyesClosed ? <g stroke="#666" strokeWidth="1.5" fill="none"><path d="M39 37 Q42 39 45 37" /><path d="M55 37 Q58 39 61 37" /></g> : <g><ellipse cx="42" cy="37" rx={eyeR * 0.7} ry={eyeR} fill="#2a2a2a" /><ellipse cx="58" cy="37" rx={eyeR * 0.7} ry={eyeR} fill="#2a2a2a" /><circle cx={42 + eyeR * 0.25} cy={37 - eyeR * 0.3} r="1.5" fill="white" /><circle cx={58 + eyeR * 0.25} cy={37 - eyeR * 0.3} r="1.5" fill="white" /><circle cx={42 - eyeR * 0.15} cy={37 + eyeR * 0.3} r="0.8" fill="white" opacity="0.6" /><circle cx={58 - eyeR * 0.15} cy={37 + eyeR * 0.3} r="0.8" fill="white" opacity="0.6" /></g>}
    {!isBaby && <g opacity="0.3"><circle cx="36" cy="42" r="3" fill="#f4a5b0" /><circle cx="64" cy="42" r="3" fill="#f4a5b0" /></g>}
    <path d="M47 42 L53 42 L50 45 Z" fill="#e8a0a0" />
    <path d="M50 45 Q46 49 44 47" stroke="#aaa" strokeWidth="1" fill="none" />
    <path d="M50 45 Q54 49 56 47" stroke="#aaa" strokeWidth="1" fill="none" />
    <line x1="32" y1="42" x2="18" y2="40" stroke="#ddd" strokeWidth="0.7" />
    <line x1="32" y1="45" x2="18" y2="47" stroke="#ddd" strokeWidth="0.7" />
    <line x1="68" y1="42" x2="82" y2="40" stroke="#ddd" strokeWidth="0.7" />
    <line x1="68" y1="45" x2="82" y2="47" stroke="#ddd" strokeWidth="0.7" />
    <path d="M37 56 Q50 60 63 56" stroke={collar} strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="50" cy="59" r="2.2" fill="#fbbf24" />
    {cat.castrated && <text x="73" y="20" fontSize="9" fill="#fbbf24" fontWeight="bold">✦</text>}
    {cat.sick && <g><rect x="37" y="48" width="26" height="5" rx="2.5" fill="white" opacity="0.85" /><circle cx="42" cy="50.5" r="1.5" fill="#e88" /><circle cx="50" cy="50.5" r="1.5" fill="#88e" /><circle cx="58" cy="50.5" r="1.5" fill="#e8e" /></g>}
  </svg>;
}

function CatSprite({ cat, index, selected, onSelect, tutPoint }: { cat: Cat; index: number; selected: boolean; onSelect: () => void; tutPoint?: boolean }) {
  const initialLeft = 15 + ((index * 19 + (cat.walkSeed ?? index) * 7) % 70); const initialTop = 34 + ((index * 23 + (cat.walkSeed ?? index) * 4) % 39);
  const [position, setPosition] = useState({ left: initialLeft, top: initialTop });
  const [dragging, setDragging] = useState(false);
  const moveCat = (event: React.PointerEvent<HTMLButtonElement>): void => { const field = event.currentTarget.parentElement; if (!field) return; const bounds = field.getBoundingClientRect(); setPosition({ left: Math.max(6, Math.min(94, ((event.clientX - bounds.left) / bounds.width) * 100)), top: Math.max(12, Math.min(86, ((event.clientY - bounds.top) / bounds.height) * 100)) }); };
  const stage = ageStage(cat.ageMonths);
  const canBreed = cat.sex === 'female' && !cat.castrated && !cat.sick && cat.ageMonths >= 3;
  const spriteSize = stage === 'newborn' ? 36 : stage === 'young' ? 44 : stage === 'kitten' ? 52 : stage === 'junior' ? 58 : 64;
  return <button className={`cat-sprite ${selected ? 'selected' : ''} ${dragging ? 'dragging' : 'cat-walking'}${tutPoint ? ' tut-point' : ''}`} style={{ left: `${position.left}%`, top: `${position.top}%`, animationDelay: `${(index * -1.4).toFixed(1)}s` }} onClick={onSelect} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveCat(event); }} onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); setDragging(false); }} aria-label={`Select or drag ${cat.name}`}><span className="cat-shadow" /><div className="cat-body-wrap"><CatArt cat={cat} size={spriteSize} /></div><span className="cat-name">{cat.name}</span>{cat.sick && <span className="sick-dot">!</span>}{canBreed && <span className="breed-dot" title="Can breed">♥</span>}{cat.ageMonths < 18 && <span className="kitten-tag">{stage === 'newborn' ? 'newborn' : stage === 'young' ? '1 mo old' : 'kitten'}</span>}</button>;
}

function CatInfo({ cat, money, onFix, onClose, tutorialFix }: { cat: Cat; money: number; onFix: (id: string) => void; onClose: () => void; tutorialFix?: boolean }) {
  const canFix = !cat.castrated && cat.ageMonths >= 2;
  const isFeral = cat.ageMonths >= 18;
  return <div className="cat-info-card"><button onClick={onClose} aria-label="Close cat details"><X size={15} /></button><div className="info-cat-emoji"><CatArt cat={cat} size={50} /></div><div className="cat-info-copy"><p className="eyebrow">Cat profile</p><h2>{cat.name}</h2><p>{cat.sex === 'female' ? 'Female' : 'Male'} · {formatAge(cat.ageMonths)} {cat.castrated ? '· Fixed' : '· Not fixed'}</p>{isFeral && <p className="feral-note"><Info size={12} /> This cat is feral, so they cannot be placed for adoption.</p>}{cat.parentNames ? <p className="parents"><Baby size={14} /> Parents: <strong>{cat.parentNames.join(' + ')}</strong></p> : <p className="parents"><PawPrint size={14} /> One of the original colony cats</p>}{!cat.castrated && <button className={`profile-fix${tutorialFix ? ' tut-point' : ''}`} disabled={!canFix || money < 100} onClick={() => onFix(cat.id)}><Syringe size={13} /> {canFix ? 'Fix this cat · $100' : 'Too young to fix'}</button>}</div></div>;
}

function Tutorial({ name, onClose, interactive = false, step = 'ready' }: { name: string; onClose: () => void; interactive?: boolean; step?: string }) {
  if (interactive) {
    const steps: Record<string, { title: string; body: string; done?: boolean }> = {
      select: { title: 'Step 1 · Select Maple', body: 'Click the kitten in the yard to open her profile.' },
      adopt: { title: 'Step 2 · Find a home', body: 'With Maple selected, press "Find a home" below. Kittens can be adopted from 2 months of age. The first adoption post costs $25.' },
      breed: { title: 'Step 3 · Select a cat that\'s ready to breed', body: 'Click on a cat with a floating heart. This means that they are ready to breed and must be fixed. Once they are fixed, they can\'t breed out of control.' },
      choice: { title: 'Step 4 · Choose carefully', body: 'Look at the top right corner of the screen. You have $100 left, so you can either choose "Fix this cat" to end her cycle, or "Tell your story" to increase your donations next month.' },
      goodjob: { title: 'Step 5 · Good job!', body: 'You don\'t have any more budget this month, but you can see updates in the colony journal. Click "Next month" to continue.' },
      ready: { title: 'You\'re ready!', body: 'Make wise decisions and help the colony', done: true},
    };
    const s = steps[step] ?? steps.ready;
    return <div className="modal-backdrop tutorial-backdrop"><div className="tutorial-modal interactive-tutorial">{!s.done && <button className="tutorial-skip" onClick={onClose}>Skip tutorial</button>}<div className={`tutorial-step${s.done ? ' complete' : ''}`}><strong>{s.title}</strong><p>{s.body}</p></div>{s.done && <button className="next-month full-button" onClick={onClose}>End tutorial <ArrowRight size={18} /></button>}</div></div>;
  }
  return <div className="modal-backdrop"><div className="tutorial-modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="tutorial-cats">🐈 🐈‍⬛ 🐱</div><p className="eyebrow">Welcome to the rescue, {name}!</p><h2>Can you give them a fresh start?</h2><p className="tutorial-intro">You have been called in to help a colony of cats living on the street. Each month, use your donations to make kind choices.</p><div className="tutorial-grid"><TutorialRow icon={<Megaphone />} title="Tell your story" text="Starts at $50 and costs $20 more each month. Your income goes up $30 each time." /><TutorialRow icon={<Syringe />} title="Fix a cat" text="$100. Male and female cats can be fixed from 2 months old." /><TutorialRow icon={<House />} title="Find a home" text="$25 for the first post, then $25 more each time this round. Select a cat aged 2–18 months." /><TutorialRow icon={<ArrowRight />} title="Next month" text="Time passes, cats grow, and healthy moms may have kittens." /></div><p className="tutorial-note"><ShieldCheck size={15} /> Cats can give birth from 4 months of age</p><button className="next-month full-button" onClick={onClose}>Close instructions <ArrowRight size={18} /></button></div></div>;
}
function TutorialRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="tutorial-row"><div className="tutorial-icon">{icon}</div><div><strong>{title}</strong><p>{text}</p></div></div>; }
function JournalModal({ entries, onClose }: { entries: string[]; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="journal-modal"><button className="modal-close" onClick={onClose} aria-label="Close colony journal"><X size={18} /></button><div className="journal-heading"><BookOpen size={22} /><div><p className="eyebrow">Colony journal</p><h2>Latest notifications</h2></div></div><div className="journal-list">{entries.slice().reverse().map((entry, index) => <div className="journal-entry" key={`${entry}-${index}`}><span>{entries.length - index}</span><p>{entry}</p></div>)}</div><button className="next-month full-button" onClick={onClose}>Back to the colony <ArrowRight size={18} /></button></div></div>;
}
function AdoptionNotice({ message, onClose }: { message: string; onClose: () => void }) {
  const foundHome = /found|forever home|family wants|loving home|adopted|fresh start|take them in|fell in love|thank-you|cozy new home|going to the same/.test(message);
  return <div className="modal-backdrop"><div className={`adoption-modal ${foundHome ? 'success' : 'try-again'}`}><div className="adoption-art">{foundHome ? '🏠 🐈' : '📬 🐈'}</div><p className="eyebrow">{foundHome ? 'Happy news' : 'Adoption update'}</p><h2>{foundHome ? 'A new beginning!' : 'Keep looking for the right match'}</h2><p className="adoption-message">{message}</p><button className="next-month full-button" onClick={onClose}>{foundHome ? 'That’s wonderful' : 'Keep helping' } <ArrowRight size={18} /></button></div></div>;
}
function BirthAnnouncement({ report, onClose }: { report: BirthReport[]; onClose: () => void }) {
  const count = report.reduce((total, item) => total + item.kittenNames.length, 0);
  return <div className="modal-backdrop"><div className="birth-modal"><div className="birth-art">🐱 🐱 🐱</div><p className="eyebrow">New arrivals</p><h2>{count} tiny kitten{count === 1 ? '' : 's'} were born!</h2><p className="birth-copy">The colony is growing. You can click on a kitten in the yard to learn who their parents are.</p><div className="birth-list">{report.map((item) => <div className="birth-row" key={item.mom}><span className="mom-face">🐈</span><div><strong>{item.mom}'s litter</strong><p>{item.kittenNames.join(', ')}</p></div></div>)}</div><button className="next-month full-button" onClick={onClose}>Meet the kittens <ArrowRight size={18} /></button></div></div>;
}
function IntroModal({ name, onContinue }: { name: string; onContinue: () => void }) {
  return <div className="modal-backdrop"><div className="intro-modal" style={{ textAlign: 'center' }}><div className="intro-art">🐱 🐾 🏠</div><p className="eyebrow">Welcome, {name}!</p><h2>Hello {name}!</h2><p className="intro-message">There's a colony of cats on the street and they need help. Get the cats fixed, and kittens rehomed before they breed out of control! The game ends once all adoptable cats have been rehomed and everyone has been fixed.</p><button className="next-month full-button" onClick={onContinue}>I can do it! <ArrowRight size={18} /></button></div></div>;
}
export default App;
