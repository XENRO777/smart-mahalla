export type Mahalla = {
  id: string;
  name: string;
  sector: number;
  population: number;
  chairman: string;
  healthScore: number;
  resolved: number;
  pending: number;
};

export type Citizen = {
  id: string;
  fullName: string;
  pinfl: string;
  birthYear: number;
  household: string;
  status: "Faol" | "Ishsiz" | "Talaba" | "Pensioner";
  notebook?: "Ayollar daftari" | "Yoshlar daftari" | "Temir daftar" | null;
  mahalla: string;
  tokens: number;
};

export type Appeal = {
  id: string;
  citizen: string;
  subject: string;
  source: "MyGov" | "E-Mahalla" | "Telefon" | "Shaxsan";
  status: "Yangi" | "Jarayonda" | "Hal qilindi" | "Rad etildi";
  priority: "Past" | "O'rta" | "Yuqori";
  date: string;
  assignee: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: "Rais" | "Kotib" | "Xotin-qizlar faoli" | "Profilaktika inspektori";
  mahalla: string;
  resolvedToday: number;
  rating: number;
  avatar: string;
};

export const mahallalar: Mahalla[] = [
  { id: "1", name: "Bog'ishamol MFY", sector: 1, population: 4820, chairman: "Akmal Karimov", healthScore: 87, resolved: 142, pending: 8 },
  { id: "2", name: "Chinobod MFY", sector: 2, population: 3210, chairman: "Dilshod Yusupov", healthScore: 72, resolved: 98, pending: 14 },
  { id: "3", name: "Yangi Hayot MFY", sector: 3, population: 5640, chairman: "Nodira Tursunova", healthScore: 91, resolved: 187, pending: 5 },
  { id: "4", name: "Olmazor MFY", sector: 4, population: 4120, chairman: "Sherzod Rahimov", healthScore: 64, resolved: 76, pending: 22 },
  { id: "5", name: "Mustaqillik MFY", sector: 5, population: 6280, chairman: "Gulnora Ismoilova", healthScore: 83, resolved: 156, pending: 11 },
  { id: "6", name: "Do'stlik MFY", sector: 6, population: 3890, chairman: "Bobur Toshmatov", healthScore: 78, resolved: 121, pending: 9 },
  { id: "7", name: "Navro'z MFY", sector: 7, population: 4560, chairman: "Madina Salimova", healthScore: 88, resolved: 168, pending: 6 },
  { id: "8", name: "Hamkorlik MFY", sector: 8, population: 5120, chairman: "Otabek Nazarov", healthScore: 69, resolved: 89, pending: 18 },
];

export const citizens: Citizen[] = [
  { id: "1", fullName: "Karimov Akmal Sobirovich", pinfl: "3****0123", birthYear: 1985, household: "X-001", status: "Faol", notebook: null, mahalla: "Bog'ishamol MFY", tokens: 245 },
  { id: "2", fullName: "Yusupova Dilnoza Akramovna", pinfl: "4****0987", birthYear: 1992, household: "X-002", status: "Faol", notebook: "Ayollar daftari", mahalla: "Bog'ishamol MFY", tokens: 180 },
  { id: "3", fullName: "Tursunov Jamshid Olimovich", pinfl: "3****1234", birthYear: 2001, household: "X-003", status: "Talaba", notebook: "Yoshlar daftari", mahalla: "Chinobod MFY", tokens: 95 },
  { id: "4", fullName: "Rahimova Zulfiya Karimovna", pinfl: "4****5678", birthYear: 1958, household: "X-004", status: "Pensioner", notebook: null, mahalla: "Yangi Hayot MFY", tokens: 60 },
  { id: "5", fullName: "Ismoilov Bekzod Anvarovich", pinfl: "3****9012", birthYear: 1988, household: "X-005", status: "Ishsiz", notebook: "Temir daftar", mahalla: "Olmazor MFY", tokens: 30 },
  { id: "6", fullName: "Nazarova Madina Sobirovna", pinfl: "4****3456", birthYear: 1995, household: "X-006", status: "Faol", notebook: "Ayollar daftari", mahalla: "Mustaqillik MFY", tokens: 320 },
  { id: "7", fullName: "Toshmatov Sardor Mukhammadjonovich", pinfl: "3****7890", birthYear: 1979, household: "X-007", status: "Faol", notebook: null, mahalla: "Do'stlik MFY", tokens: 410 },
  { id: "8", fullName: "Salimova Nilufar Bakhtiyorovna", pinfl: "4****2345", birthYear: 1990, household: "X-008", status: "Faol", notebook: null, mahalla: "Navro'z MFY", tokens: 275 },
];

export const appeals: Appeal[] = [
  { id: "M-2401", citizen: "Karimov Akmal", subject: "Ko'cha yoritgichlari ishlamayapti", source: "MyGov", status: "Yangi", priority: "Yuqori", date: "Bugun, 09:24", assignee: "Akmal Karimov" },
  { id: "M-2402", citizen: "Yusupova Dilnoza", subject: "Suv bosimi past", source: "MyGov", status: "Jarayonda", priority: "O'rta", date: "Bugun, 08:15", assignee: "Dilshod Yusupov" },
  { id: "M-2403", citizen: "Tursunov Jamshid", subject: "Yo'lda chuqur paydo bo'lgan", source: "E-Mahalla", status: "Hal qilindi", priority: "Yuqori", date: "Kecha, 16:42", assignee: "Nodira Tursunova" },
  { id: "M-2404", citizen: "Rahimova Zulfiya", subject: "Pensiya hujjatlari", source: "Shaxsan", status: "Jarayonda", priority: "Past", date: "Kecha, 14:20", assignee: "Sherzod Rahimov" },
  { id: "M-2405", citizen: "Ismoilov Bekzod", subject: "Ish o'rni so'rovi", source: "MyGov", status: "Yangi", priority: "O'rta", date: "Kecha, 11:05", assignee: "Gulnora Ismoilova" },
  { id: "M-2406", citizen: "Nazarova Madina", subject: "Bolalar bog'chasiga navbat", source: "E-Mahalla", status: "Hal qilindi", priority: "O'rta", date: "2 kun oldin", assignee: "Bobur Toshmatov" },
  { id: "M-2407", citizen: "Toshmatov Sardor", subject: "Axlat olib ketilmagan", source: "Telefon", status: "Rad etildi", priority: "Past", date: "2 kun oldin", assignee: "Madina Salimova" },
  { id: "M-2408", citizen: "Salimova Nilufar", subject: "Subsidiya hujjati", source: "MyGov", status: "Yangi", priority: "Yuqori", date: "3 kun oldin", assignee: "Otabek Nazarov" },
];

export const staff: StaffMember[] = [
  { id: "1", name: "Akmal Karimov", role: "Rais", mahalla: "Bog'ishamol MFY", resolvedToday: 12, rating: 4.8, avatar: "AK" },
  { id: "2", name: "Dilshod Yusupov", role: "Rais", mahalla: "Chinobod MFY", resolvedToday: 8, rating: 4.3, avatar: "DY" },
  { id: "3", name: "Nodira Tursunova", role: "Rais", mahalla: "Yangi Hayot MFY", resolvedToday: 15, rating: 4.9, avatar: "NT" },
  { id: "4", name: "Mavluda Hasanova", role: "Kotib", mahalla: "Bog'ishamol MFY", resolvedToday: 22, rating: 4.6, avatar: "MH" },
  { id: "5", name: "Zarina Akbarova", role: "Xotin-qizlar faoli", mahalla: "Yangi Hayot MFY", resolvedToday: 9, rating: 4.7, avatar: "ZA" },
  { id: "6", name: "Rustam Olimov", role: "Profilaktika inspektori", mahalla: "Olmazor MFY", resolvedToday: 6, rating: 4.2, avatar: "RO" },
];

export const aiAlerts = [
  { id: 1, level: "warning" as const, title: "Ishsizlik darajasi oshdi", text: "4-sektorda ishsizlik darajasi 5% ga oshdi. Tavsiya: Bandlik dasturini faollashtirish va Temir daftarni yangilash." },
  { id: 2, level: "info" as const, title: "Murojaatlar oqimi yuqori", text: "Bugun MyGov dan 47 ta yangi murojaat keldi. O'rtacha kunlik ko'rsatkichdan 23% yuqori." },
  { id: 3, level: "success" as const, title: "Yangi Hayot MFY yetakchi", text: "Nodira Tursunova rahbarligidagi mahalla bu hafta 187 ta murojaatni hal qildi (+14%)." },
  { id: 4, level: "warning" as const, title: "Xizmat sifati pasaydi", text: "Olmazor MFY da fuqarolar qoniqish darajasi 64% ga tushdi. Inspektor bilan suhbat tavsiya etiladi." },
];

export const tokenRules = [
  { id: 1, action: "MyGov orqali muammoni rasmga olish", reward: 10, daily_limit: 5 },
  { id: 2, action: "Hashar tadbirida ishtirok etish", reward: 50, daily_limit: 1 },
  { id: 3, action: "Mahalla yig'inida qatnashish", reward: 25, daily_limit: 1 },
  { id: 4, action: "Yangi fuqaroni tizimga taklif qilish", reward: 30, daily_limit: 3 },
  { id: 5, action: "Ijtimoiy loyihada ishtirok", reward: 100, daily_limit: 1 },
];

export const integrations = [
  { id: "mygov", name: "MyGov.uz", description: "Davlat xizmatlari portali", status: "active" as const, lastSync: "2 daqiqa avval", count: 1247 },
  { id: "emahalla", name: "E-Mahalla", description: "Mahalla raqamli platformasi", status: "active" as const, lastSync: "5 daqiqa avval", count: 856 },
  { id: "oneid", name: "OneID", description: "Yagona identifikatsiya", status: "active" as const, lastSync: "1 daqiqa avval", count: 4820 },
  { id: "soliq", name: "Soliq.uz", description: "Soliq xizmati", status: "syncing" as const, lastSync: "Sinxronlanmoqda...", count: 312 },
];
