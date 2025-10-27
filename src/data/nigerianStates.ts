export interface NigerianState {
  code: string;
  name: string;
  capital: string;
  region: string;
}

export const nigerianStates: NigerianState[] = [
  // North Central
  { code: "FC", name: "Abuja (FCT)", capital: "Abuja", region: "North Central" },
  { code: "BE", name: "Benue", capital: "Makurdi", region: "North Central" },
  { code: "KO", name: "Kogi", capital: "Lokoja", region: "North Central" },
  { code: "KW", name: "Kwara", capital: "Ilorin", region: "North Central" },
  { code: "NA", name: "Nasarawa", capital: "Lafia", region: "North Central" },
  { code: "NI", name: "Niger", capital: "Minna", region: "North Central" },
  { code: "PL", name: "Plateau", capital: "Jos", region: "North Central" },
  
  // North East
  { code: "AD", name: "Adamawa", capital: "Yola", region: "North East" },
  { code: "BA", name: "Bauchi", capital: "Bauchi", region: "North East" },
  { code: "BO", name: "Borno", capital: "Maiduguri", region: "North East" },
  { code: "GO", name: "Gombe", capital: "Gombe", region: "North East" },
  { code: "TA", name: "Taraba", capital: "Jalingo", region: "North East" },
  { code: "YO", name: "Yobe", capital: "Damaturu", region: "North East" },
  
  // North West
  { code: "JI", name: "Jigawa", capital: "Dutse", region: "North West" },
  { code: "KD", name: "Kaduna", capital: "Kaduna", region: "North West" },
  { code: "KN", name: "Kano", capital: "Kano", region: "North West" },
  { code: "KT", name: "Katsina", capital: "Katsina", region: "North West" },
  { code: "KE", name: "Kebbi", capital: "Birnin Kebbi", region: "North West" },
  { code: "SO", name: "Sokoto", capital: "Sokoto", region: "North West" },
  { code: "ZA", name: "Zamfara", capital: "Gusau", region: "North West" },
  
  // South East
  { code: "AB", name: "Abia", capital: "Umuahia", region: "South East" },
  { code: "AN", name: "Anambra", capital: "Awka", region: "South East" },
  { code: "EB", name: "Ebonyi", capital: "Abakaliki", region: "South East" },
  { code: "EN", name: "Enugu", capital: "Enugu", region: "South East" },
  { code: "IM", name: "Imo", capital: "Owerri", region: "South East" },
  
  // South South
  { code: "AK", name: "Akwa Ibom", capital: "Uyo", region: "South South" },
  { code: "BY", name: "Bayelsa", capital: "Yenagoa", region: "South South" },
  { code: "CR", name: "Cross River", capital: "Calabar", region: "South South" },
  { code: "DE", name: "Delta", capital: "Asaba", region: "South South" },
  { code: "ED", name: "Edo", capital: "Benin City", region: "South South" },
  { code: "RI", name: "Rivers", capital: "Port Harcourt", region: "South South" },
  
  // South West
  { code: "EK", name: "Ekiti", capital: "Ado-Ekiti", region: "South West" },
  { code: "LA", name: "Lagos", capital: "Ikeja", region: "South West" },
  { code: "OG", name: "Ogun", capital: "Abeokuta", region: "South West" },
  { code: "ON", name: "Ondo", capital: "Akure", region: "South West" },
  { code: "OS", name: "Osun", capital: "Osogbo", region: "South West" },
  { code: "OY", name: "Oyo", capital: "Ibadan", region: "South West" }
];
