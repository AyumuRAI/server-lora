import { Context } from "@lib/context";
import { LoanApplicationData } from "@lib/types";
import { formatRequirements } from "@actions/formatRequirements";
import { format, addMonths } from "date-fns"

// Enable custom scalar or custom graphql type
import { GraphQLJSON } from "graphql-type-json";

export const resolvers = {
  // Apply custom scalar
  JSON: GraphQLJSON,

  Query: {
    getLendingCompanies: async (_:any, args: {}, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        };

        const companies = await context.prismaReplica.lendingCompanies.findMany({
          include: {
            requirements: true
          }
        });

        return {
          success: true,
          message: "Companies fetched successfully",
          companies
        };
        
      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      };
    },
    getUserLoans: async (_: any, args: {}, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        }

        const user = context.user as { id: string, role: "AGENT" | "ADMIN" | "USER" };

        const loans = await context.prismaReplica.loans.findMany({
          where: {
            accountId: user.id
          },
          include: {
            lendingCompany: true
          }
        })

        if (!loans) {
          return {
            success: false,
            message: "No loans found",
            loans: []
          }
        }

        const formattedLoans = loans.map((loan) => {
          const loanAmount = parseFloat(loan.amount.toString());
          const dueDate = loan.activedAt ? format(addMonths(loan.activedAt, 1), "MMM dd, yyyy") : "N/A";
          const monthlyPayment = loanAmount / loan.terms;
          const totalInterest =  (loanAmount * parseFloat(loan.lendingCompany.interestRate.toString()));
          const loanTerms = loan.terms + " months";
          const applicationDate = format(loan.createdAt, "MMM, dd, yyyy");

          return {
            ...loan,
            interestRate: parseFloat(loan.lendingCompany.interestRate.toString()) * 100,
            term: loanTerms,
            nextPayment: dueDate,
            nextPaymentAmount: monthlyPayment,
            lender: loan.lendingCompany.name,
            applicationDate,
            dueDate,
            totalAmountDue: monthlyPayment,

            // Additional fields needed for PayNowScreen
            loanAmount: loan.amount,
            totalInterest,
            interestType: loan.lendingCompany.interestType,
            processingFee: loan.lendingCompany.processingFee,
            monthlyPayment,
            totalPayment: monthlyPayment,
            netRelease: loanAmount - parseFloat(loan.lendingCompany.processingFee.toString()),
            terms: loanTerms,
            date: applicationDate,
          };
        });

        return {
          success: true,
          message: "Loans fetched successfully",
          loans: formattedLoans
        };

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      }
    },
    getLoanTransactions: async (_:any, args: {}, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        };
        
        const user = context.user as { id: string, role: "AGENT" | "ADMIN" | "USER" };

        const loanTransactions = await context.prismaReplica.loans.findMany({
          where: {
            accountId: user.id,
            status: {
              not: "PROCESSING"
            },
            transactions: {
              some: {}
            }
          },
          include: {
            transactions: true,
            lendingCompany: true
          }
        });

        const formattedTransactions: Array<Object> = [];

        loanTransactions.forEach((loan) => {
          loan.transactions.forEach((tx) => {
            formattedTransactions.push({
                transactionId: tx.id,
                paymentMethod: tx.method,
                type: tx.type.charAt(0) + tx.type.toLowerCase().slice(1),
                amount: parseFloat(tx.amount.toString()).toFixed(2),
                date: format(tx.createdAt, "MMM dd, yyyy"),
                time: format(tx.createdAt, "hh:mm a"),
                status: tx.status.charAt(0) + tx.status.toLowerCase().slice(1),

                // Loan Details
                id: formattedTransactions.length,
                loanId: loan.id,
                lender: loan.lendingCompany.name,
                loanAmount: loan.amount,
                loanType: loan.type,
                applicationDate: loan.activedAt && format(loan.activedAt, "MMM dd, yyyy"),
                interestRate: parseFloat(loan.lendingCompany.interestRate.toString()) * 100,
                interestType: loan.lendingCompany.interestType,
                term: loan.terms + " months",
                totalInterest: parseFloat(loan.amount.toString()) * parseFloat(loan.lendingCompany.interestRate.toString()),
                processingFee: loan.lendingCompany.processingFee,
                dueDate: "SAMPLE", // TO DO: Replace with actual due date
                monthlyPayment: parseFloat(loan.amount.toString()) / loan.terms,
                netRelease: parseFloat(loan.amount.toString()) - parseFloat(loan.lendingCompany.processingFee.toString()),
              })
            })
        });

        return {
          success: true,
          message: "Loan transactions fetched successfully",
          loanTransactions: formattedTransactions
        };

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        }
      }
    },
    getUserCurrentLoan: async (_:any, args: {}, context: Context) => {
      try {
        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        };

        const user = context.user as { id: string, role: "AGENT" | "ADMIN" | "USER" };

        // Get the latest current loan
        const currentLoan = await context.prismaReplica.loans.findFirst({
          where: {
            accountId: user.id,
            status: "ACTIVE",
          },
          include: {
            lendingCompany: true
          },
          orderBy: {
            id: "desc"
          }
        }) ?? {} as any;

        const formattedCurrentLoan = [currentLoan].map((loan) => {
          const loanAmount = parseFloat(loan.amount.toString());
          const dueDate = loan.activedAt ? format(addMonths(loan.activedAt, 1), "MMM dd, yyyy") : "N/A";
          const monthlyPayment = loanAmount / loan.terms;
          const totalInterest =  (loanAmount * parseFloat(loan.lendingCompany.interestRate.toString()));
          const loanTerms = loan.terms + " months";
          const applicationDate = format(loan.createdAt, "MMM, dd, yyyy");

          return {
            ...loan,
            interestRate: parseFloat(loan.lendingCompany.interestRate.toString()) * 100,
            term: loanTerms,
            nextPayment: dueDate,
            nextPaymentAmount: monthlyPayment,
            lender: loan.lendingCompany.name,
            applicationDate,
            dueDate,
            totalAmountDue: monthlyPayment,

            // Additional fields needed for PayNowScreen
            loanAmount: loan.amount,
            totalInterest,
            interestType: loan.lendingCompany.interestType,
            processingFee: loan.lendingCompany.processingFee,
            monthlyPayment,
            totalPayment: monthlyPayment,
            netRelease: loanAmount - parseFloat(loan.lendingCompany.processingFee.toString()),
            terms: loanTerms,
            date: applicationDate
          };
        })[0];

        return {
          success: true,
          message: "Loan fetched successfully",
          currentLoan: formattedCurrentLoan
        };

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        };
      };
    } 
  },
  Mutation: {
    submitLoanApplication: async (_:any, args: { data: LoanApplicationData }, context: Context) => {
      try {

        if (!context.user) {
          return {
            success: false,
            message: "Unauthorized"
          };
        };

        // Retrieve company details based on selected company name
        const company = await context.prismaReplica.lendingCompanies.findUnique({
          where: {
            name: args.data.selectedCompany
          }
        });

        if (!company) {
          return {
            success: false,
            message: "Company not found"
          };
        }

        const user = context.user as { id: string, role: "AGENT" | "ADMIN" | "USER" };
        const formattedRequirements = await formatRequirements(args.data.documents);

        const loan = await context.prisma.loans.create({
          data: {
            accountId: user.id,
            type: args.data.type,
            amount: args.data.amount,
            remainingBalance: args.data.amount, // Set remaining balance to the same as the initial amount
            terms: args.data.terms,
            monthlyIncome: args.data.monthlyIncome,
            purpose: args.data.purpose,
            isAtmCard: args.data.isAtmCard,
            isCheck: args.data.isCheck,
            isPassBook: args.data.isPassbook,
            other: args.data.other,
            selectedLendingCompany: args.data.selectedCompany,
            
            submittedRequirements: {
              create: formattedRequirements.prismaCreate
            }
          },
        });

        return {
          success: true,
          message: "Loan application data submitted successfully",
          company,
          loan,
          numberOfDocs: formattedRequirements.numberOfDocs
        };

      } catch (err: any) {
        return {
          success: false,
          message: err.message
        }
      } 
    }
  }
}
