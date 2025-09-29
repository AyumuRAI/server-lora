import { PrismaClient } from '@prisma/client';

const sampleCompaniesData = [
  {
    name: "OCS Lending Incorporated",
    interestRate: 0.075,
    interestType: "STRAIGHT",
    processingTime: "2-3 business days",
    processingFee: 1750,
    isRequiredVisit: true,
    reviews: 1234,
    stars: 0.045,
    about: "OCS Lending Incorporated offers straight interest loans with physical visitation requirement. Established in 2010, we have served over 50,000 customers nationwide.",
    contact: "+63 912 345 6789",
    address: "123 Main Street, Manila, Philippines",
    logo: "https://placehold.co/50x50",
    loanMinAmount: 5000,
    loanMaxAmount: 100000,
    loanMinTerm: 2,
    loanMaxTerm: 24,
    requirements: {
      create: [
        {name: "Valid ID"},
        {name: "Barangay Clearance"},
        {name: "Collateral (if bank should provide form for the account of the bank)"}
      ]
    }
  },
  {
    name: "San Hec Bro Lending Incorporated",
    interestRate: 0.05,
    interestType: "DIMINISHING",
    processingTime: "1-5 business days",
    processingFee: 1500,
    isRequiredVisit: false,
    reviews: 1500,
    stars: 0.042,
    about: "San Hec Bro Lending Incorporated offers diminishing interest loans with flexible terms. Our mission is to provide affordable credit solutions to Filipinos.",
    contact: "+63 918 123 1234",
    address: "789 Business Park, Davao City, Philippines",
    logo: "https://placehold.co/50x50",
    loanMinAmount: 10000,
    loanMaxAmount: 200000,
    loanMinTerm: 3,
    loanMaxTerm: 36,
    requirements: {
      create: [
        {name: "Valid ID"},
        {name: "Barangay Clearance"},
        {name: "PSA"},
        {name: "Medical Cert"},
        {name: "Collateral (if bank should provide form for the account of the bank)"}
      ]
    }
  },
  {
    name: "PNJ Lending Company",
    interestRate: 0.1,
    interestType: "STRAIGHT",
    processingTime: "1-2 business days",
    processingFee: 0,
    isRequiredVisit: false,
    reviews: 876,
    stars: 0.042,
    about: "PNJ Lending Company provides straight interest loans with online processing. We offer quick approval and disbursement within 24 hours for qualified applicants.",
    contact: "+63 917 890 1234",
    address: "456 Commerce Ave, Cebu City, Philippines",
    logo: "https://placehold.co/50x50",
    loanMinAmount: 3000,
    loanMaxAmount: 50000,
    loanMinTerm: 1,
    loanMaxTerm: 12,
    requirements: {
      create: [
        {name: "Valid ID"},
        {name: "PSA"},
        {name: "Barangay Clearance"},
        {name: "Medical Cert"},
        {name: "Collateral (if bank should provide form for the account of the bank)"}
      ]
    }
  },
]

const prisma = new PrismaClient();

async function main() {

  // Insert sample lending companies
  sampleCompaniesData.forEach(async (company) => {
    await prisma.lendingCompanies.create({
      data: company as any
    });
  });
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });