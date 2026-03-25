import { vi } from "vitest";

export function installBasicWebRTCMocks() {
  class MockMediaStream {
    constructor() {
      this._tracks = [{ enabled: false, stop: vi.fn() }];
    }

    getAudioTracks() {
      return this._tracks;
    }

    getTracks() {
      return this._tracks;
    }

    addTrack() {}
  }

  class MockRTCPeerConnection {
    constructor() {
      this.remoteDescription = null;
      this.connectionState = "connected";
      this.onicecandidate = null;
      this.ontrack = null;
      this.onconnectionstatechange = null;
    }

    addTrack() {}
    close() {
      this.connectionState = "closed";
    }
    async createOffer() {
      return { type: "offer", sdp: "offer-sdp" };
    }
    async createAnswer() {
      return { type: "answer", sdp: "answer-sdp" };
    }
    async setLocalDescription() {}
    async setRemoteDescription(desc) {
      this.remoteDescription = desc;
    }
    async addIceCandidate() {}
  }

  class MockRTCSessionDescription {
    constructor(payload) {
      Object.assign(this, payload || {});
    }
  }

  class MockRTCIceCandidate {
    constructor(payload) {
      this.payload = payload;
    }

    toJSON() {
      return this.payload;
    }
  }

  class MockAudioContext {
    constructor() {
      this.state = "running";
    }

    async close() {}
    async resume() {}

    createAnalyser() {
      return {
        fftSize: 1024,
        smoothingTimeConstant: 0.8,
        getByteTimeDomainData: (buffer) => {
          for (let i = 0; i < buffer.length; i += 1) {
            buffer[i] = 128;
          }
        },
        disconnect: () => {},
      };
    }

    createMediaStreamSource() {
      return {
        connect: () => {},
        disconnect: () => {},
      };
    }
  }

  Object.defineProperty(globalThis, "MediaStream", { value: MockMediaStream, configurable: true });
  Object.defineProperty(window, "RTCPeerConnection", {
    value: MockRTCPeerConnection,
    configurable: true,
  });
  Object.defineProperty(window, "RTCSessionDescription", {
    value: MockRTCSessionDescription,
    configurable: true,
  });
  Object.defineProperty(window, "RTCIceCandidate", {
    value: MockRTCIceCandidate,
    configurable: true,
  });
  Object.defineProperty(window, "AudioContext", { value: MockAudioContext, configurable: true });

  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => "uuid-123456" },
    configurable: true,
  });

  Object.defineProperty(window, "requestAnimationFrame", {
    value: (cb) => setTimeout(cb, 0),
    configurable: true,
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    value: (id) => clearTimeout(id),
    configurable: true,
  });

  if (!globalThis.navigator) {
    Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
  }

  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn(async () => new MockMediaStream()),
    },
    configurable: true,
  });
}
