import { RTEReportLevel, RTEReportLevelType } from './rte.types';

export function getReportLevelByType(type: RTEReportLevelType): RTEReportLevel {
  switch (type) {
    case RTEReportLevelType.DEBUG:
    case RTEReportLevelType.DEVL_DEBUG:
      return RTEReportLevel.DEBUG;

    case RTEReportLevelType.INFO:
    case RTEReportLevelType.DEVL_INFO:
      return RTEReportLevel.INFO;

    case RTEReportLevelType.WARNING:
    case RTEReportLevelType.DEVL_WARNING:
      return RTEReportLevel.WARNING;

    case RTEReportLevelType.VIOLATION:
    case RTEReportLevelType.DEVL_VIOLATION:
      return RTEReportLevel.VIOLATION;

    case RTEReportLevelType.FAULT:
    case RTEReportLevelType.DEVL_FAULT:
      return RTEReportLevel.FAULT;

    default:
      return RTEReportLevel.UNKNOWN;
  }
}
