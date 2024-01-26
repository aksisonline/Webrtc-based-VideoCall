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
import CallerUserSVG from '@/assets/icons/callerUserSVG';


export default function Home({
  params: { id },
}: {
  params: { id: string }
}) {

  const router = useRouter()


  const endCallFunction = async () => {
    setLoading(true);
    router.push(`/`)
    await stopMediaStream()
    await clearRoom();
    const roomChannel = await getRoom({ roomId: id });
    roomChannel.send({
      type: 'broadcast',
      event: 'close',
      payload: {
      },
    })
    await closePeerConnection();
    deleteRoomAction({ roomId: id })
  };

  // Function to run when the page is about to be closed
  const handleBeforeUnload = (e: any) => {
    // Run your custom function here
    endCallFunction();

    // Standard message to display the confirmation dialog
    e.returnValue = 'Closing this window will end the call';
    e.preventDefault();
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

  const { room, creator, roomMembers, currentRoomMemberId, fetchRoom, clearRoom } = useRoom();

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
  }, [localStream])


  useEffect(() => {
    if (remoteStream) {
      const remoteVideoData = document.getElementById('remoteStream') as HTMLVideoElement;
      setRemoteVideo(remoteVideoData);

      if (remoteVideoData && remoteVideoData instanceof HTMLVideoElement) {
        remoteVideoData.srcObject = remoteStream;
      }
    }

  }, [remoteStream])


  useEffect(() => {
    setupChannel();
  }, [])



  const setupChannel = async () => {
    if (user && fetchRoom) {
      setLoading(true);
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



      setLoading(false);


      pc.addEventListener('negotiationneeded', async (event) => {
        const creator = getCallStarterStatus();
        if (creator && generateOffer)
          await generateOffer({ roomMember: currentRoomMember });
      });

      roomChannelSub({ room: currentRoom, roomMember: currentRoomMember })
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
      {loading && <div className='z-20 bg-background absolute h-screen w-screen gap-x-5 flex justify-center items-center'>
        <p className='animate-bounce text-4xl duration-500 delay-500'>
          ::
        </p>
        <p className='animate-bounce text-4xl duration-500 delay-100'>
          ::
        </p>
        <p className='animate-bounce text-4xl duration-500 delay-500'>
          ::
        </p>
        <p className='animate-bounce text-4xl duration-500 delay-100'>
          ::
        </p>
        <p className='animate-bounce text-4xl duration-500 delay-500'>
          ::
        </p>
        <p className='animate-bounce text-4xl duration-500 delay-100'>
          ::
        </p>
        <p className='animate-bounce text-4xl duration-500 delay-500'>
          ::
        </p>
      </div>}
      <div className='max-w-[1280px] relative w-full h-full flex flex-col justify-start items-top px-[3%] pt-0 space-y-4'>
        <div className='max-h-[900px] w-[full] h-[91%] bg-green-200 rounded-md relative overflow-hidden mt-4' >
          <video id="remoteStream" autoPlay playsInline className='w-full h-full absolute object-cover' />
          <div className='flex w-full justify-center items-center h-full text-black '>
            <CallerUserSVG className="w-32 h-32" />
          </div>
          <div className='min-w-[120px] w-[40%] sm:w-[30%] md:w-[20%] lg:w-[20%]  absolute  aspect-square bg-black rounded-md 
          bottom-[2.5%] 
          right-[2.5%] 
          overflow-hidden
        ' >
            <video id="localStream" autoPlay playsInline className='w-full h-full absolute object-cover' muted />
            <div className='flex w-full justify-center items-center h-full text-green-200 '>
              <CallerUserSVG className="w-20 h-20" />
            </div>
          </div>

        </div>

        <div>
          <Card className=' mb-10 text-white'>
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
                  {micOn ? <MicrophoneSVG className="h-8 w-8" /> : <MicrophoneOffSVG className="h-8 w-8 text-red-400" />}
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
                  {videoOn ? <VideoSVG className="h-8 w-8" /> : <VideoOffSVG className="h-8 w-8 text-red-400" />}
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

      </div>
    </main>
  )
}
