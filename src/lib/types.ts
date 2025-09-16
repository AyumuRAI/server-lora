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

export { CreateAccountData };