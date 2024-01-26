"use client"
import { useEffect, useState } from 'react';
import { useRoom } from '@/context/room';
import { useUser } from '@/context/user';
import { useOffer } from '@/context/offer';
import { useAnswer } from '@/context/answer';
import { useStream } from '@/context/stream';
import { Room, RoomMember } from '@prisma/client';
import { getRoom } from '@/utils/supabase';
import { addIce, closePeerConnection, getCallStarterStatus, getPeerConnection, peerConnectionIcecandidate, peerSetRemoteDescription, setupDataChannel, setupTheOffer } from '@/utils/peerConnection';
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import MicrophoneSVG from '@/assets/icons/microphone';
import MicrophoneOffSVG from '@/assets/icons/microphoneOff';
import VideoSVG from '@/assets/icons/video';
import VideoOffSVG from '@/assets/icons/videoOff';
import EndCallSVG from '@/assets/icons/endCall';
import { useRouter } from 'next/navigation';
import { deleteRoomAction } from '@/actions/room';


export default function Home({
  params: { id },
}: {
  params: { id: string }
}) {

  const router = useRouter()


  const endCallFunction = async () => {
    // Your logic here
    await closePeerConnection();
    await stopMediaStream()
    await deleteRoomAction({ roomId: id })
    router.push(`/`)
    const roomChannel = await getRoom({ roomId: id });
    roomChannel.send({
      type: 'broadcast',
      event: 'close',
      payload: {
      },
    })
  };

  // Function to run when the page is about to be closed
  const handleBeforeUnload = (e: any) => {
    // Run your custom function here
    endCallFunction();

    // Standard message to display the confirmation dialog
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const [remoteVideo, setRemoteVideo] = useState<HTMLVideoElement>();
  const [localVideo, setLocalVideo] = useState<HTMLVideoElement>();
  const [loading, setLoading] = useState<boolean>(true);

  const { room, creator, roomMembers, currentRoomMemberId, fetchRoom } = useRoom();

  const { user } = useUser();

  const { generateOffer, offerDescription, } = useOffer();

  const { generateAnswer, } = useAnswer();

  const { localStream, setStream, remoteStream, pauseAudio, pauseVideo, resumeAudio, resumeVideo, stopMediaStream } = useStream();

  const [micOn, setMicOn] = useState<boolean>(true);
  const [videoOn, setVideoOn] = useState<boolean>(true);


  useEffect(() => {
    if (localStream) {
      const localVideoData = document.getElementById('localStream') as HTMLVideoElement;
      setLocalVideo(localVideoData);
      if (localVideoData && localVideoData instanceof HTMLVideoElement) {
        localVideoData.srcObject = localStream;
      }
    }
    console.log('i fire once: localStream');
  }, [localStream])


  useEffect(() => {
    if (remoteStream) {
      const remoteVideoData = document.getElementById('remoteStream') as HTMLVideoElement;
      setRemoteVideo(remoteVideoData);

      if (remoteVideoData && remoteVideoData instanceof HTMLVideoElement) {
        remoteVideoData.srcObject = remoteStream;
      }
    }

    console.log('i fire once: remoteStream');
  }, [remoteStream])


  useEffect(() => {
    setupChannel();
    console.log('i fire once: channel');
  }, [])



  const setupChannel = async () => {
    if (user && fetchRoom) {
      let creatorData = creator;
      let currentRoom: Room;
      let currentRoomMember: RoomMember = roomMembers[currentRoomMemberId];

      await setStream()

      if (!room) {
        try {
          const data = await fetchRoom({ roomId: id, userId: user.id });
          creatorData = data.creator;
          currentRoom = data.room;
          currentRoomMember = data.roomMember;
        } catch (e) {

          endCallFunction();
          return;
        }

      } else {
        currentRoom = room
      }

      await setupDataChannel(currentRoom.id);
      const pc = getPeerConnection()

      if (currentRoom)
        await peerConnectionIcecandidate({
          roomId: currentRoom.id,
          roomMemberId: currentRoomMember.id
        })

      if (creatorData && generateOffer) {
        await generateOffer({ roomMember: currentRoomMember });
      } else if (generateAnswer) {
        await generateAnswer({ roomMember: currentRoomMember, room: currentRoom! });
      }



      pc.addEventListener('negotiationneeded', async (event) => {
        console.log("negotiationneeded", event)
        const creator = getCallStarterStatus();
        if (creator && generateOffer)
          await generateOffer({ roomMember: currentRoomMember });
      });

      roomChannelSub({ room: currentRoom, roomMember: currentRoomMember })
      setLoading(false);
    }
  }


  const roomChannelSub = async ({ room, roomMember }: { room: Room, roomMember: RoomMember }) => {
    const roomChannel = await getRoom({ roomId: id });
    roomChannel
      .on(
        'broadcast',
        { event: 'description' },
        async (payload: any) => {
          const pc = getPeerConnection();
          if (payload.payload.type === "answer" && pc.currentRemoteDescription) return;

          if (payload.payload.type === "answer")
            peerSetRemoteDescription({
              sdp: payload.payload.sdp,
              type: payload.payload.type,
            })
          else if (payload.payload.type === "offer" && generateAnswer && room)
            await generateAnswer({
              roomMember: roomMember, room: room, offerDescriptionData: {
                sdp: payload.payload.sdp,
                type: payload.payload.type
              }
            });
        }
      ).on(
        'broadcast',
        { event: 'iceCandidate' },
        async (payload: any) => {
          addIce({ ...payload.payload.candidate });
        }
      ).on(
        'broadcast',
        { event: 'close' },
        async (payload: any) => {

          endCallFunction();
        }
      ).subscribe()
  }




  return (
    <main className="flex  w-screen h-screen items-top justify-center min-w-[320px] min-h-[500px] ">

      <div className='max-w-[1280px] relative w-full h-full flex flex-col justify-start items-top px-[3%] pt-0 space-y-4'>
        <div className='max-h-[900px] w-full h-[91%] bg-red-300 rounded-md relative overflow-hidden mt-4' >
          <video id="remoteStream" autoPlay playsInline className='w-full h-full absolute object-cover' muted />

          <div className=' min-w-[120px] w-[40%] md:w-[30%] lg:w-[20%]  absolute  aspect-square bg-white rounded-md 
          bottom-[2.5%] 
          right-[2.5%] 
          overflow-hidden
        ' >
            <video id="localStream" autoPlay playsInline className='w-full h-full absolute object-cover' muted />
          </div>

        </div>


        <Card className='bottom-[1.8%]  mb-10'>
          <CardContent className='p-2 '>
            <ToggleGroup type="multiple" className='gap-x-4'>
              <ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => {
                if (micOn) {
                  pauseAudio()
                  setMicOn(false);
                } else {
                  resumeAudio()
                  setMicOn(true);
                }
              }}>
                {micOn ? <MicrophoneSVG className="h-8 w-8" /> : <MicrophoneOffSVG className="h-8 w-8" />}
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => {
                if (videoOn) {
                  pauseVideo()
                  setVideoOn(false);
                } else {
                  resumeVideo()
                  setVideoOn(true);
                }
              }}>
                {videoOn ? <VideoSVG className="h-8 w-8" /> : <VideoOffSVG className="h-8 w-8" />}
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline" onClick={() => {
                endCallFunction();
              }}>
                <EndCallSVG className="h-8 w-8" />
              </ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

      </div>
    </main>
  )
}



// <div
// className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
// onClick={async () => {

//   const pc = getPeerConnection()

//   const roomMember = roomMembers[currentRoomMemberId];

//   if (room)
//     await peerConnectionIcecandidate({
//       roomId: room.id,
//       roomMemberId: roomMember.id
//     })

//   if (creator && generateOffer) {
//     await generateOffer({ roomMember: roomMembers[currentRoomMemberId] });
//   } else if (generateAnswer) {
//     await generateAnswer({ roomMember: roomMember, room: room! });
//   }

//   pc.addEventListener('negotiationneeded', async (event) => {
//     console.log("negotiationneeded", event)
//     const creator = getCallStarterStatus();
//     if (creator) {
//       await setupTheOffer();
//     } else {
//       //TODO: investigate what can be done here
//       console.log("here");
//     }
//   });

// }}
// >
// <h2 className={`mb-3 text-2xl font-semibold`}>
//   Join{' '}
//   <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//     -&gt;
//   </span>
// </h2>
// <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//   Join streaming
// </p>
// </div>


// <div
// className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
// onClick={async () => {

//   await setStream()

// }}
// >
// <h2 className={`mb-3 text-2xl font-semibold`}>
//   stream{' '}
//   <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//     -&gt;
//   </span>
// </h2>
// <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//   Join streaming
// </p>
// </div>

// <div
// className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
// onClick={() => {
//   // if (client) {

//   //   const channel = client.channel('room')
//   //   channel.subscribe((status) => {
//   //     // Wait for successful connection
//   //     if (status !== 'SUBSCRIBED') {
//   //       return null
//   //     }
//   //     // Send a message once the client is subscribed
//   //     channel.send({
//   //       type: 'broadcast',
//   //       event: 'test',
//   //       payload: { message: 'hello, world' },
//   //     })
//   //   })
//   // }
//   const pc = getPeerConnection()
//   console.log(pc)
// }}
// >
// <h2 className={`mb-3 text-2xl font-semibold`}>
//   Stop{' '}
//   <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//     -&gt;
//   </span>
// </h2>
// <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//   stop streaming
// </p>
// </div>


// <div
// className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
// onClick={async () => {
//   if (room)
//     await setupDataChannel(room?.id)


// }}
// >
// <h2 className={`mb-3 text-2xl font-semibold`}>
//   stream{' '}
//   <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//     -&gt;
//   </span>
// </h2>
// <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//   Join streaming
// </p>
// </div>

// <div
// className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
// onClick={async () => {

//   if (room) {
//     const dataChannel = await getDataChannel(room.id);

//     console.log("dataChannel", dataChannel);
//     // dataChannel.send("data")

//   }


// }}
// >
// <h2 className={`mb-3 text-2xl font-semibold`}>
//   data channel{' '}
//   <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//     -&gt;
//   </span>
// </h2>
// <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//   get data channel
// </p>
// </div>


// <div
// className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
// onClick={async () => {

//   if (room) {
//     const dataChannel = await getDataChannel(room.id);
//     await dataChannel.send(room.id)
//     await dataChannel.send("message")
//   }


// }}
// >
// <h2 className={`mb-3 text-2xl font-semibold`}>
//   send{' '}
//   <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
//     -&gt;
//   </span>
// </h2>
// <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
//   send message
// </p>
// </div>

