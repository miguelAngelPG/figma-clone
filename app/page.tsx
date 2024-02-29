'use client'

import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";
import LeftSidebar from "@/components/LeftSidebar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { handleCanvasMouseDown, handleCanvasMouseUp, handleCanvasObjectModified, handleCanvaseMouseMove, handleResize, initializeFabric, renderCanvas } from "@/lib/canvas";
import { ActiveElement } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { defaultNavElement } from "@/constants";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {

    const undo = useUndo()
    const redo = useRedo()

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fabricRef = useRef<fabric.Canvas | null>(null)
    const isDrawing = useRef(false)
    const shapeRef = useRef<fabric.Object | null>(null)
    const selectedShapeRef = useRef<string | null>(null) 
    const activeObjectRef = useRef<fabric.Object | null>(null) 
    const imageInputRef = useRef<HTMLInputElement>(null)

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

    const deleteShapeFromStorage = useMutation(({ storage }, objectId: string) => {
        const canvasObjects = storage.get('canvasObject')

        canvasObjects.delete(objectId)
    }, [])

    const handleActiveElement = (elem: ActiveElement) => {
        setActiveElement(elem)

        switch (elem?.value) {
            case 'reset':
                deleteAllShapes()
                fabricRef.current?.clear()
                setActiveElement(defaultNavElement)
                break
            case 'delete':
                handleDelete(fabricRef.current as any, deleteShapeFromStorage)
                setActiveElement(defaultNavElement)
            case 'image': 
                imageInputRef.current?.click()
                isDrawing.current = false

                if (fabricRef.current) {
                    fabricRef.current.isDrawingMode = false
                }
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

        window.addEventListener('keydown', (e) => {
            handleKeyDown({
                e,
                canvas: fabricRef.current,
                undo,
                redo,
                syncShapeInStorage,
                deleteShapeFromStorage
            })
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
                imageInputRef={ imageInputRef }
                handleImageUpload={(e: any) => {
                    e.stopPropagation()

                    handleImageUpload({
                        file: e.target.files[0],
                        canvas: fabricRef as any,
                        syncShapeInStorage,
                        shapeRef
                    })
                }}
            />
            <section className="flex flex-row h-full">
                <LeftSidebar allShapes={Array.from(canvasObjects)}/>
                <Live canvasRef={ canvasRef }/>
                {/* <canvas ref={ canvasRef } className="h-full w-full" /> */}
                <RightSidebar/>
            </section>
        </main>
    )
}