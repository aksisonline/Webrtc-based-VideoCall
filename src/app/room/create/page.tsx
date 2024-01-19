"use client"
import { useEffect } from 'react';

import { useRoom } from '@/context/room';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation'
import { useOffer } from '@/context/offer';
import { useUser } from '@/context/user';

export default function Create() {


  const { createRoom } = useRoom();
  const { user } = useUser();
  const { generateOffer } = useOffer();

  const router = useRouter()


  useEffect(() => {
    getThingSetup();
  }, [])

  const getThingSetup = async () => {
    if (user && createRoom && generateOffer) {
      const {
        room, roomMember
      } = await createRoom({ userId: user.id })
      // setStream()
      await generateOffer({ roomMember });
      router.push(`/room/${room.id}`)
    }

  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-24">


      <div className="mb-32 w-full flex flex-wrap">

        <Link href={"/room/create"} className='flex-1'>
          <Card className="group rounded-md border-gray-100/50  flex-1 cursor-pointer select-none border-0 hover:border-[1px] duration-200">
            <CardHeader className='mb-4 pb-0'>
              <CardTitle>
                Start Room{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none duration-300">
                  -&gt;
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='opacity-50 mt-0'>
              <p>start a room to invite your friend in</p>
            </CardContent>
          </Card>
        </Link>


      </div>
    </main>
  )
}
