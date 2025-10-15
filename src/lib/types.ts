type Gender = "MALE" | "FEMALE" | "OTHERS" | null;

type CreateAccountData = {
  phone: string;
  fname: string;
  mname: string | null;
  lname: string;
  suffix: string | null;
  birthdate: string;
  gender: Gender;
  nationality: string | null;
  country: string;
  province: string;
  municipality: string;
  barangay: string;
  address_text: string;
  pinCode: string;
};

type CreateAccountDataAdmin = {
  fname: string;
  lname: string;
  email: string;
  password: string;
  role: "ADMIN" | "AGENT" | "USER";
}

type SubmittedRequirementData = {
  name: string;
  uri: string;
  type: string;
  class: string;
  subclass: string;
  requirement: string;
  uploadDate: string;
  isImage?: boolean;
}

type Requirement = {
  name: string;
  class: string;
  subclass: string;
  files: [{ type: string, url: string }];
}

type LoanApplicationData = {
  type: "REGULAR" | "BONUS";
  amount: number;
  terms: number;
  monthlyIncome: number;
  purpose: string;
  isAtmCard: boolean;
  isCheck: boolean;
  isPassbook: boolean;
  other: string;
  selectedCompany: string;
  documents: SubmittedRequirementData[];
}

type User = {
  id: string;
  role: "AGENT" | "ADMIN" | "USER";
  phoneNumber?: string;
}

type CashInMethodType = "GCASH" | "OVER_THE_COUNTER" | "PAYMAYA" | "CREDIT_CARD" | "DEBIT_CARD";

export { 
  CreateAccountData, CreateAccountDataAdmin, 
  LoanApplicationData, SubmittedRequirementData,
  Requirement, User, CashInMethodType
};