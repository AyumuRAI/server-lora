import { Context } from "@lib/context";
import { LoanApplicationData } from "@lib/types";
import { formatRequirements } from "@actions/formatRequirements";

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
