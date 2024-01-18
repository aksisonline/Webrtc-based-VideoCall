"use client"
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
import Image from 'next/image'
import { useEffect, useState } from 'react';

import { RealtimeChannel, SupabaseClient, createClient } from '@supabase/supabase-js'
import { useRoom } from '@/context/room/room';


export default function Home() {


  // Global State

  const [remoteVideo, setRemoteVideo] = useState<HTMLVideoElement>();
  const [localVideo, setLocalVideo] = useState<HTMLVideoElement>();
  const [currentRoom, setCurrentRoom] = useState<RealtimeChannel>();

  // Simple function to log any messages we receive
  function messageReceived(payload: any) {
    console.log(payload)
  }

  const { clientData } = useRoom();

  useEffect(() => {

    if (clientData) {

      const myChannel = clientData.channel('room')
      setCurrentRoom(myChannel)

      setRemoteVideo(document.getElementById('remoteStream') as HTMLVideoElement);
      setLocalVideo(document.getElementById('localStream') as HTMLVideoElement);
    }

    console.log("remoteVideo", remoteVideo)
    console.log("localVideo", localVideo)
    return () => {

    }
  }, [])


  // useEffect(() => {

  //   if (currentRoom) {

  //     if (creator) {
  //       currentRoom
  //         .on(
  //           'broadcast',
  //           { event: 'response' },
  //           (payload) => messageReceived(payload)
  //         )
  //         .subscribe()
  //     }
  //   }
  // }, [currentRoom])


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-24">

      <div className='w-full m-2 md:m-10 gap-10 flex flex-col md:flex-row justify-center items-center'>

        <div className='w-full md:w-1/2 h-[400px] bg-white rounded-md relative overflow-hidden' >
          <video id="localStream" autoPlay playsInline className='w-full h-full absolute object-cover' muted />

        </div>


        <div className='w-full md:w-1/2 h-[400px] bg-red-300 rounded-md relative overflow-hidden' >
          <AspectRatio ratio={16 / 9}>
            <video id="remoteStream" autoPlay playsInline className='w-full h-full absolute object-cover' />
          </AspectRatio>
        </div>

      </div>

      <div className="mb-32 w-full flex flex-wrap">

        <div
          className="group rounded-md border border-transparent px-5 py-4 w-1/2 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          onClick={
            async () => {
              //   console.log("pc", pc)
              //   if (pc) {
              //     console.log("pc", pc)
              //     const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              //     const remoteStream = new MediaStream();

              //     setRemoteStream(remoteStream);
              //     setLocalStream(localStream);

              //     // Push tracks from local stream to peer connection
              //     localStream.getTracks().forEach((track) => {
              //       pc.addTrack(track, localStream);
              //     });

              //     // Pull tracks from remote stream, add to video stream
              //     pc.ontrack = (event) => {
              //       event.streams[0].getTracks().forEach((track) => {
              //         remoteStream.addTrack(track);
              //       });
              //     };

              //     if (localVideo instanceof HTMLVideoElement) {
              //       localVideo.srcObject = localStream;
              //     }
              //     if (remoteVideo != null && remoteVideo instanceof HTMLVideoElement) {
              //       remoteVideo.srcObject = remoteStream;
              //     }
              //   }
            }
          }
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            start{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            start broadcast
          </p>
        </div>


        <div
          className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          onClick={async () => {
            // if (pc) {

            //   let offerCandidates: { candidate: string, sdpMLineIndex: number | null, sdpMid: string | null, usernameFragment: string | null, }[] = []
            //   // // fetch the data from the database
            //   // const callDoc = firestore.collection('calls').doc();
            //   // const offerCandidates = callDoc.collection('offerCandidates');
            //   // const answerCandidates = callDoc.collection('answerCandidates');

            //   // // Get candidates for caller, save to db
            //   // pc.onicecandidate = (event) => {
            //   //   event.candidate && offerCandidates.add(event.candidate.toJSON());
            //   // };
            //   pc.onicecandidate = (event) => {
            //     if (event.candidate) {
            //       offerCandidates = [...offerCandidates, {
            //         candidate: event.candidate.candidate,
            //         sdpMLineIndex: event.candidate.sdpMLineIndex,
            //         sdpMid: event.candidate.sdpMid,
            //         usernameFragment: event.candidate.usernameFragment,
            //       }];
            //       console.log("offerCandidates", offerCandidates);
            //     }
            //   };

            //   // Create offer
            //   const offerDescription = await pc.createOffer();
            //   await pc.setLocalDescription(offerDescription);

            //   const offer = {
            //     sdp: offerDescription.sdp,
            //     type: offerDescription.type,
            //   };



            //   console.log("offerDescription", offerDescription)
            //   console.log("offer", offer)

            //   console.log("offerCandidates", offerCandidates);
            //   // save it to the database
            //   // const offerCandidates = callDoc.collection('offerCandidates');
            //   // const answerCandidates = callDoc.collection('answerCandidates');

            //   // Get candidates for caller, save to db

            // }
          }}
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Create Offer{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Create Offer data
          </p>
        </div>

        <div
          className="group rounded-md border border-transparent w-1/2 px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          onClick={async () => {
            // if (pc) {
            //   const answerDescription = await pc.createAnswer();
            //   await pc.setLocalDescription(answerDescription);

            //   const answer = {
            //     type: answerDescription.type,
            //     sdp: answerDescription.sdp,
            //   };


            //   let answerCandidates: { candidate: string, sdpMLineIndex: number | null, sdpMid: string | null, usernameFragment: string | null, }[] = []



            //   pc.onicecandidate = (event) => {
            //     if (event.candidate) {
            //       answerCandidates = [...answerCandidates, {
            //         candidate: event.candidate.candidate,
            //         sdpMLineIndex: event.candidate.sdpMLineIndex,
            //         sdpMid: event.candidate.sdpMid,
            //         usernameFragment: event.candidate.usernameFragment,
            //       }];
            //       console.log("answerCandidates", answerCandidates);
            //     }
            //   };



            // }

          }}
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Answer{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Answer Call
          </p>
        </div>

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
