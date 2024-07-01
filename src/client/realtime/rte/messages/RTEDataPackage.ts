/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageScope, RealtimeDataPackage } from '../../realtime-client.types';
import { AbstractRealtimeMessage } from '../../realtime.messages';
import { RTEMessageTypePublic } from '../rte.types';
import {
  RTEGlobalVariablesSetupMessage,
  RTEGlobalVariablesUpdateMessage,
} from './RTEProgramStateMessage';

export class RTEDataPackage
  extends AbstractRealtimeMessage
  implements RealtimeDataPackage
{
  public variables: { [key: string]: any } = {};

  private _variableNames: RTEGlobalVariablesSetupMessage | undefined;
  private _variableValues: RTEGlobalVariablesUpdateMessage | undefined;

  constructor() {
    super(RTEMessageTypePublic.DATA, MessageScope.PUBLIC);
  }

  public get variableNames(): RTEGlobalVariablesSetupMessage | undefined {
    return this._variableNames;
  }

  public set variableNames(
    message: RTEGlobalVariablesSetupMessage | undefined
  ) {
    if (message) {
      if (this._variableNames) {
        this._variableNames.names.splice(
          message.startIndex,
          message.names.length,
          ...message.names
        );
        this._variableNames.timestamp = message.timestamp;
      } else {
        this._variableNames = message;
      }

      // clear out values since we have a new set of names
      this._variableValues = undefined;
      this.variables = {};
    }
  }

  public get variableValues(): RTEGlobalVariablesUpdateMessage | undefined {
    return this._variableValues;
  }

  public set variableValues(
    message: RTEGlobalVariablesUpdateMessage | undefined
  ) {
    if (message) {
      if (this._variableValues) {
        this._variableValues.values.splice(
          message.startIndex,
          message.values.length,
          ...message.values
        );
        this._variableValues.timestamp = message.timestamp;
      } else {
        this._variableValues = message;
      }

      // create map of the name-value pairs based on matching index
      // if there are more values than names, then index is used as the name
      this.variables = {};
      for (let i = 0; i < this._variableValues.values.length; i++) {
        const name = this._variableNames?.names[i] ?? i;
        this.variables[name] = this._variableValues.values[i];
      }
    }
  }

  public getData() {
    return {
      variableNames: this.variableNames,
      variableValues: this.variableValues,
      variables: this.variables,
    };
  }
}
