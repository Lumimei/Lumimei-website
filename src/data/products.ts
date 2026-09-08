import { Product, Category, SkinConcern, BeautyTip, Review } from '../types';
import soapImg from '../assets/images/lumimei_soap_1785062880444.jpg';
import riceMaskImg from '../assets/images/lumimei_rice_mask_1785063133244.jpg';
import serumImg from '../assets/images/lumimei_serum_1785063150378.jpg';
import coconutOilImg from '../assets/images/lumimei_coconut_oil_1785063164037.jpg';
import eyebrowPencilImg from '../assets/images/lumimei_eyebrow_pencil_1785063179712.jpg';

export const KHR_RATE = 4100;

export const SKIN_CONCERNS: SkinConcern[] = [
  { id: 'all', name: 'All Concerns', nameKm: 'បញ្ហាស្បែកទាំងអស់', nameZh: '所有肤质问题' },
  { id: 'acne', name: 'Acne & Blemishes', nameKm: 'ស្បែកមានមុន & ស្នាម', nameZh: '祛痘去印' },
  { id: 'hydration', name: 'Dryness & Dehydration', nameKm: 'ស្បែកស្ងួត & ខ្វះទឹក', nameZh: '保湿补水' },
  { id: 'brightening', name: 'Dark Spots & Dullness', nameKm: 'ស្បែកស្រអាប់ & ស្នាមជាំ', nameZh: '美白亮肤' },
  { id: 'antiaging', name: 'Anti-Aging & Wrinkles', nameKm: 'ពន្យារវ័យ & ជ្រួញ', nameZh: '抗衰紧致' },
  { id: 'sensitive', name: 'Redness & Sensitivity', nameKm: 'ស្បែកស្តើង & ងាយរមាស់', nameZh: '舒缓修护' },
];

export const BRANDS = [
  'Lumimei Cambodia'
];

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Products', nameKm: 'ទាំងអស់', nameZh: '全部商品', icon: 'Sparkles' },
  { id: 'promotion', name: 'Promotion (Special Offers)', nameKm: 'ប្រូម៉ូសិន (Promotion)', nameZh: '特惠促销 (Promotion)', icon: 'Tag' },
  { id: 'best-seller', name: 'Best Sellers', nameKm: 'ផលិតផលលក់ដាច់', nameZh: '畅销热卖 (Best Sellers)', icon: 'Flame' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Acne Care Set (Large)',
    nameKm: 'ឈុតថែរក្សាមុខមុន(ធំ)',
    nameZh: 'Lumimei 祛痘修护大套装',
    brand: 'Lumimei Cambodia',
    category: 'best-seller',
    priceUsd: 33.00,
    priceKhr: Math.round(33.00 * KHR_RATE),
    originalPriceUsd: 40.00,
    rating: 0,
    reviewCount: 0,
    image: 'https://i.postimg.cc/Dz534vg7/IMG-20260708-135255.png',
    gallery: ['https://i.postimg.cc/Dz534vg7/IMG-20260708-135255.png', riceMaskImg],
    isBestSeller: true,
    isNew: true,
    skinTypes: ['all', 'acne', 'oily', 'combination', 'sensitive', 'dry'],
    skinConcerns: ['acne', 'brightening', 'hydration'],
    description: '100% Authentic Lumimei Acne Care Set (Large) formulated with natural botanical ingredients. Deeply purifies pores, exfoliates gently, and heals acne.',
    descriptionKm: 'ឈុតថែរក្សាមុខមុន(ធំ) Lumimei ផ្សំពីរុក្ខជាតិធម្មជាតិសុទ្ធ ១០០% ជួយជម្រុះកោសិកាចាស់ៗ សម្អាតរន្ធញើស បំបាត់មុនគ្រប់ប្រភេទ និងធ្វើឲ្យស្បែកមុខសរលោងថ្លាម៉ត់ប្រកបដោយសុវត្ថិភាព។',
    descriptionZh: 'Lumimei 祛痘修护大套装，温和去角质，深层清洁毛孔，祛痘修护，让肌肤细嫩白皙。',
    howToUse: 'Apply an even layer over clean face, leave on for 10-15 minutes, then rinse gently with water.',
    howToUseZh: '均匀涂抹于洁净面部，敷10-15分钟后用清水冲洗干净。',
    ingredients: 'អង្ករ (Rice), ប្រទាលកន្ទុយក្រពើ (Aloe Vera), ប្រេងដូង (Coconut Oil), ទឹកឃ្មុំ (Honey)',
    stock: 100,
    volume: '60g',
    madeInKm: 'ផលិតនៅប្រទេសកម្ពុជា 🇰🇭',
    benefitsKm: [
      'ជួយបឺតជាតិពុល និងជម្រុះកោសិកាចាស់ៗ',
      'ជួយព្យាបាលមុខមុន មុនរលាក មុខរោល និងមុខមានសរសៃក្រហម',
      'ជួយអោយមុខខ្មៅស្រអាប់ មុនមានរន្ធញើសធំទៅជាភ្លឺថ្លាម៉តរលោង',
      'កាន់តែប្រើជួយអោយស្បែកមុខភ្លឺថ្លាម៉តរលោងចេញពីខាងក្នុង',
      'ជួយគ្រប់គ្រងជាតិខ្លាញ់បានល្អប្រសើរ'
    ],
    suitableForKm: [
      'អ្នកដែលមានមុខមុន មុនរលាក មុខរោល មុខមានសរសៃក្រហម មុខខ្មៅស្រអាប់ មុនមានរន្ធញើសធំ ប្រើផលិតផលច្រើនហើយតែនៅតែមានបញ្ហា',
      'អ្នកដែលធ្លាប់ផាត់ម្សៅក្រាស់ៗ ផាត់មុខអត់ចូល ចង់ជម្រុះកោសិកាចាស់ៗ និងបឺតជាតិពុលចេញពីស្បែកមុខ',
      'អ្នកដែលចង់បានស្បែកមុខភ្លឺថ្លាម៉តរលោងចេញពីខាងក្នុង',
      'អ្នកដែលឧស្សាហ៍មុខឡើងខ្លាញ់ ចង់ឱ្យស្បែកមុខកាត់បន្ថយខ្លាញ់'
    ],
    notSuitableForKm: [
      'អ្នកដែលចង់ជាពីមុខមុនក្នុងរយៈពេលខ្លីរហ័សពេក',
      'អ្នកដែលប្រើប្រាស់តែមួយមុខតែចង់ជាពីមុខមុនបានគ្រប់ប្រភេទ'
    ],
    whoCanUseKm: [
      'អាចប្រើប្រាស់បានទាំងប្រុស និងទាំងស្រី',
      'អាចប្រើប្រាស់បានចាប់ពីក្មេងអាយុ 12 ឆ្នាំឡើងទៅ',
      'ស្ត្រីមានផ្ទៃពោះ និងម្តាយបំបៅដោះកូន',
      'អ្នកដែលមានមុខស្តើង សរសៃក្រហម ឬមុខងាយមានប្រតិកម្ម'
    ],
    whoCannotUseKm: [
      'ក្មេងក្រោមអាយុ 12 ឆ្នាំ'
    ],
    storageKm: [
      'ទុកនៅកន្លែងស្ងួត មិនត្រូវទុកដាក់នៅកន្លែងសើម (ដូចជានៅក្នុងបន្ទប់ទឹក)',
      'ទុកនៅក្នុងផ្ទះ ដែលមានសីតុណ្ហភាពមិនក្តៅពេក និងមិនត្រជាក់ពេក',
      'មិនតម្រូវឲ្យទុកក្នុងទូទឹកកកនោះទេ',
      'ទុកឱ្យឆ្ងាយពីដៃក្មេង'
    ],
    precautionsKm: [
      'ពេលដែលបិទ ប្រយ័ត្នកុំឲ្យប៉ះនឹងភ្នែក',
      'មិនត្រូវបិទម៉ាស រួចចូលគេងនោះទេ'
    ],
    howToUseKm: '១. លាងមុខឱ្យស្អាត ដួសម្សៅ ២-៣ ស្លាបព្រាកាហ្វេ ដាក់នៅក្នុងកូនចានមួយ\n២. លាយជាមួយនឹងទឹកស្អាតធម្មតា ឬទឹកដោះគោស្រស់ រួចកូឱ្យវាក្លាយជាល្បាយតែមួយ\n៣. បិទលើមុខទុកចោល 15 នាទី រួចលាងចេញ\n៤. ពេលលាងហើយ ត្រូវលាងជាមួយនឹងសាប៊ូមួយតង់ទៀត\n៥. ចំពោះអ្នកប្រើប្រាស់ថ្មីៗ មួយអាទិត្យដំបូងបិទរាល់ថ្ងៃ ក្រោយពីមួយអាទិត្យហើយ អាចបិទ ២ ថ្ងៃម្ដង។',
    videoUrl: 'https://youtube.com/shorts/0MqVvrtIGWI?si=vDuVN86Iby5Zijni',
    newUserGuideKm: '🌿 ផលិតផលធម្មជាតិ៖ ប្រើដំបូង "រាងរើសស្បែក" តែលទ្ធផលក្រោយមក "ដឹងតែស្អាតប្លែក" ✨ មិនខកបំណង!\n\nស្បែកខ្លះធ្លាប់ឆ្លងកាត់ជាតិគីមី ឬមានកោសិកាចាស់កកស្ទះច្រើន ពេលប្រើដំបូងអាចមានអារម្មណ៍ថាក្ដៅ រមាស់ ឬស្ងួតបន្តិច ព្រោះវាជាវគ្គ "ជម្រុះជាតិពុល និងបន្សាំស្បែក"។ នេះជាសញ្ញាបង្ហាញថា សារធាតុផ្សំធម្មជាតិកំពុងចូលទៅធ្វើការយ៉ាងសកម្ម ដើម្បីជម្រុះកាកសំណល់ចាស់ៗ និងកោសិកាងាប់ៗចេញពីរន្ធរោម។\n\n❌ មិនមែនប្រតិកម្មរោលខូចស្បែកទេ តែជាដំណើរការជួសជុលកោសិកាពីខាងក្នុង។ ទ្រាំអត់ធ្មត់ដំបូង ១-២ សប្ដាហ៍ ស្បែកនឹងចាប់ផ្ដើមប្លែក ភ្លឺថ្លា ម៉ត់ខៃ មានសុខភាពល្អពិតប្រាកដ។'
  },
  {
    id: 'p2',
    name: 'Acne Care Set (Small)',
    nameKm: 'ឈុតថែរក្សាមុខមុន(តូច)',
    nameZh: 'Lumimei 祛痘修护小套装',
    brand: 'Lumimei Cambodia',
    category: 'best-seller',
    priceUsd: 21.00,
    priceKhr: Math.round(21.00 * KHR_RATE),
    originalPriceUsd: 26.00,
    rating: 0,
    reviewCount: 0,
    image: serumImg,
    gallery: [serumImg],
    isBestSeller: true,
    isNew: true,
    skinTypes: ['all', 'acne', 'dry', 'oily', 'sensitive'],
    skinConcerns: ['acne', 'brightening', 'hydration', 'antiaging'],
    description: 'Acne Care Set (Small) hydrates deeply, reduces dark spots, and improves skin elasticity for a youthful radiance.',
    descriptionKm: 'ឈុតថែរក្សាមុខមុន(តូច) ជួយជួសជុលស្បែកមុខ បំបាត់ស្នាមមុន ផ្តល់សំណើមយ៉ាងជ្រាលជ្រៅ និងធ្វើឲ្យស្បែកមុខមានពន្លឺចាំងថ្លា។',
    descriptionZh: 'Lumimei 祛痘修护小套装，深层修护，淡化痘印，补水提亮。',
    howToUse: 'Apply 2-3 drops to clean face and neck, massage gently until fully absorbed.',
    howToUseKm: 'បន្តក់ ២-៣ ដំណក់លើផ្ទៃមុខ និងកស្អាត រួចអង្អែលស្រាលៗឲ្យជ្រាបចូលស្បែក។',
    howToUseZh: '取2-3滴涂抹于干净的面部和颈部，轻轻按摩至完全吸收。',
    ingredients: 'Hyaluronic Acid, Vitamin C, Niacinamide, Botanical Extracts, Purified Aqua.',
    stock: 80,
    volume: '15g'
  },
  {
    id: 'p3',
    name: 'Double Cleansing Set',
    nameKm: 'ឈុតលាងមុខ ២ តង់',
    nameZh: 'Lumimei 双重洁面套装',
    brand: 'Lumimei Cambodia',
    category: 'promotion',
    priceUsd: 15.00,
    priceKhr: Math.round(15.00 * KHR_RATE),
    originalPriceUsd: 19.00,
    rating: 0,
    reviewCount: 0,
    image: coconutOilImg,
    gallery: [coconutOilImg],
    isBestSeller: true,
    isFreeShipping: true,
    skinTypes: ['all', 'dry', 'sensitive', 'normal'],
    skinConcerns: ['hydration', 'brightening', 'sensitive'],
    description: 'Double Cleansing Set deeply cleanses, moisturizes skin, repairs dry patches, and preserves skin moisture.',
    descriptionKm: 'ឈុតលាងមុខ ២ តង់ ជួយសម្អាតស្បែកយ៉ាងជ្រៅ ផ្តល់សំណើមដល់ស្បែក ការពារស្បែកស្ងួតប្រេះ និងធ្វើឲ្យស្បែកទន់ល្មើយ (Free ដឹកជញ្ជូន)។',
    descriptionZh: '双重洁面卸妆滋润套装，温和深层清洁，滋润修护（包邮）。',
    howToUse: 'Apply a small amount to skin or hair as needed. Massage gently.',
    howToUseKm: 'លាបលើស្បែក ឬសក់ក្នុងបរិមាណសមល្មម រួចអង្អែលថ្នមៗ។',
    howToUseZh: '取适量涂抹于皮肤或头发上，轻轻按摩。',
    ingredients: '100% Pure Cold-Pressed Virgin Coconut Oil (Cocos Nucifera Oil).',
    stock: 120,
    volume: '100g'
  },
  {
    id: 'p4',
    name: 'Lumimei Soap (3 Bars)',
    nameKm: 'Lumimei សាប៊ូ (៣ដុំ)',
    nameZh: 'Lumimei 天然草本香皂 (3块装)',
    brand: 'Lumimei Cambodia',
    category: 'best-seller',
    priceUsd: 10.00,
    priceKhr: Math.round(10.00 * KHR_RATE),
    originalPriceUsd: 13.00,
    rating: 0,
    reviewCount: 0,
    image: soapImg,
    gallery: [soapImg],
    isBestSeller: true,
    skinTypes: ['all', 'acne', 'oily', 'sensitive'],
    skinConcerns: ['acne', 'brightening', 'hydration'],
    description: '100% Organic handcrafted Lumimei Soap (3 Bars) made with pure coconut oil and herbal extracts. Cleanses deeply while preserving skin moisture.',
    descriptionKm: 'Lumimei សាប៊ូ (៣ដុំ) ធម្មជាតិ ផ្សំពីប្រេងដូង និងរុក្ខជាតិធម្មជាតិ ១០០% មិនមានសារធាតុគីមីបក់កាត់។ ជួយសម្អាតស្បែកយ៉ាងជ្រៅ បំបាត់មុនខ្នង និងមុនមុខ។',
    descriptionZh: '100% 纯天然草本手工皂（3块装），深层清洁，祛痘抑菌。',
    howToUse: 'Lather with water in hands, gently massage face or body, then rinse thoroughly.',
    howToUseKm: 'ដុសសាប៊ូជាមួយទឹកឲ្យកើតពពុះ រួចម៉ាសាលើផ្ទៃមុខ ឬដងខ្លួន រួចលាងទឹកចេញឲ្យស្អាត។',
    howToUseZh: '沾水打出丰富泡沫，涂抹面部或身体后用清水冲洗。',
    ingredients: 'Coconut Oil, Glycerin, Herbal Extracts, Tocopherol (Vitamin E).',
    stock: 150,
    volume: '3 x 100g'
  },
  {
    id: 'p5',
    name: 'Lumimei Soap (6 Bars)',
    nameKm: 'Lumimei សាប៊ូ (៦ដុំ)',
    nameZh: 'Lumimei 天然草本香皂 (6块装)',
    brand: 'Lumimei Cambodia',
    category: 'promotion',
    priceUsd: 18.00,
    priceKhr: Math.round(18.00 * KHR_RATE),
    originalPriceUsd: 22.00,
    rating: 0,
    reviewCount: 0,
    image: eyebrowPencilImg,
    gallery: [eyebrowPencilImg],
    isBestSeller: false,
    isNew: true,
    isFreeShipping: true,
    skinTypes: ['all'],
    skinConcerns: ['brightening'],
    description: 'Lumimei Soap (6 Bars) value pack for continuous natural skincare, deep purification, and glowing skin.',
    descriptionKm: 'Lumimei សាប៊ូ (៦ដុំ) ឈុតសន្សំសំចៃខ្ពស់ ផ្សំពីរុក្ខជាតិធម្មជាតិសុទ្ធ ១០០% ជួយសម្អាតស្បែក បំបាត់មុន និងផ្ដល់សំណើមស្បែកមុខ និងដងខ្លួន (Free ដឹកជញ្ជូន)។',
    descriptionZh: 'Lumimei 天然草本香皂（6块超值装），深层清洁抑菌（包邮）。',
    howToUse: 'Lather with water in hands, gently massage face or body, then rinse thoroughly.',
    howToUseKm: 'ដុសសាប៊ូជាមួយទឹកឲ្យកើតពពុះ រួចម៉ាសាលើផ្ទៃមុខ ឬដងខ្លួន រួចលាងទឹកចេញឲ្យស្អាត។',
    howToUseZh: '沾水打出丰富泡沫，涂抹面部或身体后用清水冲洗。',
    ingredients: 'Coconut Oil, Glycerin, Herbal Extracts, Tocopherol (Vitamin E).',
    stock: 90,
    volume: '6 x 100g'
  }
];

export const BEAUTY_TIPS: BeautyTip[] = [
  {
    id: 'tip-1',
    title: '5 Steps to Build an Effective Daily Skincare Routine in Cambodia',
    titleKm: 'វិធីសាស្រ្ត ៥ យ៉ាងក្នុងការថែរក្សាស្បែកមុខឲ្យត្រឹមត្រូវសម្រាប់អាកាសធាតុក្តៅនៅកម្ពុជា',
    category: 'Skincare Basics',
    categoryKm: 'ចំណេះដឹងគ្រឹះ',
    readTime: '3 min read',
    summary: 'Learn how to keep your skin fresh, hydrated, and protected from heat and humidity.',
    summaryKm: 'រៀនពីរបៀបរក្សាស្បែកមុខឲ្យមានសំណើម មិនស្អិត និងការពារពីកំដៅថ្ងៃខ្លាំង។',
    image: 'https://images.unsplash.com/photo-1512290900673-04021dd51a14?auto=format&fit=crop&q=80&w=800',
    contentKm: [
      '១. លាងសម្អាតមុខឲ្យបានស្អាតល្អពីរដងក្នុងមួយថ្ងៃ (Double Cleansing ពេលល្ងាច) ដើម្បីជម្រះដីធូលី និងឡេការពារកំដៅថ្ងៃ។',
      '២. ប្រើប្រាស់តូណឺ (Toner) ដែលគ្មានជាតិអាល់កុល ដើម្បីតម្រូវ pH និងផ្តល់សំណើមបឋម។',
      '៣. បន្ថែមសេរ៉ូម (Serum) ដែលសមស្របនឹងបញ្ហាស្បែក ដូចជា Niacinamide សម្រាប់បង្រួមរន្ធញើស ឬ Hyaluronic Acid សម្រាប់ផ្តល់សំណើម។',
      '៤. ប្រើប្រាស់ឡេផ្តល់សំណើមប្រភេទ Gel / Lotion ស្រាលៗ ដើម្បីជៀសវាងការស្អិត និងកើតមុនក្បាលខ្មៅ។',
      '៥. លាបឡេការពារកំដៅថ្ងៃ SPF50+ PA++++ ជាចាំបាច់រៀងរាល់ព្រឹក ទោះបីជានៅក្នុងផ្ទះក៏ដោយ។'
    ]
  },
  {
    id: 'tip-2',
    title: 'How to Choose the Right Sunscreen for Oily Skin',
    titleKm: 'របៀបជ្រើសរើសឡេការពារកំដៅថ្ងៃសម្រាប់អ្នកមានស្បែកមុខខ្លាញ់',
    category: 'Sun Protection',
    categoryKm: 'ការការពារកំដៅថ្ងៃ',
    readTime: '2 min read',
    summary: 'Say goodbye to heavy, oily sunscreens with these expert tips.',
    summaryKm: 'លាហើយឡេការពារកំដៅថ្ងៃស្អិតមុខ និងកើនខ្លាញ់ ជាមួយបច្ចេកទេសជ្រើសរើសឡេស្រាល។',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    contentKm: [
      'សម្រាប់អ្នកមានស្បែកមុខខ្លាញ់ គួរជ្រើសរើសឡេប្រភេទ Chemical ឬ Hybrid ដែលមានសាច់ឡេស្រាល (Fluid / Milk / Essence)។',
      'ស្វែងរកពាក្យថា Non-comedogenic, Sebum Control, និង Oil-free លើសំបកដប។',
      'ឡេការពារកំដៅថ្ងៃកូរ៉េ និងជប៉ុនសម័យថ្មី ដូចជា Beauty of Joseon និង Anessa ផ្តល់ភាពស្រស់ថ្លា និងមិនបន្សល់ទុកស្នាមសឡើយ។'
    ]
  }
];

export const SAMPLE_REVIEWS: Review[] = [];
