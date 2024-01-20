import { IceCandidate } from "./../interface/room";
import { PCDescription } from "@/interface/room";
import { getRoom } from "./supabase";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};
let processing = false;
let pc: RTCPeerConnection;
let callStarter: boolean = false;

export const setupPeerConnection = () => {
  pc = new RTCPeerConnection(servers);
  return pc;
};

export const getPeerConnection = () => {
  if (pc) return pc;
  return setupPeerConnection();
};

export const getCallStarterStatus = () => {
  return callStarter;
};

/**
 * This is used by the caller to setup its offer
 * and it local description for the peer connection
 * @returns offerDescription
 */
export const setupTheOffer = async (): Promise<RTCSessionDescriptionInit> => {
  callStarter = true;
  if (!pc.localDescription) {
    if (!pc) await setupPeerConnection();
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    return offerDescription;
  } else return pc.localDescription;
};

/**
 * this is called by both to add the remote description
 * that has been sent by the the other side of the caller
 * it can be the offer or description depending on which
 * side it is being called from
 * @param description
 */
export const peerSetRemoteDescription = async (description: PCDescription) => {
  // if (
  //   !pc.currentRemoteDescription &&
  //   pc.signalingState === "have-local-offer"
  // ) {
  if (!pc) await setupPeerConnection();
  const answerDescription = new RTCSessionDescription({
    sdp: description.sdp,
    type: description.type as RTCSdpType,
  });
  await pc.setRemoteDescription(answerDescription);
  // }
};

/**
 * This is used by the receiver to setup it remote description
 * using the offer that is received and generate the answer
 * and set it up as the local description for the peer connection
 * @param offerDescription
 * @returns answerDescription
 */
export const setupTheAnswer = async (
  offerDescription: PCDescription,
): Promise<RTCSessionDescriptionInit> => {
  if (!pc) await setupPeerConnection();
  await pc.setRemoteDescription(
    new RTCSessionDescription({
      sdp: offerDescription.sdp,
      type: offerDescription.type as RTCSdpType,
    }),
  );
  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);
  return answerDescription;
};

/**
 *
 * @param iceCandidate
 */
export const addIce = async (iceCandidate: IceCandidate) => {
  if (!pc) await setupPeerConnection();

  if (
    iceCandidate &&
    iceCandidate.candidate &&
    iceCandidate.sdpMLineIndex &&
    iceCandidate.sdpMid &&
    iceCandidate.usernameFragment
  ) {
    let candidate = new RTCIceCandidate({
      candidate: iceCandidate.candidate,
      sdpMid: iceCandidate.sdpMid,
      sdpMLineIndex: iceCandidate.sdpMLineIndex,
      usernameFragment: iceCandidate.usernameFragment,
    });

    console.log("candidate", candidate);

    pc.addIceCandidate(candidate);
  }
};

export const peerConnectionIcecandidate = async ({
  roomId,
  roomMemberId,
}: {
  roomId: string;
  roomMemberId: string;
}) => {
  if (!pc) await setupPeerConnection();

  const roomChannel = await getRoom({ roomId: roomId });

  console.log("Data", "here");
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      console.log("event", event);
      // Send a message once the client is subscribed
      roomChannel.send({
        type: "broadcast",
        event: "iceCandidate",
        payload: {
          roomMemberId: roomMemberId,
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment,
          },
        },
      });
    }
  };

  pc.onconnectionstatechange = (event) => {
    console.log("connectionstatechange", event);
  };

  pc.addEventListener("connectionstatechange", (event) => {
    console.log("connectionstatechange", event);
  });

  pc.addEventListener("icegatheringstatechange", (event) => {
    console.log("icegatheringstatechange", event);
  });

  pc.addEventListener("iceconnectionstatechange", (event) => {
    console.log("iceconnectionstatechange", event);
  });
};
