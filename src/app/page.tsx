"use client"
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
import Image from 'next/image'
import { useEffect, useState } from 'react';

import { RealtimeChannel, SupabaseClient, createClient } from '@supabase/supabase-js'
import { useRoom } from '@/context/room/room';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';


export default function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2 md:p-24">



      <div className="mb-32 w-full gap-10 flex flex-wrap">
        <Link href={"/room/create"} className='flex-1'>
          <Card className="group rounded-md border-gray-100/50  flex-1 cursor-pointer select-none border-0 hover:border-[1px] duration-200">
            <CardHeader className='mb-4 pb-0'>
              <CardTitle>
                Create Room{' '}
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

        <Link href={"/room/join"} className='flex-1'>
          <Card className="group rounded-md border-gray-100/50 flex-1 cursor-pointer select-none border-0 hover:border-[1px] duration-200">
            <CardHeader className='mb-4 pb-0'>
              <CardTitle>
                Join Room{' '}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none duration-300">
                  -&gt;
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='opacity-50 mt-0'>
              <p>Join a room created by your friend</p>
            </CardContent>
          </Card>


        </Link>

      </div>
    </main>
  )
}
