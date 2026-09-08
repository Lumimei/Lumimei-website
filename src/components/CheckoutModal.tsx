import React, { useState } from 'react';
import { X, MapPin, CreditCard, QrCode, Phone, Truck, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { CartItem, PaymentMethod, OrderCustomerInfo, Language } from '../types';
import { KHR_RATE } from '../data/products';

interface CheckoutModalProps {
  isOpen: boolean;
  language: Language;
  items: CartItem[];
  subtotalUsd: number;
  discountUsd: number;
  shippingFeeUsd: number;
  onClose: () => void;
  onSubmitOrder: (customerInfo: OrderCustomerInfo, paymentMethod: PaymentMethod) => void;
}

const CAMBODIA_PROVINCES = [
  'រាជធានីភ្នំពេញ (Phnom Penh)',
  'ខេត្តកណ្តាល (Kandal)',
  'ខេត្តសៀមរាប (Siem Reap)',
  'ខេត្តបាត់ដំបង (Battambang)',
  'ខេត្តព្រះសីហនុ (Preah Sihanouk)',
  'ខេត្តកំពង់ចាម (Kampong Cham)',
  'ខេត្តកំពត (Kampot)',
  'ខេត្តស្វាយរៀង (Svay Rieng)',
  'ខេត្តតាកែវ (Takeo)',
  'ខេត្តកំពង់ស្ពឺ (Kampong Speu)',
  'ខេត្តពោធិ៍សាត់ (Pursat)',
  'ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)',
];

const CAMBODIA_DISTRICTS_MAP: Record<string, string[]> = {
  'រាជធានីភ្នំពេញ (Phnom Penh)': [
    'ខណ្ឌទួលគោក (Toul Kork)',
    'ខណ្ឌចំការមន (Chamkar Mon)',
    'ខណ្ឌដូនពេញ (Daun Penh)',
    'ខណ្ឌ៧មករា (Prampir Makara)',
    'ខណ្ឌដង្កោ (Dangkao)',
    'ខណ្ឌមានជ័យ (Meanchey)',
    'ខណ្ឌឫស្សីកែវ (Russei Keo)',
    'ខណ្ឌសែនសុខ (Sen Sok)',
    'ខណ្ឌពោធិ៍សែនជ័យ (Porsenchey)',
    'ខណ្ឌជ្រោយចង្វារ (Chroy Changvar)',
    'ខណ្ឌព្រែកព្នៅ (Prek Pnov)',
    'ខណ្ឌច្បារអំពៅ (Chbar Ampov)',
    'ខណ្ឌបឹងកេងកង (Boeng Keng Kang)',
    'ខណ្ឌកម្ពុជា (Kamboul)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តកណ្តាល (Kandal)': [
    'ក្រុងតាខ្មៅ (Ta Khmau)',
    'ស្រុកកណ្ដាលស្ទឹង (Kandal Stueng)',
    'ស្រុកគៀនស្វាយ (Kien Svay)',
    'ស្រុកខ្សាច់កណ្ដាល (Ksach Kandal)',
    'ស្រុកកោះធំ (Koh Thom)',
    'ស្រុកលើកដែក (Leuk Daek)',
    'ស្រុកមុខកំពូល (Mukh Kamphool)',
    'ស្រុកអង្គស្នួល (Angk Snuol)',
    'ស្រុកពញាឮ (Ponhea Lueu)',
    'ស្រុកស្រីសន្ធរ (Srei Santhor)',
    'ស្រុកស្អាង (Sa\'ang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តសៀមរាប (Siem Reap)': [
    'ក្រុងសៀមរាប (Siem Reap)',
    'ស្រុកអង្គរធំ (Angkor Thom)',
    'ស្រុកអង្គរជុំ (Angkor Chum)',
    'ស្រុកបន្ទាយស្រី (Banteay Srei)',
    'ស្រុកជីក្រែង (Chi Kraeng)',
    'ស្រុកក្រឡាញ់ (Kralanh)',
    'ស្រុកពួគ (Puok)',
    'ស្រុកប្រាសាទបាគង (Prasat Bakong)',
    'ស្រុកសូទ្រនិគម (Soutr Nikum)',
    'ស្រុកស្វាយលើ (Svay Leu)',
    'ស្រុកវារិន (Varin)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តបាត់ដំបង (Battambang)': [
    'ក្រុងបាត់ដំបង (Battambang)',
    'ស្រុកបាណន់ (Banan)',
    'ស្រុកថ្មគោល (Thma Koul)',
    'ស្រុកបវេល (Bavel)',
    'ស្រុកឯកភ្នំ (Ek Phnom)',
    'ស្រុកមករា (Moung Ruessei)',
    'ស្រុកសំឡូត (Samlout)',
    'ស្រុកកំរៀង (Kamrieng)',
    'ស្រុកភ្នំព្រឹក (Phnum Proek)',
    'ស្រុកសម្ពៅលូន (Sampov Loun)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តព្រះសីហនុ (Preah Sihanouk)': [
    'ក្រុងព្រះសីហនុ (Preah Sihanouk)',
    'ក្រុងកោះរ៉ុង (Koh Rong)',
    'ស្រុកព្រៃនប់ (Prey Nob)',
    'ស្រុកស្ទឹងហាវ (Stung Hav)',
    'ស្រុកកំពង់សិលា (Kampong Seila)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តកំពង់ចាម (Kampong Cham)': [
    'ក្រុងកំពង់ចាម (Kampong Cham)',
    'ស្រុកបាធាយ (Batheay)',
    'ស្រុកចំការលើ (Chamkar Leu)',
    'ស្រុកជើងព្រៃ (Cheung Prey)',
    'ស្រុកកំពង់សៀម (Kampong Siem)',
    'ស្រុកកង់មាស (Kang Meas)',
    'ស្រុកកោះសូទិន (Koh Sotin)',
    'ស្រុកស្រីសន្ធរ (Srei Santhor)',
    'ស្រុកស្ទឹងត្រង់ (Stueng Trang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តកំពត (Kampot)': [
    'ក្រុងកំពត (Kampot)',
    'ក្រុងបូកគោ (Bokor)',
    'ស្រុកអង្គរជ័យ (Angkor Chey)',
    'ស្រុកបន្ទាយមាស (Banteay Meas)',
    'ស្រុកឈូក (Chhouk)',
    'ស្រុកជុំគិរី (Chum Kiri)',
    'ស្រុកដងទង់ (Dang Tong)',
    'ស្រុកកំពង់ត្រាច (Kampong Trach)',
    'ស្រុកទឹកឈូ (Tuek Chhou)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តស្វាយរៀង (Svay Rieng)': [
    'ក្រុងស្វាយរៀង (Svay Rieng)',
    'ក្រុងបាវិត (Bavet)',
    'ស្រុកចន្ទ្រី (Chanthrea)',
    'ស្រុកកំពង់រោទិ៍ (Kampong Rou)',
    'ស្រុក រំដួល (Rumduol)',
    'ស្រុក រមាសហែក (Romeas Haek)',
    'ស្រុក ស្វាយជ្រំ (Svay Chrum)',
    'ស្រុក ស្វាយទាប (Svay Theab)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តតាកែវ (Takeo)': [
    'ក្រុងដូនកែវ (Doun Kaev)',
    'ស្រុកអង្គរបូរី (Angkor Borei)',
    'ស្រុកបាទី (Bati)',
    'ស្រុកបូរីជលសារ (Borei Cholsar)',
    'ស្រុកកោះអណ្តែត (Koh Andet)',
    'ស្រុកព្រៃកប្បាស (Prey Kabbas)',
    'ស្រុកសំរោង (Samraong)',
    'ស្រុកត្រាំកក់ (Tram Kak)',
    'ស្រុកទ្រាំង (Treang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តកំពង់ស្ពឺ (Kampong Speu)': [
    'ក្រុងច្បារមន (Chbar Mon)',
    'ស្រុកបសេដ្ឋ (Baset)',
    'ស្រុកគងពិសី (Kong Pisei)',
    'ស្រុកឱរ៉ាល់ (Aural)',
    'ស្រុកភ្នំស្រួច (Phnum Sruoch)',
    'ស្រុកសំរោងទង (Samraong Tong)',
    'ស្រុកថ្ពង (Thpong)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តពោធិ៍សាត់ (Pursat)': [
    'ក្រុងពោធិ៍សាត់ (Pursat)',
    'ស្រុកបាកាន (Bakan)',
    'ស្រុកកណ្តៀង (Kandieng)',
    'ស្រុកក្រគរ (Krakor)',
    'ស្រុកភ្នំក្រវ៉ាញ (Phnum Kravanh)',
    'ស្រុកវាលវែង (Veal Veaeng)',
    'ផ្សេងៗ (Other)',
  ],
  'ខេត្តបន្ទាយមានជ័យ (Banteay Meanchey)': [
    'ក្រុងសិរីសោភ័ណ (Serei Saophoan)',
    'ក្រុងប៉ោយប៉ែត (Poipet)',
    'ស្រុកមង្គលបុរី (Mongkol Borei)',
    'ស្រុកភ្នំស្រុក (Phnum Srok)',
    'ស្រុកព្រះនេត្រព្រះ (Preah Netr Preah)',
    'ស្រុកអូរជ្រៅ (Ou Chrov)',
    'ស្រុកស្វាយចេក (Svay Chek)',
    'ស្រុកថ្មពួក (Thma Puok)',
    'ផ្សេងៗ (Other)',
  ],
};

const CAMBODIA_SANGKATS_MAP: Record<string, string[]> = {
  'ខណ្ឌទួលគោក (Toul Kork)': [
    'សង្កាត់បឹងកក់១ (Boeng Kak 1)',
    'សង្កាត់បឹងកក់២ (Boeng Kak 2)',
    'សង្កាត់ផ្សារដេប៉ូ១ (Phsar Depo 1)',
    'សង្កាត់ផ្សារដេប៉ូ២ (Phsar Depo 2)',
    'សង្កាត់ផ្សារដេប៉ូ៣ (Phsar Depo 3)',
    'សង្កាត់ទឹកល្អក់១ (Tuek La\'ak 1)',
    'សង្កាត់ទឹកល្អក់២ (Tuek La\'ak 2)',
    'សង្កាត់ទឹកល្អក់៣ (Tuek La\'ak 3)',
    'សង្កាត់ផ្សារដើមគ (Phsar Daeum Kor)',
    'សង្កាត់បឹងសាឡាង (Boeng Salang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌចំការមន (Chamkar Mon)': [
    'សង្កាត់ទន្លេបាសាក់ (Tonle Bassac)',
    'សង្កាត់បឹងត្របែក (Boeng Trabaek)',
    'សង្កាត់ផ្សារដើមថ្កូវ (Phsar Daeum Thkov)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌដូនពេញ (Daun Penh)': [
    'សង្កាត់ផ្សារថ្មី១ (Phsar Thmei 1)',
    'សង្កាត់ផ្សារថ្មី២ (Phsar Thmei 2)',
    'សង្កាត់ផ្សារថ្មី៣ (Phsar Thmei 3)',
    'សង្កាត់ចតុមុខ (Chatomuk)',
    'សង្កាត់វត្តភ្នំ (Wat Phnom)',
    'សង្កាត់ផ្សារចាស់ (Phsar Chas)',
    'សង្កាត់ស្រះចក (Srah Chak)',
    'សង្កាត់ជ័យជំនះ (Chey Chumneass)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌ៧មករា (Prampir Makara)': [
    'សង្កាត់មនោរម្យ (Monorom)',
    'សង្កាត់មិត្តភាព (Mittapheap)',
    'សង្កាត់វាលវង់ (Veal Vong)',
    'សង្កាត់អូរឫស្សី១ (Ou Ruessei 1)',
    'សង្កាត់អូរឫស្សី២ (Ou Ruessei 2)',
    'សង្កាត់អូរឫស្សី៣ (Ou Ruessei 3)',
    'សង្កាត់អូរឫស្សី៤ (Ou Ruessei 4)',
    'សង្កាត់បឹងព្រលិត (Boeng Prolit)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌដង្កោ (Dangkao)': [
    'សង្កាត់ដង្កោ (Dangkao)',
    'សង្កាត់ពងទឹក (Pong Tuek)',
    'សង្កាត់ព្រៃវែង (Prey Veaeng)',
    'សង្កាត់ព្រៃស (Prey Sa)',
    'សង្កាត់ក្រាំងពង្រ (Krang Pongro)',
    'សង្កាត់ប្រទះឡាង (Prateah Lang)',
    'សង្កាត់ស័ក្ដិសិទ្ធិ (Sak Sampov)',
    'សង្កាត់ជើងឯក (Cheung Aek)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌមានជ័យ (Meanchey)': [
    'សង្កាត់ស្ទឹងមានជ័យ១ (Steung Meanchey 1)',
    'សង្កាត់ស្ទឹងមានជ័យ២ (Steung Meanchey 2)',
    'សង្កាត់ស្ទឹងមានជ័យ៣ (Steung Meanchey 3)',
    'សង្កាត់ចាក់អង្រែលើ (Chak Angre Leu)',
    'សង្កាត់ចាក់អង្រែក្រោម (Chak Angre Krom)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌឫស្សីកែវ (Russei Keo)': [
    'សង្កាត់ឫស្សីកែវ (Russei Keo)',
    'សង្កាត់ទួលសង្កែ១ (Toul Sangke 1)',
    'សង្កាត់ទួលសង្កែ២ (Toul Sangke 2)',
    'សង្កាត់គីឡូម៉ែត្រលេខ៦ (Kilometr Lek 6)',
    'សង្កាត់ច្រាំងចំរេះ១ (Chrang Chamreh 1)',
    'សង្កាត់ច្រាំងចំរេះ២ (Chrang Chamreh 2)',
    'សង្កាត់ស្វាយបាក់ (Svay Pak)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌសែនសុខ (Sen Sok)': [
    'សង្កាត់ភ្នំពេញថ្មី (Phnom Penh Thmei)',
    'សង្កាត់ទឹកថ្លា (Tuek Thla)',
    'សង្កាត់ឃ្មួញ (Khmuonh)',
    'សង្កាត់ក្រាំងធ្នង់ (Krang Thnong)',
    'សង្កាត់អូររ៉ា (Ou Baek K\'am)',
    'សង្កាត់គោកឃ្លាង (Kouk Khleang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌពោធិ៍សែនជ័យ (Porsenchey)': [
    'សង្កាត់ចោមចៅ១ (Chaom Chau 1)',
    'សង្កាត់ចោមចៅ២ (Chaom Chau 2)',
    'សង្កាត់ចោមចៅ៣ (Chaom Chau 3)',
    'សង្កាត់កាកាប១ (Kakab 1)',
    'សង្កាត់កាកាប២ (Kakab 2)',
    'សង្កាត់សំរោងក្រោម (Samraong Krom)',
    'សង្កាត់ត្រពាំងក្រសាំង (Trapeang Krasang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌជ្រោយចង្វារ (Chroy Changvar)': [
    'សង្កាត់ជ្រោយចង្វារ (Chroy Changvar)',
    'សង្កាត់ព្រែកលៀប (Prek Leap)',
    'សង្កាត់ព្រែកតាសេក (Prek Ta Sek)',
    'សង្កាត់កោះដាច់ (Koh Dach)',
    'សង្កាត់បាក់ខែង (Bak Khaeng)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌព្រែកព្នៅ (Prek Pnov)': [
    'សង្កាត់ព្រែកព្នៅ (Prek Pnov)',
    'សង្កាត់ពន្ធ៉ាំង (Ponhea Pon)',
    'សង្កាត់សំរោង (Samraong)',
    'សង្កាត់គោករកា (Kouk Roka)',
    'សង្កាត់ពន្លៃ (Ponsang)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌច្បារអំពៅ (Chbar Ampov)': [
    'សង្កាត់ច្បារអំពៅ១ (Chbar Ampov 1)',
    'សង្កាត់ច្បារអំពៅ២ (Chbar Ampov 2)',
    'សង្កាត់និរោធ (Niroth)',
    'សង្កាត់ព្រែកប្រា (Prek Pra)',
    'សង្កាត់វាលស្បូវ (Veal Sbov)',
    'សង្កាត់ព្រែកឯង (Prek Aeng)',
    'សង្កាត់ក្បាលកោះ (Kbal Koh)',
    'សង្កាត់ព្រែកថ្មី (Prek Thmei)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌបឹងកេងកង (Boeng Keng Kang)': [
    'សង្កាត់បឹងកេងកង១ (Boeng Keng Kang 1)',
    'សង្កាត់បឹងកេងកង២ (Boeng Keng Kang 2)',
    'សង្កាត់បឹងកេងកង៣ (Boeng Keng Kang 3)',
    'សង្កាត់អូឡាំពិក (Olympic)',
    'សង្កាត់ទួលស្វាយព្រៃ១ (Toul Svay Prey 1)',
    'សង្កាត់ទួលស្វាយព្រៃ២ (Toul Svay Prey 2)',
    'សង្កាត់ទំនប់ទឹក (Tumnob Teuk)',
    'ផ្សេងៗ (Other)',
  ],
  'ខណ្ឌកម្ពុជា (Kamboul)': [
    'សង្កាត់កំបូល (Kamboul)',
    'សង្កាត់កន្ទោក (Kantouk)',
    'សង្កាត់ឱឡោក (Oulok)',
    'សង្កាត់ស្នោរ (Snaor)',
    'សង្កាត់ភ្លើងឆេះរទេះ (Phleung Chheh Roteh)',
    'សង្កាត់បឹងធំ (Boeng Thom)',
    'សង្កាត់ប្រទះឡាង (Prateah Lang)',
    'ផ្សេងៗ (Other)',
  ],
};

const DEFAULT_SANGKATS = [
  'សង្កាត់ទី១ / ឃុំទី១ (Sangkat / Commune 1)',
  'សង្កាត់ទី២ / ឃុំទី២ (Sangkat / Commune 2)',
  'សង្កាត់ទី៣ / ឃុំទី៣ (Sangkat / Commune 3)',
  'សង្កាត់ទី៤ / ឃុំទី៤ (Sangkat / Commune 4)',
  'ផ្សេងៗ (Other)',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  language,
  items,
  subtotalUsd,
  discountUsd,
  shippingFeeUsd,
  onClose,
  onSubmitOrder,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [customerInfo, setCustomerInfo] = useState<OrderCustomerInfo>({
    fullName: '',
    phone: '',
    telegramPhone: '',
    cityProvince: 'រាជធានីភ្នំពេញ (Phnom Penh)',
    districtSangkat: 'ខណ្ឌទួលគោក (Toul Kork)',
    sangkatCommune: 'សង្កាត់បឹងកក់១ (Boeng Kak 1)',
    addressDetail: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('khqr');

  if (!isOpen) return null;

  const totalUsd = Math.max(0, subtotalUsd - discountUsd + shippingFeeUsd);
  const totalKhr = Math.round(totalUsd * KHR_RATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.districtSangkat) {
      alert(language === 'km' ? 'សូមបំពេញព័ត៌មានអាសយដ្ឋាន និងលេខទូរស័ព្ទឲ្យបានគ្រប់គ្រាន់' : 'Please fill in required customer details');
      return;
    }
    onSubmitOrder(customerInfo, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-opensans">
              {language === 'km' ? 'ទូទាត់ប្រាក់ និងដឹកជញ្ជូន' : 'Checkout & Shipping'}
            </h3>
            <p className="text-xs text-emerald-700 font-medium">
              {language === 'km' ? 'ជំហានទី ២៖ បំពេញព័ត៌មាន និងជ្រើសរើសការទូទាត់' : 'Complete shipping & select payment'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Customer & Address Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
              <MapPin className="w-4 h-4" />
              <span>{language === 'km' ? '១. អាសយដ្ឋានដឹកជញ្ជូនទំនិញ' : '1. Shipping Address'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'ឈ្មោះពេញអ្នកទទួល' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'km' ? 'ឧទាហរណ៍៖ សុខ ជា' : 'e.g. Sok Chea'}
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'លេខទូរស័ព្ទទំនាក់ទំនង' : 'Phone Number'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="012 345 678 / 096 123 4567"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'លេខ Telegram ឬ ឈ្មោះតេឡេក្រាម' : 'Telegram / User ID'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'km' ? '@username ឬ 012 345 678' : '@username or phone'}
                  value={customerInfo.telegramPhone || ''}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, telegramPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'បញ្ហាស្បែកមុខ (Skin Concern)' : 'Skin Concern'}
                </label>
                <select
                  value={customerInfo.skinConcern || ''}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, skinConcern: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  <option value="">{language === 'km' ? '-- ជ្រើសរើសបញ្ហាស្បែកមុខ --' : '-- Select Skin Concern --'}</option>
                  <option value="មុន & រលាក (Acne / Breakouts)">មុន & រលាក (Acne / Breakouts)</option>
                  <option value="ជាំ & អាចម៍រុយ (Melasma / Dark Spots)">ជាំ & អាចម៍រុយ (Melasma / Dark Spots)</option>
                  <option value="ស្បែកស្ងួត & ខ្សោះជាតិទឹក (Dry / Dehydrated)">ស្បែកស្ងួត & ខ្សោះជាតិទឹក (Dry / Dehydrated)</option>
                  <option value="ស្បែកមុខខ្លាញ់ (Oily Skin)">ស្បែកមុខខ្លាញ់ (Oily Skin)</option>
                  <option value="ស្បែកងាយប្រតិកម្ម & រោល (Sensitive / Redness)">ស្បែកងាយប្រតិកម្ម & រោល (Sensitive / Redness)</option>
                  <option value="ភាពចាស់ & ស្នាមជ្រួញ (Aging / Anti-Wrinkle)">ភាពចាស់ & ស្នាមជ្រួញ (Aging / Anti-Wrinkle)</option>
                  <option value="ស្បែកស្រអាប់ ត្រូវការធ្វើឲ្យភ្លឺ (Dullness / Brightening)">ស្បែកស្រអាប់ ត្រូវការធ្វើឲ្យភ្លឺ (Dullness / Brightening)</option>
                  <option value="ស្បែកធម្មតា / គ្មានបញ្ហា (Normal)">ស្បែកធម្មតា / គ្មានបញ្ហា (Normal)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'រាជធានី / ខេត្ត' : 'City / Province'} *
                </label>
                <select
                  value={customerInfo.cityProvince}
                  onChange={(e) => {
                    const newCity = e.target.value;
                    const districts = CAMBODIA_DISTRICTS_MAP[newCity] || [];
                    const newDistrict = districts.length > 0 ? districts[0] : '';
                    const sangkats = CAMBODIA_SANGKATS_MAP[newDistrict] || DEFAULT_SANGKATS;
                    const newSangkat = sangkats.length > 0 ? sangkats[0] : '';
                    setCustomerInfo({
                      ...customerInfo,
                      cityProvince: newCity,
                      districtSangkat: newDistrict,
                      sangkatCommune: newSangkat,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  {CAMBODIA_PROVINCES.map((prov, i) => (
                    <option key={i} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'ខណ្ឌ' : 'District / Khan'} *
                </label>
                <select
                  required
                  value={customerInfo.districtSangkat}
                  onChange={(e) => {
                    const newDistrict = e.target.value;
                    const sangkats = CAMBODIA_SANGKATS_MAP[newDistrict] || DEFAULT_SANGKATS;
                    const newSangkat = sangkats.length > 0 ? sangkats[0] : '';
                    setCustomerInfo({
                      ...customerInfo,
                      districtSangkat: newDistrict,
                      sangkatCommune: newSangkat,
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  <option value="">
                    {language === 'km' ? '-- ជ្រើសរើស ខណ្ឌ --' : '-- Select District / Khan --'}
                  </option>
                  {(
                    CAMBODIA_DISTRICTS_MAP[customerInfo.cityProvince] ||
                    CAMBODIA_DISTRICTS_MAP['រាជធានីភ្នំពេញ (Phnom Penh)'] ||
                    []
                  ).map((dist, i) => (
                    <option key={i} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'km' ? 'សង្កាត់ ឬ ស្រុក' : 'Sangkat / District'} *
                </label>
                <select
                  required
                  value={customerInfo.sangkatCommune || ''}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, sangkatCommune: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                >
                  <option value="">
                    {language === 'km' ? '-- ជ្រើសរើស សង្កាត់ ឬ ស្រុក --' : '-- Select Sangkat / District --'}
                  </option>
                  {(
                    CAMBODIA_SANGKATS_MAP[customerInfo.districtSangkat] ||
                    DEFAULT_SANGKATS
                  ).map((sang, i) => (
                    <option key={i} value={sang}>
                      {sang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                {language === 'km' ? 'អាសយដ្ឋានលម្អិត (ផ្ទះលេខ, ផ្លូវ, ឬទីតាំងចំណាំ)' : 'Detailed Address (House No, Street, Landmark)'}
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'ឧ. ផ្ទះលេខ ១២E0 ផ្លូវ ២៨៩ ជិតកាលម៉ែត' : 'e.g. House #12, Street 289 near Calmette'}
                value={customerInfo.addressDetail}
                onChange={(e) => setCustomerInfo({ ...customerInfo, addressDetail: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                {language === 'km' ? 'កំណត់សំគាល់អតិថិជន' : 'Customer Notes'}
              </label>
              <textarea
                rows={2}
                placeholder={
                  language === 'km'
                    ? 'បញ្ជាក់បន្ថែម៖ ម៉ោងដឹកជញ្ជូនដែលងាយស្រួលទទួល, សម្គាល់ទីតាំង ឬចំណាំផ្សេងៗ...'
                    : 'Additional notes: preferred delivery time, landmarks, or special instructions...'
                }
                value={customerInfo.notes || ''}
                onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-normal"
              />
            </div>
          </div>

          {/* Section 2: Easy Payment Methods */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 border-b border-emerald-100 pb-2">
              <CreditCard className="w-4 h-4" />
              <span>{language === 'km' ? '២. ជ្រើសរើសវិធីសាស្ត្រទូទាត់ប្រាក់' : '2. Select Payment Method'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* KHQR Option */}
              <label
                onClick={() => setPaymentMethod('khqr')}
                className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'khqr'
                    ? 'border-red-500 bg-red-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  KHQR
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      KHQR / Bakong Scan
                    </span>
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      {language === 'km' ? 'ពេញនិយម' : 'Popular'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {language === 'km' ? 'ស្កេនបានគ្រប់ធនាគារ (ABA, ACLEDA, Bakong)' : 'Scan with ABA, ACLEDA, Bakong, etc.'}
                  </p>
                </div>
              </label>

              {/* ABA Pay Option */}
              <label
                onClick={() => setPaymentMethod('aba_pay')}
                className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'aba_pay'
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  ABA
                </div>
                <div className="flex-1">
                  <span className="text-xs font-extrabold text-slate-800">
                    ABA Pay Mobile Direct
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {language === 'km' ? 'ទូទាត់ផ្ទាល់លើ ABA App' : 'Pay instantly inside ABA App'}
                  </p>
                </div>
              </label>

            </div>
          </div>

          {/* Order Total Highlight */}
          <div className="p-4 bg-emerald-950 text-white rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-300">
                {language === 'km' ? 'ទឹកប្រាក់ត្រូវទូទាត់សរុប' : 'Total Payable'}
              </p>
              <p className="text-[11px] text-slate-300">
                {items.length} {language === 'km' ? 'មុខទំនិញ' : 'items'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-400">${totalUsd.toFixed(2)}</p>
              <p className="text-xs text-slate-300">៛{totalKhr.toLocaleString()}</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {paymentMethod === 'khqr' || paymentMethod === 'aba_pay'
                ? (language === 'km' ? 'បន្តទៅស្កេនទូទាត់ប្រាក់ KHQR' : 'Proceed to KHQR Scan')
                : (language === 'km' ? 'បញ្ជាក់ការបញ្ជាទិញ' : 'Confirm & Place Order')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
