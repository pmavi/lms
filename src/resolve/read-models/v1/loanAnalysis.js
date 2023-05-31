import { getLoanAnalysis } from '../../helperFunctions/v1/loanAnalysis-helpers.js';
import { checkEntityAccess } from '../../../utils/checkEntityAccess';

export default {
   name: 'loanAnalysis',

   gqlSchema: `
      type LoanAnalysis {
         id: UUID
         assets: LoanAnalysisTermInfo
         liabilities: LoanAnalysisTermInfo
         lessTotalLiabilities: Float
         clientLeverage: Float
         totalBankSafetyNet: Float
      }
      type LoanAnalysisTermInfo {
         id: UUID
         current: LoanAnalysisInfo
         intermediate: LoanAnalysisInfo
         longTerm: LoanAnalysisInfo
         marketValue: Float
         loanToValue: Float
         bankLoanValue: Float
      }
      type LoanAnalysisInfo {
         id: UUID
         categories: [LoanAnalysisCategoryInfo]
         marketValue: Float
         loanToValue: Float
         bankLoanValue: Float
      }
      type LoanAnalysisCategoryInfo {
         id: UUID
         categoryName: String
         marketValue: Float
         loanToValue: Float
         bankLoanValue: Float
         assets: [Asset]
         liabilities: [Liability]
      }
   `,

   gqlQueries: `
      loanAnalysis(entityId: [UUID], date: DateOnly): LoanAnalysis
   `,

   gqlMutations: `
   `,

   gqlQueryResolvers: {
      // Get the balance report for an entity
      loanAnalysis: (_, { entityId, date }, context) => {
         const { db, req } = context;
         return checkEntityAccess(req.user, entityId)
            ? getLoanAnalysis(db, req, entityId, date)
            : new Error(
                 'You do not have permission to view balance report for this entity id.',
              );
      },
   },

   gqlMutationResolvers: {},

   gqlExtras: {},
};
