"use client"
import { useEffect, useState } from 'react';

import { RealtimeChannel, createClient } from '@supabase/supabase-js'
import { useRoom } from '@/context/room';
import { useUser } from '@/context/user';
import { useOffer } from '@/context/offer';
import { useAnswer } from '@/context/answer';
import { useStream } from '@/context/stream';
import { RoomMember } from '@prisma/client';
import { getRoom } from '@/utils/supabase';
import { getPeerConnection } from '@/utils/peerConnection';


export default function Home({
  params: { id },
}: {
  params: { id: string }
}) {


  const [remoteVideo, setRemoteVideo] = useState<HTMLVideoElement>();
  const [localVideo, setLocalVideo] = useState<HTMLVideoElement>();
  const [loading, setLoading] = useState<boolean>(true);

  // Simple function to log any messages we receive
  function messageReceived(payload: any) {
    console.log(payload)
  }

  const { room, creator, roomMembers, currentRoomMemberId, fetchRoom } = useRoom();

  const { user } = useUser();

  const { generateOffer, offerCandidates, offerDescription, setupOfferIceCandidate } = useOffer();

  const { generateAnswer, setupAnswer, setupAnswerIceCandidate } = useAnswer();

  const { localStream, setStream, remoteStream } = useStream();



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
      let creatorData = creator;
      let currentRoom = room;
      let currentRoomMember: RoomMember = roomMembers[currentRoomMemberId];
      if (!room) {
        const data = await fetchRoom({ roomId: id, userId: user.id });
        creatorData = data.creator;
        currentRoom = data.room;
        currentRoomMember = data.roomMember;
      }

      const pc = getPeerConnection()
      console.log(pc)

      if (creatorData && generateOffer) {
        await generateOffer({ roomMember: currentRoomMember });
      } else if (generateAnswer) {
        await generateAnswer({ roomMember: currentRoomMember, room: currentRoom! });
      }

      console.log(pc)


      pc.addEventListener('connectionstatechange', (event) => {
        console.log("connectionstatechange", event)
      });
      pc.addEventListener('icegatheringstatechange', (event) => {
        console.log("icegatheringstatechange", event)
      });


      pc.addEventListener('iceconnectionstatechange', (event) => {
        console.log("iceconnectionstatechange", event)
      });

      pc.addEventListener('negotiationneeded', (event) => {
        console.log("negotiationneeded", event)
      });

      //setup the listener for the peer connection

      await setStream()



      //setup the listener for the socket connection
      const roomChannel = getRoom({ roomId: currentRoom!.id });



      // roomChannel
      //   .on(
      //     'broadcast',
      //     { event: 'iceCandidate' },
      //     //TODO setup the s
      //     (payload) => messageReceived(payload)
      //   )
      //   .subscribe()

      roomChannel
        .on(
          'broadcast',
          { event: 'description' },
          (payload: any) => {
            if (setupAnswer) setupAnswer({
              sdp: payload.payload.sdp,
              type: payload.payload.type,
            })

          }
        )
        .subscribe()

      setLoading(false);
    }
  }




  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-24">

      <div className='w-full m-2 md:m-10 gap-10 flex flex-col md:flex-row justify-center items-center'>

        <div className='w-full md:w-1/2 h-[400px] bg-white rounded-md relative overflow-hidden' >
          <video id="localStream" autoPlay playsInline className='w-full h-full absolute object-cover' muted />

        </div>


        <div className='w-full md:w-1/2 h-[400px] bg-red-300 rounded-md relative overflow-hidden' >
          <video id="remoteStream" autoPlay playsInline className='w-full h-full absolute object-cover' />
        </div>

      </div>

      <div className="mb-32 w-full flex flex-wrap">


        <div
          className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          onClick={() => {
            // if (client) {

            //   const channel = client.channel('room')
            //   channel.subscribe((status) => {
            //     // Wait for successful connection
            //     if (status !== 'SUBSCRIBED') {
            //       return null
            //     }
            //     // Send a message once the client is subscribed
            //     channel.send({
            //       type: 'broadcast',
            //       event: 'test',
            //       payload: { message: 'hello, world' },
            //     })
            //   })
            // }
            const pc = getPeerConnection()
            console.log(pc)
          }}
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Stop{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            stop streaming
          </p>
        </div>


      </div>
    </main>
  )
}
