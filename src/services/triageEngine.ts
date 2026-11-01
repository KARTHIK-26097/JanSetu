import type { IssueCategory, LanguageCode, TriageExplainability, UrgencyLevel } from '../types';

// Authority Directory
export const MUNICIPAL_AUTHORITIES = [
  {
    id: 'auth-dot',
    name: 'Department of Transportation & Public Works',
    code: 'DOT-PW',
    department: 'Civil Infrastructure & Roadways',
    contactEmail: 'roads-dispatch@civiccare.gov',
    phone: '+1 (555) 234-7623',
    activeOfficers: 14,
    avgResponseHours: 12,
    categoriesHandled: ['roads', 'bridges', 'transit'] as IssueCategory[],
    zonesCovered: ['Downtown', 'North River', 'Eastside', 'South Harbor', 'West Industrial'],
  },
  {
    id: 'auth-water',
    name: 'Municipal Water & Sewerage Authority',
    code: 'MWSA',
    department: 'Hydraulics & Drainage Utility',
    contactEmail: 'water-emergencies@civiccare.gov',
    phone: '+1 (555) 345-8821',
    activeOfficers: 9,
    avgResponseHours: 6,
    categoriesHandled: ['water', 'pollution'] as IssueCategory[],
    zonesCovered: ['Downtown', 'North River', 'Eastside', 'South Harbor', 'West Industrial'],
  },
  {
    id: 'auth-power',
    name: 'Bureau of Street Lighting & Grid Safety',
    code: 'BSL-GRID',
    department: 'Municipal Electrical Services',
    contactEmail: 'lighting-grid@civiccare.gov',
    phone: '+1 (555) 876-1190',
    activeOfficers: 7,
    avgResponseHours: 18,
    categoriesHandled: ['street_lighting'] as IssueCategory[],
    zonesCovered: ['Downtown', 'North River', 'Eastside', 'South Harbor', 'West Industrial'],
  },
  {
    id: 'auth-sanitation',
    name: 'Environmental Sanitation & Waste Division',
    code: 'ESWD',
    department: 'Public Health & Solid Waste Management',
    contactEmail: 'sanitation-triage@civiccare.gov',
    phone: '+1 (555) 654-9901',
    activeOfficers: 11,
    avgResponseHours: 24,
    categoriesHandled: ['waste', 'pollution', 'other'] as IssueCategory[],
    zonesCovered: ['Downtown', 'North River', 'Eastside', 'South Harbor', 'West Industrial'],
  },
];

// Language metadata
export const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'zh', label: 'Mandarin Chinese', nativeName: '中文' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
];

// Common realistic civic translations dictionary
const PHRASE_DICTIONARY: Record<string, Record<LanguageCode, string>> = {
  pothole: {
    en: 'Massive deep pothole on the northbound lane causing severe wheel damage and swerving.',
    es: 'Enorme bache profundo en el carril hacia el norte que causa daños graves en las ruedas y desvíos peligrosos.',
    hi: 'उत्तर की ओर जाने वाली लेन में गहरा गड्ढा जिससे वाहनों के पहिए क्षतिग्रस्त हो रहे हैं।',
    fr: 'Nid-de-poule profond sur la voie nord causant de graves dommages aux roues et des écarts dangereux.',
    zh: '北行车道上有一个巨大的深坑，导致车轮严重受损和车辆打滑。',
    ar: 'حفرة عميقة ضخمة في المسار المتجه شمالاً تسبب أضراراً بالغة لعجلات السيارات وانحرافات مفاجئة.',
    de: 'Riesiges tiefes Schlagloch auf der Nordspur, das schwere Radschäden und riskante Ausweichmanöver verursacht.',
  },
  water_leak: {
    en: 'Water main rupture flooding the pedestrian sidewalk and flowing into basement storefronts.',
    es: 'Ruptura de tubería principal de agua inundando la acera peatonal e ingresando a locales comerciales subterráneos.',
    hi: 'मुख्य पानी की पाइपलाइन फटने से पैदल मार्ग पर पानी भर गया है और दुकानों के बेसमेंट में घुस रहा है।',
    fr: 'Rupture de canalisation principale inondant le trottoir piétonnier et s\'écoulant vers les sous-sols.',
    zh: '主供水管道爆裂，淹没了人行道并流入沿街地下商铺。',
    ar: 'انفجار أنبوب مياه رئيسي يغمر رصيف المشاة ويتدفق إلى أقبية المتاجر المجاورة.',
    de: 'Hauptwasserrohrbruch überschwemmt den Bürgersteig und dringt in Kellergeschosse der Geschäfte ein.',
  },
  street_light: {
    en: 'Street lighting pole tilted dangerously with exposed live electrical wires after a collision.',
    es: 'Poste de alumbrado público inclinado peligrosamente con cables eléctricos pelados tras una colisión.',
    hi: 'टक्कर के बाद बिजली का खंभा खतरनाक रूप से झुक गया है और खुले बिजली के तार लटक रहे हैं।',
    fr: 'Poteau d\'éclairage public dangereusement penché avec des fils électriques dénudés après un impact.',
    zh: '路灯杆发生碰撞后严重倾斜，裸露的带电电线垂落悬挂。',
    ar: 'عمود إنارة الشارع مائل بشكل خطير مع أسلاك كهربائية مكشوفة بعد اصطدام.',
    de: 'Straßenlaternenmast nach Kollision gefährlich geneigt mit freiliegenden spannungsführenden Drähten.',
  },
  waste_dump: {
    en: 'Severe accumulation of rotting garbage and commercial waste blocking pedestrian emergency alleyway.',
    es: 'Acumulación grave de basura en descomposición y residuos comerciales bloqueando el callejón peatonal de emergencia.',
    hi: 'सड़क की गली में भारी मात्रा में सड़ा हुआ कचरा जमा है जिससे पैदल रास्ता पूरी तरह अवरुद्ध हो गया है।',
    fr: 'Accumulation sévère de déchets en décomposition bloquant le passage piétonnier de secours.',
    zh: '商业废弃物和腐烂垃圾严重堆积，阻塞了行人安全疏散通道。',
    ar: 'تراكم شديد للقمامة المتخلفة والمخلفات التجارية يسد زقاق الطوارئ للمشاة.',
    de: 'Schwere Ansammlung verrottender Abfälle und Gewerbemüll blockiert die Fußgängernotgasse.',
  },
};

/**
 * Intelligent Explainable Triage Analysis
 */
export function analyzeGrievance(
  description: string,
  selectedCategory?: IssueCategory,
  locationHint?: string
): TriageExplainability {
  const text = (description + ' ' + (locationHint || '')).toLowerCase();
  const reasons: string[] = [];

  let dangerScore = 15; // baseline low risk
  let riskToPeople = 'Minimal direct personal hazard under standard daylight conditions.';
  let scaleDisruption = 'Localized disturbance confined to immediate vicinity.';
  let worseningRate = 'Stable state with slow deterioration over multiple weeks.';

  // 1. Immediate Danger Triggers
  const criticalDangerWords = [
    'electric', 'live wire', 'spark', 'shock', 'electrocution',
    'gas', 'smell gas', 'explosion', 'toxic', 'chemical',
    'collapse', 'cave-in', 'sinkhole', 'falling concrete', 'structural failure',
    'burst pipe', 'gushing water', 'rushing water', 'severe flooding',
  ];

  const highDangerWords = [
    'deep pothole', 'wheel damage', 'tire puncture', 'accident', 'collision',
    'tilted pole', 'hanging wire', 'broken bridge', 'crack', 'blocked lane',
    'open manhole', 'missing cover', 'overflowing sewage', 'biohazard',
  ];

  const matchesCritical = criticalDangerWords.filter((w) => text.includes(w));
  const matchesHigh = highDangerWords.filter((w) => text.includes(w));

  if (matchesCritical.length > 0) {
    dangerScore = Math.min(95, 75 + matchesCritical.length * 10);
    reasons.push(`Critical safety triggers detected: "${matchesCritical.join('", "')}".`);
    riskToPeople = 'Acute bodily injury or electrocution/toxic exposure risk to passing public.';
    scaleDisruption = 'High potential for utility outage, structural failure, or road closure.';
    worseningRate = 'Rapidly accelerating deterioration requiring urgent dispatch within 4 hours.';
  } else if (matchesHigh.length > 0) {
    dangerScore = Math.min(74, 45 + matchesHigh.length * 10);
    reasons.push(`Elevated hazard factors identified: "${matchesHigh.join('", "')}".`);
    riskToPeople = 'Moderate safety hazard for vehicles, cyclists, or pedestrians.';
    scaleDisruption = 'Partial lane obstruction or noticeable civic service disruption.';
    worseningRate = 'Active deterioration under continued traffic or weather load.';
  } else {
    reasons.push('Standard non-emergency civic maintenance report.');
  }

  // 2. Vulnerability & Public Activity Multipliers
  if (text.includes('school') || text.includes('hospital') || text.includes('kindergarten')) {
    dangerScore = Math.min(100, dangerScore + 15);
    reasons.push('Proximity to vulnerable populations (school / medical facility zone).');
  }
  if (text.includes('avenue') || text.includes('highway') || text.includes('downtown') || text.includes('main street')) {
    dangerScore = Math.min(100, dangerScore + 10);
    reasons.push('High-density traffic corridor with heightened exposure volume.');
  }

  // 3. Determine Urgency Level
  let suggestedSeverity: UrgencyLevel = 'low';
  if (dangerScore >= 75) suggestedSeverity = 'critical';
  else if (dangerScore >= 50) suggestedSeverity = 'high';
  else if (dangerScore >= 25) suggestedSeverity = 'medium';

  // 4. Suggest Category if not chosen
  let suggestedCategory: IssueCategory = selectedCategory || 'roads';
  if (!selectedCategory) {
    if (text.includes('pothole') || text.includes('road') || text.includes('asphalt') || text.includes('curb') || text.includes('traffic')) {
      suggestedCategory = 'roads';
    } else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('sewer') || text.includes('drain')) {
      suggestedCategory = 'water';
    } else if (text.includes('light') || text.includes('dark') || text.includes('lamp') || text.includes('pole') || text.includes('wiring')) {
      suggestedCategory = 'street_lighting';
    } else if (text.includes('trash') || text.includes('garbage') || text.includes('waste') || text.includes('dump') || text.includes('debris')) {
      suggestedCategory = 'waste';
    } else if (text.includes('bridge') || text.includes('overpass') || text.includes('viaduct')) {
      suggestedCategory = 'bridges';
    } else if (text.includes('smoke') || text.includes('smell') || text.includes('fumes') || text.includes('chemical') || text.includes('noise')) {
      suggestedCategory = 'pollution';
    } else {
      suggestedCategory = 'other';
    }
  }

  // 5. Route to Relevant Authority
  let matchedAuthority = MUNICIPAL_AUTHORITIES.find((a) =>
    a.categoriesHandled.includes(suggestedCategory)
  ) || MUNICIPAL_AUTHORITIES[0];

  // 6. Precautionary Safety Guidance (Clear informational disclaimer)
  let safetyGuidance = 'Informational Precaution: Maintain situational awareness and stay clear of the affected zone.';
  if (suggestedCategory === 'street_lighting' || text.includes('wire') || text.includes('pole')) {
    safetyGuidance = 'Informational Safety Notice: Keep a minimum 10-meter clearance from tilted poles or fallen wiring. Treat all exposed wires as live.';
  } else if (suggestedCategory === 'water' || text.includes('flood') || text.includes('leak')) {
    safetyGuidance = 'Informational Safety Notice: Do not attempt to wade through standing murky water. Avoid consuming tap water until municipal quality is verified.';
  } else if (suggestedCategory === 'roads' || text.includes('pothole')) {
    safetyGuidance = 'Informational Safety Notice: Motorists should reduce speed and proceed with caution. Cyclists should dismount when approaching damaged asphalt.';
  } else if (suggestedCategory === 'waste' || suggestedCategory === 'pollution') {
    safetyGuidance = 'Informational Safety Notice: Avoid direct physical contact with uncontained waste. Keep pets and children away from decomposing refuse.';
  } else if (suggestedCategory === 'other' || text.includes('scaffolding')) {
    safetyGuidance = 'Informational Safety Notice: Pedestrians should maintain safe distance from overhead construction and unstable structures.';
  }

  return {
    immediateDangerScore: dangerScore,
    riskToPeople,
    scaleDisruption,
    worseningRate,
    suggestedSeverity,
    suggestedCategory,
    suggestedAuthorityId: matchedAuthority.id,
    suggestedAuthorityName: matchedAuthority.name,
    safetyGuidance,
    reasonFactors: reasons,
  };
}

/**
 * Multi-Language Translation Service with Natural Fallback
 */
export function translateToEnglish(
  text: string,
  sourceLanguage: string
): { translatedText: string; isAutomated: boolean; confidence: number } {
  if (sourceLanguage === 'en' || !text.trim()) {
    return { translatedText: text, isAutomated: false, confidence: 1.0 };
  }

  // Check matching phrases in civic phrase dictionary
  for (const key of Object.keys(PHRASE_DICTIONARY)) {
    const entry = PHRASE_DICTIONARY[key];
    if (entry[sourceLanguage] && (text.includes(entry[sourceLanguage].slice(0, 20)) || entry[sourceLanguage].includes(text.slice(0, 20)))) {
      return {
        translatedText: entry.en,
        isAutomated: true,
        confidence: 0.98,
      };
    }
  }

  // Keyword-assisted translation heuristics for realistic civic terms
  const dictionaryPairs: Record<string, string> = {
    // Spanish
    bache: 'pothole',
    hueco: 'hole',
    calle: 'street',
    avenida: 'avenida/road',
    agua: 'water',
    tubería: 'pipe',
    inundación: 'flooding',
    luz: 'light',
    poste: 'pole',
    peligro: 'danger',
    basura: 'garbage/waste',
    roto: 'broken',
    cables: 'wires',
    // French
    'nid-de-poule': 'pothole',
    fuite: 'leak',
    déchets: 'waste/rubbish',
    dangereux: 'dangerous',
    éclairage: 'lighting',
    // German
    schlagloch: 'pothole',
    wasserrohrbruch: 'burst water pipe',
    laterne: 'street light',
    müll: 'waste/garbage',
    // Hindi translit / keywords
    'गड्ढा': 'pothole',
    'पानी': 'water',
    'बिजली': 'electricity/street light',
    'कचरा': 'waste/garbage',
  };

  let translated = text;
  let translatedWords = 0;
  for (const [foreign, eng] of Object.entries(dictionaryPairs)) {
    if (translated.toLowerCase().includes(foreign.toLowerCase())) {
      translated = translated.replace(new RegExp(foreign, 'gi'), eng);
      translatedWords++;
    }
  }

  if (translatedWords > 0) {
    return {
      translatedText: `[Partial dictionary-assisted English draft from ${sourceLanguage.toUpperCase()} — compare with the original]: ${translated}`,
      isAutomated: true,
      confidence: 0.45,
    };
  }

  // Do not label copied non-English text as an English translation.
  return {
    translatedText: `English translation unavailable for ${sourceLanguage.toUpperCase()}. Please review the original report.`,
    isAutomated: false,
    confidence: 0,
  };
}

/**
 * Reverse translation for demo presets
 */
export function getDemoTextInLanguage(key: 'pothole' | 'water_leak' | 'street_light' | 'waste_dump', lang: LanguageCode): string {
  if (PHRASE_DICTIONARY[key] && PHRASE_DICTIONARY[key][lang]) {
    return PHRASE_DICTIONARY[key][lang];
  }
  return PHRASE_DICTIONARY[key].en;
}
