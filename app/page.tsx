'use client'

import { fabric } from "fabric";
import { useEffect, useRef } from "react";
import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { handleCanvasMouseDown, handleResize, initializeFabric } from "@/lib/canvas";

export default function Page() {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricRef = useRef<fabric.Canvas | null>(null)
    const isDrawing = useRef(false)
    const shapeRef = useRef<fabric.Object | null>(null)
    const selectedShapeRef = useRef<string | null>('rectangle') 

    useEffect(() => {
        const canvas = initializeFabric({canvasRef, fabricRef})
        console.log('dkm', canvas)
        canvas.on('mouse:dblclick', (options) => {
            console.log('first', options)
            handleCanvasMouseDown({
                options,
                isDrawing,
                canvas,
                shapeRef,
                selectedShapeRef
            })
        })

        window.addEventListener('resize', () => {
            console.log('resize')
            handleResize({  canvas: fabricRef.current })
        })

    }, [])

    return (
        <main className="h-screen overflow-hidden ">
            <Navbar/>
            <section className="flex flex-row h-full">
                <LeftSidebar/>
                <Live canvasRef={ canvasRef }/>
                <RightSidebar/>
            </section>
        </main>
    )
}