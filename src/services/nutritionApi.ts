import { FoodItem } from '../types';

// Standard USDA & Global Reference database for instant, high-accuracy nutrition queries
interface CommonNutrientProfile {
  aliases: string[];
  serving: string;
  baseGrams: number;
  unitGrams?: Partial<Record<'g' | 'kg' | 'oz' | 'lb' | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'scoop' | 'slice' | 'piece' | 'bowl' | 'plate' | 'glass' | 'can' | 'bar' | 'handful', number>>;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number; // mg
  potassium: number; // mg
}

const COMMON_FOODS: CommonNutrientProfile[] = [
  // Eggs & Dairy
  {
    aliases: ['egg white', 'egg whites', 'boiled egg white'],
    serving: '1 large white (33g)',
    baseGrams: 33,
    unitGrams: { g: 1, cup: 243, piece: 33 },
    calories: 17,
    protein: 3.6,
    carbs: 0.2,
    fats: 0.1,
    fiber: 0,
    sodium: 55,
    potassium: 54,
  },
  {
    aliases: ['egg', 'eggs', 'whole egg', 'whole eggs', 'boiled egg', 'boiled eggs', 'fried egg', 'poached egg', 'scrambled egg', 'scrambled eggs', 'omelette', 'omelet'],
    serving: '1 large (50g)',
    baseGrams: 50,
    unitGrams: { g: 1, piece: 50, oz: 28.35 },
    calories: 74,
    protein: 6.3,
    carbs: 0.4,
    fats: 5.0,
    fiber: 0,
    sodium: 71,
    potassium: 69,
  },
  {
    aliases: ['greek yogurt', 'nonfat greek yogurt', 'plain greek yogurt'],
    serving: '1 cup (170g)',
    baseGrams: 170,
    unitGrams: { g: 1, cup: 170, bowl: 200, tbsp: 15, oz: 28.35 },
    calories: 100,
    protein: 17.0,
    carbs: 6.0,
    fats: 0.7,
    fiber: 0,
    sodium: 61,
    potassium: 240,
  },
  {
    aliases: ['yogurt', 'plain yogurt', 'curd', 'dahi'],
    serving: '1 cup (170g)',
    baseGrams: 170,
    unitGrams: { g: 1, cup: 170, bowl: 180, tbsp: 15, oz: 28.35 },
    calories: 105,
    protein: 8.5,
    carbs: 11.4,
    fats: 2.6,
    fiber: 0,
    sodium: 80,
    potassium: 260,
  },
  {
    aliases: ['cottage cheese', 'low fat cottage cheese'],
    serving: '1/2 cup (113g)',
    baseGrams: 113,
    unitGrams: { g: 1, cup: 226, bowl: 180, oz: 28.35 },
    calories: 92,
    protein: 12.5,
    carbs: 4.5,
    fats: 2.5,
    fiber: 0,
    sodium: 360,
    potassium: 110,
  },
  {
    aliases: ['paneer', 'cottage cheese cubes'],
    serving: '100g',
    baseGrams: 100,
    unitGrams: { g: 1, cup: 150, oz: 28.35, piece: 25 },
    calories: 265,
    protein: 18.3,
    carbs: 3.6,
    fats: 20.8,
    fiber: 0,
    sodium: 22,
    potassium: 100,
  },
  {
    aliases: ['cheddar cheese', 'mozzarella cheese', 'cheese slice', 'cheese'],
    serving: '1 slice / 28g',
    baseGrams: 28,
    unitGrams: { g: 1, slice: 28, oz: 28.35, cup: 113 },
    calories: 113,
    protein: 7.0,
    carbs: 0.9,
    fats: 9.2,
    fiber: 0,
    sodium: 180,
    potassium: 25,
  },
  {
    aliases: ['whole milk', 'skim milk', 'almond milk', 'soy milk', 'oat milk', 'milk'],
    serving: '1 glass (240ml)',
    baseGrams: 240,
    unitGrams: { ml: 1, g: 1, l: 1000, glass: 240, cup: 240 },
    calories: 122,
    protein: 8.0,
    carbs: 12.0,
    fats: 4.8,
    fiber: 0,
    sodium: 115,
    potassium: 322,
  },

  // Proteins & Meats & Plant Protein
  {
    aliases: ['chicken breast', 'grilled chicken breast', 'grilled chicken', 'baked chicken', 'boiled chicken', 'cooked chicken', 'chicken'],
    serving: '100g cooked',
    baseGrams: 100,
    unitGrams: { g: 1, kg: 1000, oz: 28.35, lb: 453.6, piece: 140, bowl: 150, plate: 180 },
    calories: 165,
    protein: 31.0,
    carbs: 0,
    fats: 3.6,
    fiber: 0,
    sodium: 74,
    potassium: 256,
  },
  {
    aliases: ['chicken thigh', 'chicken thighs', 'roasted chicken thigh'],
    serving: '100g cooked',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, piece: 110 },
    calories: 209,
    protein: 26.0,
    carbs: 0,
    fats: 10.9,
    fiber: 0,
    sodium: 88,
    potassium: 240,
  },
  {
    aliases: ['turkey breast', 'ground turkey', 'turkey'],
    serving: '100g cooked',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, slice: 28 },
    calories: 147,
    protein: 29.0,
    carbs: 0,
    fats: 2.1,
    fiber: 0,
    sodium: 82,
    potassium: 270,
  },
  {
    aliases: ['salmon fillet', 'grilled salmon', 'baked salmon', 'smoked salmon', 'salmon'],
    serving: '100g cooked',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, piece: 150, plate: 170 },
    calories: 206,
    protein: 22.0,
    carbs: 0,
    fats: 12.3,
    fiber: 0,
    sodium: 61,
    potassium: 384,
  },
  {
    aliases: ['canned tuna', 'tuna steak', 'tuna salad', 'tuna'],
    serving: '1 can (100g drained)',
    baseGrams: 100,
    unitGrams: { g: 1, can: 115, oz: 28.35 },
    calories: 116,
    protein: 26.0,
    carbs: 0,
    fats: 0.8,
    fiber: 0,
    sodium: 247,
    potassium: 237,
  },
  {
    aliases: ['shrimp', 'prawns', 'grilled shrimp'],
    serving: '100g cooked',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, cup: 140 },
    calories: 99,
    protein: 24.0,
    carbs: 0.2,
    fats: 0.3,
    fiber: 0,
    sodium: 111,
    potassium: 259,
  },
  {
    aliases: ['sirloin steak', 'beef steak', 'lean beef', 'ground beef', 'steak', 'beef'],
    serving: '100g cooked',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, lb: 453.6, piece: 170 },
    calories: 217,
    protein: 26.1,
    carbs: 0,
    fats: 11.8,
    fiber: 0,
    sodium: 54,
    potassium: 318,
  },
  {
    aliases: ['tofu', 'firm tofu', 'grilled tofu'],
    serving: '100g',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, cup: 126 },
    calories: 94,
    protein: 10.0,
    carbs: 2.3,
    fats: 5.3,
    fiber: 1.2,
    sodium: 9,
    potassium: 148,
  },
  {
    aliases: ['tempeh'],
    serving: '100g',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35 },
    calories: 192,
    protein: 20.3,
    carbs: 7.6,
    fats: 10.8,
    fiber: 1.4,
    sodium: 9,
    potassium: 412,
  },
  {
    aliases: ['whey protein isolate', 'whey protein', 'protein shake', 'protein powder', 'casein protein', 'whey'],
    serving: '1 scoop (30g)',
    baseGrams: 30,
    unitGrams: { g: 1, scoop: 30, tbsp: 10, oz: 28.35 },
    calories: 120,
    protein: 24.0,
    carbs: 3.0,
    fats: 1.5,
    fiber: 0.5,
    sodium: 130,
    potassium: 160,
  },
  {
    aliases: ['protein bar', 'energy bar', 'quest bar'],
    serving: '1 bar (60g)',
    baseGrams: 60,
    unitGrams: { g: 1, bar: 60 },
    calories: 210,
    protein: 20.0,
    carbs: 22.0,
    fats: 7.0,
    fiber: 10.0,
    sodium: 200,
    potassium: 150,
  },

  // Grains, Starches & Legumes
  {
    aliases: ['rolled oats', 'overnight oats', 'oatmeal', 'oats', 'porridge'],
    serving: '1 bowl / 40g dry',
    baseGrams: 40,
    unitGrams: { g: 1, cup: 80, bowl: 50, tbsp: 8, oz: 28.35 },
    calories: 153,
    protein: 5.3,
    carbs: 27.4,
    fats: 2.6,
    fiber: 4.0,
    sodium: 2,
    potassium: 147,
  },
  {
    aliases: ['brown rice', 'jasmine rice', 'basmati rice', 'white rice', 'cooked rice', 'steamed rice', 'rice'],
    serving: '1 cup cooked (150g)',
    baseGrams: 150,
    unitGrams: { g: 1, cup: 150, bowl: 200, plate: 250, oz: 28.35 },
    calories: 195,
    protein: 4.5,
    carbs: 41.2,
    fats: 1.6,
    fiber: 2.5,
    sodium: 5,
    potassium: 84,
  },
  {
    aliases: ['quinoa', 'cooked quinoa'],
    serving: '1 cup cooked (185g)',
    baseGrams: 185,
    unitGrams: { g: 1, cup: 185, bowl: 200, oz: 28.35 },
    calories: 222,
    protein: 8.1,
    carbs: 39.4,
    fats: 3.6,
    fiber: 5.2,
    sodium: 13,
    potassium: 318,
  },
  {
    aliases: ['lentils', 'cooked lentils', 'yellow dal', 'dal', 'daal'],
    serving: '1 bowl / cup cooked (198g)',
    baseGrams: 198,
    unitGrams: { g: 1, cup: 198, bowl: 200, oz: 28.35 },
    calories: 230,
    protein: 17.9,
    carbs: 39.9,
    fats: 0.8,
    fiber: 15.6,
    sodium: 4,
    potassium: 731,
  },
  {
    aliases: ['chickpeas', 'garbanzo beans', 'chana'],
    serving: '1 cup cooked (164g)',
    baseGrams: 164,
    unitGrams: { g: 1, cup: 164, bowl: 164, oz: 28.35 },
    calories: 269,
    protein: 14.5,
    carbs: 45.0,
    fats: 4.2,
    fiber: 12.5,
    sodium: 11,
    potassium: 477,
  },
  {
    aliases: ['black beans', 'kidney beans', 'rajma', 'beans'],
    serving: '1 cup cooked (172g)',
    baseGrams: 172,
    unitGrams: { g: 1, cup: 172, bowl: 172, oz: 28.35 },
    calories: 227,
    protein: 15.2,
    carbs: 40.8,
    fats: 0.9,
    fiber: 15.0,
    sodium: 2,
    potassium: 611,
  },
  {
    aliases: ['roti', 'rotis', 'chapati', 'chapatis', 'phulka', 'whole wheat roti'],
    serving: '1 medium roti (40g)',
    baseGrams: 40,
    unitGrams: { g: 1, piece: 40 },
    calories: 106,
    protein: 3.6,
    carbs: 21.5,
    fats: 0.7,
    fiber: 3.2,
    sodium: 110,
    potassium: 85,
  },
  {
    aliases: ['paratha', 'aloo paratha', 'plain paratha'],
    serving: '1 piece (85g)',
    baseGrams: 85,
    unitGrams: { g: 1, piece: 85 },
    calories: 260,
    protein: 5.5,
    carbs: 36.0,
    fats: 10.2,
    fiber: 3.0,
    sodium: 280,
    potassium: 140,
  },
  {
    aliases: ['idli', 'idlis'],
    serving: '1 piece (40g)',
    baseGrams: 40,
    unitGrams: { g: 1, piece: 40 },
    calories: 58,
    protein: 2.0,
    carbs: 12.0,
    fats: 0.2,
    fiber: 0.8,
    sodium: 95,
    potassium: 45,
  },
  {
    aliases: ['masala dosa', 'plain dosa', 'dosa'],
    serving: '1 dosa (120g)',
    baseGrams: 120,
    unitGrams: { g: 1, piece: 120 },
    calories: 215,
    protein: 5.2,
    carbs: 36.0,
    fats: 5.5,
    fiber: 2.2,
    sodium: 310,
    potassium: 165,
  },
  {
    aliases: ['whole wheat bread', 'sourdough bread', 'white bread', 'bread', 'toast'],
    serving: '1 slice (38g)',
    baseGrams: 38,
    unitGrams: { g: 1, slice: 38, piece: 38 },
    calories: 81,
    protein: 4.0,
    carbs: 13.8,
    fats: 1.1,
    fiber: 1.9,
    sodium: 146,
    potassium: 69,
  },
  {
    aliases: ['bagel', 'whole wheat bagel'],
    serving: '1 medium bagel (95g)',
    baseGrams: 95,
    unitGrams: { g: 1, piece: 95 },
    calories: 245,
    protein: 9.8,
    carbs: 48.0,
    fats: 1.5,
    fiber: 2.3,
    sodium: 430,
    potassium: 95,
  },
  {
    aliases: ['tortilla', 'flour tortilla', 'corn tortilla', 'wrap'],
    serving: '1 medium tortilla (45g)',
    baseGrams: 45,
    unitGrams: { g: 1, piece: 45 },
    calories: 130,
    protein: 3.6,
    carbs: 22.0,
    fats: 3.1,
    fiber: 1.5,
    sodium: 280,
    potassium: 55,
  },
  {
    aliases: ['sweet potato', 'baked sweet potato', 'yam'],
    serving: '1 medium (130g)',
    baseGrams: 130,
    unitGrams: { g: 1, cup: 200, oz: 28.35, piece: 130 },
    calories: 112,
    protein: 2.0,
    carbs: 26.0,
    fats: 0.1,
    fiber: 3.9,
    sodium: 72,
    potassium: 438,
  },
  {
    aliases: ['boiled potato', 'baked potato', 'mashed potatoes', 'potato', 'potatoes'],
    serving: '1 medium (150g)',
    baseGrams: 150,
    unitGrams: { g: 1, cup: 155, oz: 28.35, piece: 150 },
    calories: 130,
    protein: 3.0,
    carbs: 30.0,
    fats: 0.2,
    fiber: 2.8,
    sodium: 10,
    potassium: 620,
  },
  {
    aliases: ['pasta', 'cooked pasta', 'spaghetti', 'penne'],
    serving: '1 cup cooked (140g)',
    baseGrams: 140,
    unitGrams: { g: 1, cup: 140, bowl: 200, plate: 250, oz: 28.35 },
    calories: 220,
    protein: 8.1,
    carbs: 43.2,
    fats: 1.3,
    fiber: 2.5,
    sodium: 1,
    potassium: 61,
  },

  // Healthy Fats & Nuts
  {
    aliases: ['peanut butter', 'almond butter', 'pb'],
    serving: '2 tbsp (32g)',
    baseGrams: 32,
    unitGrams: { g: 1, tbsp: 16, tsp: 5.5, oz: 28.35 },
    calories: 188,
    protein: 8.0,
    carbs: 7.0,
    fats: 16.0,
    fiber: 2.0,
    sodium: 147,
    potassium: 208,
  },
  {
    aliases: ['olive oil', 'coconut oil', 'ghee', 'butter'],
    serving: '1 tbsp (14g)',
    baseGrams: 14,
    unitGrams: { g: 1, tbsp: 14, tsp: 4.7, oz: 28.35 },
    calories: 119,
    protein: 0,
    carbs: 0,
    fats: 13.5,
    fiber: 0,
    sodium: 0,
    potassium: 0,
  },
  {
    aliases: ['almonds', 'walnuts', 'cashews', 'mixed nuts', 'pistachios', 'nuts'],
    serving: '1 handful (28g)',
    baseGrams: 28,
    unitGrams: { g: 1, oz: 28.35, handful: 28, cup: 140, tbsp: 10 },
    calories: 164,
    protein: 6.0,
    carbs: 6.1,
    fats: 14.2,
    fiber: 3.5,
    sodium: 1,
    potassium: 208,
  },
  {
    aliases: ['chia seeds', 'flax seeds', 'pumpkin seeds'],
    serving: '2 tbsp (24g)',
    baseGrams: 24,
    unitGrams: { g: 1, tbsp: 12, tsp: 4, oz: 28.35 },
    calories: 117,
    protein: 4.0,
    carbs: 10.0,
    fats: 7.4,
    fiber: 8.2,
    sodium: 4,
    potassium: 98,
  },
  {
    aliases: ['avocado', 'avocados', 'fresh avocado'],
    serving: '1/2 medium (100g)',
    baseGrams: 100,
    unitGrams: { g: 1, oz: 28.35, slice: 20, piece: 150 },
    calories: 160,
    protein: 2.0,
    carbs: 8.5,
    fats: 14.7,
    fiber: 6.7,
    sodium: 7,
    potassium: 485,
  },
  {
    aliases: ['hummus'],
    serving: '2 tbsp (30g)',
    baseGrams: 30,
    unitGrams: { g: 1, tbsp: 15, cup: 246 },
    calories: 70,
    protein: 2.4,
    carbs: 6.0,
    fats: 4.2,
    fiber: 1.8,
    sodium: 130,
    potassium: 70,
  },

  // Fruits & Vegetables
  {
    aliases: ['banana', 'bananas'],
    serving: '1 medium (118g)',
    baseGrams: 118,
    unitGrams: { g: 1, piece: 118, oz: 28.35 },
    calories: 105,
    protein: 1.3,
    carbs: 27.0,
    fats: 0.3,
    fiber: 3.1,
    sodium: 1,
    potassium: 422,
  },
  {
    aliases: ['green apple', 'red apple', 'apple', 'apples'],
    serving: '1 medium (182g)',
    baseGrams: 182,
    unitGrams: { g: 1, piece: 182, cup: 125, slice: 25 },
    calories: 95,
    protein: 0.5,
    carbs: 25.1,
    fats: 0.3,
    fiber: 4.4,
    sodium: 2,
    potassium: 195,
  },
  {
    aliases: ['orange', 'oranges', 'mandarin'],
    serving: '1 medium (131g)',
    baseGrams: 131,
    unitGrams: { g: 1, piece: 131 },
    calories: 62,
    protein: 1.2,
    carbs: 15.4,
    fats: 0.2,
    fiber: 3.1,
    sodium: 0,
    potassium: 237,
  },
  {
    aliases: ['mango', 'mangoes'],
    serving: '1 cup diced (165g)',
    baseGrams: 165,
    unitGrams: { g: 1, cup: 165, piece: 200 },
    calories: 99,
    protein: 1.4,
    carbs: 24.7,
    fats: 0.6,
    fiber: 2.6,
    sodium: 2,
    potassium: 277,
  },
  {
    aliases: ['blueberries', 'strawberries', 'raspberries', 'mixed berries', 'berries'],
    serving: '1 cup (150g)',
    baseGrams: 150,
    unitGrams: { g: 1, cup: 150, bowl: 150, handful: 45 },
    calories: 84,
    protein: 1.1,
    carbs: 21.0,
    fats: 0.5,
    fiber: 3.6,
    sodium: 1,
    potassium: 114,
  },
  {
    aliases: ['grapes'],
    serving: '1 cup (151g)',
    baseGrams: 151,
    unitGrams: { g: 1, cup: 151, handful: 50 },
    calories: 104,
    protein: 1.1,
    carbs: 27.3,
    fats: 0.2,
    fiber: 1.4,
    sodium: 3,
    potassium: 288,
  },
  {
    aliases: ['steamed broccoli', 'fresh broccoli', 'broccoli'],
    serving: '1 cup chopped (91g)',
    baseGrams: 91,
    unitGrams: { g: 1, cup: 91, bowl: 120, oz: 28.35 },
    calories: 31,
    protein: 2.6,
    carbs: 6.0,
    fats: 0.3,
    fiber: 2.4,
    sodium: 30,
    potassium: 288,
  },
  {
    aliases: ['baby spinach', 'cooked spinach', 'spinach'],
    serving: '2 cups fresh (60g)',
    baseGrams: 60,
    unitGrams: { g: 1, cup: 30, bowl: 60 },
    calories: 14,
    protein: 1.7,
    carbs: 2.2,
    fats: 0.2,
    fiber: 1.3,
    sodium: 48,
    potassium: 335,
  },
  {
    aliases: ['green salad', 'mixed salad', 'caesar salad', 'salad'],
    serving: '1 bowl (150g)',
    baseGrams: 150,
    unitGrams: { g: 1, bowl: 150, plate: 200, cup: 80 },
    calories: 115,
    protein: 3.5,
    carbs: 9.0,
    fats: 7.2,
    fiber: 3.2,
    sodium: 185,
    potassium: 360,
  },

  // Drinks & Quick Meals
  {
    aliases: ['black coffee', 'coffee', 'espresso'],
    serving: '1 cup (240ml)',
    baseGrams: 240,
    unitGrams: { ml: 1, cup: 240 },
    calories: 5,
    protein: 0.3,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sodium: 5,
    potassium: 116,
  },
  {
    aliases: ['latte', 'cappuccino', 'iced coffee with milk'],
    serving: '1 medium cup (350ml)',
    baseGrams: 350,
    unitGrams: { ml: 1, cup: 350, glass: 350 },
    calories: 150,
    protein: 8.5,
    carbs: 13.0,
    fats: 6.5,
    fiber: 0,
    sodium: 130,
    potassium: 340,
  },
  {
    aliases: ['fruit smoothie', 'protein smoothie', 'smoothie'],
    serving: '1 glass (350ml)',
    baseGrams: 350,
    unitGrams: { ml: 1, glass: 350, cup: 250 },
    calories: 240,
    protein: 14.0,
    carbs: 38.0,
    fats: 3.5,
    fiber: 4.2,
    sodium: 110,
    potassium: 460,
  },
  {
    aliases: ['chicken burger', 'hamburger', 'cheeseburger', 'burger'],
    serving: '1 burger (180g)',
    baseGrams: 180,
    unitGrams: { g: 1, piece: 180 },
    calories: 430,
    protein: 24.0,
    carbs: 36.0,
    fats: 21.0,
    fiber: 2.0,
    sodium: 780,
    potassium: 320,
  },
  {
    aliases: ['pizza slice', 'cheese pizza', 'pepperoni pizza', 'pizza'],
    serving: '1 large slice (110g)',
    baseGrams: 110,
    unitGrams: { g: 1, slice: 110 },
    calories: 285,
    protein: 12.2,
    carbs: 35.6,
    fats: 10.4,
    fiber: 2.5,
    sodium: 640,
    potassium: 184,
  },
  {
    aliases: ['honey'],
    serving: '1 tbsp (21g)',
    baseGrams: 21,
    unitGrams: { g: 1, tbsp: 21, tsp: 7 },
    calories: 64,
    protein: 0.1,
    carbs: 17.3,
    fats: 0,
    fiber: 0,
    sodium: 1,
    potassium: 11,
  },
  {
    aliases: ['dark chocolate', 'chocolate'],
    serving: '1 oz / 28g',
    baseGrams: 28,
    unitGrams: { g: 1, oz: 28, bar: 45, piece: 10 },
    calories: 168,
    protein: 2.2,
    carbs: 13.0,
    fats: 12.0,
    fiber: 3.1,
    sodium: 6,
    potassium: 200,
  },
];

// Pre-build a flattened alias table sorted by length descending so multi-word matches always win
interface AliasLookup {
  alias: string;
  food: CommonNutrientProfile;
}

const SORTED_ALIASES: AliasLookup[] = COMMON_FOODS.flatMap((food) =>
  food.aliases.map((alias) => ({ alias: alias.toLowerCase(), food }))
).sort((a, b) => b.alias.length - a.alias.length);

// Number word mapper (supports words, fractions, informal quantities)
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  a: 1,
  an: 1,
  one: 1,
  single: 1,
  two: 2,
  couple: 2,
  pair: 2,
  double: 2,
  three: 3,
  triple: 3,
  four: 4,
  five: 5,
  six: 6,
  half: 0.5,
  quarter: 0.25,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  fifteen: 15,
  twenty: 20,
};

const UNIT_ALIASES: Record<string, keyof NonNullable<CommonNutrientProfile['unitGrams']>> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  gm: 'g',
  gms: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  cup: 'cup',
  cups: 'cup',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  scoop: 'scoop',
  scoops: 'scoop',
  slice: 'slice',
  slices: 'slice',
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  bowl: 'bowl',
  bowls: 'bowl',
  plate: 'plate',
  plates: 'plate',
  glass: 'glass',
  glasses: 'glass',
  can: 'can',
  cans: 'can',
  bar: 'bar',
  bars: 'bar',
  handful: 'handful',
  handfuls: 'handful',
};

/**
 * Searches local USDA standard food database + attempts Open Food Facts public API
 */
export async function searchFoodItem(query: string): Promise<FoodItem[]> {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const localMatches: FoodItem[] = [];
  for (const food of COMMON_FOODS) {
    if (food.aliases.some((alias) => alias.includes(clean) || clean.includes(alias))) {
      localMatches.push({
        name: capitalizeWords(food.aliases[0]),
        servingSize: food.serving,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
        sodium: food.sodium,
        potassium: food.potassium,
      });
    }
  }

  // Query Open Food Facts public database if local results are sparse
  if (localMatches.length < 3) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          clean
        )}&search_simple=1&action=process&json=1&page_size=5`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
          for (const prod of data.products) {
            const name = prod.product_name || prod.generic_name;
            if (!name) continue;
            const nut = prod.nutriments || {};
            const calories = Math.round(nut['energy-kcal_100g'] || nut['energy-kcal'] || (nut.energy_100g ? nut.energy_100g / 4.184 : 0));
            const protein = Math.round((nut.proteins_100g || nut.proteins || 0) * 10) / 10;
            const carbs = Math.round((nut.carbohydrates_100g || nut.carbohydrates || 0) * 10) / 10;
            const fats = Math.round((nut.fat_100g || nut.fat || 0) * 10) / 10;
            const fiber = Math.round((nut.fiber_100g || nut.fiber || 0) * 10) / 10;
            const sodium = Math.round((nut.sodium_100g || (nut.salt_100g ? nut.salt_100g / 2.5 : 0)) * 1000);
            const potassium = Math.round((nut.potassium_100g || 0) * 1000);

            if (calories > 0 || protein > 0 || carbs > 0) {
              localMatches.push({
                name: capitalizeWords(name.slice(0, 45)),
                servingSize: prod.serving_size || '100g',
                calories,
                protein,
                carbs,
                fats,
                fiber: fiber || undefined,
                sodium: sodium || undefined,
                potassium: potassium || undefined,
              });
            }
          }
        }
      }
    } catch {
      // Graceful fallback to local database
    }
  }

  const seen = new Set<string>();
  return localMatches.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Natural language parser for speech-to-text & quick-entry food intake logs.
 * Handles weights/units (200g, 6 oz, 2 tbsp, 1.5 cups), fractions (1/2, half, one and a half),
 * size modifiers (large, small), and multi-item sentences accurately.
 */
export function parseSpokenFoodText(transcript: string): FoodItem[] {
  if (!transcript || !transcript.trim()) return [];

  // 1. Strip conversational filler anywhere in sentence
  let cleanText = transcript.toLowerCase().trim();
  cleanText = cleanText
    .replace(/\b(today i had|today i ate|i just had|i just ate|please log|log my|i had|i ate|ate some|had some|for breakfast|for lunch|for dinner|as a snack|for my snack|this morning|tonight|right now|roughly|approximately|around|about)\b/gi, ' ')
    .replace(/\b(one and a half|1 and a half|1 and 1\/2)\b/gi, '1.5')
    .replace(/\b(two and a half|2 and a half)\b/gi, '2.5')
    .replace(/\b(three quarters|3\/4)\b/gi, '0.75')
    .replace(/\b(a quarter of a|quarter of a|1\/4)\b/gi, '0.25')
    .replace(/\b(half a|half an|a half|1\/2)\b/gi, '0.5')
    .replace(/\b(a couple of|couple of)\b/gi, '2')
    .replace(/\ba dozen\b/gi, '12')
    .replace(/(\d+)\s*(g|grams?|gms?|kg|oz|ounces?|lb|lbs|ml|l|tbsp|tsp)\b/gi, '$1 $2') // separate "200g" -> "200 g"
    .replace(/\s+/g, ' ')
    .trim();

  // Protect "and" inside compound names before splitting
  cleanText = cleanText
    .replace(/\bpeanut butter and jelly\b/gi, 'peanut butter__pbj')
    .replace(/\bmac and cheese\b/gi, 'mac__cheese');

  // 2. Split on separators: commas, "and", "with", "plus", "then", "also", "&"
  const segments = cleanText
    .split(/,|;|\n|\s&\s|\band\b|\bwith\b|\bplus\b|\bthen\b|\balso\b/gi)
    .map((s) =>
      s
        .replace(/__pbj/g, ' and jelly')
        .replace(/__cheese/g, ' and cheese')
        .trim()
    )
    .filter((s) => s.length > 1);

  const recognizedItems: FoodItem[] = [];

  for (const seg of segments) {
    const parsed = parseSegmentToFoodItem(seg);
    if (parsed) {
      recognizedItems.push(parsed);
    }
  }

  // 3. Fallback full-string scan if segment splitting yielded nothing
  if (recognizedItems.length === 0) {
    const matched = matchFoodInText(cleanText);
    if (matched) {
      recognizedItems.push(matched);
    }
  }

  // 4. Smart heuristic fallback if completely unknown food item
  if (recognizedItems.length === 0 && cleanText.length > 2) {
    const cleanedName = cleanText.replace(/^(a|an|the|some)\s+/i, '').trim();
    recognizedItems.push({
      name: capitalizeWords(cleanedName.slice(0, 50)),
      servingSize: '1 portion (est. — tap Search to refine)',
      calories: 180,
      protein: 8,
      carbs: 22,
      fats: 6,
      fiber: 2,
      sodium: 150,
      potassium: 180,
    });
  }

  return recognizedItems;
}

function parseNumericToken(token: string): number | null {
  const clean = token.trim().toLowerCase();
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return parseFloat(clean);
  }
  if (/^\d+\/\d+$/.test(clean)) {
    const [n, d] = clean.split('/').map(Number);
    return d > 0 ? n / d : null;
  }
  if (NUMBER_WORDS[clean] !== undefined) {
    return NUMBER_WORDS[clean];
  }
  return null;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchFoodInText(segment: string): FoodItem | null {
  const tokens = segment.trim().split(/\s+/);
  let qty = 1;
  let unitKey: keyof NonNullable<CommonNutrientProfile['unitGrams']> | null = null;
  let sizeFactor = 1;
  let idx = 0;

  // Step A: Leading quantity ("2", "1.5", "two", "half")
  if (idx < tokens.length) {
    const parsedNum = parseNumericToken(tokens[idx]);
    if (parsedNum !== null) {
      qty = parsedNum;
      idx++;
    }
  }

  // Optional size adjective ("small", "medium", "large", "big", "extra large")
  if (idx < tokens.length) {
    const sizeTok = tokens[idx].toLowerCase();
    if (sizeTok === 'small') {
      sizeFactor = 0.8;
      idx++;
    } else if (sizeTok === 'medium' || sizeTok === 'regular') {
      sizeFactor = 1;
      idx++;
    } else if (sizeTok === 'large' || sizeTok === 'big') {
      sizeFactor = 1.25;
      idx++;
    } else if (sizeTok === 'huge' || sizeTok === 'jumbo') {
      sizeFactor = 1.5;
      idx++;
    }
  }

  // Step B: Unit token ("g", "oz", "cup", "tbsp", "scoop", "bowl", "slice", "plate")
  if (idx < tokens.length && UNIT_ALIASES[tokens[idx].toLowerCase()]) {
    unitKey = UNIT_ALIASES[tokens[idx].toLowerCase()];
    idx++;
  }

  // Consume optional connecting word "of" ("bowl of oatmeal", "200 g of chicken")
  if (idx < tokens.length && tokens[idx].toLowerCase() === 'of') {
    idx++;
  }

  const remainingPhrase = tokens.slice(idx).join(' ').trim() || segment;

  // Step C: Longest-alias exact word-boundary match first, then substring fallback
  let matchedProfile: CommonNutrientProfile | null = null;

  for (const entry of SORTED_ALIASES) {
    const boundaryRe = new RegExp(`\\b${escapeRegExp(entry.alias)}\\b`, 'i');
    if (boundaryRe.test(remainingPhrase)) {
      matchedProfile = entry.food;
      break;
    }
  }

  if (!matchedProfile) {
    for (const entry of SORTED_ALIASES) {
      if (remainingPhrase.includes(entry.alias) || entry.alias.includes(remainingPhrase)) {
        matchedProfile = entry.food;
        break;
      }
    }
  }

  if (!matchedProfile) return null;

  // Step D: Compute accurate multiplier based on weight/volume unit vs food's baseGrams
  let multiplier = qty * sizeFactor;
  let servingLabel = `${qty !== 1 ? `${qty} × ` : ''}${matchedProfile.serving}`;

  if (unitKey) {
    const unitWeight =
      matchedProfile.unitGrams?.[unitKey] ??
      (unitKey === 'g'
        ? 1
        : unitKey === 'kg'
        ? 1000
        : unitKey === 'oz'
        ? 28.35
        : unitKey === 'lb'
        ? 453.6
        : unitKey === 'ml'
        ? 1
        : undefined);

    if (unitWeight !== undefined && matchedProfile.baseGrams > 0) {
      multiplier = ((qty * unitWeight) / matchedProfile.baseGrams) * sizeFactor;
      servingLabel = `${qty} ${unitKey}`;
    } else {
      servingLabel = `${qty} ${unitKey}`;
    }
  }

  // Round values cleanly
  const calories = Math.max(1, Math.round(matchedProfile.calories * multiplier));
  const protein = Math.round(matchedProfile.protein * multiplier * 10) / 10;
  const carbs = Math.round(matchedProfile.carbs * multiplier * 10) / 10;
  const fats = Math.round(matchedProfile.fats * multiplier * 10) / 10;
  const fiber = matchedProfile.fiber ? Math.round(matchedProfile.fiber * multiplier * 10) / 10 : 0;
  const sodium = matchedProfile.sodium ? Math.round(matchedProfile.sodium * multiplier) : 0;
  const potassium = matchedProfile.potassium ? Math.round(matchedProfile.potassium * multiplier) : 0;

  const displayQtyPrefix = unitKey
    ? `${qty}${unitKey === 'g' || unitKey === 'ml' || unitKey === 'oz' || unitKey === 'kg' ? unitKey : ` ${unitKey}`} `
    : qty !== 1
    ? `${qty}× `
    : '';

  return {
    name: `${displayQtyPrefix}${capitalizeWords(matchedProfile.aliases[0])}`.trim(),
    servingSize: servingLabel,
    calories,
    protein,
    carbs,
    fats,
    fiber,
    sodium,
    potassium,
  };
}

function parseSegmentToFoodItem(segment: string): FoodItem | null {
  const direct = matchFoodInText(segment);
  if (direct) return direct;

  // Unmatched explicit segment? Provide clean editable estimate only if meaningful (>= 3 chars and not pure filler)
  const trimmed = segment.replace(/^(a|an|the|some|of)\s+/i, '').trim();
  if (trimmed.length >= 3 && !/^\d+(\.\d+)?$/.test(trimmed)) {
    return {
      name: capitalizeWords(trimmed.slice(0, 45)),
      servingSize: '1 serving (est. — adjust or search)',
      calories: 160,
      protein: 7,
      carbs: 20,
      fats: 5,
      fiber: 2,
      sodium: 140,
      potassium: 160,
    };
  }
  return null;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
