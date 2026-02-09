import { IntakeData, AddressEntry } from './intakeStorage';

export type PdfPayload = {
  fields: Record<string, string>;
  checkboxes: Record<string, boolean>;
};

export type FormSlug = 'i-130' | 'i-130a' | 'i-131' | 'i-485' | 'i-765';

function formatDate(month: string, day?: string, year?: string): string {
  if (!month || !year) return '';
  const d = day || '01';
  return `${month.padStart(2, '0')}/${d.padStart(2, '0')}/${year}`;
}

function mapAddressToFields(
  addr: AddressEntry | undefined,
  fieldMap: Record<string, string>
): Record<string, string> {
  if (!addr) return {};
  const result: Record<string, string> = {};
  if (fieldMap.street && addr.street) result[fieldMap.street] = addr.street;
  if (fieldMap.unit && addr.unit) result[fieldMap.unit] = addr.unit;
  if (fieldMap.city && addr.city) result[fieldMap.city] = addr.city;
  if (fieldMap.state && addr.state) result[fieldMap.state] = addr.state;
  if (fieldMap.zip && addr.zip) result[fieldMap.zip] = addr.zip;
  if (fieldMap.country && addr.country) result[fieldMap.country] = addr.country;
  if (fieldMap.province) result[fieldMap.province] = '';
  if (fieldMap.postalCode) result[fieldMap.postalCode] = '';
  if (fieldMap.dateFrom) {
    result[fieldMap.dateFrom] = formatDate(addr.startMonth, addr.startDay, addr.startYear);
  }
  if (fieldMap.dateTo && !addr.isCurrent) {
    result[fieldMap.dateTo] = formatDate(addr.endMonth || '', addr.endDay, addr.endYear);
  }
  return result;
}

function getCurrentAddress(data: IntakeData): AddressEntry | undefined {
  return data.addresses.find(a => a.isCurrent) || data.addresses[0];
}

function getPreviousAddresses(data: IntakeData): AddressEntry[] {
  return data.addresses.filter(a => !a.isCurrent);
}

function getMailingAddress(data: IntakeData): AddressEntry {
  if (data.mailingSameAsPhysical) {
    return getCurrentAddress(data) || data.addresses[0];
  }
  return data.mailingAddress;
}

function buildI130Payload(data: IntakeData): PdfPayload {
  const fields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  
  const currentAddr = getCurrentAddress(data);
  const prevAddrs = getPreviousAddresses(data);
  const mailingAddr = getMailingAddress(data);
  
  // Petitioner name
  fields['form1[0].#subform[0].Pt2Line4a_FamilyName[0]'] = data.basics.petitioner.familyName;
  fields['form1[0].#subform[0].Pt2Line4b_GivenName[0]'] = data.basics.petitioner.givenName;
  fields['form1[0].#subform[0].Pt2Line4c_MiddleName[0]'] = data.basics.petitioner.middleName;
  
  // Relationship checkbox
  const rel = data.basics.relationship;
  checkboxes['form1[0].#subform[0].Pt1Line1_Spouse[0]'] = rel === 'spouse';
  checkboxes['form1[0].#subform[0].Pt1Line1_Parent[0]'] = rel === 'parent';
  checkboxes['form1[0].#subform[0].Pt1Line1_Child[0]'] = rel === 'child';
  checkboxes['form1[0].#subform[0].Pt1Line1_Siblings[0]'] = rel === 'sibling';
  
  // DOB
  fields['form1[0].#subform[1].Pt2Line8_DateofBirth[0]'] = formatDate(
    data.basics.dateOfBirth.month, data.basics.dateOfBirth.day, data.basics.dateOfBirth.year
  );
  
  // Mailing address same as physical
  checkboxes['form1[0].#subform[1].Pt2Line11_Yes[0]'] = data.mailingSameAsPhysical;
  checkboxes['form1[0].#subform[1].Pt2Line11_No[0]'] = !data.mailingSameAsPhysical;
  
  // Petitioner mailing address (Line 10)
  Object.assign(fields, mapAddressToFields(mailingAddr, {
    street: 'form1[0].#subform[1].Pt2Line10_StreetNumberName[0]',
    unit: 'form1[0].#subform[1].Pt2Line10_AptSteFlrNumber[0]',
    city: 'form1[0].#subform[1].Pt2Line10_CityOrTown[0]',
    state: 'form1[0].#subform[1].Pt2Line10_State[0]',
    zip: 'form1[0].#subform[1].Pt2Line10_ZipCode[0]',
    province: 'form1[0].#subform[1].Pt2Line10_Province[0]',
    postalCode: 'form1[0].#subform[1].Pt2Line10_PostalCode[0]',
    country: 'form1[0].#subform[1].Pt2Line10_Country[0]',
  }));
  
  // Petitioner physical address (Line 12) - only if different from mailing
  if (!data.mailingSameAsPhysical && currentAddr) {
    Object.assign(fields, mapAddressToFields(currentAddr, {
      street: 'form1[0].#subform[1].Pt2Line12_StreetNumberName[0]',
      unit: 'form1[0].#subform[1].Pt2Line12_AptSteFlrNumber[0]',
      city: 'form1[0].#subform[1].Pt2Line12_CityOrTown[0]',
      state: 'form1[0].#subform[1].Pt2Line12_State[0]',
      zip: 'form1[0].#subform[1].Pt2Line12_ZipCode[0]',
      province: 'form1[0].#subform[1].Pt2Line12_Province[0]',
      postalCode: 'form1[0].#subform[1].Pt2Line12_PostalCode[0]',
      country: 'form1[0].#subform[1].Pt2Line12_Country[0]',
    }));
  }
  
  // Current address start date
  if (currentAddr) {
    fields['form1[0].#subform[1].Pt2Line13a_DateFrom[0]'] = formatDate(
      currentAddr.startMonth, currentAddr.startDay, currentAddr.startYear
    );
  }
  
  // Previous address (Line 14) - first previous
  if (prevAddrs.length > 0) {
    Object.assign(fields, mapAddressToFields(prevAddrs[0], {
      street: 'form1[0].#subform[1].Pt2Line14_StreetNumberName[0]',
      unit: 'form1[0].#subform[1].Pt2Line14_AptSteFlrNumber[0]',
      city: 'form1[0].#subform[1].Pt2Line14_CityOrTown[0]',
      state: 'form1[0].#subform[1].Pt2Line14_State[0]',
      zip: 'form1[0].#subform[1].Pt2Line14_ZipCode[0]',
      province: 'form1[0].#subform[1].Pt2Line14_Province[0]',
      postalCode: 'form1[0].#subform[1].Pt2Line14_PostalCode[0]',
      country: 'form1[0].#subform[1].Pt2Line14_Country[0]',
      dateFrom: 'form1[0].#subform[1].Pt2Line15a_DateFrom[0]',
      dateTo: 'form1[0].#subform[1].Pt2Line15b_DateTo[0]',
    }));
  }
  
  return { fields, checkboxes };
}

function buildI130aPayload(data: IntakeData): PdfPayload {
  const fields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  
  const currentAddr = getCurrentAddress(data);
  const prevAddrs = getPreviousAddresses(data);
  const mailingAddr = getMailingAddress(data);
  
  // Petitioner physical address (Pt1Line4)
  Object.assign(fields, mapAddressToFields(currentAddr, {
    street: 'form1[0].#subform[0].Pt1Line4a_StreetNumberName[0]',
    unit: 'form1[0].#subform[0].Pt1Line4b_AptSteFlrNumber[0]',
    city: 'form1[0].#subform[0].Pt1Line4c_CityOrTown[0]',
    state: 'form1[0].#subform[0].Pt1Line4d_State[0]',
    zip: 'form1[0].#subform[0].Pt1Line4e_ZipCode[0]',
    province: 'form1[0].#subform[0].Pt1Line4f_Province[0]',
    postalCode: 'form1[0].#subform[0].Pt1Line4g_PostalCode[0]',
    country: 'form1[0].#subform[0].Pt1Line4h_Country[0]',
  }));
  
  // Petitioner mailing (Pt1Line6)
  Object.assign(fields, mapAddressToFields(mailingAddr, {
    street: 'form1[0].#subform[0].Pt1Line6a_StreetNumberName[0]',
    unit: 'form1[0].#subform[0].Pt1Line6b_AptSteFlrNumber[0]',
    city: 'form1[0].#subform[0].Pt1Line6c_CityOrTown[0]',
    state: 'form1[0].#subform[0].Pt1Line6d_State[0]',
    zip: 'form1[0].#subform[0].Pt1Line6e_ZipCode[0]',
    province: 'form1[0].#subform[0].Pt1Line6f_Province[0]',
    postalCode: 'form1[0].#subform[0].Pt1Line6g_PostalCode[0]',
    country: 'form1[0].#subform[0].Pt1Line6h_Country[0]',
  }));
  
  // Petitioner previous address (Pt1Line8)
  if (prevAddrs.length > 0) {
    Object.assign(fields, mapAddressToFields(prevAddrs[0], {
      street: 'form1[0].#subform[0].Pt1Line8a_StreetNumberName[0]',
      unit: 'form1[0].#subform[0].Pt1Line8b_AptSteFlrNumber[0]',
      city: 'form1[0].#subform[0].Pt1Line8c_CityOrTown[0]',
      province: 'form1[0].#subform[0].Pt1Line8d_Province[0]',
      postalCode: 'form1[0].#subform[0].Pt1Line8e_PostalCode[0]',
      country: 'form1[0].#subform[0].Pt1Line8f_Country[0]',
    }));
  }
  
  return { fields, checkboxes };
}

function buildI131Payload(data: IntakeData): PdfPayload {
  const fields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  
  const currentAddr = getCurrentAddress(data);
  const mailingAddr = getMailingAddress(data);
  
  // Physical address (Part2_Line3)
  Object.assign(fields, mapAddressToFields(currentAddr, {
    street: 'form1[0].P5[0].Part2_Line3_StreetNumberName[0]',
    unit: 'form1[0].P5[0].Part2_Line3_AptSteFlrNumber[0]',
    city: 'form1[0].P5[0].Part2_Line3_CityTown[0]',
    state: 'form1[0].P5[0].Part2_Line3_State[0]',
    zip: 'form1[0].P5[0].Part2_Line3_ZipCode[0]',
    province: 'form1[0].P5[0].Part2_Line3_Province[0]',
    postalCode: 'form1[0].P5[0].Part2_Line3_PostalCode[0]',
    country: 'form1[0].P5[0].Part2_Line3_Country[0]',
  }));
  
  // Mailing address (Part2_Line4)
  Object.assign(fields, mapAddressToFields(mailingAddr, {
    street: 'form1[0].P5[0].Part2_Line4_StreetNumberName[0]',
    unit: 'form1[0].P5[0].Part2_Line4_AptSteFlrNumber[0]',
    city: 'form1[0].P5[0].Part2_Line4_CityTown[0]',
    state: 'form1[0].P5[0].Part2_Line4_State[0]',
    zip: 'form1[0].P5[0].Part2_Line4_ZipCode[0]',
    province: 'form1[0].P5[0].Part2_Line4_Province[0]',
    postalCode: 'form1[0].P5[0].Part2_Line4_PostalCode[0]',
    country: 'form1[0].P5[0].Part2_Line4_Country[0]',
  }));
  
  return { fields, checkboxes };
}

function buildI485Payload(data: IntakeData): PdfPayload {
  const fields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  
  const currentAddr = getCurrentAddress(data);
  const mailingAddr = getMailingAddress(data);
  const prevAddrs = getPreviousAddresses(data);
  
  // Mailing address (Pt1Line18US = mailing)
  Object.assign(fields, mapAddressToFields(mailingAddr, {
    street: 'form1[0].#subform[2].Pt1Line18_StreetNumberName[0]',
    unit: 'form1[0].#subform[2].Pt1Line18US_AptSteFlrNumber[0]',
    city: 'form1[0].#subform[2].Pt1Line18_CityOrTown[0]',
    state: 'form1[0].#subform[2].Pt1Line18_State[0]',
    zip: 'form1[0].#subform[2].Pt1Line18_ZipCode[0]',
  }));
  
  // Physical / current address (Pt1Line18_Current)
  Object.assign(fields, mapAddressToFields(currentAddr, {
    street: 'form1[0].#subform[2].Pt1Line18_CurrentStreetNumberName[0]',
    unit: 'form1[0].#subform[2].Pt1Line18_CurrentAptSteFlrNumber[0]',
    city: 'form1[0].#subform[2].Pt1Line18_CurrentCityOrTown[0]',
    state: 'form1[0].#subform[2].Pt1Line18_CurrentState[0]',
    zip: 'form1[0].#subform[2].Pt1Line18_CurrentZipCode[0]',
    dateFrom: 'form1[0].#subform[2].Pt1Line18_Date[0]',
  }));
  
  // First previous address (Pt1Line18_Prior)
  if (prevAddrs.length > 0) {
    Object.assign(fields, mapAddressToFields(prevAddrs[0], {
      street: 'form1[0].#subform[3].Pt1Line18_PriorStreetName[0]',
      unit: 'form1[0].#subform[3].Pt1Line18_PriorAddress_Number[0]',
      city: 'form1[0].#subform[3].Pt1Line18_PriorCity[0]',
      state: 'form1[0].#subform[3].Pt1Line18_PriorState[0]',
      zip: 'form1[0].#subform[3].Pt1Line18_PriorZipCode[0]',
      province: 'form1[0].#subform[3].Pt1Line18_PriorProvince[0]',
      postalCode: 'form1[0].#subform[3].Pt1Line18_PriorPostalCode[0]',
      country: 'form1[0].#subform[3].Pt1Line18_PriorCountry[0]',
      dateFrom: 'form1[0].#subform[3].Pt1Line18_PriorDateFrom[0]',
      dateTo: 'form1[0].#subform[3].Pt1Line18PriorDateTo[0]',
    }));
  }
  
  // Second previous address (Pt1Line18_Recent)
  if (prevAddrs.length > 1) {
    Object.assign(fields, mapAddressToFields(prevAddrs[1], {
      street: 'form1[0].#subform[3].Pt1Line18_RecentStreetName[0]',
      unit: 'form1[0].#subform[3].Pt1Line18_RecentNumber[0]',
      city: 'form1[0].#subform[3].Pt1Line18_RecentCity[0]',
      state: 'form1[0].#subform[3].Pt1Line18_RecentState[0]',
      zip: 'form1[0].#subform[3].Pt1Line18_RecentZipCode[0]',
      province: 'form1[0].#subform[3].Pt1Line18_RecentProvince[0]',
      postalCode: 'form1[0].#subform[3].Pt1Line18_RecentPostalCode[0]',
      country: 'form1[0].#subform[3].Pt1Line18_RecentCountry[0]',
      dateFrom: 'form1[0].#subform[3].Pt1Line18_RecentDateFrom[0]',
      dateTo: 'form1[0].#subform[3].Pt1Line18_RecentDateTo[0]',
    }));
  }
  
  return { fields, checkboxes };
}

function buildI765Payload(data: IntakeData): PdfPayload {
  const fields: Record<string, string> = {};
  const checkboxes: Record<string, boolean> = {};
  
  const currentAddr = getCurrentAddress(data);
  const mailingAddr = getMailingAddress(data);
  
  // Physical / current address (Pt2Line5)
  Object.assign(fields, mapAddressToFields(currentAddr, {
    street: 'form1[0].Page2[0].Line4b_StreetNumberName[0]',
    unit: 'form1[0].Page2[0].Pt2Line5_AptSteFlrNumber[0]',
    city: 'form1[0].Page2[0].Pt2Line5_CityOrTown[0]',
    state: 'form1[0].Page2[0].Pt2Line5_State[0]',
    zip: 'form1[0].Page2[0].Pt2Line5_ZipCode[0]',
  }));
  
  // Mailing address (Pt2Line7)
  Object.assign(fields, mapAddressToFields(mailingAddr, {
    street: 'form1[0].Page2[0].Pt2Line7_StreetNumberName[0]',
    unit: 'form1[0].Page2[0].Pt2Line7_AptSteFlrNumber[0]',
    city: 'form1[0].Page2[0].Pt2Line7_CityOrTown[0]',
    state: 'form1[0].Page2[0].Pt2Line7_State[0]',
    zip: 'form1[0].Page2[0].Pt2Line7_ZipCode[0]',
  }));
  
  return { fields, checkboxes };
}

export function buildPdfPayload(formSlug: FormSlug, data: IntakeData): PdfPayload {
  switch (formSlug) {
    case 'i-130': return buildI130Payload(data);
    case 'i-130a': return buildI130aPayload(data);
    case 'i-131': return buildI131Payload(data);
    case 'i-485': return buildI485Payload(data);
    case 'i-765': return buildI765Payload(data);
    default: return { fields: {}, checkboxes: {} };
  }
}

export const FORM_NAMES: Record<FormSlug, string> = {
  'i-130': 'I-130 Petition for Alien Relative',
  'i-130a': 'I-130A Supplemental Information',
  'i-131': 'I-131 Application for Travel Document',
  'i-485': 'I-485 Application to Register Permanent Residence',
  'i-765': 'I-765 Application for Employment Authorization',
};

export const ALL_FORM_SLUGS: FormSlug[] = ['i-130', 'i-130a', 'i-131', 'i-485', 'i-765'];
