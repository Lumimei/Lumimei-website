import { Product, Category, SkinConcern, BeautyTip } from '../types';
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
  { id: 'all', name: 'All Products', nameKm: 'ផលិតផលទាំងអស់', nameZh: '全部商品', icon: 'Sparkles' },
  { id: 'mask', name: 'Lumimei Clay Mask', nameKm: 'Lumimei Clay Mask', nameZh: 'Lumimei 泥膜', icon: 'Smile' },
  { id: 'serum', name: 'Lumimei Serum', nameKm: 'Lumimei សេរ៉ូម', nameZh: 'Lumimei 精华液', icon: 'Zap' },
  { id: 'oil', name: 'Lumimei Coconut Oil', nameKm: 'Lumimei ប្រេងដូង', nameZh: 'Lumimei 椰子油', icon: 'Sun' },
  { id: 'cleanser', name: 'Lumimei Soap', nameKm: 'Lumimei សាប៊ូ', nameZh: 'Lumimei 香皂', icon: 'Droplets' },
  { id: 'makeup', name: 'Eyebrow Pencil', nameKm: 'ខ្មៅដៃគូសចិញ្ចើម', nameZh: '眉笔', icon: 'Heart' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Lumimei Clay Mask',
    nameKm: 'Lumimei Clay Mask',
    nameZh: 'Lumimei 天然大米泥膜',
    brand: 'Lumimei Cambodia',
    category: 'mask',
    priceUsd: 10.00,
    priceKhr: Math.round(10.00 * KHR_RATE),
    originalPriceUsd: 14.00,
    rating: 5.0,
    reviewCount: 342,
    image: 'https://i.postimg.cc/Dz534vg7/IMG-20260708-135255.png',
    gallery: ['https://i.postimg.cc/Dz534vg7/IMG-20260708-135255.png', riceMaskImg],
    isBestSeller: true,
    isNew: true,
    skinTypes: ['all', 'acne', 'oily', 'combination', 'sensitive', 'dry'],
    skinConcerns: ['acne', 'brightening', 'hydration'],
    description: '100% Authentic Lumimei Clay Mask formulated with mineral clay and botanical ingredients. Deeply purifies pores, exfoliates gently, and reveals glowing skin.',
    descriptionKm: 'ម៉ាសភក់ធម្មជាតិ Lumimei Clay Mask ខ្មែរសុទ្ធ ១០០% ជួយជម្រុះកោសិកាចាស់ៗ សម្អាតរន្ធញើស បំបាត់មុន និងធ្វើឲ្យស្បែកមុខសរលោងថ្លាម៉ត់ប្រកបដោយសុវត្ថិភាព។',
    descriptionZh: 'Lumimei 大米天然面膜，温和去角质，深层清洁毛孔，让肌肤细嫩白皙。',
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
      'អ្នកដែលប្រើប្រាស់តែ Lumimei Clay Mask មួយមុខតែចង់ជាពីមុខមុនបានគ្រប់ប្រភេទ'
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
      'ពេលដែលបិទ Lumimei Clay Mask ប្រយ័ត្នកុំឲ្យប៉ះនឹងភ្នែក',
      'មិនត្រូវបិទ Lumimei Clay Mask រួចចូលគេងនោះទេ'
    ],
    howToUseKm: '១. លាងមុខឱ្យស្អាត ដួស Lumimei Clay Mask ២-៣ ស្លាបព្រាកាហ្វេ ដាក់នៅក្នុងកូនចានមួយ\n២. លាយជាមួយនឹងទឹកស្អាតធម្មតា ឬទឹកដោះគោស្រស់ រួចកូឱ្យវាក្លាយជាល្បាយតែមួយ\n៣. បិទលើមុខទុកចោល 15 នាទី រួចលាងចេញ\n៤. ពេលលាង Lumimei Clay Mask ហើយ ត្រូវលាងជាមួយនឹងសាប៊ូមួយតង់ទៀត\n៥. ចំពោះអ្នកប្រើប្រាស់ថ្មីៗ មួយអាទិត្យដំបូងបិទរាល់ថ្ងៃ ក្រោយពីមួយអាទិត្យហើយ អាចបិទ ២ ថ្ងៃម្ដង។',
    videoUrl: 'https://youtube.com/shorts/0MqVvrtIGWI?si=vDuVN86Iby5Zijni',
    newUserGuideKm: '🌿 ផលិតផលធម្មជាតិ៖ ប្រើដំបូង "រាងរើសស្បែក" តែលទ្ធផលក្រោយមក "ដឹងតែស្អាតប្លែក" ✨ មិនខកបំណង!\n\nស្បែកខ្លះធ្លាប់ឆ្លងកាត់ជាតិគីមី ឬមានកោសិកាចាស់កកស្ទះច្រើន ពេលប្រើដំបូងអាចមានអារម្មណ៍ថាក្ដៅ រមាស់ ឬស្ងួតបន្តិច ព្រោះវាជាវគ្គ "ជម្រុះជាតិពុល និងបន្សាំស្បែក"។ នេះជាសញ្ញាបង្ហាញថា សារធាតុផ្សំធម្មជាតិកំពុងចូលទៅធ្វើការយ៉ាងសកម្ម ដើម្បីជម្រុះកាកសំណល់ចាស់ៗ និងកោសិកាងាប់ៗចេញពីរន្ធរោម។\n\n❌ មិនមែនប្រតិកម្មរោលខូចស្បែកទេ តែជាដំណើរការជួសជុលកោសិកាពីខាងក្នុង។ ទ្រាំអត់ធ្មត់ដំបូង ១-២ សប្ដាហ៍ ស្បែកនឹងចាប់ផ្ដើមប្លែក ភ្លឺថ្លា ម៉ត់ខៃ មានសុខភាពល្អពិតប្រាកដ។'
  },
  {
    id: 'p2',
    name: 'Lumimei Serum',
    nameKm: 'Lumimei សេរ៉ូម',
    nameZh: 'Lumimei 焕彩精华液',
    brand: 'Lumimei Cambodia',
    category: 'serum',
    priceUsd: 11.00,
    priceKhr: Math.round(11.00 * KHR_RATE),
    originalPriceUsd: 15.00,
    rating: 4.9,
    reviewCount: 288,
    image: serumImg,
    gallery: [serumImg],
    isBestSeller: true,
    isNew: true,
    skinTypes: ['all', 'acne', 'dry', 'oily', 'sensitive'],
    skinConcerns: ['acne', 'brightening', 'hydration', 'antiaging'],
    description: 'Lumimei Serum hydrates deeply, reduces dark spots, and improves skin elasticity for a youthful radiance.',
    descriptionKm: 'សេរ៉ូម Lumimei ជួយជួសជុលស្បែកមុខ បំបាត់ស្នាមមុន ផ្តល់សំណើមយ៉ាងជ្រាលជ្រៅ និងធ្វើឲ្យស្បែកមុខមានពន្លឺចាំងថ្លា។',
    descriptionZh: 'Lumimei 焕彩精华液，深层修护，淡化痘印，补水提亮。',
    howToUse: 'Apply 2-3 drops to clean face and neck, massage gently until fully absorbed.',
    howToUseKm: 'បន្តក់ ២-៣ ដំណក់លើផ្ទៃមុខ និងកស្អាត រួចអង្អែលស្រាលៗឲ្យជ្រាបចូលស្បែក។',
    howToUseZh: '取2-3滴涂抹于干净的面部和颈部，轻轻按摩至完全吸收。',
    ingredients: 'Hyaluronic Acid, Vitamin C, Niacinamide, Botanical Extracts, Purified Aqua.',
    stock: 80,
    volume: '15g'
  },
  {
    id: 'p3',
    name: 'Lumimei Coconut Oil',
    nameKm: 'Lumimei ប្រេងដូង',
    nameZh: 'Lumimei 纯天然椰子油',
    brand: 'Lumimei Cambodia',
    category: 'oil',
    priceUsd: 5.00,
    priceKhr: Math.round(5.00 * KHR_RATE),
    originalPriceUsd: 7.00,
    rating: 4.9,
    reviewCount: 195,
    image: coconutOilImg,
    gallery: [coconutOilImg],
    isBestSeller: true,
    skinTypes: ['all', 'dry', 'sensitive', 'normal'],
    skinConcerns: ['hydration', 'brightening', 'sensitive'],
    description: '100% Pure Natural Cold-Pressed Lumimei Coconut Oil. Moisturizes skin, repairs dry patches, and conditions hair.',
    descriptionKm: 'ប្រេងដូងធម្មជាតិ Lumimei ១០០% ជួយផ្តល់សំណើមដល់ស្បែក និងសក់ ការពារស្បែកស្ងួតប្រេះ និងធ្វើឲ្យស្បែកទន់ល្មើយ។',
    descriptionZh: '100% 柬埔寨纯天然椰子油，滋润皮肤与秀发。',
    howToUse: 'Apply a small amount to skin or hair as needed. Massage gently.',
    howToUseKm: 'លាបលើស្បែក ឬសក់ក្នុងបរិមាណសមល្មម រួចអង្អែលថ្នមៗ។',
    howToUseZh: '取适量涂抹于皮肤或头发上，轻轻按摩。',
    ingredients: '100% Pure Cold-Pressed Virgin Coconut Oil (Cocos Nucifera Oil).',
    stock: 120,
    volume: '100g'
  },
  {
    id: 'p4',
    name: 'Lumimei Soap',
    nameKm: 'Lumimei សាប៊ូ',
    nameZh: 'Lumimei 天然草本香皂',
    brand: 'Lumimei Cambodia',
    category: 'cleanser',
    priceUsd: 3.00,
    priceKhr: Math.round(3.00 * KHR_RATE),
    originalPriceUsd: 4.50,
    rating: 5.0,
    reviewCount: 410,
    image: soapImg,
    gallery: [soapImg],
    isBestSeller: true,
    skinTypes: ['all', 'acne', 'oily', 'sensitive'],
    skinConcerns: ['acne', 'brightening', 'hydration'],
    description: '100% Organic handcrafted Lumimei Soap made with pure coconut oil and herbal extracts. Cleanses deeply while preserving skin moisture.',
    descriptionKm: 'សាប៊ូធម្មជាតិ Lumimei ផ្សំពីប្រេងដូង និងរុក្ខជាតិធម្មជាតិ ១០០% មិនមានសារធាតុគីមីបក់កាត់។ ជួយសម្អាតស្បែកយ៉ាងជ្រៅ បំបាត់មុនខ្នង និងមុនមុខ។',
    descriptionZh: '100% 纯天然草本手工皂，深层清洁，祛痘抑菌。',
    howToUse: 'Lather with water in hands, gently massage face or body, then rinse thoroughly.',
    howToUseKm: 'ដុសសាប៊ូជាមួយទឹកឲ្យកើតពពុះ រួចម៉ាសាលើផ្ទៃមុខ ឬដងខ្លួន រួចលាងទឹកចេញឲ្យស្អាត។',
    howToUseZh: '沾水打出丰富泡沫，涂抹面部或身体后用清水冲洗。',
    ingredients: 'Coconut Oil, Glycerin, Herbal Extracts, Tocopherol (Vitamin E).',
    stock: 150,
    volume: '100g'
  },
  {
    id: 'p5',
    name: 'Eyebrow Pencil',
    nameKm: 'ខ្មៅដៃគូសចិញ្ចើម',
    nameZh: 'Lumimei 防水眉笔',
    brand: 'Lumimei Cambodia',
    category: 'makeup',
    priceUsd: 3.50,
    priceKhr: Math.round(3.50 * KHR_RATE),
    originalPriceUsd: 5.00,
    rating: 4.8,
    reviewCount: 165,
    image: eyebrowPencilImg,
    gallery: [eyebrowPencilImg],
    isBestSeller: false,
    isNew: true,
    skinTypes: ['all'],
    skinConcerns: ['brightening'],
    description: 'Waterproof and sweatproof long-lasting eyebrow pencil for natural, beautiful brows.',
    descriptionKm: 'ខ្មៅដៃគូសចិញ្ចើម សាច់ខ្មៅដៃទន់ស្អាត មិនងាយជ្រាបទឹក ឬបែកញើស គូសបានជើងចិញ្ចើមស្អាតធម្មជាតិពេញមួយថ្ងៃ។',
    descriptionZh: '防水防汗精密眉笔，轻松勾勒自然精致眉型。',
    howToUse: 'Outline and fill in brows using gentle strokes.',
    howToUseKm: 'គូសវាស និងបំពេញជើងចិញ្ចើមតាមទម្រង់ធម្មជាតិ។',
    howToUseZh: '顺着眉毛生长方向倾斜描画填补。',
    ingredients: 'Carnauba Wax, Hydrogenated Coco-Glycerides, Synthetic Japan Wax, Iron Oxides.',
    stock: 90,
    volume: '1pc'
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

export const SAMPLE_REVIEWS = [
  {
    id: 'r1',
    userName: 'សុខា (Sokha P.)',
    rating: 5,
    date: '២២ កក្កដា ២០២៦',
    comment: 'Lumimei Clay Mask នេះល្អខ្លាំងណាស់! ប្រើហើយមុខទន់រលោង ស្អាតមែនទែន ហើយដឹកជញ្ជូននៅភ្នំពេញលឿន! ទូទាត់តាម ABA KHQR ងាយស្រួលណាស់។',
    verified: true
  },
  {
    id: 'r2',
    userName: 'ម៉ានី (Maly K.)',
    rating: 5,
    date: '២០ កក្កដា ២០២៦',
    comment: 'Lumimei សេរ៉ូម ប្រើបាន ២សប្តាហ៍ មុខបាត់ស្នាមមុនច្រើន។ ផលិតផលសុទ្ធ ១០០% ជឿជាក់ខ្លាំងលើ Lumimei!',
    verified: true
  },
  {
    id: 'r3',
    userName: 'Thida N.',
    rating: 5,
    date: '១៨ កក្កដា ២០២៦',
    comment: 'ទិញ Lumimei សាប៊ូ និងប្រេងដូងមកប្រើ ស្បែកទន់រលោងមានសំណើមខ្លាំង។ សេវាកម្មអតិថិជនល្អ និងឆ្លើយតបលឿន!',
    verified: true
  }
];
