import {
  PacketProcessors,
  RealtimeClientOptions,
} from '../realtime-client.types';

/**
 * See section "Message Sources" in the RTE documentation
 * https://s3-eu-west-1.amazonaws.com/ur-support-site/16496/ClientInterfaces_Primary.pdf
 */
export enum RTEMessageSource {
  CONTROLLER = 7,
  EUROMAP_A = 117,
  EUROMAP_B = 127,
  EUROMAP_FPGA = 107,
  GUI = -5,
  JOINT_0_A = 110,
  JOINT_0_B = 120,
  JOINT_0_FPGA = 100,
  JOINT_1_A = 111,
  JOINT_1_B = 121,
  JOINT_1_FPGA = 101,
  JOINT_2_A = 112,
  JOINT_2_B = 122,
  JOINT_2_FPGA = 102,
  JOINT_3_A = 113,
  JOINT_3_B = 123,
  JOINT_3_FPGA = 103,
  JOINT_4_A = 114,
  JOINT_4_B = 124,
  JOINT_4_FPGA = 104,
  JOINT_5_A = 115,
  JOINT_5_B = 125,
  JOINT_5_FPGA = 105,
  PROCESSOR_UA = 20,
  PROCESSOR_UB = 30,
  ROBOTINTERFACE = -2,
  RTDE = 8,
  RTMACHINE = -3,
  SCB_FPGA = 40,
  SIMULATED_ROBOT = -4,
  TEACH_PENDANT_A = 108,
  TEACH_PENDANT_B = 118,
  TOOL_A = 116,
  TOOL_B = 126,
  TOOL_FPGA = 106,
}

/**
 * See section "Message Sources" in the RTE documentation
 * https://s3-eu-west-1.amazonaws.com/ur-support-site/16496/ClientInterfaces_Primary.pdf
 */
export enum RTEMessageSourceType {
  DISCONNECT = -1,
  HMC = 22,
  MODBUS_INFO = 5,
  PROGRAM_STATE = 25,
  ROBOT_MESSAGE = 20,
  ROBOT_STATE = 16,
  SAFETY_COMPLIANCE_TOLERANCES = 24,
  SAFETY_SETUP_BROADCAST = 23,
  VERSION = 3,
}

export type RTEMessageType = RTEMessageTypePublic | RTEMessageTypeInternal;

export enum RTEMessageTypePublic {
  COMM_MESSAGE = 'CommMessage',
  DATA = 'Data',
  KEY_MESSAGE = 'KeyMessage',
  RUNTIME_EXCEPTION_MESSAGE = 'RuntimeExceptionMessage',
  TEXT_MESSAGE = 'TextMessage',
  VERSION_MESSAGE = 'VersionMessage',
}

export enum RTEMessageTypeInternal {
  CARTESIAN_INFO = 'CartesianInfo',
  GLOBAL_VARIABLES_SETUP = 'GlobalVariablesSetup',
  GLOBAL_VARIABLES_UPDATE = 'GlobalVariablesUpdate',
}

export type RTEMessageSubType =
  | RTEProgramStateMessageSubType
  | RTERobotMessageSubType;

/**
 * Message subtypes when RTEMessageSourceType.ROBOT_STATE
 */
export enum RTERobotStateMessageSubtype {
  ROBOT_MODE = 0,
  JOINT_DATA = 1,
  TOOL_DATA = 2,
  MASTERBOARD_DATA = 3,
  CARTESIAN_INFO = 4,
  KINEMATICS_INFO = 5,
  CONFIGURATION_DATA = 6,
  FORCE_MODE_DATA = 7,
  ADDITIONAL_INFO = 8,
  CALIBRATION_DATA = 9,
  SAFETY_DATA = 10,
  TOOL_COMMUNICATION_INFO = 11,
  TOOL_MODE_INFO = 12,
  SINGULARITY_INFO = 13,
}

/**
 * Message subtypes when RTEMessageSourceType.PRORGAM_STATE
 */
export enum RTEProgramStateMessageSubType {
  GLOBAL_VARIABLES_SETUP = 0,
  GLOBAL_VARIABLES_UPDATE = 1,
}

/**
 * Message subtypes when RTEMessageSourceType.ROBOT_MESSAGE
 */
export enum RTERobotMessageSubType {
  SAFETY_MODE = 5,
  ROBOT_COMM = 6,
  KEY = 7,
  PROGRAM_THREADS = 14,
  POPUP = 2,
  REQUEST_VALUE = 9,
  TEXT = 0,
  RUNTIME_EXCEPTION = 10,
}

export interface RTEClientOptions extends RealtimeClientOptions {
  processors?: PacketProcessors;
}

/**
 * See section "Report Levels" in the RTE documentation
 * https://s3-eu-west-1.amazonaws.com/ur-support-site/16496/ClientInterfaces_Primary.pdf
 */
export enum RTEReportLevelType {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  VIOLATION = 3,
  FAULT = 4,
  DEVL_DEBUG = 128,
  DEVL_INFO = 129,
  DEVL_WARNING = 130,
  DEVL_VIOLATION = 131,
  DEVL_FAULT = 132,
}

export enum RTEReportLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  VIOLATION = 'violation',
  FAULT = 'fault',
  UNKNOWN = 'unknown',
}
