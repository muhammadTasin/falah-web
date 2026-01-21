
export interface District {
  id: string;
  nameBn: string;
  nameEn: string;
  lat: number;
  lng: number;
  offsetSehri: number; // Minutes relative to Dhaka (Sehri Last Time)
  offsetIftar: number; // Minutes relative to Dhaka (Iftar/Maghrib)
}

// Offsets based on Islamic Foundation Bangladesh Permanent Calendar
// Note: Positive (+) means ADD minutes to Dhaka time (Later)
//       Negative (-) means SUBTRACT minutes from Dhaka time (Earlier)
export const districts: District[] = [
  // Dhaka Division
  { id: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', lat: 23.8103, lng: 90.4125, offsetSehri: 0, offsetIftar: 0 },
  { id: 'gazipur', nameBn: 'গাজীপুর', nameEn: 'Gazipur', lat: 23.9999, lng: 90.4203, offsetSehri: 0, offsetIftar: 0 },
  { id: 'narayanganj', nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', lat: 23.6337, lng: 90.4964, offsetSehri: -1, offsetIftar: 0 },
  { id: 'munshiganj', nameBn: 'মুন্সিগঞ্জ', nameEn: 'Munshiganj', lat: 23.5422, lng: 90.5305, offsetSehri: -1, offsetIftar: 0 },
  { id: 'manikganj', nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', lat: 23.8644, lng: 90.0047, offsetSehri: +2, offsetIftar: +2 },
  { id: 'narsingdi', nameBn: 'নরসিংদী', nameEn: 'Narsingdi', lat: 23.9322, lng: 90.7154, offsetSehri: -2, offsetIftar: -1 },
  { id: 'kishoreganj', nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', lat: 24.4449, lng: 90.7765, offsetSehri: -2, offsetIftar: -1 },
  { id: 'faridpur', nameBn: 'ফরিদপুর', nameEn: 'Faridpur', lat: 23.6071, lng: 89.8429, offsetSehri: +3, offsetIftar: +3 },
  { id: 'madaripur', nameBn: 'মাদারীপুর', nameEn: 'Madaripur', lat: 23.1641, lng: 90.1897, offsetSehri: +1, offsetIftar: +1 },
  { id: 'shariatpur', nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', lat: 23.2423, lng: 90.4348, offsetSehri: +1, offsetIftar: +1 },
  { id: 'rajbari', nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', lat: 23.7574, lng: 89.6445, offsetSehri: +4, offsetIftar: +4 },
  { id: 'gopalganj', nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', lat: 23.0051, lng: 89.8266, offsetSehri: +3, offsetIftar: +3 },
  { id: 'tangail', nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', lat: 24.2513, lng: 89.9167, offsetSehri: +2, offsetIftar: +2 },

  // Mymensingh Division
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', lat: 24.7471, lng: 90.4203, offsetSehri: 0, offsetIftar: -1 },
  { id: 'jamalpur', nameBn: 'জামালপুর', nameEn: 'Jamalpur', lat: 24.9375, lng: 89.9378, offsetSehri: +2, offsetIftar: +1 },
  { id: 'sherpur', nameBn: 'শেরপুর', nameEn: 'Sherpur', lat: 25.0205, lng: 90.0153, offsetSehri: +1, offsetIftar: 0 },
  { id: 'netrokona', nameBn: 'নেত্রকোনা', nameEn: 'Netrokona', lat: 24.8709, lng: 90.7279, offsetSehri: -1, offsetIftar: -2 },

  // Chittagong Division
  { id: 'chittagong', nameBn: 'চট্টগ্রাম', nameEn: 'Chittagong', lat: 22.3569, lng: 91.7832, offsetSehri: -3, offsetIftar: -5 },
  { id: 'coxsbazar', nameBn: 'কক্সবাজার', nameEn: 'Cox\'s Bazar', lat: 21.4272, lng: 92.0058, offsetSehri: -4, offsetIftar: -6 },
  { id: 'rangamati', nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', lat: 22.7324, lng: 92.2985, offsetSehri: -4, offsetIftar: -7 },
  { id: 'bandarban', nameBn: 'বান্দরবান', nameEn: 'Bandarban', lat: 22.1953, lng: 92.2184, offsetSehri: -5, offsetIftar: -7 },
  { id: 'khagrachari', nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachari', lat: 23.1193, lng: 91.9847, offsetSehri: -3, offsetIftar: -6 },
  { id: 'comilla', nameBn: 'কুমিল্লা', nameEn: 'Comilla', lat: 23.4607, lng: 91.1809, offsetSehri: -2, offsetIftar: -3 },
  { id: 'brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', lat: 23.9571, lng: 91.1119, offsetSehri: -3, offsetIftar: -3 },
  { id: 'chandpur', nameBn: 'চাঁদপুর', nameEn: 'Chandpur', lat: 23.2321, lng: 90.6631, offsetSehri: -1, offsetIftar: -1 },
  { id: 'noakhali', nameBn: 'নোয়াখালী', nameEn: 'Noakhali', lat: 22.8696, lng: 91.0994, offsetSehri: -1, offsetIftar: -2 },
  { id: 'lakshmipur', nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', lat: 22.9447, lng: 90.8282, offsetSehri: 0, offsetIftar: -1 },
  { id: 'feni', nameBn: 'ফেনী', nameEn: 'Feni', lat: 23.0159, lng: 91.3976, offsetSehri: -2, offsetIftar: -3 },

  // Sylhet Division
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', lat: 24.8949, lng: 91.8687, offsetSehri: -8, offsetIftar: -10 },
  { id: 'habiganj', nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', lat: 24.3749, lng: 91.4155, offsetSehri: -5, offsetIftar: -6 },
  { id: 'moulvibazar', nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', lat: 24.4829, lng: 91.7649, offsetSehri: -6, offsetIftar: -8 },
  { id: 'sunamganj', nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', lat: 25.0658, lng: 91.3950, offsetSehri: -5, offsetIftar: -7 },

  // Barisal Division
  { id: 'barisal', nameBn: 'বরিশাল', nameEn: 'Barisal', lat: 22.7010, lng: 90.3535, offsetSehri: +1, offsetIftar: +1 },
  { id: 'jhalokathi', nameBn: 'ঝালকাঠি', nameEn: 'Jhalokathi', lat: 22.6406, lng: 90.1987, offsetSehri: +2, offsetIftar: +2 },
  { id: 'pirojpur', nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', lat: 22.5841, lng: 89.9720, offsetSehri: +3, offsetIftar: +3 },
  { id: 'bhola', nameBn: 'ভোলা', nameEn: 'Bhola', lat: 22.6859, lng: 90.6482, offsetSehri: 0, offsetIftar: 0 },
  { id: 'patuakhali', nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', lat: 22.3596, lng: 90.3299, offsetSehri: +1, offsetIftar: 0 },
  { id: 'barguna', nameBn: 'বরগুনা', nameEn: 'Barguna', lat: 22.1520, lng: 90.1194, offsetSehri: +2, offsetIftar: +1 },

  // Khulna Division
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', lat: 22.8456, lng: 89.5403, offsetSehri: +4, offsetIftar: +5 },
  { id: 'bagerhat', nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', lat: 22.6516, lng: 89.7859, offsetSehri: +3, offsetIftar: +4 },
  { id: 'satkhira', nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', lat: 22.7234, lng: 89.0700, offsetSehri: +6, offsetIftar: +7 },
  { id: 'jessore', nameBn: 'যশোর', nameEn: 'Jessore', lat: 23.1634, lng: 89.2182, offsetSehri: +6, offsetIftar: +7 },
  { id: 'magura', nameBn: 'মাগুরা', nameEn: 'Magura', lat: 23.4855, lng: 89.4198, offsetSehri: +5, offsetIftar: +5 },
  { id: 'narail', nameBn: 'নড়াইল', nameEn: 'Narail', lat: 23.1725, lng: 89.5127, offsetSehri: +4, offsetIftar: +4 },
  { id: 'jhenaidah', nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', lat: 23.5450, lng: 89.1726, offsetSehri: +6, offsetIftar: +7 },
  { id: 'chuadanga', nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', lat: 23.6420, lng: 88.8560, offsetSehri: +8, offsetIftar: +9 },
  { id: 'kushtia', nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', lat: 23.9013, lng: 89.1205, offsetSehri: +6, offsetIftar: +7 },
  { id: 'meherpur', nameBn: 'মেহেরপুর', nameEn: 'Meherpur', lat: 23.7622, lng: 88.6318, offsetSehri: +9, offsetIftar: +10 },

  // Rajshahi Division
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', lat: 24.3636, lng: 88.6241, offsetSehri: +6, offsetIftar: +7 },
  { id: 'natore', nameBn: 'নাটোর', nameEn: 'Natore', lat: 24.4206, lng: 89.0006, offsetSehri: +5, offsetIftar: +6 },
  { id: 'naogaon', nameBn: 'নওগাঁ', nameEn: 'Naogaon', lat: 24.8103, lng: 88.9437, offsetSehri: +5, offsetIftar: +6 },
  { id: 'chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapainawabganj', lat: 24.5965, lng: 88.2775, offsetSehri: +8, offsetIftar: +9 },
  { id: 'pabna', nameBn: 'পাবনা', nameEn: 'Pabna', lat: 24.0040, lng: 89.2500, offsetSehri: +5, offsetIftar: +5 },
  { id: 'sirajganj', nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', lat: 24.4534, lng: 89.7008, offsetSehri: +3, offsetIftar: +3 },
  { id: 'bogura', nameBn: 'বগুড়া', nameEn: 'Bogura', lat: 24.8465, lng: 89.3778, offsetSehri: +4, offsetIftar: +4 },
  { id: 'joypurhat', nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', lat: 25.1025, lng: 89.0227, offsetSehri: +6, offsetIftar: +6 },

  // Rangpur Division
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', lat: 25.7439, lng: 89.2752, offsetSehri: +4, offsetIftar: +3 },
  { id: 'dinajpur', nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', lat: 25.6217, lng: 88.6355, offsetSehri: +7, offsetIftar: +6 },
  { id: 'thakurgaon', nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', lat: 26.0337, lng: 88.4617, offsetSehri: +9, offsetIftar: +8 },
  { id: 'panchagarh', nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', lat: 26.3411, lng: 88.5542, offsetSehri: +9, offsetIftar: +7 },
  { id: 'nilphamari', nameBn: 'নীলফামারী', nameEn: 'Nilphamari', lat: 25.9318, lng: 88.8526, offsetSehri: +6, offsetIftar: +5 },
  { id: 'lalmonirhat', nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', lat: 25.9165, lng: 89.4532, offsetSehri: +4, offsetIftar: +3 },
  { id: 'kurigram', nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', lat: 25.8054, lng: 89.6362, offsetSehri: +3, offsetIftar: +1 },
  { id: 'gaibandha', nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', lat: 25.3288, lng: 89.5295, offsetSehri: +3, offsetIftar: +3 },
];
