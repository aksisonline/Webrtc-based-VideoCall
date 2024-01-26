import { IceCandidate } from "./../interface/room";
import { PCDescription } from "@/interface/room";
import { getRoom } from "./supabase";
import { addIceCandidateAction } from "@/actions/iceCandidate";

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
  if (!pc) await setupPeerConnection();

  // if (!pc.localDescription) {
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  return offerDescription;
  // } else return pc.localDescription;
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
  const description = new RTCSessionDescription({
    sdp: offerDescription.sdp,
    type: offerDescription.type as RTCSdpType,
  });
  await pc.setRemoteDescription(description);
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
    iceCandidate != null &&
    iceCandidate.candidate != null &&
    iceCandidate.sdpMLineIndex != null &&
    iceCandidate.sdpMid != null &&
    iceCandidate.usernameFragment != null &&
    pc.remoteDescription != null
  ) {
    let candidate = new RTCIceCandidate({
      candidate: iceCandidate.candidate,
      sdpMid: iceCandidate.sdpMid,
      sdpMLineIndex: iceCandidate.sdpMLineIndex,
      usernameFragment: iceCandidate.usernameFragment,
    });
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
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
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

      await addIceCandidateAction({
        roomMemberId: roomMemberId,
        candidate: {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        },
        dataType: pc.localDescription?.type ?? "offer",
      });
    }
  };

  pc.onconnectionstatechange = (event) => {
    console.log("connectionstatechange", event.target);
  };

  pc.onsignalingstatechange = (event) => {
    console.log("onsignalingstatechange", event.target);
  };

  pc.addEventListener("iceconnectionstatechange", (event) => {
    console.log("iceConnectionState", event.target!);
  });

  pc.ondatachannel = (event) => {
    const dataChannel = event.channel;
    console.log("dataChannel", dataChannel, event);
  };
};

export const setupStream = async ({
  localStreamData,
  remoteVideo,
}: {
  localStreamData: MediaStream;
  remoteVideo: HTMLVideoElement;
}) => {
  if (!pc) await setupPeerConnection();
  // Push tracks from local stream to peer connection
  localStreamData.getTracks().forEach((track) => {
    console.log("track", track);
    console.log("localStreamData", localStreamData);
    pc.addTrack(track, localStreamData);
  });

  // Pull tracks from remote stream, add to video stream
  // pc.ontrack = (event) => {
  //   console.log("ontrack", event);
  //   const [remoteStream] = event.streams;
  //   remoteVideo.srcObject = remoteStream;
  //   console.log("remoteStream", remoteStream);
  // };
  const remoteStream = new MediaStream();

  remoteStream.addEventListener("addtrack", () => {
    console.log("added");
  });

  remoteVideo.srcObject = remoteStream;
  console.log("remoteVideo", remoteVideo.srcObject);
  // pc.ontrack = (event) => {
  //   event.streams[0].getTracks().forEach((track) => {
  //     remoteStream.addTrack(track);
  //   });
  // };

  pc.ontrack = (ev: any) => {
    if (ev.streams && ev.streams[0]) {
      remoteVideo.srcObject = ev.streams[0];
    } else {
      let inboundStream = new MediaStream(ev.track);
      remoteVideo.srcObject = inboundStream;
    }
  };
};

let dataChannel: RTCDataChannel;
/**
 *
 * @param iceCandidate
 */
export const setupDataChannel = async (roomId: string) => {
  if (!pc) await setupPeerConnection();

  dataChannel = pc.createDataChannel(roomId);

  dataChannel.onopen = (event) => {
    console.log("open", event);
  };

  dataChannel.onclose = (event) => {
    console.log("onclose", event);
  };

  dataChannel.onmessage = (event) => {
    console.log("dataChannel message", event, event.data);
  };

  dataChannel.onerror = (event) => {
    console.log("on error", event);
  };

  return dataChannel;
};

/**
 *
 * @param iceCandidate
 */
export const getDataChannel = async (roomId: string) => {
  if (dataChannel) return dataChannel;
  return setupDataChannel(roomId);
};
