"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
export default function Navbar() {


  return (
    <header className="sticky top-0 z-50 w-full border-b border-customPalette-lightBlue/40 bg-customPalette-lightGray/95 backdrop-blur supports-[backdrop-filter]:bg-customPalette-lightGray/80 shadow-md">
      <div className=" flex h-16 justify-items-start items-center w-screen">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-customPalette-gold flex items-center justify-center">
            <Image
              src="/placeholder.svg?height=32&width=32"
              alt="Company Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="hidden font-bold text-customPalette-darkBlue sm:inline-block">
            Infarma
          </span>
        </Link>
      </div>
    </header>
  );
}
