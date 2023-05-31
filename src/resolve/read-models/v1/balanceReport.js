import { getBalanceReport } from '../../helperFunctions/v1/balanceReport-helpers.js';
import { checkEntityAccess } from '../../../utils/checkEntityAccess';

export default {
   name: 'balanceReport',

   gqlSchema: `
      type BalanceReport {
         id: UUID
         assets: BalanceReportTermInfo
         liabilities: BalanceReportTermInfo
         totalAssetCount: Int
         totalLiabilityCount: Int
         totalEquityCount: Int
         currentRatio: Float
         workingCapital: Float
         equityAssetPercentage: Float
         totalAssets: Float
         totalLiabilities: Float
         totalEquity: Float
      }
      type BalanceReportTermInfo {
         id: UUID
         current: BalanceReportInfo
         intermediate: BalanceReportInfo
         longTerm: BalanceReportInfo
      }
      type BalanceReportInfo {
         id: UUID
         categories: [BalanceReportCategoryInfo]
         total: Float
      }
      type BalanceReportCategoryInfo {
         id: UUID
         categoryName: String
         total: Float
         assets: [Asset]
         liabilities: [Liability]
      }
   `,

   gqlQueries: `
      balanceReport(entityId: [UUID], date: DateOnly): BalanceReport
   `,

   gqlMutations: `
   `,

   gqlQueryResolvers: {
      // Get the balance report for an entity
      balanceReport: (_, { entityId, date }, context) => {
         const { db, req } = context;
         return checkEntityAccess(req.user, entityId)
            ? getBalanceReport(db, req, entityId, date)
            : new Error(
                 'You do not have permission to view balance report for this entity id.',
              );
      },
   },

   gqlMutationResolvers: {},

   gqlExtras: {
      totalEquityCount: (balanceReport) =>
         balanceReport.totalAssetCount - balanceReport.totalLiabilityCount,
      currentRatio: (balanceReport) =>
         balanceReport.liabilities.current.total > 0
            ? balanceReport.assets.current.total /
              balanceReport.liabilities.current.total
            : null,
      workingCapital: (balanceReport) =>
         balanceReport.assets.current.total -
         balanceReport.liabilities.current.total,
      equityAssetPercentage: (balanceReport) =>
         balanceReport.totalAssets > 0
            ? balanceReport.totalEquity / balanceReport.totalAssets
            : null,
   },
};
