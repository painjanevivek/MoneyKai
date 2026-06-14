const RAW_INDIA_BANK_ALIASES_CSV = `category,bank_name,aliases,status,notes
Public Sector Bank,State Bank of India,"SBI|State Bank",available,"RBI Banks in India"
Public Sector Bank,Bank of Baroda,"BOB|BoB|Baroda Bank",available,"RBI Banks in India"
Public Sector Bank,Bank of India,"BOI",available,"RBI Banks in India"
Public Sector Bank,Bank of Maharashtra,"BOM|Mahabank",available,"RBI Banks in India"
Public Sector Bank,Canara Bank,"Canara|CANBK",available,"RBI Banks in India"
Public Sector Bank,Central Bank of India,"Central Bank|CBI",available,"RBI Banks in India"
Public Sector Bank,Indian Bank,"IB|Indian Bank",available,"RBI Banks in India"
Public Sector Bank,Indian Overseas Bank,"IOB",available,"RBI Banks in India"
Public Sector Bank,Punjab & Sind Bank,"PSB|Punjab Sind Bank",available,"RBI Banks in India"
Public Sector Bank,Punjab National Bank,"PNB",available,"RBI Banks in India"
Public Sector Bank,UCO Bank,"UCO",available,"RBI Banks in India"
Public Sector Bank,Union Bank of India,"Union Bank|UBI",available,"RBI Banks in India"
Domestic Private Sector Bank,Axis Bank Limited,"Axis Bank|Axis",available,"RBI Banks in India"
Domestic Private Sector Bank,Bandhan Bank Limited,"Bandhan Bank|Bandhan",available,"RBI Banks in India"
Domestic Private Sector Bank,CSB Bank Limited,"CSB|Catholic Syrian Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,City Union Bank Limited,"CUB|City Union Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,DCB Bank Limited,"DCB|Development Credit Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,Dhanlaxmi Bank Limited,"Dhanlaxmi Bank|Dhan Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,Federal Bank Limited,"Federal Bank|Federal",available,"RBI Banks in India"
Domestic Private Sector Bank,HDFC Bank Limited,"HDFC Bank|HDFC",available,"RBI Banks in India"
Domestic Private Sector Bank,ICICI Bank Limited,"ICICI Bank|ICICI",available,"RBI Banks in India"
Domestic Private Sector Bank,IndusInd Bank Limited,"IndusInd Bank|IndusInd",available,"RBI Banks in India"
Domestic Private Sector Bank,IDFC FIRST Bank Limited,"IDFC FIRST Bank|IDFC First|IDFC",available,"RBI Banks in India"
Domestic Private Sector Bank,Jammu & Kashmir Bank Limited,"J&K Bank|Jammu and Kashmir Bank|JKB|JK Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,Karnataka Bank Limited,"Karnataka Bank|KBL",available,"RBI Banks in India"
Domestic Private Sector Bank,Karur Vysya Bank Limited,"KVB|Karur Vysya Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,Kotak Mahindra Bank Limited,"Kotak Bank|Kotak|KMBL",available,"RBI Banks in India"
Domestic Private Sector Bank,Nainital Bank Limited,"Nainital Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,RBL Bank Limited,"RBL|Ratnakar Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,South Indian Bank Limited,"SIB|South Indian Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,Tamilnad Mercantile Bank Limited,"TMB|Tamilnad Mercantile Bank",available,"RBI Banks in India"
Domestic Private Sector Bank,YES Bank Limited,"YES Bank|YES",available,"RBI Banks in India"
Domestic Private Sector Bank,IDBI Bank Limited,"IDBI Bank|IDBI",available,"RBI Banks in India"
Local Area Bank,Coastal Local Area Bank Ltd.,"Coastal LAB|Coastal Local Area Bank",available,"RBI Banks in India"
Local Area Bank,Krishna Bhima Samruddhi Local Area Bank Limited,"KBSLAB|Krishna Bhima Samruddhi LAB",available,"RBI Banks in India"
Small Finance Bank,AU Small Finance Bank Limited,"AU SFB|AU Bank|AU Small Finance Bank",available,"RBI Banks in India"
Small Finance Bank,Capital Small Finance Bank Limited,"Capital SFB|Capital Small Finance Bank",available,"RBI Banks in India"
Small Finance Bank,Equitas Small Finance Bank Limited,"Equitas SFB|Equitas Small Finance Bank",available,"RBI Banks in India"
Small Finance Bank,ESAF Small Finance Bank Limited,"ESAF SFB|ESAF Bank",available,"RBI Banks in India"
Small Finance Bank,Suryoday Small Finance Bank Limited,"Suryoday SFB|Suryoday Bank",available,"RBI Banks in India"
Small Finance Bank,Ujjivan Small Finance Bank Limited,"Ujjivan SFB|Ujjivan Bank",available,"RBI Banks in India"
Small Finance Bank,Utkarsh Small Finance Bank Limited,"Utkarsh SFB|Utkarsh Bank",available,"RBI Banks in India"
Small Finance Bank,slice Small Finance Bank Limited,"slice SFB|Slice Bank|North East Small Finance Bank",available,"RBI Banks in India"
Small Finance Bank,Jana Small Finance Bank Limited,"Jana SFB|Jana Bank",available,"RBI Banks in India"
Small Finance Bank,Shivalik Small Finance Bank Limited,"Shivalik SFB|Shivalik Bank",available,"RBI Banks in India"
Small Finance Bank,Unity Small Finance Bank Limited,"Unity SFB|Unity Bank",available,"RBI Banks in India"
Payments Bank,Airtel Payments Bank Limited,"Airtel Payments Bank|Airtel Bank|APBL",available,"RBI Banks in India"
Payments Bank,India Post Payments Bank Limited,"IPPB|India Post Bank",available,"RBI Banks in India"
Payments Bank,Fino Payments Bank Limited,"Fino Payments Bank|Fino Bank|FPBL",available,"RBI Banks in India"
Payments Bank,Jio Payments Bank Limited,"Jio Payments Bank|Jio Bank|JPBL",available,"RBI Banks in India address list"
Payments Bank,NSDL Payments Bank Limited,"NSDL Payments Bank|NSDL Bank",available,"RBI Banks in India"
Payments Bank,Paytm Payments Bank Limited,"Paytm Payments Bank|Paytm Bank|PPBL",not_available_license_cancelled,"RBI page marks banking licence cancelled"
Regional Rural Bank,Andhra Pradesh Grameena Bank,"APGB",available,"RBI Banks in India"
Regional Rural Bank,Assam Gramin Bank,"AGB|Assam Gramin",available,"RBI Banks in India"
Regional Rural Bank,Arunachal Pradesh Rural Bank,"APRB",available,"RBI Banks in India"
Regional Rural Bank,Bihar Gramin Bank,"BGB",available,"RBI Banks in India"
Regional Rural Bank,Chhattisgarh Gramin Bank,"CGB",available,"RBI Banks in India"
Regional Rural Bank,Gujarat Gramin Bank,"GGB",available,"RBI Banks in India"
Regional Rural Bank,Haryana Gramin Bank,"HGB|SHGB",available,"RBI Banks in India"
Regional Rural Bank,Himachal Pradesh Gramin Bank,"HPGB",available,"RBI Banks in India"
Regional Rural Bank,Jharkhand Gramin Bank,"JGB|JRGB",available,"RBI Banks in India"
Regional Rural Bank,Jammu and Kashmir Grameen Bank,"JKGB|J&K Grameen Bank",available,"RBI Banks in India"
Regional Rural Bank,Karnataka Grameena Bank,"KGB Karnataka|Karnataka GB",available,"RBI Banks in India"
Regional Rural Bank,Kerala Grameena Bank,"KGB Kerala|Kerala GB",available,"RBI Banks in India"
Regional Rural Bank,Maharashtra Gramin Bank,"MGB|Maha Gramin Bank",available,"RBI Banks in India"
Regional Rural Bank,Madhya Pradesh Gramin Bank,"MPGB",available,"RBI Banks in India"
Regional Rural Bank,Manipur Rural Bank,"MRB Manipur|Manipur Rural",available,"RBI Banks in India"
Regional Rural Bank,Meghalaya Rural Bank,"MRB Meghalaya|Meghalaya Rural",available,"RBI Banks in India"
Regional Rural Bank,Mizoram Rural Bank,"MRB Mizoram|Mizoram Rural",available,"RBI Banks in India"
Regional Rural Bank,Nagaland Rural Bank,"NRB",available,"RBI Banks in India"
Regional Rural Bank,Odisha Grameen Bank,"OGB",available,"RBI Banks in India"
Regional Rural Bank,Punjab Gramin Bank,"PGB",available,"RBI Banks in India"
Regional Rural Bank,Puducherry Grama Bank,"PYGB|Puducherry Grama",available,"RBI Banks in India"
Regional Rural Bank,Rajasthan Gramin Bank,"RGB",available,"RBI Banks in India"
Regional Rural Bank,Tamil Nadu Grama Bank,"TNGB",available,"RBI Banks in India"
Regional Rural Bank,Telangana Grameena Bank,"TGB",available,"RBI Banks in India"
Regional Rural Bank,Tripura Gramin Bank,"TGB Tripura|Tripura Gramin",available,"RBI Banks in India"
Regional Rural Bank,Uttar Pradesh Gramin Bank,"UPGB",available,"RBI Banks in India"
Regional Rural Bank,Uttarakhand Gramin Bank,"UKGB",available,"RBI Banks in India"
Regional Rural Bank,West Bengal Gramin Bank,"WBGB",available,"RBI Banks in India"
Foreign Bank,AB Bank PLC,"AB Bank",available,"RBI Banks in India"
Foreign Bank,American Express Banking Corporation,"Amex Bank|American Express Bank",available,"RBI Banks in India"
Foreign Bank,Australia and New Zealand Banking Group Ltd.,"ANZ Bank|ANZ",available,"RBI Banks in India"
Foreign Bank,Barclays Bank Plc.,"Barclays",available,"RBI Banks in India"
Foreign Bank,Bank of America National Association,"Bank of America|BofA|BOFA",available,"RBI Banks in India"
Foreign Bank,Bank of Bahrain and Kuwait B.S.C.,"BBK|Bank of Bahrain and Kuwait",available,"RBI Banks in India"
Foreign Bank,Bank of Ceylon,"BOC|Ceylon Bank",available,"RBI Banks in India"
Foreign Bank,Bank of China Limited,"BOC China|Bank of China",available,"RBI Banks in India"
Foreign Bank,Bank of Nova Scotia,"Scotiabank|BNS",available,"RBI Banks in India"
Foreign Bank,BNP Paribas,"BNP",available,"RBI Banks in India"
Foreign Bank,Citibank N.A.,"Citi|Citibank",available,"RBI Banks in India"
Foreign Bank,Cooperatieve Rabobank U.A./ Cooperatieve Centrale Raiffeisen-Boerenleenbank B.A.,"Rabobank",available,"RBI Banks in India"
Foreign Bank,Credit Agricole Corporate and Investment Bank,"Credit Agricole CIB|CA-CIB",available,"RBI Banks in India"
Foreign Bank,CTBC Bank Co. Ltd.,"CTBC Bank|CTBC",available,"RBI Banks in India"
Foreign Bank,DBS Bank India Limited,"DBS Bank|DBS India",available,"RBI Banks in India; wholly owned subsidiary"
Foreign Bank,Deutsche Bank A.G.,"Deutsche Bank|DB",available,"RBI Banks in India"
Foreign Bank,Doha Bank Q.P.S.C.,"Doha Bank",available,"RBI Banks in India"
Foreign Bank,Emirates NBD Bank P.J.S.C,"Emirates NBD|ENBD",available,"RBI Banks in India"
Foreign Bank,First Abu Dhabi Bank PJSC,"FAB|First Abu Dhabi Bank",available,"RBI Banks in India"
Foreign Bank,FirstRand Bank Limited,"FirstRand|FRB",available,"RBI Banks in India"
Foreign Bank,Hong Kong and Shanghai Banking Corporation Limited,"HSBC|HSBC Bank",available,"RBI Banks in India"
Foreign Bank,Industrial and Commercial Bank of China Limited,"ICBC|ICBC Bank",available,"RBI Banks in India"
Foreign Bank,Industrial Bank of Korea,"IBK|IBK Bank",available,"RBI Banks in India"
Foreign Bank,J.P. Morgan Chase Bank N.A.,"JPMorgan Chase|JPMorgan|JP Morgan|JPMC",available,"RBI Banks in India"
Foreign Bank,JSC VTB Bank,"VTB|VTB Bank",available,"RBI Banks in India"
Foreign Bank,KEB Hana Bank,"Hana Bank|KEB Hana",available,"RBI Banks in India"
Foreign Bank,Kookmin Bank,"KB Kookmin|Kookmin",available,"RBI Banks in India"
Foreign Bank,Mashreqbank P.S.C,"Mashreq|Mashreq Bank",available,"RBI Banks in India"
Foreign Bank,Mizuho Bank Ltd.,"Mizuho",available,"RBI Banks in India"
Foreign Bank,MUFG Bank Ltd.,"MUFG|Bank of Tokyo-Mitsubishi UFJ",available,"RBI Banks in India"
Foreign Bank,NatWest Markets Plc,"NatWest Markets|NatWest",available,"RBI Banks in India"
Foreign Bank,NongHyup Bank,"NH Bank|NongHyup",available,"RBI Banks in India"
Foreign Bank,PT Bank Maybank Indonesia TBK,"Maybank Indonesia|Maybank",available,"RBI Banks in India"
Foreign Bank,Qatar National Bank Q.P.S.C.,"QNB|Qatar National Bank",available,"RBI Banks in India"
Foreign Bank,Sberbank,"Sberbank",available,"RBI Banks in India"
Foreign Bank,SBM Bank India Limited,"SBM Bank|SBM India",available,"RBI Banks in India; wholly owned subsidiary"
Foreign Bank,Shinhan Bank,"Shinhan",available,"RBI Banks in India"
Foreign Bank,Societe Generale,"SocGen|Societe Generale",available,"RBI Banks in India"
Foreign Bank,Sonali Bank PLC,"Sonali Bank",available,"RBI Banks in India"
Foreign Bank,Standard Chartered Bank,"Standard Chartered|SCB|StanChart",available,"RBI Banks in India"
Foreign Bank,Sumitomo Mitsui Banking Corporation,"SMBC",available,"RBI Banks in India"
Foreign Bank,United Overseas Bank Limited,"UOB|United Overseas Bank",available,"RBI Banks in India"
Foreign Bank,UBS AG,"UBS",available,"RBI Banks in India"
Foreign Bank,Woori Bank,"Woori",available,"RBI Banks in India"`;

type BankAliasRecord = {
  category: string;
  bankName: string;
  aliases: string[];
  status: string;
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
};

const normalizeBankText = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const INDIA_BANK_ALIAS_RECORDS: BankAliasRecord[] = RAW_INDIA_BANK_ALIASES_CSV
  .split('\n')
  .slice(1)
  .map((line) => parseCsvLine(line))
  .map(([category, bankName, aliases, status]) => ({
    category,
    bankName,
    aliases: aliases ? aliases.split('|').map((alias) => alias.trim()).filter(Boolean) : [],
    status,
  }));

export const INDIA_BANK_ALIAS_TERMS = Array.from(
  new Set(
    INDIA_BANK_ALIAS_RECORDS.flatMap((record) => [record.bankName, ...record.aliases])
      .map((term) => term.trim())
      .filter(Boolean)
  )
).sort((a, b) => b.length - a.length);

const bankAliasSearchTerms = INDIA_BANK_ALIAS_TERMS
  .map((term) => ({ term, normalized: normalizeBankText(term) }))
  .filter((item) => item.normalized.length >= 3);

export const getKnownIndianBankMatch = (value: string) => {
  const normalizedValue = normalizeBankText(value);
  if (!normalizedValue) return undefined;

  return bankAliasSearchTerms.find(({ normalized }) =>
    new RegExp(`(^| )${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(normalizedValue)
  )?.term;
};

export const hasKnownIndianBankSignal = (value: string) => Boolean(getKnownIndianBankMatch(value));
