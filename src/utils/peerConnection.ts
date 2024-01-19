import { PCDescription } from "@/interface/room";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
let processing = false;
let pc: RTCPeerConnection;

const setup = () => {
  pc = new RTCPeerConnection(servers);
  return pc;
};

export const getPeerConnection = () => {
  if (pc) return pc;
  return setup();
};

export const setupAnswerAction = async (answer: PCDescription) => {
  if (
    !pc.currentRemoteDescription &&
    pc.signalingState === "have-local-offer" &&
    !processing
  ) {
    processing = true;
    const answerDescription = new RTCSessionDescription({
      sdp: answer.sdp,
      type: answer.type as RTCSdpType,
    });
    await pc.setRemoteDescription(answerDescription);
    processing = false;
  }
};
