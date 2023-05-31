import { getCashFlowReport } from '../../helperFunctions/v1/cashFlowReport-helpers.js';
import { checkEntityAccess } from '../../../utils/checkEntityAccess';

export default {
   name: 'cashFlowReport',

   gqlSchema: `
      type CashFlowReport {
         id: String
         startDate: DateOnly
         endDate: DateOnly
         startMonth: String
         monthOrder: [String]
         income: [CashFlowIncomeExpenseInfo]
         expenses: [CashFlowIncomeExpenseInfo]
         incomeGlobal: CashFlowIncomeExpenseInfo
         expenseGlobal: CashFlowIncomeExpenseInfo
         netCashFlow: CashFlowIncomeExpenseInfo
         operatingLoanBalance: CashFlowIncomeExpenseInfo
         expectedYTDCashFlow: Float
         actualYTDCashFlow: Float
         targetIncome: Float
         operatingLoanLimit: Float
         actualOperatingLoanBalanceBeginning: Float
         actualOperatingLoanBalanceEnd: Float
         expectedOperatingLoanBalanceBeginning: Float
         expectedOperatingLoanBalanceEnd: Float
      }
      type CashFlowIncomeExpenseInfo {
         id: String
         typeId: UUID
         typeName: String
         entityId: UUID
         jan: CashFlowInfo
         feb: CashFlowInfo
         mar: CashFlowInfo
         apr: CashFlowInfo
         may: CashFlowInfo
         jun: CashFlowInfo
         jul: CashFlowInfo
         aug: CashFlowInfo
         sep: CashFlowInfo
         oct: CashFlowInfo
         nov: CashFlowInfo
         dec: CashFlowInfo
         annual: CashFlowInfo
      }
      type CashFlowInfo {
         id: String
         expected: Float
         actual: Float
         noteExpected: String
         noteActual: String
         incomes: [Income]
         expenses: [Expense]
      }
   `,

   gqlQueries: `
      cashFlowReport(entityId: [UUID], year: Int): CashFlowReport
   `,

   gqlMutations: `
   `,

   gqlQueryResolvers: {
      // Get the cashFlow report for an entity
      cashFlowReport: (_, { entityId, year }, context) => {
         const { db, req } = context;
         return checkEntityAccess(req.user, entityId)
            ? getCashFlowReport(db, req, entityId, year)
            : new Error(
                 'You do not have permission to view cashFlow report for this entity id.',
              );
      },
   },

   gqlMutationResolvers: {},

   gqlExtras: {},
};
