'use client'

import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";
import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvaseMouseMove, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { useMutation, useStorage } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";

export default function Page() {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricRef = useRef<fabric.Canvas | null>(null)
    const isDrawing = useRef(false)
    const shapeRef = useRef<fabric.Object | null>(null)
    const selectedShapeRef = useRef<string | null>('rectangle') 
    const activeObjectRef = useRef<fabric.Object | null>(null) 

    const canvasObjects = useStorage((root) => root.canvasObject)
    const syncShapeInStorage = useMutation(({ storage }, object) => {
        if (!object) return

        const { objectId } = object 

        const shapeData = object.toJSON()
        shapeData.objectId = objectId

        const canvasObjects = storage.get('canvasObject')

        canvasObjects.set(objectId, shapeData)
    }, [])

    const [activeElement, setActiveElement] = useState<ActiveElement>({
        name: '',
        value: '',
        icon: '' 
    })

    const deleteAllShapes = useMutation(({ storage }) => {
        const canvasObjects = storage.get('canvasObject')

        if (!canvasObjects || canvasObjects.size === 0) return true

        for( const [key, value] of canvasObjects.entries()){
            canvasObjects.delete(key)
        }

        return canvasObjects.size === 0
    }, [])

    const handleActiveElement = (elem: ActiveElement) => {
        setActiveElement(elem)

        switch (elem?.value) {
            case 'reset':
                deleteAllShapes()
                fabricRef.current?.clear()
                setActiveElement(defaultNavElement)
                break
            default:
                break
        }

        selectedShapeRef.current = elem?.value as string
    }

    useEffect(() => {
        const canvas = initializeFabric({canvasRef, fabricRef})

        canvas.on('mouse:down', function(options) {
            handleCanvasMouseDown({
                options,
                isDrawing,
                canvas,
                shapeRef,
                selectedShapeRef
            })
        })

        canvas.on('mouse:move', function(options) {
            handleCanvaseMouseMove({
                options,
                isDrawing,
                canvas,
                shapeRef,
                selectedShapeRef,
                syncShapeInStorage
            })
        })

        canvas.on('mouse:up', function(options) {
            handleCanvasMouseUp({
                activeObjectRef,
                canvas,
                isDrawing,
                shapeRef,
                selectedShapeRef,
                syncShapeInStorage,
                setActiveElement
            })
        })

        canvas.on('object:modified', function(options) {
            handleCanvasObjectModified({
                options,
                syncShapeInStorage
            })
        })

        window.addEventListener('resize', () => {
            console.log('resize')
            handleResize({  canvas: fabricRef.current })
        })

        return () => {
            canvas.dispose(); // Limpiar al desmontar el componente
        };

    }, [])

    useEffect(() => {
        renderCanvas({ 
            fabricRef, 
            canvasObjects,
            activeObjectRef 
        })
    }, [canvasObjects])

    return (
        <main className="h-screen overflow-hidden ">
            <Navbar
                activeElement={ activeElement }
                handleActiveElement={ handleActiveElement }
            />
            <section className="flex flex-row h-full">
                <LeftSidebar/>
                <Live canvasRef={ canvasRef }/>
                {/* <canvas ref={ canvasRef } className="h-full w-full" /> */}
                <RightSidebar/>
            </section>
        </main>
    )
}