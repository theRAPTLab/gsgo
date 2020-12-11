/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  client-side subscriber class to the PTRACK frame server
  (1) pt.Connect() to establish socket connection
  (2) entity data is processed behind-the-scenes automatically
  (3) pt.GetEntityDict() returns the dictionary of current objects

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { EntityObject, Frame, FrameStatus } from './t-ptrack';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PTRAK');

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class PTrack {
  input_socket: {
    onmessage?: Function;
  };
  socketAddress: string;
  N_ENTITIES: number;
  entityDict: Map<string, EntityObject>;
  connectStatusDict: Map<string, FrameStatus>;
  descriptor: {}; // legacy unused?

  constructor() {
    this.input_socket = {};
    this.socketAddress = 'ws://localhost:3030';
    this.N_ENTITIES = 15;
    this.entityDict = new Map();
    // 2.0 infer the connection status of PTRACK with our system
    this.connectStatusDict = new Map();
    // descriptor, used for input module enumeration
    this.descriptor = {
      name: 'PTrack',
      type: 'tracker',
      maxTrack: 15,
      id: null,
      instance: this
    };
  }
  Initialize() {}
  SetSocketAddress(serverAddress: string) {
    this.socketAddress = `ws://${serverAddress}:3030`;
  }
  Connect() {
    this.input_socket = new WebSocket(this.socketAddress);
    this.input_socket.onmessage = event => {
      this.ProcessFrame(event.data); // new routine
    };
  }
  ProcessFrame(frameData: Frame) {
    // frameData is JSON
    function parseTracks() {}
    function hasBadData() {}
    // converts framedata into updated entityDict
    // which is indexed by id and contains entityObjs
  }
  GetEntityDict() {}
  GetConnectionStatusDict() {}
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
console.log(...PR('UR.RegisterHooks(sysloop => {})'));

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
