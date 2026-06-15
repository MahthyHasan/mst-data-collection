// Assessment calculation and classification helpers

export function calculateBMI(weightKg: number, heightM: number) {
  if (!heightM || heightM <= 0) return { bmi: 0, classification: 'Normal' as const };
  const bmi = weightKg / (heightM * heightM);
  const roundedBmi = Math.round(bmi * 10) / 10;

  let classification: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = 'Normal';
  if (roundedBmi < 18.5) {
    classification = 'Underweight';
  } else if (roundedBmi < 25.0) {
    classification = 'Normal';
  } else if (roundedBmi < 30.0) {
    classification = 'Overweight';
  } else {
    classification = 'Obese';
  }

  return { bmi: roundedBmi, classification };
}

export function calculateFallRisk(answers: {
  age65OrOlder: boolean;
  fallHistory6Months: boolean;
  takingFourOrMoreMedications: boolean;
  psychoactiveMedications: boolean;
  abnormalGait: boolean;
  usesAssistiveDevice: boolean;
  impairedBalance: boolean;
  visionImpairment: boolean;
}) {
  let score = 0;
  if (answers.age65OrOlder) score += 1;
  if (answers.fallHistory6Months) score += 1;
  if (answers.takingFourOrMoreMedications) score += 1;
  if (answers.psychoactiveMedications) score += 1;
  if (answers.abnormalGait) score += 1;
  if (answers.usesAssistiveDevice) score += 1;
  if (answers.impairedBalance) score += 1;
  if (answers.visionImpairment) score += 1;

  let classification: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
  if (score >= 5) {
    classification = 'High Risk';
  } else if (score >= 3) {
    classification = 'Moderate Risk';
  }

  return { score, classification };
}

// GDS-15 scoring mapping
// Questions index (0-14). True for Yes, False for No.
// 1 point is given for the answers listed below:
// Q1: No (false), Q2: Yes (true), Q3: Yes (true), Q4: Yes (true), Q5: No (false), Q6: Yes (true),
// Q7: No (false), Q8: Yes (true), Q9: Yes (true), Q10: Yes (true), Q11: No (false), Q12: Yes (true),
// Q13: No (false), Q14: Yes (true), Q15: Yes (true).
export function calculateGDS(responses: boolean[]) {
  const depressionAnswers = [
    false, // 1. Satisfied with life? (No)
    true,  // 2. Dropped activities? (Yes)
    true,  // 3. Life empty? (Yes)
    true,  // 4. Often bored? (Yes)
    false, // 5. Good spirits? (No)
    true,  // 6. Afraid bad thing? (Yes)
    false, // 7. Happy most time? (No)
    true,  // 8. Helpless? (Yes)
    true,  // 9. Prefer stay home? (Yes)
    true,  // 10. Memory problems? (Yes)
    false, // 11. Wonderful to be alive? (No)
    true,  // 12. Worthless? (Yes)
    false, // 13. Full of energy? (No)
    true,  // 14. Hopeless? (Yes)
    true,  // 15. Others better off? (Yes)
  ];

  let score = 0;
  for (let i = 0; i < 15; i++) {
    if (responses[i] === depressionAnswers[i]) {
      score += 1;
    }
  }

  let classification: 'Normal' | 'Mild Depression' | 'Moderate Depression' | 'Severe Depression' = 'Normal';
  if (score >= 12) {
    classification = 'Severe Depression';
  } else if (score >= 9) {
    classification = 'Moderate Depression';
  } else if (score >= 5) {
    classification = 'Mild Depression';
  }

  return { score, classification };
}

export function calculateMinicog(recallScore: number, clockDrawingScore: number) {
  const totalScore = recallScore + clockDrawingScore;
  const outcome: 'Normal Screening' | 'Possible Cognitive Impairment' =
    totalScore >= 3 ? 'Normal Screening' : 'Possible Cognitive Impairment';
  return { totalScore, outcome };
}

export function calculateADL(items: {
  feeding: number;
  bathing: number;
  grooming: number;
  dressing: number;
  bowelBladder: number;
  toiletUse: number;
  transfers: number;
  mobility: number;
  stairsMobility: number;
}) {
  const totalScore =
    items.feeding +
    items.bathing +
    items.grooming +
    items.dressing +
    items.bowelBladder +
    items.toiletUse +
    items.transfers +
    items.mobility +
    items.stairsMobility;

  let classification: 'Total Dependence' | 'Severe Dependence' | 'Moderate Dependence' | 'Slight Dependence' | 'Independent' = 'Independent';
  
  if (totalScore <= 20) {
    classification = 'Total Dependence';
  } else if (totalScore <= 60) {
    classification = 'Severe Dependence';
  } else if (totalScore <= 90) {
    classification = 'Moderate Dependence';
  } else if (totalScore <= 99) {
    classification = 'Slight Dependence';
  }

  return { totalScore, classification };
}

export function calculateIADL(items: {
  phone: number;
  shopping: number;
  foodPrep: number;
  housekeeping: number;
  laundry: number;
  transport: number;
  medications: number;
  finances: number;
}) {
  const totalScore =
    items.phone +
    items.shopping +
    items.foodPrep +
    items.housekeeping +
    items.laundry +
    items.transport +
    items.medications +
    items.finances;

  const classification: 'Functional Impairment' | 'Independent' =
    totalScore >= 5 ? 'Independent' : 'Functional Impairment';

  return { totalScore, classification };
}
