import { createReportProcedure } from "./procedures/create-report";
import { listReportsProcedure } from "./procedures/list-reports";
import { resolveReport } from "./procedures/resolve-report";

export const reportsRouter = {
	create: createReportProcedure,
	list: listReportsProcedure,
	resolve: resolveReport,
};
