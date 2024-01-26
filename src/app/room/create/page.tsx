"use client"
import { useEffect } from 'react';

import { useRoom } from '@/context/room';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation'
import { useOffer } from '@/context/offer';
import { useUser } from '@/context/user';
import { useStream } from '@/context/stream';

export default function Create() {


  const { createRoom } = useRoom();
  const { user } = useUser();
  const { generateOffer } = useOffer();

  const router = useRouter()


  useEffect(() => {
    getThingSetup();
  }, [])


  const { stopMediaStream } = useStream()

  const getThingSetup = async () => {

    stopMediaStream();
    if (user && createRoom && generateOffer) {
      const {
        room, roomMember
      } = await createRoom({ userId: user.id })
      // setStream()
      // await generateOffer({ roomMember });
      router.push(`/room/${room.id}`)
    }

  }

  return (
    <div className=' h-screen w-screen gap-x-5 flex justify-center items-center'>
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
    </div>
  )
}
